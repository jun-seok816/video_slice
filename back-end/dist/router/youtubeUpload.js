"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const db_1 = require("../db");
const router = express_1.default.Router();
const DATA_ROOT = path.resolve(__dirname, "../../../data");
const JOBS_ROOT = path.join(DATA_ROOT, "jobs");
const DEFAULT_YTDLP_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;
let lastYtDlpUpdateCheckedAt = 0;
let ytDlpUpdatePromise = null;
// 현재 YouTube 업로드 작업 상태를 가져옵니다.
function getState(res) {
    return res.locals.youtubeUpload;
}
// YouTube URL에서 영상 ID를 추출합니다.
function getYoutubeVideoId(youtubeUrl) {
    const matched = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return matched?.[1] || "";
}
// 요청값에서 URL 문자열만 안전하게 정리합니다.
function normalizeYoutubeUrl(value) {
    if (typeof value !== "string")
        return "";
    return value.trim().split("&")[0];
}
// 로컬 data 경로를 브라우저에서 접근 가능한 /data 경로로 변환합니다.
function toPublicDataPath(filePath) {
    return `/data/${path.relative(DATA_ROOT, filePath).split(path.sep).join("/")}`;
}
// pipx로 설치된 yt-dlp는 PM2/systemd PATH에 잡히지 않는 경우가 많습니다.
function getPipxYtDlpBin() {
    if (process.platform === "win32")
        return "";
    return path.join(os.homedir(), ".local", "bin", "yt-dlp");
}
// yt-dlp 실행 명령을 환경에 맞게 구성합니다.
function getYtDlpSpawnCommand(args) {
    const configuredYtDlpBin = process.env.YTDLP_BIN?.trim();
    if (configuredYtDlpBin) {
        return {
            command: configuredYtDlpBin,
            args,
        };
    }
    if (process.platform === "win32") {
        return {
            command: getPythonBin(),
            args: ["-m", "yt_dlp", ...args],
        };
    }
    const pipxYtDlpBin = getPipxYtDlpBin();
    if (pipxYtDlpBin && fs.existsSync(pipxYtDlpBin)) {
        return {
            command: pipxYtDlpBin,
            args,
        };
    }
    return {
        command: "yt-dlp",
        args,
    };
}
// yt-dlp 업데이트에 사용할 Python 실행 명령을 반환합니다.
function getPythonBin() {
    return (process.env.YTDLP_PYTHON_BIN?.trim() ||
        (process.platform === "win32" ? "python" : "python3"));
}
// yt-dlp 자동 업데이트 기능을 사용할지 판단합니다.
function shouldAutoUpdateYtDlp() {
    return process.env.YTDLP_AUTO_UPDATE === "true";
}
// yt-dlp 업데이트 방식을 반환합니다.
function getYtDlpUpdateMethod() {
    const updateMethod = process.env.YTDLP_UPDATE_METHOD?.trim().toLowerCase();
    if (updateMethod === "pip")
        return "pip";
    return "pipx";
}
// yt-dlp 자동 업데이트 확인 주기를 반환합니다.
function getYtDlpUpdateIntervalMs() {
    const envInterval = Number(process.env.YTDLP_UPDATE_INTERVAL_MS);
    if (Number.isFinite(envInterval) && envInterval > 0) {
        return envInterval;
    }
    return DEFAULT_YTDLP_UPDATE_INTERVAL_MS;
}
// 외부 명령을 실행하고 stdout/stderr를 문자열로 반환합니다.
function runProcess(command, args) {
    return new Promise((resolve, reject) => {
        const childProcess = (0, child_process_1.spawn)(command, args, { windowsHide: true });
        const stdoutChunks = [];
        const stderrChunks = [];
        childProcess.stdout.on("data", (data) => {
            stdoutChunks.push(data.toString());
        });
        childProcess.stderr.on("data", (data) => {
            stderrChunks.push(data.toString());
        });
        childProcess.on("error", reject);
        childProcess.on("close", (code) => {
            const stdout = stdoutChunks.join("");
            const stderr = stderrChunks.join("");
            if (code !== 0) {
                reject(Error(`${command} ${args.join(" ")} failed with code ${code}: ${stderr || stdout}`));
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}
// 선택된 패키지 관리 도구를 통해 yt-dlp를 최신 버전으로 업데이트합니다.
async function updateYtDlp() {
    if (getYtDlpUpdateMethod() === "pip") {
        await runProcess(getPythonBin(), ["-m", "pip", "install", "-U", "yt-dlp"]);
        return;
    }
    await runProcess("pipx", ["upgrade", "yt-dlp"]);
}
// 설정된 주기마다 yt-dlp 자동 업데이트를 시도합니다.
async function autoUpdateYtDlp(req, res, next) {
    if (!shouldAutoUpdateYtDlp()) {
        next();
        return;
    }
    const now = Date.now();
    if (now - lastYtDlpUpdateCheckedAt < getYtDlpUpdateIntervalMs()) {
        next();
        return;
    }
    if (ytDlpUpdatePromise === null) {
        ytDlpUpdatePromise = updateYtDlp()
            .then(() => {
            lastYtDlpUpdateCheckedAt = Date.now();
        })
            .catch((err) => {
            lastYtDlpUpdateCheckedAt = Date.now();
            console.warn("[yt-dlp] auto update failed:", err);
        })
            .then(() => {
            ytDlpUpdatePromise = null;
        });
    }
    await ytDlpUpdatePromise;
    next();
}
// yt-dlp stderr 내용을 사용자에게 보여줄 메시지로 변환합니다.
function mapYtDlpErrorMessage(stderr) {
    if (stderr.includes("No supported JavaScript runtime could be found")) {
        return "yt-dlp JavaScript runtime 설정이 필요합니다. YTDLP_JS_RUNTIMES=node 값을 확인해 주세요.";
    }
    if (stderr.includes("Sign in to confirm")) {
        return "YouTube에서 로그인을 요구하는 영상입니다. yt-dlp 쿠키 설정이 필요합니다.";
    }
    if (stderr.includes("Unsupported URL")) {
        return "지원하지 않는 YouTube URL입니다.";
    }
    return "yt-dlp 영상 다운로드에 실패했습니다.";
}
// yt-dlp 공통 옵션을 환경변수 기반으로 추가합니다.
function appendYtDlpOptionalArgs(args) {
    const jsRuntime = process.env.YTDLP_JS_RUNTIMES?.trim();
    if (jsRuntime) {
        args.push("--js-runtimes", jsRuntime);
    }
    const cookiesPath = process.env.YTDLP_COOKIES_PATH?.trim();
    if (cookiesPath) {
        args.push("--cookies", cookiesPath);
    }
    const cookiesFromBrowser = process.env.YTDLP_COOKIES_FROM_BROWSER?.trim();
    if (cookiesFromBrowser) {
        args.push("--cookies-from-browser", cookiesFromBrowser);
    }
    const userAgent = process.env.YTDLP_USER_AGENT?.trim();
    if (userAgent) {
        args.push("--user-agent", userAgent);
    }
}
// yt-dlp 영상 다운로드 인자 목록을 구성합니다.
function getYtDlpVideoCommandArgs(outputTemplate, youtubeUrl) {
    const args = [
        "--no-playlist",
        "-o",
        outputTemplate,
        "-f",
        "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best[ext=mp4]/best",
        "--merge-output-format",
        "mp4",
        "--print",
        "after_move:filepath",
    ];
    appendYtDlpOptionalArgs(args);
    args.push(youtubeUrl);
    return args;
}
// yt-dlp 오디오 다운로드 인자 목록을 구성합니다.
function getYtDlpAudioCommandArgs(outputTemplate, youtubeUrl) {
    const args = [
        "--no-playlist",
        "-o",
        outputTemplate,
        "-f",
        "ba[ext=m4a]/bestaudio[ext=m4a]/ba[ext=webm]/bestaudio",
        "--print",
        "after_move:filepath",
    ];
    appendYtDlpOptionalArgs(args);
    args.push(youtubeUrl);
    return args;
}
// yt-dlp 다운로드 프로세스를 실행하고 출력된 파일 경로 목록을 반환합니다.
function runYtDlpDownload(req, args) {
    return new Promise((resolve, reject) => {
        const ytDlpCommand = getYtDlpSpawnCommand(args);
        const ytDlpProcess = (0, child_process_1.spawn)(ytDlpCommand.command, ytDlpCommand.args, {
            windowsHide: true,
        });
        const stdoutChunks = [];
        const stderrChunks = [];
        const abortHandler = () => {
            ytDlpProcess.kill("SIGTERM");
        };
        req.on("aborted", abortHandler);
        ytDlpProcess.stdout.on("data", (data) => {
            stdoutChunks.push(data.toString());
        });
        ytDlpProcess.stderr.on("data", (data) => {
            stderrChunks.push(data.toString());
        });
        ytDlpProcess.on("error", (err) => {
            req.off("aborted", abortHandler);
            reject(Error(`${ytDlpCommand.command} 실행에 실패했습니다. yt-dlp 설치, PATH, 또는 YTDLP_BIN 설정을 확인해 주세요. pipx로 설치했다면 YTDLP_BIN=${getPipxYtDlpBin()} 값을 사용할 수 있습니다. (${err.message})`));
        });
        ytDlpProcess.on("close", (code) => {
            req.off("aborted", abortHandler);
            if (code !== 0) {
                const stderr = stderrChunks.join("");
                reject(Error(`${mapYtDlpErrorMessage(stderr)} (code ${code})`));
                return;
            }
            resolve(stdoutChunks
                .join("")
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0));
        });
    });
}
// yt-dlp가 출력한 경로 또는 작업 폴더에서 실제 다운로드 파일을 찾습니다.
function getExistingYtDlpOutputPathByExt(dirPath, printedPaths, fileBaseName, extPriority) {
    const existingPrintedPath = printedPaths.find((candidate) => fs.existsSync(candidate));
    if (existingPrintedPath)
        return existingPrintedPath;
    if (!fs.existsSync(dirPath))
        return null;
    return (fs
        .readdirSync(dirPath)
        .map((fileName) => path.join(dirPath, fileName))
        .filter((filePath) => path.basename(filePath).startsWith(`${fileBaseName}.`) &&
        extPriority.includes(path.extname(filePath).toLowerCase()))
        .sort((a, b) => {
        const aExt = path.extname(a).toLowerCase();
        const bExt = path.extname(b).toLowerCase();
        return extPriority.indexOf(aExt) - extPriority.indexOf(bExt);
    })[0] ?? null);
}
// 작업 폴더에서 실제 다운로드된 영상 파일을 찾습니다.
function getExistingYtDlpVideoOutputPath(dirPath, printedPaths) {
    return getExistingYtDlpOutputPathByExt(dirPath, printedPaths, "video", [
        ".mp4",
        ".mkv",
        ".webm",
        ".mov",
    ]);
}
// 작업 폴더에서 실제 다운로드된 오디오 파일을 찾습니다.
function getExistingYtDlpAudioOutputPath(dirPath, printedPaths) {
    return getExistingYtDlpOutputPathByExt(dirPath, printedPaths, "audio", [
        ".m4a",
        ".mp3",
        ".webm",
        ".opus",
        ".wav",
    ]);
}
// 요청 본문에서 YouTube URL과 언어 값을 검증하고 작업 상태를 초기화합니다.
function validateYoutubeUrl(req, res, next) {
    const youtubeUrl = normalizeYoutubeUrl(req.body.youtubeUrl);
    const videoId = getYoutubeVideoId(youtubeUrl);
    if (youtubeUrl.length === 0 || videoId.length === 0) {
        res.status(400).send({
            err: true,
            message: "유효한 YouTube URL을 입력해 주세요.",
        });
        return;
    }
    res.locals.youtubeUpload = {
        youtubeUrl,
        videoId,
        sourceLanguage: req.body.sourceLanguage || "KOR",
        targetLanguage: req.body.targetLanguage || "ENG",
    };
    next();
}
// 다운로드 파일을 저장할 data/jobs/{jobId} 폴더를 준비합니다.
function prepareDownloadFolder(req, res, next) {
    const state = getState(res);
    const jobId = (0, crypto_1.randomUUID)();
    const jobDir = path.join(JOBS_ROOT, jobId);
    fs.mkdirSync(jobDir, { recursive: true });
    state.jobId = jobId;
    state.jobDir = jobDir;
    state.videoOutputTemplate = path.join(jobDir, "video.%(ext)s");
    state.audioOutputTemplate = path.join(jobDir, "audio.%(ext)s");
    next();
}
// YouTube 영상을 작업 폴더에 다운로드합니다.
async function downloadYoutubeVideo(req, res, next) {
    const state = getState(res);
    try {
        const printedPaths = await runYtDlpDownload(req, getYtDlpVideoCommandArgs(state.videoOutputTemplate, state.youtubeUrl));
        const videoPath = getExistingYtDlpVideoOutputPath(state.jobDir, printedPaths);
        if (videoPath === null) {
            throw Error("다운로드된 영상 파일을 찾을 수 없습니다.");
        }
        state.videoPath = videoPath;
        state.videoPublicPath = toPublicDataPath(videoPath);
        state.fileSize = fs.statSync(videoPath).size;
        next();
    }
    catch (err) {
        next(err);
    }
}
// ElevenLabs STT에 전달할 오디오 파일을 작업 폴더에 다운로드합니다.
async function downloadYoutubeAudio(req, res, next) {
    const state = getState(res);
    try {
        const printedPaths = await runYtDlpDownload(req, getYtDlpAudioCommandArgs(state.audioOutputTemplate, state.youtubeUrl));
        const audioPath = getExistingYtDlpAudioOutputPath(state.jobDir, printedPaths);
        if (audioPath === null) {
            throw Error("STT에 사용할 오디오 파일을 찾을 수 없습니다.");
        }
        state.audioPath = audioPath;
        state.audioPublicPath = toPublicDataPath(audioPath);
        next();
    }
    catch (err) {
        next(err);
    }
}
// 다운로드가 끝난 영상 작업 정보를 ai_video_jobs 테이블에 저장합니다.
async function insertAiVideoJob(req, res, next) {
    const state = getState(res);
    try {
        await db_1.dbPool.execute(`
      INSERT INTO ai_video_jobs (
        id,
        youtube_url,
        title,
        video_path,
        audio_path,
        thumbnail_path,
        duration,
        source_language,
        target_language,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            state.jobId,
            state.youtubeUrl,
            `YouTube video (${state.videoId})`,
            state.videoPublicPath,
            state.audioPublicPath,
            null,
            0,
            state.sourceLanguage,
            state.targetLanguage,
            "download_ready",
        ]);
        state.dbSaved = true;
        next();
    }
    catch (err) {
        next(err);
    }
}
// 다운로드 결과를 프론트엔드에 반환합니다.
function sendDownloadResult(req, res) {
    const state = getState(res);
    res.send({
        err: false,
        data: {
            jobId: state.jobId,
            youtubeUrl: state.youtubeUrl,
            videoId: state.videoId,
            sourceLanguage: state.sourceLanguage,
            targetLanguage: state.targetLanguage,
            thumbnailUrl: `https://img.youtube.com/vi/${state.videoId}/mqdefault.jpg`,
            videoPath: state.videoPublicPath,
            audioPath: state.audioPublicPath,
            fileSize: state.fileSize,
            dbSaved: state.dbSaved,
        },
    });
}
// YouTube 업로드 라우터 오류를 공통 응답 형식으로 처리합니다.
function handleYoutubeUploadError(err, req, res, next) {
    console.error(err);
    res.status(500).send({
        err: true,
        message: err.message || "YouTube 영상 다운로드에 실패했습니다.",
    });
}
router.post("/youtube-url", validateYoutubeUrl, prepareDownloadFolder, autoUpdateYtDlp, downloadYoutubeVideo, downloadYoutubeAudio, insertAiVideoJob, sendDownloadResult);
router.use(handleYoutubeUploadError);
exports.default = router;
//# sourceMappingURL=youtubeUpload.js.map