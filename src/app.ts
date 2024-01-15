import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { DATA_LIMIT } from "./constants";
import userRouter from "./routes/user.routes";
import videoRouter from "./routes/video.routes";

const app = express();

// ================= middlewares ================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// for json data configuration
app.use(
  express.json({
    limit: DATA_LIMIT,
  }),
);
// for url data configuration
app.use(express.urlencoded({ extended: true, limit: DATA_LIMIT }));
// for static files
app.use(express.static("public"));
app.use(cookieParser());

// ================ Routes ==================
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

export default app;
