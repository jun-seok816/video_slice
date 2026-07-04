import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { RowDataPacket } from "mysql2/promise";
import { dbPool } from "../db";

const router = express.Router();

type SttRequestBody = {
  jobId?: string;
};

type SttState = {
  jobId: string;
  translationJobId: string;
  sourceLanguage: string;
  targetLanguage: string;
  videoPath: string;
  audioPath: string | null;
  localFilePath: string;
  subtitles: ParsedSubtitleItem[];
};

type AiVideoJobRow = RowDataPacket & {
  id: string;
  video_path: string;
  audio_path: string | null;
  source_language: string;
  target_language: string;
};

type ParsedSubtitleItem = {
  id: string;
  startTime: number;
  endTime: number;
  sourceText: string;
  sortOrder: number;
};

type ElevenLabsWord = {
  text: string;
  start: number;
  end: number;
  type?: "word" | "spacing" | "audio_event" | string;
  speaker_id?: string;
};

type ElevenLabsSpeechToTextResponse = {
  text: string;
  words?: ElevenLabsWord[];
};

const DATA_ROOT = path.resolve(__dirname, "../../../data");
const ELEVENLABS_STT_URL =
  process.env.ELEVENLABS_STT_URL ||
  "https://api.elevenlabs.io/v1/speech-to-text";
const ELEVENLABS_STT_MODEL_ID =
  process.env.ELEVENLABS_STT_MODEL_ID || "scribe_v2";
const ELEVENLABS_STT_MAX_RETRIES = Number(
  process.env.ELEVENLABS_STT_MAX_RETRIES || "3"
);
const SUBTITLE_WORD_GAP_THRESHOLD_SEC = 0.8;
const SUBTITLE_MAX_DURATION_SEC = 4.5;
const SUBTITLE_MAX_CHARS = 84;
const SUBTITLE_SENTENCE_END_REGEX = /[.!?]$/;

const languageMap: Record<string, string> = {
  KOR: "ko",
  ENG: "en",
  JPN: "ja",
  CHN: "zh",
  CMN: "zh",
  SPA: "es",
  FRA: "fr",
  GER: "de",
  VIE: "vi",
  THA: "th",
  IDN: "id",
};

// 현재 요청의 STT 작업 상태를 가져옵니다.
function getState(res: Response) {
  return res.locals.stt as SttState;
}

// 프론트엔드에서 받은 jobId를 검증합니다.
function validateSttRequest(
  req: Request<{}, {}, SttRequestBody>,
  res: Response,
  next: NextFunction
) {
  const jobId = typeof req.body.jobId === "string" ? req.body.jobId.trim() : "";

  if (jobId.length === 0) {
    res.status(400).send({
      err: true,
      message: "STT를 수행할 작업 ID가 필요합니다.",
    });
    return;
  }

  res.locals.stt = {
    jobId,
  } as SttState;

  next();
}

// DB에서 영상 작업 정보와 다운로드된 파일 경로를 조회합니다.
async function loadAiVideoJob(req: Request, res: Response, next: NextFunction) {
  const state = getState(res);

  try {
    const [rows] = await dbPool.execute<AiVideoJobRow[]>(
      `
      SELECT id, video_path, audio_path, source_language, target_language
      FROM ai_video_jobs
      WHERE id = ?
      LIMIT 1
      `,
      [state.jobId]
    );
    const job = rows[0];

    if (!job) {
      res.status(404).send({
        err: true,
        message: "영상 작업 정보를 찾을 수 없습니다.",
      });
      return;
    }

    state.videoPath = job.video_path;
    state.audioPath = job.audio_path;
    state.sourceLanguage = job.source_language;
    state.targetLanguage = job.target_language;
    state.localFilePath = resolveDataFilePath(job.audio_path || job.video_path);

    if (!fs.existsSync(state.localFilePath)) {
      res.status(404).send({
        err: true,
        message: "STT를 수행할 영상 파일을 찾을 수 없습니다.",
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

// /data 공개 경로를 서버 내부 실제 파일 경로로 안전하게 변환합니다.
function resolveDataFilePath(publicPath: string) {
  if (!publicPath.startsWith("/data/")) {
    throw Error("영상 파일 경로가 올바르지 않습니다.");
  }

  const relativePath = publicPath.replace(/^\/data\//, "");
  const localFilePath = path.resolve(DATA_ROOT, relativePath);

  if (!localFilePath.startsWith(DATA_ROOT)) {
    throw Error("영상 파일 경로가 허용된 data 폴더를 벗어났습니다.");
  }

  return localFilePath;
}

// DB에 STT 작업 row를 생성하고 영상 작업 상태를 처리 중으로 변경합니다.
async function createSttJob(req: Request, res: Response, next: NextFunction) {
  const state = getState(res);
  const translationJobId = randomUUID();

  try {
    await dbPool.execute(
      `
      INSERT INTO ai_translation_jobs (
        id,
        video_job_id,
        stt_status,
        translation_status,
        started_at
      ) VALUES (?, ?, ?, ?, NOW())
      `,
      [
        translationJobId,
        state.jobId,
        "processing",
        "pending",
      ]
    );

    await dbPool.execute(
      `
      UPDATE ai_video_jobs
      SET status = ?
      WHERE id = ?
      `,
      ["translation_processing", state.jobId]
    );

    state.translationJobId = translationJobId;
    next();
  } catch (err) {
    next(err);
  }
}

// ElevenLabs Scribe STT API로 영상/오디오 파일의 자막을 생성합니다.
async function requestElevenLabsStt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = getState(res);
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    next(Error("ELEVENLABS_API_KEY 환경변수가 필요합니다."));
    return;
  }

  try {
    state.subtitles = await requestElevenLabsSttWithRetry(state, apiKey);
    next();
  } catch (err) {
    next(err);
  }
}

// 네트워크 오류나 일시적인 API 오류가 있을 때 STT 요청을 재시도합니다.
async function requestElevenLabsSttWithRetry(
  state: SttState,
  apiKey: string
) {
  let lastError: unknown;
  const maxRetries = Number.isFinite(ELEVENLABS_STT_MAX_RETRIES)
    ? Math.max(1, ELEVENLABS_STT_MAX_RETRIES)
    : 3;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestElevenLabsSttOnce(state, apiKey);
    } catch (err) {
      lastError = err;

      if (attempt >= maxRetries) {
        break;
      }

      await delay(1000 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : Error("ElevenLabs STT 요청에 실패했습니다.");
}

// ElevenLabs STT API에 multipart/form-data 요청을 한 번 전송합니다.
async function requestElevenLabsSttOnce(state: SttState, apiKey: string) {
  const fileBuffer = await fs.promises.readFile(state.localFilePath);
  const formData = new FormData();
  const fileBlob = new Blob([bufferToArrayBuffer(fileBuffer)], {
    type: getMimeType(state.localFilePath),
  });
  const language = getSttLanguageCode(state.sourceLanguage);

  formData.append("model_id", ELEVENLABS_STT_MODEL_ID);
  formData.append("file", fileBlob, path.basename(state.localFilePath));
  formData.append("timestamps_granularity", "word");
  formData.append("diarize", "false");
  formData.append("tag_audio_events", "false");

  if (language) {
    formData.append("language_code", language);
  }

  const response = await axios.post<ElevenLabsSpeechToTextResponse | string>(
    ELEVENLABS_STT_URL,
    formData,
    {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
      headers: {
        "xi-api-key": apiKey,
      },
    }
  );

  if (response.status < 200 || response.status >= 300) {
    throw Error(
      `ElevenLabs STT 요청 실패: ${formatAxiosResponseData(response.data)}`
    );
  }

  const result =
    typeof response.data === "string"
      ? parseElevenLabsResponse(response.data)
      : response.data;
  const subtitles = elevenLabsWordsToSubtitleItems(result.words || []);

  if (subtitles.length === 0) {
    throw Error("ElevenLabs STT 응답에서 저장할 자막을 찾지 못했습니다.");
  }

  return subtitles;
}

// axios 오류 응답 값을 로그에 남기기 쉬운 문자열로 변환합니다.
function formatAxiosResponseData(data: unknown) {
  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

// Node Buffer를 Blob이 받을 수 있는 ArrayBuffer로 변환합니다.
function bufferToArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

// 파일 확장자를 기준으로 multipart 업로드 MIME 타입을 반환합니다.
function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".webm") return "audio/webm";
  if (ext === ".opus") return "audio/ogg";
  if (ext === ".mp4") return "video/mp4";

  return "application/octet-stream";
}

// 내부 언어 코드를 ElevenLabs가 받는 ISO 언어 코드로 변환합니다.
function getSttLanguageCode(sourceLanguage: string) {
  return languageMap[sourceLanguage] || sourceLanguage.toLowerCase();
}

// ElevenLabs 응답 문자열을 JSON으로 파싱합니다.
function parseElevenLabsResponse(responseText: string) {
  try {
    return JSON.parse(responseText) as ElevenLabsSpeechToTextResponse;
  } catch {
    throw Error("ElevenLabs STT 응답을 JSON으로 파싱하지 못했습니다.");
  }
}

// ElevenLabs 단어 타임스탬프 배열을 DB 저장용 자막 배열로 바로 변환합니다.
function elevenLabsWordsToSubtitleItems(words: ElevenLabsWord[]) {
  const subtitles: ParsedSubtitleItem[] = [];
  let currentWords: ElevenLabsWord[] = [];

  const flushSubtitle = () => {
    const spokenWords = currentWords.filter((word) => word.type !== "spacing");
    const firstWord = spokenWords[0];
    const lastWord = spokenWords[spokenWords.length - 1];

    if (!firstWord || !lastWord) {
      currentWords = [];
      return;
    }

    const text = currentWords
      .map((word) => word.text)
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length === 0) {
      currentWords = [];
      return;
    }

    subtitles.push({
      id: randomUUID(),
      startTime: firstWord.start,
      endTime: lastWord.end,
      sourceText: text,
      sortOrder: subtitles.length + 1,
    });
    currentWords = [];
  };

  for (const word of words) {
    if (!word.text || word.type === "audio_event") {
      continue;
    }

    const spokenWords = currentWords.filter((item) => item.type !== "spacing");
    const previousWord = spokenWords[spokenWords.length - 1];
    const firstWord = spokenWords[0];
    const gap =
      previousWord && word.type !== "spacing"
        ? Math.max(0, word.start - previousWord.end)
        : 0;
    const duration = firstWord ? word.end - firstWord.start : 0;
    const currentText = currentWords.map((item) => item.text).join("");
    const nextTextLength = currentText.length + word.text.length;
    const shouldFlush =
      previousWord &&
      word.type !== "spacing" &&
      (gap > SUBTITLE_WORD_GAP_THRESHOLD_SEC ||
        duration > SUBTITLE_MAX_DURATION_SEC ||
        nextTextLength > SUBTITLE_MAX_CHARS ||
        SUBTITLE_SENTENCE_END_REGEX.test(previousWord.text.trim()));

    if (shouldFlush) {
      flushSubtitle();
    }

    currentWords.push(word);
  }

  flushSubtitle();

  return subtitles.filter((subtitle) => subtitle.endTime > subtitle.startTime);
}

// STT 결과를 ai_subtitle_items에 저장하고 작업 상태를 완료로 변경합니다.
async function saveSttResult(req: Request, res: Response, next: NextFunction) {
  const state = getState(res);
  const subtitles = state.subtitles;

  if (subtitles.length === 0) {
    next(Error("STT 결과에서 저장할 자막을 찾지 못했습니다."));
    return;
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `
      INSERT INTO ai_subtitle_items (
        id,
        video_job_id,
        translation_job_id,
        start_time,
        end_time,
        source_text,
        translated_text,
        sort_order
      ) VALUES ?
      `,
      [
        subtitles.map((subtitle) => [
          subtitle.id,
          state.jobId,
          state.translationJobId,
          subtitle.startTime,
          subtitle.endTime,
          subtitle.sourceText,
          null,
          subtitle.sortOrder,
        ]),
      ]
    );

    await connection.query(
      `
      UPDATE ai_translation_jobs
      SET stt_status = ?, completed_at = NOW()
      WHERE id = ?
      `,
      ["completed", state.translationJobId]
    );

    await connection.commit();
    state.subtitles = subtitles;
    next();
  } catch (err) {
    await connection.rollback().catch(() => undefined);
    next(err);
  } finally {
    connection.release();
  }
}

// STT 작업 결과를 프론트엔드에 반환합니다.
function sendSttResult(req: Request, res: Response) {
  const state = getState(res);

  res.send({
    err: false,
    data: {
      jobId: state.jobId,
      translationJobId: state.translationJobId,
      subtitleCount: state.subtitles.length,
    },
  });
}

// STT 실패 시 DB 작업 상태를 failed로 변경합니다.
async function handleSttError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const state = res.locals.stt as Partial<SttState> | undefined;

  if (state?.translationJobId) {
    await dbPool
      .execute(
        `
        UPDATE ai_translation_jobs
        SET stt_status = ?, translation_status = ?, error_message = ?, completed_at = NOW()
        WHERE id = ?
        `,
        ["failed", "failed", err.message.slice(0, 65535), state.translationJobId]
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
    message: err.message || "STT 작업에 실패했습니다.",
  });
}

// 지정한 시간만큼 대기합니다.
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.post(
  "/elevenlabs",
  validateSttRequest,
  loadAiVideoJob,
  createSttJob,
  requestElevenLabsStt,
  saveSttResult,
  sendSttResult
);

router.use(handleSttError);

export default router;
