import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export { randomUUID };

// ── Types ──
export interface UserRecord {
  id: string;
  anonymousKey: string;
  tossUserKey: number | null;
  nickname: string | null;
  createdAt: string;
}

export interface PlaceRecord {
  id: string;
  photoUrl: string | null;
  address: string;
  placeName: string | null;
  lat: number;
  lng: number;
  memo: string | null;
  createdAt: string;
}

export interface CourseRecord {
  id: string;
  userId: string;
  title: string;
  tag: "date" | "travel" | "food" | "cafe" | "walk" | "etc";
  isPublic: boolean;
  isAnonymous: boolean;
  places: PlaceRecord[];
  likes: string[];
  bookmarks: string[];
  reports: string[];
  createdAt: string;
}

export interface TodaySession {
  id: string;
  userId: string;
  places: PlaceRecord[];
  startedAt: string;
  status: "recording" | "finished";
}

interface DB {
  users: UserRecord[];
  courses: CourseRecord[];
  todaySessions: TodaySession[];
}

// ── File I/O ──
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "tteonalite-db.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load(): DB {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) return { users: [], courses: [], todaySessions: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function save(data: DB) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── User ──
export const db = {
  findUserByKey(anonymousKey: string): UserRecord | undefined {
    return load().users.find(u => u.anonymousKey === anonymousKey);
  },

  findUserByTossKey(tossUserKey: number): UserRecord | undefined {
    return load().users.find(u => u.tossUserKey === tossUserKey);
  },

  findUserById(id: string): UserRecord | undefined {
    return load().users.find(u => u.id === id);
  },

  createUser(user: UserRecord) {
    const data = load();
    data.users.push(user);
    save(data);
  },

  updateUser(id: string, updates: Partial<UserRecord>) {
    const data = load();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) { Object.assign(data.users[idx], updates); save(data); }
  },

  setTossUserKey(id: string, key: number) {
    this.updateUser(id, { tossUserKey: key });
  },

  deleteUser(id: string) {
    const data = load();
    data.users = data.users.filter(u => u.id !== id);
    data.courses = data.courses.filter(c => c.userId !== id);
    data.todaySessions = data.todaySessions.filter(s => s.userId !== id);
    save(data);
  },

  // ── Today Session ──
  getActiveSession(userId: string): TodaySession | undefined {
    return load().todaySessions.find(s => s.userId === userId && s.status === "recording");
  },

  createSession(session: TodaySession) {
    const data = load();
    data.todaySessions.push(session);
    save(data);
  },

  addPlaceToSession(sessionId: string, place: PlaceRecord) {
    const data = load();
    const session = data.todaySessions.find(s => s.id === sessionId);
    if (session) { session.places.push(place); save(data); }
    return session;
  },

  removePlaceFromSession(sessionId: string, placeId: string) {
    const data = load();
    const session = data.todaySessions.find(s => s.id === sessionId);
    if (session) {
      session.places = session.places.filter(p => p.id !== placeId);
      save(data);
    }
    return session;
  },

  finishSession(sessionId: string): TodaySession | undefined {
    const data = load();
    const session = data.todaySessions.find(s => s.id === sessionId);
    if (session) { session.status = "finished"; save(data); }
    return session;
  },

  // ── Courses ──
  createCourse(course: CourseRecord) {
    const data = load();
    data.courses.push(course);
    save(data);
    return course;
  },

  getCoursesByUser(userId: string): CourseRecord[] {
    return load().courses.filter(c => c.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getPublicCourses(tag?: string): CourseRecord[] {
    let courses = load().courses.filter(c => c.isPublic && c.reports.length < 3);
    if (tag && tag !== "all") courses = courses.filter(c => c.tag === tag);
    return courses.sort((a, b) => b.likes.length - a.likes.length);
  },

  getCourseById(id: string): CourseRecord | undefined {
    return load().courses.find(c => c.id === id);
  },

  updateCourse(id: string, updates: Partial<CourseRecord>) {
    const data = load();
    const idx = data.courses.findIndex(c => c.id === id);
    if (idx !== -1) { Object.assign(data.courses[idx], updates); save(data); }
  },

  deleteCourse(id: string) {
    const data = load();
    data.courses = data.courses.filter(c => c.id !== id);
    save(data);
  },

  toggleLike(courseId: string, userId: string): boolean {
    const data = load();
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return false;
    const idx = course.likes.indexOf(userId);
    if (idx === -1) course.likes.push(userId);
    else course.likes.splice(idx, 1);
    save(data);
    return idx === -1;
  },

  toggleBookmark(courseId: string, userId: string): boolean {
    const data = load();
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return false;
    const idx = course.bookmarks.indexOf(userId);
    if (idx === -1) course.bookmarks.push(userId);
    else course.bookmarks.splice(idx, 1);
    save(data);
    return idx === -1;
  },

  reportCourse(courseId: string, userId: string) {
    const data = load();
    const course = data.courses.find(c => c.id === courseId);
    if (course && !course.reports.includes(userId)) {
      course.reports.push(userId);
      save(data);
    }
  },

  // ── Archive ──
  getCoursesByMonth(userId: string, year: number, month: number): CourseRecord[] {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return load().courses.filter(c => c.userId === userId && c.createdAt.startsWith(prefix));
  },

  getCourseDates(userId: string, year: number, month: number): string[] {
    const courses = this.getCoursesByMonth(userId, year, month);
    return [...new Set(courses.map(c => c.createdAt.slice(0, 10)))];
  },
};
