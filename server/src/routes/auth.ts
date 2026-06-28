import { Router, Request, Response } from "express";
import { db, randomUUID } from "../db";
import { signToken, authMiddleware, AuthRequest } from "../middleware/auth";
import { getTossUserKey } from "../services/tossLogin";

const router = Router();

router.post("/login", (req: Request, res: Response): void => {
  const { anonymousKey, authorizationCode, referrer } = req.body as {
    anonymousKey: string;
    authorizationCode?: string;
    referrer?: string;
  };
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

    if (authorizationCode && referrer && !user.tossUserKey) {
      getTossUserKey(authorizationCode, referrer)
        .then((tossUserKey) => {
          if (tossUserKey) {
            db.setTossUserKey(user!.id, tossUserKey);
            console.log(`[AUTH] tossUserKey 저장: userId=${user!.id}, tossUserKey=${tossUserKey}`);
          }
        })
        .catch(() => {});
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

function unlinkHandler(req: Request, res: Response): void {
  const userKey = Number(req.body?.userKey ?? req.query?.userKey) || 0;
  if (!userKey) { res.json({ ok: true }); return; }

  try {
    const user = db.findUserByTossKey(userKey);
    if (user) {
      db.deleteUser(user.id);
      console.log(`[Unlink] 유저 데이터 삭제: tossUserKey=${userKey}`);
    }
  } catch {}
  res.json({ ok: true });
}

router.get("/unlink", unlinkHandler);
router.post("/unlink", unlinkHandler);

export default router;
