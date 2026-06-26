import { Router, Request, Response } from "express";
import { db, randomUUID } from "../db";
import { signToken, authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", (req: Request, res: Response): void => {
  const { anonymousKey } = req.body as { anonymousKey: string };
  if (!anonymousKey) { res.status(400).json({ error: "anonymousKey가 필요해요." }); return; }

  try {
    let user = db.findUserByKey(anonymousKey);
    if (!user) {
      user = {
        id: randomUUID(),
        anonymousKey,
        tossUserKey: null,
        nickname: null,
        createdAt: new Date().toISOString(),
      };
      db.createUser(user);
    }
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, nickname: user.nickname } });
  } catch (error) {
    console.error("[AUTH]", error);
    res.status(500).json({ error: "로그인 중 오류가 발생했어요." });
  }
});

router.patch("/me", authMiddleware, (req: AuthRequest, res: Response): void => {
  const { nickname } = req.body as { nickname?: string };
  if (!nickname || nickname.trim().length === 0) { res.status(400).json({ error: "별명을 입력해주세요." }); return; }
  if (nickname.length > 10) { res.status(400).json({ error: "별명은 10자 이내로 입력해주세요." }); return; }
  db.updateUser(req.userId!, { nickname: nickname.trim() });
  res.json({ ok: true, nickname: nickname.trim() });
});

router.delete("/me", authMiddleware, (req: AuthRequest, res: Response): void => {
  db.deleteUser(req.userId!);
  res.json({ ok: true });
});

router.post("/unlink", (req: Request, res: Response): void => {
  const { userKey } = req.body as { userKey?: number };
  if (userKey) {
    const data = require("fs").readFileSync(
      require("path").join(process.env.DATA_DIR ?? require("path").join(__dirname, "..", "..", "data"), "tteonalite-db.json"), "utf-8"
    );
    const parsed = JSON.parse(data) as { users: Array<{ id: string; tossUserKey: number | null }> };
    const user = parsed.users.find(u => u.tossUserKey === userKey);
    if (user) {
      db.deleteUser(user.id);
      console.log(`[Unlink] 유저 데이터 삭제: tossUserKey=${userKey}`);
    }
  }
  res.json({ ok: true });
});

export default router;
