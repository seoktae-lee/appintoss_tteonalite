import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Course } from "../api/types";

const TAG_LABEL: Record<string, string> = {
  date: "데이트", travel: "여행", food: "맛집탐방", cafe: "카페투어", walk: "산책", etc: "기타",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  onBack: () => void;
  onCourseDetail: (id: string) => void;
}

export function ArchivePage({ onBack, onCourseDetail }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dates, setDates] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const dRes = await api.get<{ dates: string[] }>(`/api/courses/archive/dates?year=${year}&month=${month}`);
        setDates(dRes.dates);
        const cRes = await api.get<{ courses: Course[] }>(`/api/courses/archive/list?year=${year}&month=${month}`);
        setCourses(cRes.courses);
      } catch {}
    })();
  }, [year, month]);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "0 20px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, border: "none", background: "var(--g100)", borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g700)" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>코스 아카이브</h2>
      </div>

      {/* 월 선택 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", fontSize: 18, color: "var(--g400)", cursor: "pointer" }}>◀</button>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{year}년 {month}월</h3>
        <button onClick={nextMonth} style={{ background: "none", border: "none", fontSize: 18, color: "var(--g400)", cursor: "pointer" }}>▶</button>
      </div>

      {/* 캘린더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", marginBottom: 20 }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ fontSize: 11, color: "var(--g400)", fontWeight: 600, padding: "4px 0" }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasCourse = dates.includes(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div key={day} onClick={() => hasCourse && onCourseDetail(courses.find(c => c.createdAt.startsWith(dateStr))?.id || "")} style={{
              padding: "8px 0", borderRadius: 8, fontSize: 13,
              background: hasCourse ? "var(--or-100)" : "transparent",
              color: hasCourse ? "var(--or-d)" : "var(--g500)",
              fontWeight: hasCourse ? 600 : 400,
              border: isToday ? "2px solid var(--or)" : "none",
              cursor: hasCourse ? "pointer" : "default",
            }}>{day}</div>
          );
        })}
      </div>

      {/* 최근 코스 */}
      {courses.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--g400)", marginBottom: 8 }}>최근 코스</p>
          {courses.map(course => (
            <div key={course.id} onClick={() => onCourseDetail(course.id)} style={{
              background: "#fff", borderRadius: 16, border: "1px solid var(--g100)",
              overflow: "hidden", marginBottom: 12, cursor: "pointer",
            }}>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--or-bg)", color: "var(--or-d)" }}>
                    {TAG_LABEL[course.tag]}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--g400)" }}>{new Date(course.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{course.title}</h3>
                <p style={{ fontSize: 12, color: "var(--g400)", margin: "2px 0 0" }}>장소 {course.places.length}곳</p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
