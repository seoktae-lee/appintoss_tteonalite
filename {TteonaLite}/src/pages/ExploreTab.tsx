import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Course, CourseTag } from "../api/types";
import tteoniGuide from "../assets/mascot/tteoni-guide.png";
import { NaruLoading } from "../components/NaruLoading";

const TAGS: { key: CourseTag | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "date", label: "데이트" },
  { key: "travel", label: "여행" },
  { key: "food", label: "맛집" },
  { key: "cafe", label: "카페" },
  { key: "walk", label: "산책" },
];

const TAG_LABEL: Record<string, string> = {
  date: "데이트", travel: "여행", food: "맛집탐방", cafe: "카페투어", walk: "산책", etc: "기타",
};

interface Props {
  onCourseDetail: (id: string) => void;
}

export function ExploreTab({ onCourseDetail }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const loadCourses = async (tag?: string) => {
    setLoading(true);
    try {
      const query = tag && tag !== "all" ? `?tag=${tag}` : "";
      const res = await api.get<{ courses: Course[] }>(`/api/courses/explore${query}`);
      setCourses(res.courses);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(selectedTag); }, [selectedTag]);

  return (
    <div style={{ padding: "12px 0 100px" }}>
      <div style={{ padding: "0 20px 12px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>코스 탐색</h2>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {TAGS.map(t => (
            <button key={t.key} onClick={() => setSelectedTag(t.key)} style={{
              padding: "7px 14px", borderRadius: 100, fontSize: 13, fontWeight: selectedTag === t.key ? 600 : 500,
              border: `1.5px solid ${selectedTag === t.key ? "var(--or)" : "var(--g200)"}`,
              background: selectedTag === t.key ? "var(--or)" : "#fff",
              color: selectedTag === t.key ? "#fff" : "var(--g500)",
              cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <NaruLoading message="코스를 불러오는 중!" />
      ) : courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <img src={tteoniGuide} alt="" style={{ height: 100, opacity: 0.5, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--g700)", marginBottom: 4 }}>아직 공개된 코스가 없어!</p>
          <p style={{ fontSize: 13, color: "var(--g400)" }}>"나의 오늘"로 첫 코스를 만들어봐</p>
        </div>
      ) : (
        <div style={{ padding: "0 20px" }}>
          {courses.map(course => {
            const firstPhoto = course.places.find(p => p.photoUrl)?.photoUrl;
            return (
              <div key={course.id} onClick={() => onCourseDetail(course.id)} style={{
                background: "#fff", borderRadius: 16, border: "1px solid var(--g100)",
                overflow: "hidden", marginBottom: 12, cursor: "pointer",
              }}>
                {firstPhoto && (
                  <img src={firstPhoto} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
                )}
                <div style={{ padding: "12px 14px" }}>
                  <span style={{
                    display: "inline-flex", padding: "3px 8px", borderRadius: 6,
                    fontSize: 11, fontWeight: 600, background: "var(--or-bg)", color: "var(--or-d)",
                  }}>{TAG_LABEL[course.tag] || course.tag}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: "6px 0 4px", color: "var(--g900)" }}>{course.title}</h3>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--g400)" }}>
                    <span>{course.authorNickname}</span>
                    <span>장소 {course.places.length}곳</span>
                    <span>❤ {course.likeCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 본앱 유도 */}
      <div style={{
        margin: "16px 20px", padding: 16,
        background: "linear-gradient(135deg, var(--or-100), #FFF5EB)",
        borderRadius: 14, textAlign: "center",
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--or-d)", marginBottom: 4 }}>영상으로 더 멋지게 기록하고 싶다면?</p>
        <p style={{ fontSize: 12, color: "var(--g500)", marginBottom: 10 }}>떠나 앱에서 자동 Vlog를 만들어봐!</p>
        <button style={{
          padding: "8px 20px", borderRadius: 100, border: "none",
          background: "var(--or)", color: "#fff", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>떠나 앱 다운로드</button>
      </div>
    </div>
  );
}
