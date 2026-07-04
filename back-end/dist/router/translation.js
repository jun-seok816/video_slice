"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../db");
const router = express_1.default.Router();
const GEMINI_TRANSLATION_MODEL = process.env.GEMINI_TRANSLATION_MODEL || "gemini-3.1-flash-lite";
const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TRANSLATION_BATCH_SIZE = Number(process.env.GEMINI_TRANSLATION_BATCH_SIZE || "40");
const languageNameMap = {
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
function getState(res) {
    return res.locals.translation;
}
// 요청 본문에서 작업 ID를 검증합니다.
function validateTranslationRequest(req, res, next) {
    const jobId = typeof req.body.jobId === "string" ? req.body.jobId.trim() : "";
    const translationJobId = typeof req.body.translationJobId === "string"
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
    };
    next();
}
// DB에서 번역 작업과 원본/대상 언어 정보를 조회합니다.
async function loadTranslationJob(req, res, next) {
    const state = getState(res);
    try {
        const params = state.translationJobId
            ? [state.translationJobId]
            : [state.jobId];
        const whereClause = state.translationJobId
            ? "tj.id = ?"
            : "tj.video_job_id = ?";
        const [rows] = await db_1.dbPool.execute(`
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
      `, params);
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
    }
    catch (err) {
        next(err);
    }
}
// 번역할 원문 자막 목록을 조회합니다.
async function loadSourceSubtitles(req, res, next) {
    const state = getState(res);
    try {
        const [rows] = await db_1.dbPool.execute(`
      SELECT id, source_text, sort_order
      FROM ai_subtitle_items
      WHERE translation_job_id = ?
      ORDER BY sort_order ASC
      `, [state.translationJobId]);
        if (rows.length === 0) {
            res.status(404).send({
                err: true,
                message: "번역할 원문 자막이 없습니다.",
            });
            return;
        }
        state.subtitles = rows;
        next();
    }
    catch (err) {
        next(err);
    }
}
// 번역 작업 상태를 처리 중으로 변경합니다.
async function markTranslationProcessing(req, res, next) {
    const state = getState(res);
    try {
        await db_1.dbPool.execute(`
      UPDATE ai_translation_jobs
      SET translation_status = ?, error_message = NULL
      WHERE id = ?
      `, ["processing", state.translationJobId]);
        next();
    }
    catch (err) {
        next(err);
    }
}
// 원문 자막을 여러 묶음으로 나누어 Gemini API에 번역 요청합니다.
async function requestGeminiTranslation(req, res, next) {
    const state = getState(res);
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        next(Error("GEMINI_API_KEY 환경변수가 필요합니다."));
        return;
    }
    try {
        const translatedItems = [];
        const batches = chunkArray(state.subtitles, getTranslationBatchSize());
        for (const batch of batches) {
            const batchItems = await requestGeminiTranslationBatch(state, batch, apiKey);
            translatedItems.push(...batchItems);
        }
        if (translatedItems.length === 0) {
            throw Error("Gemini 번역 응답에서 저장할 번역 결과를 찾지 못했습니다.");
        }
        state.translatedItems = translatedItems;
        next();
    }
    catch (err) {
        next(err);
    }
}
// Gemini API에 자막 일부 묶음만 전달해 번역합니다.
async function requestGeminiTranslationBatch(state, subtitles, apiKey) {
    const response = await axios_1.default.post(`${GEMINI_API_BASE_URL}/models/${GEMINI_TRANSLATION_MODEL}:generateContent`, {
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
    }, {
        params: {
            key: apiKey,
        },
        validateStatus: () => true,
    });
    if (response.status < 200 || response.status >= 300) {
        throw Error(`Gemini 번역 요청 실패: ${formatResponseData(response.data)}`);
    }
    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseTranslatedItems(responseText);
}
// 번역 프롬프트를 생성합니다.
function buildTranslationPrompt(state, subtitles) {
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
    if (Number.isFinite(GEMINI_TRANSLATION_BATCH_SIZE) &&
        GEMINI_TRANSLATION_BATCH_SIZE > 0) {
        return Math.floor(GEMINI_TRANSLATION_BATCH_SIZE);
    }
    return 40;
}
// 배열을 지정한 크기만큼 잘라 반환합니다.
function chunkArray(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
// 내부 언어 코드를 사람이 읽는 언어명으로 변환합니다.
function getLanguageName(languageCode) {
    return languageNameMap[languageCode] || languageCode;
}
// Gemini 응답 문자열에서 번역 결과 배열을 파싱합니다.
function parseTranslatedItems(responseText) {
    try {
        return JSON.parse(responseText);
    }
    catch {
        const matched = responseText.match(/\[[\s\S]*\]/);
        if (!matched) {
            throw Error("Gemini 번역 응답을 JSON 배열로 파싱하지 못했습니다.");
        }
        return JSON.parse(matched[0]);
    }
}
// 오류 응답 값을 로그에 남기기 쉬운 문자열로 변환합니다.
function formatResponseData(data) {
    if (typeof data === "string")
        return data;
    try {
        return JSON.stringify(data);
    }
    catch {
        return String(data);
    }
}
// 번역 결과를 ai_subtitle_items.translated_text에 저장합니다.
async function saveTranslatedText(req, res, next) {
    const state = getState(res);
    const translatedMap = new Map(state.translatedItems
        .filter((item) => item.id && typeof item.translatedText === "string")
        .map((item) => [item.id, item.translatedText]));
    const connection = await db_1.dbPool.getConnection();
    try {
        await connection.beginTransaction();
        for (const subtitle of state.subtitles) {
            const translatedText = translatedMap.get(subtitle.id);
            if (translatedText === undefined) {
                continue;
            }
            await connection.execute(`
        UPDATE ai_subtitle_items
        SET translated_text = ?
        WHERE id = ? AND translation_job_id = ?
        `, [translatedText, subtitle.id, state.translationJobId]);
        }
        await connection.execute(`
      UPDATE ai_translation_jobs
      SET translation_status = ?, completed_at = NOW()
      WHERE id = ?
      `, ["completed", state.translationJobId]);
        await connection.execute(`
      UPDATE ai_video_jobs
      SET status = ?
      WHERE id = ?
      `, ["completed", state.jobId]);
        await connection.commit();
        next();
    }
    catch (err) {
        await connection.rollback().catch(() => undefined);
        next(err);
    }
    finally {
        connection.release();
    }
}
// 번역 작업 결과를 프론트엔드에 반환합니다.
function sendTranslationResult(req, res) {
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
// DB 자막 데이터를 기존 에디터 JSON과 같은 TimeCode 배열로 반환합니다.
// 완료된 번역 작업 목록을 리스트 화면에서 사용할 수 있는 형태로 반환합니다.
async function sendCompletedTranslationJobs(req, res) {
    const limit = getLimitedQueryNumber(req.query.limit, 50, 100);
    const offset = getOffsetQueryNumber(req.query.offset);
    try {
        const [rows] = await db_1.dbPool.execute(`
      SELECT
        tj.id AS translation_job_id,
        tj.video_job_id,
        tj.stt_status,
        tj.translation_status,
        tj.started_at,
        tj.completed_at,
        vj.youtube_url,
        vj.title,
        vj.video_path,
        vj.audio_path,
        vj.thumbnail_path,
        vj.source_language,
        vj.target_language,
        vj.created_at,
        (
          SELECT COUNT(*)
          FROM ai_subtitle_items si
          WHERE si.translation_job_id = tj.id
        ) AS subtitle_count
      FROM ai_translation_jobs tj
      INNER JOIN ai_video_jobs vj ON vj.id = tj.video_job_id
      WHERE tj.translation_status = ?
      ORDER BY tj.completed_at DESC, tj.started_at DESC      
      `, ["completed"]);
        res.send({
            err: false,
            data: {
                items: rows.map((row) => ({
                    translationJobId: row.translation_job_id,
                    jobId: row.video_job_id,
                    youtubeUrl: row.youtube_url,
                    title: row.title,
                    videoPath: row.video_path,
                    audioPath: row.audio_path,
                    thumbnailPath: row.thumbnail_path,
                    thumbnailUrl: getYoutubeThumbnailUrl(row.youtube_url, row.thumbnail_path),
                    sourceLanguage: row.source_language,
                    targetLanguage: row.target_language,
                    sttStatus: row.stt_status,
                    translationStatus: row.translation_status,
                    subtitleCount: Number(row.subtitle_count),
                    startedAt: row.started_at,
                    completedAt: row.completed_at,
                    createdAt: row.created_at,
                })),
                limit,
                offset,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            err: true,
            message: "완료된 번역 작업 목록 조회에 실패했습니다.",
        });
    }
}
function getLimitedQueryNumber(value, defaultValue, maxValue) {
    const parsed = typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : defaultValue;
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return defaultValue;
    }
    return Math.min(Math.floor(parsed), maxValue);
}
function getOffsetQueryNumber(value) {
    const parsed = typeof value === "string" && value.trim().length > 0 ? Number(value) : 0;
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return Math.floor(parsed);
}
function getYoutubeThumbnailUrl(youtubeUrl, thumbnailPath) {
    if (thumbnailPath)
        return thumbnailPath;
    const videoId = getYoutubeVideoId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
}
function getYoutubeVideoId(youtubeUrl) {
    const matched = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return matched?.[1] || "";
}
async function sendTimeCodeSubtitles(req, res) {
    const jobId = typeof req.query.jobId === "string" ? req.query.jobId.trim() : "";
    const translationJobId = typeof req.query.translationJobId === "string"
        ? req.query.translationJobId.trim()
        : "";
    if (jobId.length === 0 && translationJobId.length === 0) {
        res.status(400).send({
            err: true,
            message: "자막을 조회할 작업 ID가 필요합니다.",
        });
        return;
    }
    try {
        const params = translationJobId ? [translationJobId] : [jobId];
        const whereClause = translationJobId
            ? "translation_job_id = ?"
            : "video_job_id = ?";
        const [rows] = await db_1.dbPool.execute(`
      SELECT
        id,
        source_text,
        translated_text,
        start_time,
        end_time,
        sort_order
      FROM ai_subtitle_items
      WHERE ${whereClause}
      ORDER BY sort_order ASC
      `, params);
        res.send(rows.map((row) => ({
            id: row.id,
            text: row.translated_text || row.source_text,
            sTime: Number(row.start_time),
            eTime: Number(row.end_time),
        })));
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            err: true,
            message: "자막 조회에 실패했습니다.",
        });
    }
}
// 번역 실패 시 DB 작업 상태를 failed로 변경합니다.
async function handleTranslationError(err, req, res, next) {
    const state = res.locals.translation;
    if (state?.translationJobId) {
        await db_1.dbPool
            .execute(`
        UPDATE ai_translation_jobs
        SET translation_status = ?, error_message = ?, completed_at = NOW()
        WHERE id = ?
        `, ["failed", err.message.slice(0, 65535), state.translationJobId])
            .catch(() => undefined);
    }
    if (state?.jobId) {
        await db_1.dbPool
            .execute(`
        UPDATE ai_video_jobs
        SET status = ?
        WHERE id = ?
        `, ["failed", state.jobId])
            .catch(() => undefined);
    }
    console.error(err);
    res.status(500).send({
        err: true,
        message: err.message || "번역 작업에 실패했습니다.",
    });
}
router.post("/gemini", validateTranslationRequest, loadTranslationJob, loadSourceSubtitles, markTranslationProcessing, requestGeminiTranslation, saveTranslatedText, sendTranslationResult);
router.get("/completed", sendCompletedTranslationJobs);
router.get("/subtitles", sendTimeCodeSubtitles);
router.use(handleTranslationError);
exports.default = router;
//# sourceMappingURL=translation.js.map