import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import { RowDataPacket } from "mysql2/promise";
import { dbPool } from "../db";

const router = express.Router();

type TranslationRequestBody = {
  jobId?: string;
  translationJobId?: string;
};

type TranslationState = {
  jobId: string;
  translationJobId: string;
  sourceLanguage: string;
  targetLanguage: string;
  subtitles: SubtitleRow[];
  translatedItems: TranslatedSubtitle[];
};

type TranslationJobRow = RowDataPacket & {
  translation_job_id: string;
  video_job_id: string;
  source_language: string;
  target_language: string;
};

type SubtitleRow = RowDataPacket & {
  id: string;
  source_text: string;
  sort_order: number;
};

type TranslatedSubtitle = {
  id: string;
  translatedText: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const GEMINI_TRANSLATION_MODEL =
  process.env.GEMINI_TRANSLATION_MODEL || "gemini-3.1-flash-lite";
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TRANSLATION_BATCH_SIZE = Number(
  process.env.GEMINI_TRANSLATION_BATCH_SIZE || "40"
);

const languageNameMap: Record<string, string> = {
  KOR: "Korean",
  ENG: "English",
  JPN: "Japanese",
  CHN: "Chinese",
  CMN: "Chinese",
  SPA: "Spanish",
  FRA: "French",
  GER: "German",
  VIE: "Vietnamese",
  THA: "Thai",
  IDN: "Indonesian",
};

// 현재 요청의 번역 작업 상태를 가져옵니다.
function getState(res: Response) {
  return res.locals.translation as TranslationState;
}

// 요청 본문에서 작업 ID를 검증합니다.
function validateTranslationRequest(
  req: Request<{}, {}, TranslationRequestBody>,
  res: Response,
  next: NextFunction
) {
  const jobId = typeof req.body.jobId === "string" ? req.body.jobId.trim() : "";
  const translationJobId =
    typeof req.body.translationJobId === "string"
      ? req.body.translationJobId.trim()
      : "";

  if (jobId.length === 0 && translationJobId.length === 0) {
    res.status(400).send({
      err: true,
      message: "번역할 작업 ID가 필요합니다.",
    });
    return;
  }

  res.locals.translation = {
    jobId,
    translationJobId,
  } as TranslationState;

  next();
}

// DB에서 번역 작업과 원본/대상 언어 정보를 조회합니다.
async function loadTranslationJob(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = getState(res);

  try {
    const params = state.translationJobId
      ? [state.translationJobId]
      : [state.jobId];
    const whereClause = state.translationJobId
      ? "tj.id = ?"
      : "tj.video_job_id = ?";

    const [rows] = await dbPool.execute<TranslationJobRow[]>(
      `
      SELECT
        tj.id AS translation_job_id,
        tj.video_job_id,
        vj.source_language,
        vj.target_language
      FROM ai_translation_jobs tj
      INNER JOIN ai_video_jobs vj ON vj.id = tj.video_job_id
      WHERE ${whereClause}
      ORDER BY tj.started_at DESC
      LIMIT 1
      `,
      params
    );
    const job = rows[0];

    if (!job) {
      res.status(404).send({
        err: true,
        message: "번역 작업 정보를 찾을 수 없습니다.",
      });
      return;
    }

    state.jobId = job.video_job_id;
    state.translationJobId = job.translation_job_id;
    state.sourceLanguage = job.source_language;
    state.targetLanguage = job.target_language;

    next();
  } catch (err) {
    next(err);
  }
}

// 번역할 원문 자막 목록을 조회합니다.
async function loadSourceSubtitles(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = getState(res);

  try {
    const [rows] = await dbPool.execute<SubtitleRow[]>(
      `
      SELECT id, source_text, sort_order
      FROM ai_subtitle_items
      WHERE translation_job_id = ?
      ORDER BY sort_order ASC
      `,
      [state.translationJobId]
    );

    if (rows.length === 0) {
      res.status(404).send({
        err: true,
        message: "번역할 원문 자막이 없습니다.",
      });
      return;
    }

    state.subtitles = rows;
    next();
  } catch (err) {
    next(err);
  }
}

// 번역 작업 상태를 처리 중으로 변경합니다.
async function markTranslationProcessing(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = getState(res);

  try {
    await dbPool.execute(
      `
      UPDATE ai_translation_jobs
      SET translation_status = ?, error_message = NULL
      WHERE id = ?
      `,
      ["processing", state.translationJobId]
    );

    next();
  } catch (err) {
    next(err);
  }
}

// 원문 자막을 여러 묶음으로 나누어 Gemini API에 번역 요청합니다.
async function requestGeminiTranslation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = getState(res);
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    next(Error("GEMINI_API_KEY 환경변수가 필요합니다."));
    return;
  }

  try {
    const translatedItems: TranslatedSubtitle[] = [];
    const batches = chunkArray(state.subtitles, getTranslationBatchSize());

    for (const batch of batches) {
      const batchItems = await requestGeminiTranslationBatch(
        state,
        batch,
        apiKey
      );
      translatedItems.push(...batchItems);
    }

    if (translatedItems.length === 0) {
      throw Error("Gemini 번역 응답에서 저장할 번역 결과를 찾지 못했습니다.");
    }

    state.translatedItems = translatedItems;
    next();
  } catch (err) {
    next(err);
  }
}

// Gemini API에 자막 일부 묶음만 전달해 번역합니다.
async function requestGeminiTranslationBatch(
  state: TranslationState,
  subtitles: SubtitleRow[],
  apiKey: string
) {
  const response = await axios.post<GeminiResponse>(
    `${GEMINI_API_BASE_URL}/models/${GEMINI_TRANSLATION_MODEL}:generateContent`,
    {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildTranslationPrompt(state, subtitles),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    },
    {
      params: {
        key: apiKey,
      },
      validateStatus: () => true,
    }
  );

  if (response.status < 200 || response.status >= 300) {
    throw Error(`Gemini 번역 요청 실패: ${formatResponseData(response.data)}`);
  }

  const responseText =
    response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return parseTranslatedItems(responseText);
}

// 번역 프롬프트를 생성합니다.
function buildTranslationPrompt(state: TranslationState, subtitles: SubtitleRow[]) {
  const sourceLanguage = getLanguageName(state.sourceLanguage);
  const targetLanguage = getLanguageName(state.targetLanguage);
  const items = subtitles.map((subtitle) => ({
    id: subtitle.id,
    text: subtitle.source_text,
  }));

  return [
    `Translate the subtitle items from ${sourceLanguage} to ${targetLanguage}.`,
    "Keep the meaning natural for video subtitles.",
    "Do not change id values.",
    'Return only a JSON array like [{"id":"...","translatedText":"..."}].',
    JSON.stringify(items),
  ].join("\n");
}

// 환경변수로 지정한 번역 배치 크기를 반환합니다.
function getTranslationBatchSize() {
  if (
    Number.isFinite(GEMINI_TRANSLATION_BATCH_SIZE) &&
    GEMINI_TRANSLATION_BATCH_SIZE > 0
  ) {
    return Math.floor(GEMINI_TRANSLATION_BATCH_SIZE);
  }

  return 40;
}

// 배열을 지정한 크기만큼 잘라 반환합니다.
function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

// 내부 언어 코드를 사람이 읽는 언어명으로 변환합니다.
function getLanguageName(languageCode: string) {
  return languageNameMap[languageCode] || languageCode;
}

// Gemini 응답 문자열에서 번역 결과 배열을 파싱합니다.
function parseTranslatedItems(responseText: string) {
  try {
    return JSON.parse(responseText) as TranslatedSubtitle[];
  } catch {
    const matched = responseText.match(/\[[\s\S]*\]/);

    if (!matched) {
      throw Error("Gemini 번역 응답을 JSON 배열로 파싱하지 못했습니다.");
    }

    return JSON.parse(matched[0]) as TranslatedSubtitle[];
  }
}

// 오류 응답 값을 로그에 남기기 쉬운 문자열로 변환합니다.
function formatResponseData(data: unknown) {
  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

// 번역 결과를 ai_subtitle_items.translated_text에 저장합니다.
async function saveTranslatedText(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = getState(res);
  const translatedMap = new Map(
    state.translatedItems
      .filter((item) => item.id && typeof item.translatedText === "string")
      .map((item) => [item.id, item.translatedText])
  );
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    for (const subtitle of state.subtitles) {
      const translatedText = translatedMap.get(subtitle.id);

      if (translatedText === undefined) {
        continue;
      }

      await connection.execute(
        `
        UPDATE ai_subtitle_items
        SET translated_text = ?
        WHERE id = ? AND translation_job_id = ?
        `,
        [translatedText, subtitle.id, state.translationJobId]
      );
    }

    await connection.execute(
      `
      UPDATE ai_translation_jobs
      SET translation_status = ?, completed_at = NOW()
      WHERE id = ?
      `,
      ["completed", state.translationJobId]
    );

    await connection.execute(
      `
      UPDATE ai_video_jobs
      SET status = ?
      WHERE id = ?
      `,
      ["completed", state.jobId]
    );

    await connection.commit();
    next();
  } catch (err) {
    await connection.rollback().catch(() => undefined);
    next(err);
  } finally {
    connection.release();
  }
}

// 번역 작업 결과를 프론트엔드에 반환합니다.
function sendTranslationResult(req: Request, res: Response) {
  const state = getState(res);

  res.send({
    err: false,
    data: {
      jobId: state.jobId,
      translationJobId: state.translationJobId,
      translatedCount: state.translatedItems.length,
    },
  });
}

// 번역 실패 시 DB 작업 상태를 failed로 변경합니다.
async function handleTranslationError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = res.locals.translation as Partial<TranslationState> | undefined;

  if (state?.translationJobId) {
    await dbPool
      .execute(
        `
        UPDATE ai_translation_jobs
        SET translation_status = ?, error_message = ?, completed_at = NOW()
        WHERE id = ?
        `,
        ["failed", err.message.slice(0, 65535), state.translationJobId]
      )
      .catch(() => undefined);
  }

  if (state?.jobId) {
    await dbPool
      .execute(
        `
        UPDATE ai_video_jobs
        SET status = ?
        WHERE id = ?
        `,
        ["failed", state.jobId]
      )
      .catch(() => undefined);
  }

  console.error(err);

  res.status(500).send({
    err: true,
    message: err.message || "번역 작업에 실패했습니다.",
  });
}

router.post(
  "/gemini",
  validateTranslationRequest,
  loadTranslationJob,
  loadSourceSubtitles,
  markTranslationProcessing,
  requestGeminiTranslation,
  saveTranslatedText,
  sendTranslationResult
);

router.use(handleTranslationError);

export default router;
