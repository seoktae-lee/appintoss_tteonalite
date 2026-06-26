import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import uploadRouter from "./routes/upload";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 사진 업로드용 static
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/upload", uploadRouter);

app.get("/health", (_req, res) => res.json({ status: "ok", app: "tteonalite" }));

app.listen(PORT, () => {
  console.log(`TteonaLite server running on port ${PORT}`);
});
