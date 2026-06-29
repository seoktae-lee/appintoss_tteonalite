import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Course, CourseTag } from "../api/types";
import tteoniGuide from "../assets/mascot/tteoni-guide.png";
import { NaruLoading } from "../components/NaruLoading";
import { BannerAdSlot } from "../components/BannerAdSlot";
import heartOrange from "../assets/heart-orange.png";

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

type ViewMode = "explore" | "liked" | "bookmarked";

export function ExploreTab({ onCourseDetail }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("explore");
  const [loading, setLoading] = useState(true);

  const loadCourses = async (tag?: string, mode?: ViewMode) => {
    setLoading(true);
    try {
      const currentMode = mode || viewMode;
      if (currentMode === "explore") {
        const query = tag && tag !== "all" ? `?tag=${tag}` : "";
        const res = await api.get<{ courses: Course[] }>(`/api/courses/explore${query}`);
        setCourses(res.courses);
      } else {
        const res = await api.get<{ courses: Course[] }>(`/api/courses/explore`);
        if (currentMode === "liked") {
          setCourses(res.courses.filter(c => c.isLiked));
        } else {
          setCourses(res.courses.filter(c => c.isBookmarked));
        }
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(selectedTag, viewMode); }, [selectedTag, viewMode]);

  return (
    <div style={{ padding: "12px 0 100px" }}>
      <div style={{ padding: "0 20px 12px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>코스 탐색</h2>
        {/* 뷰 모드 탭 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {([
            { key: "explore" as ViewMode, label: "전체" },
            { key: "liked" as ViewMode, label: "좋아요" },
            { key: "bookmarked" as ViewMode, label: "🔖 북마크" },
          ]).map(m => (
            <button key={m.key} onClick={() => setViewMode(m.key)} style={{
              padding: "6px 14px", borderRadius: 100, fontSize: 13,
              fontWeight: viewMode === m.key ? 700 : 500,
              border: "none",
              background: viewMode === m.key ? "var(--or)" : "var(--g100)",
              color: viewMode === m.key ? "#fff" : "var(--g500)",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {m.key === "liked" && <img src={heartOrange} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />}
              {m.label}
            </button>
          ))}
        </div>
        {viewMode === "explore" && (
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
        )}
      </div>

      {loading ? (
        <NaruLoading message="코스를 불러오는 중!" />
      ) : courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <img src={tteoniGuide} alt="" style={{ height: 100, opacity: 0.5, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--g700)", marginBottom: 4 }}>
            {viewMode === "liked" ? "좋아요한 코스가 없어!" : viewMode === "bookmarked" ? "북마크한 코스가 없어!" : "아직 공개된 코스가 없어!"}
          </p>
          <p style={{ fontSize: 13, color: "var(--g400)" }}>
            {viewMode === "explore" ? "\"나의 오늘\"로 첫 코스를 만들어봐" : "탐색에서 마음에 드는 코스를 찾아봐"}
          </p>
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
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><img src={heartOrange} alt="" style={{ width: 16, height: 16 }} />{course.likeCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 배너 광고 */}
      <div style={{ margin: "16px 20px" }}>
        <BannerAdSlot adGroupId="ait.v2.live.cfbd9ede35f94c00" />
      </div>

    </div>
  );
}
