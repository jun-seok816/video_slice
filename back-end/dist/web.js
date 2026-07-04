"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const youtubeUpload_1 = __importDefault(require("./router/youtubeUpload"));
const stt_1 = __importDefault(require("./router/stt"));
const translation_1 = __importDefault(require("./router/translation"));
const db_1 = require("./db");
// .env 파일에서 환경 변수 로드
dotenv_1.default.config();
//https://expressjs.com/ko/starter/static-files.html s
app.set("puplic", path_1.default.join(__dirname, "../build"));
app.use(express_1.default.static(app.settings.puplic));
//https://www.npmjs.com/package/body-parser
app.use(body_parser_1.default.json({ limit: "100mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "100mb", extended: false }));
app.use((0, cookie_parser_1.default)());
const sessionMiddleware = (0, express_session_1.default)({
    secret: "subscribe_loutbtbahah4281!@",
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 * 7, // 24 hours
    },
});
app.use(sessionMiddleware);
app.use("/data", express_1.default.static(path_1.default.join(__dirname, "../../data")));
app.use(express_1.default.static(path_1.default.join(__dirname, '../wavesurfer')));
app.use("/upload", youtubeUpload_1.default);
app.use("/stt", stt_1.default);
app.use("/translation", translation_1.default);
// ② React 번들의 정적 파일
app.use(express_1.default.static(path_1.default.join(__dirname, "../build"), {
    index: false, // index.html 은 직접 라우트에서 전송
}));
// ⑤ React SPA 용 catch‑all
app.get("*", (_, res) => {
    res.sendFile(path_1.default.join(__dirname, "../build/index.html"));
});
console.log("[routes]", app._router.stack
    .filter((l) => l.route)
    .map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`));
const server = app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`);
});
const shutdown = async () => {
    server.close(async () => {
        await (0, db_1.closeDbPool)();
        process.exit(0);
    });
};
process.on("SIGINT", () => {
    void shutdown();
});
process.on("SIGTERM", () => {
    void shutdown();
});
server.keepAliveTimeout = 300; // Keep-Alive 연결 제한 시간
server.headersTimeout = 11000; // 헤더 대기 시간
exports.default = app;
//# sourceMappingURL=web.js.map