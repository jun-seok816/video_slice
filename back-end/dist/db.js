"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.closeDbPool = exports.checkDbConnection = void 0;
require("./env");
const promise_1 = __importDefault(require("mysql2/promise"));
const toNumber = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const dbPool = promise_1.default.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "video_ai_translation",
    waitForConnections: true,
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
    charset: "utf8mb4"
});
exports.dbPool = dbPool;
const checkDbConnection = async () => {
    const [rows] = await dbPool.query("SELECT 1 AS ok");
    return rows;
};
exports.checkDbConnection = checkDbConnection;
const closeDbPool = async () => {
    await dbPool.end();
};
exports.closeDbPool = closeDbPool;
//# sourceMappingURL=db.js.map