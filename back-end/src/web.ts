import express, { Request, Response, NextFunction } from "express";
const app = express();
import bodyParser from "body-parser";
import path from "path";
import mysql, { Connection,Pool } from "mysql2";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import youtubeUpload from "./router/youtubeUpload";
import { closeDbPool } from "./db";

// .env 파일에서 환경 변수 로드
dotenv.config();

declare global {
  namespace NodeJS {
    interface Process {
      _myApp: MyApp;
    }
  }

  interface MyApp {        
    db: Pool;        
    checkSession:(req: Request, res: Response, next: NextFunction)=>void;
  }
}

declare module "express-session" {
  export interface SessionData {
    user: number;
    picture_uri: string;
    email:string;
    name:string;        
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}


//https://expressjs.com/ko/starter/static-files.html s
app.set("puplic", path.join(__dirname, "../build"));
app.use(express.static(app.settings.puplic));
//https://www.npmjs.com/package/body-parser
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));



app.use(cookieParser());

const sessionMiddleware = session({
  secret: "subscribe_loutbtbahah4281!@",
  resave: true,
  saveUninitialized: false,  
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 * 7, // 24 hours
  },
});

app.use(sessionMiddleware);
app.use("/data", express.static(path.join(__dirname, "../../data")));
app.use(express.static(path.join(__dirname, '../wavesurfer')));
app.use("/upload", youtubeUpload);

// ② React 번들의 정적 파일
app.use(
  express.static(path.join(__dirname, "../build"), {
    index: false,                               // index.html 은 직접 라우트에서 전송
  })
);


// ⑤ React SPA 용 catch‑all
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

console.log(
  "[routes]",
  app._router.stack
    .filter((l: { route: any; }) => l.route)
    .map((l: { route: { methods: {}; path: any; }; }) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`)
);

const server = app.listen(3000, () => {
  console.log(`Example app listening on port ${3000}`);
});

const shutdown = async () => {
  server.close(async () => {
    await closeDbPool();
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

export default app;
