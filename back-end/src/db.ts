import "./env";
import mysql, { type Pool } from "mysql2/promise";

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dbPool: Pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: toNumber(process.env.DB_PORT, 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "webtoon_translation",
  waitForConnections: true,
  connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  charset: "utf8mb4"
});

const checkDbConnection = async () => {
  const [rows] = await dbPool.query("SELECT 1 AS ok");
  return rows;
};

const closeDbPool = async () => {
  await dbPool.end();
};

export { checkDbConnection, closeDbPool, dbPool };
