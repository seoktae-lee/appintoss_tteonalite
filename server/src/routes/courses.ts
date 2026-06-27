import { Router, Response } from "express";
import { db, randomUUID, type PlaceRecord, type CourseRecord } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { reverseGeocode } from "../services/geocode";

const router = Router();
router.use(authMiddleware);

// ── 나의 오늘 (Today Session) ──

router.post("/today/start", (req: AuthRequest, res: Response): void => {
  const existing = db.getActiveSession(req.userId!);
  if (existing) { res.json({ session: existing }); return; }

  const session = {
    id: randomUUID(),
    userId: req.userId!,
    places: [],
    startedAt: new Date().toISOString(),
    status: "recording" as const,
  };
  db.createSession(session);
  res.json({ session });
});

router.get("/today/active", (req: AuthRequest, res: Response): void => {
  const session = db.getActiveSession(req.userId!);
  res.json({ session: session || null });
});

router.post("/today/add-place", async (req: AuthRequest, res: Response): Promise<void> => {
  const session = db.getActiveSession(req.userId!);
  if (!session) { res.status(400).json({ error: "기록 중인 세션이 없어요." }); return; }

  const { lat, lng, memo, placeName, photoUrl } = req.body as {
    lat: number; lng: number; memo?: string; placeName?: string; photoUrl?: string;
  };

  if (!lat || !lng) { res.status(400).json({ error: "위치 정보가 필요해요." }); return; }

  const address = await reverseGeocode(lat, lng);

  const place: PlaceRecord = {
    id: randomUUID(),
    photoUrl: photoUrl || null,
    address,
    placeName: placeName || null,
    lat, lng,
    memo: memo || null,
    createdAt: new Date().toISOString(),
  };

  const updated = db.addPlaceToSession(session.id, place);
  res.json({ session: updated, place });
});

router.post("/today/discard", (req: AuthRequest, res: Response): void => {
  const session = db.getActiveSession(req.userId!);
  if (!session) { res.json({ ok: true }); return; }
  db.finishSession(session.id);
  res.json({ ok: true });
});

router.post("/today/finish", (req: AuthRequest, res: Response): void => {
  const session = db.getActiveSession(req.userId!);
  if (!session) { res.status(400).json({ error: "기록 중인 세션이 없어요." }); return; }

  const { title, tag, isPublic } = req.body as { title?: string; tag?: string; isPublic?: boolean };

  const finished = db.finishSession(session.id);
  if (!finished || finished.places.length === 0) {
    res.status(400).json({ error: "장소가 없어서 코스를 저장할 수 없어요." });
    return;
  }

  const today = new Date();
  const defaultTitle = `${today.getMonth() + 1}월 ${today.getDate()}일 코스`;

  const course: CourseRecord = {
    id: randomUUID(),
    userId: req.userId!,
    title: title || defaultTitle,
    tag: (tag as CourseRecord["tag"]) || "etc",
    isPublic: isPublic ?? false,
    places: finished.places,
    likes: [],
    bookmarks: [],
    reports: [],
    createdAt: new Date().toISOString(),
  };

  db.createCourse(course);
  res.json({ course });
});

// ── 코스 CRUD ──

router.get("/my", (req: AuthRequest, res: Response): void => {
  const courses = db.getCoursesByUser(req.userId!);
  res.json({ courses });
});

router.get("/explore", (req: AuthRequest, res: Response): void => {
  const tag = req.query.tag as string | undefined;
  const courses = db.getPublicCourses(tag);
  const user = db.findUserById(req.userId!);
  const enriched = courses.map(c => ({
    ...c,
    authorNickname: db.findUserById(c.userId)?.nickname || "익명",
    isLiked: c.likes.includes(req.userId!),
    isBookmarked: c.bookmarks.includes(req.userId!),
    likeCount: c.likes.length,
  }));
  res.json({ courses: enriched });
});

router.get("/:id", (req: AuthRequest, res: Response): void => {
  const course = db.getCourseById(req.params.id);
  if (!course) { res.status(404).json({ error: "코스를 찾을 수 없어요." }); return; }
  const author = db.findUserById(course.userId);
  res.json({
    course: {
      ...course,
      authorNickname: author?.nickname || "익명",
      isLiked: course.likes.includes(req.userId!),
      isBookmarked: course.bookmarks.includes(req.userId!),
      likeCount: course.likes.length,
      isMine: course.userId === req.userId,
    },
  });
});

router.patch("/:id", (req: AuthRequest, res: Response): void => {
  const course = db.getCourseById(req.params.id);
  if (!course || course.userId !== req.userId) { res.status(403).json({ error: "권한이 없어요." }); return; }
  const { title, tag, isPublic } = req.body;
  db.updateCourse(req.params.id, { ...(title && { title }), ...(tag && { tag }), ...(isPublic !== undefined && { isPublic }) });
  res.json({ ok: true });
});

router.delete("/:id", (req: AuthRequest, res: Response): void => {
  const course = db.getCourseById(req.params.id);
  if (!course || course.userId !== req.userId) { res.status(403).json({ error: "권한이 없어요." }); return; }
  db.deleteCourse(req.params.id);
  res.json({ ok: true });
});

router.post("/:id/like", (req: AuthRequest, res: Response): void => {
  const liked = db.toggleLike(req.params.id, req.userId!);
  res.json({ liked });
});

router.post("/:id/bookmark", (req: AuthRequest, res: Response): void => {
  const bookmarked = db.toggleBookmark(req.params.id, req.userId!);
  res.json({ bookmarked });
});

router.post("/:id/report", (req: AuthRequest, res: Response): void => {
  db.reportCourse(req.params.id, req.userId!);
  res.json({ ok: true });
});

// ── 아카이브 ──

router.get("/archive/dates", (req: AuthRequest, res: Response): void => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const dates = db.getCourseDates(req.userId!, year, month);
  res.json({ dates });
});

router.get("/archive/list", (req: AuthRequest, res: Response): void => {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const courses = db.getCoursesByMonth(req.userId!, year, month);
  res.json({ courses });
});

export default router;
