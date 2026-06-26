import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

router.post("/photo", upload.single("photo"), (req: AuthRequest, res: Response): void => {
  if (!req.file) { res.status(400).json({ error: "사진 파일이 필요해요." }); return; }
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3004}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
