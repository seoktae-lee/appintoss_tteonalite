import { useState, useEffect, useRef, useCallback } from "react";
import { ConfirmDialog } from "@toss/tds-mobile";
import { api } from "../api/client";
import type { Course } from "../api/types";
import { NaruLoading } from "../components/NaruLoading";
import "leaflet/dist/leaflet.css";

const TAG_LABEL: Record<string, string> = {
  date: "데이트", travel: "여행", food: "맛집탐방", cafe: "카페투어", walk: "산책", etc: "기타",
};

function PhotoSwiper({ photos, photoIndex, onIndexChange }: {
  photos: { photoUrl: string | null }[];
  photoIndex: number;
  onIndexChange: (i: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScroll = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !isUserScroll.current) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== photoIndex && idx >= 0 && idx < photos.length) {
      onIndexChange(idx);
    }
  }, [photoIndex, photos.length, onIndexChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    isUserScroll.current = false;
    el.scrollTo({ left: photoIndex * el.clientWidth, behavior: "smooth" });
    const timer = setTimeout(() => { isUserScroll.current = true; }, 300);
    return () => clearTimeout(timer);
  }, [photoIndex]);

  return (
    <div style={{ padding: "0 20px", marginBottom: 8 }}>
      <style>{`.photo-swiper::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={scrollRef}
        className="photo-swiper"
        onScroll={handleScroll}
        style={{
          display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
          borderRadius: 16, WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}
      >
        {photos.map((p, i) => (
          <img
            key={i}
            src={p.photoUrl || ""}
            alt=""
            style={{
              width: "100%", height: 200, objectFit: "cover", flexShrink: 0,
              scrollSnapAlign: "start",
            }}
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
          {photos.map((_, i) => (
            <div key={i} onClick={() => onIndexChange(i)} style={{
              width: i === photoIndex ? 16 : 8, height: 8,
              borderRadius: i === photoIndex ? 4 : 50,
              background: i === photoIndex ? "var(--or)" : "var(--g300)",
              cursor: "pointer", transition: ".2s",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  courseId: string;
  onBack: () => void;
  onStartCourseNav?: (course: Course) => void;
}

export function CourseDetailPage({ courseId, onBack, onStartCourseNav }: Props) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ course: Course }>(`/api/courses/${courseId}`);
        setCourse(res.course);
      } catch {} finally { setLoading(false); }
    })();
  }, [courseId]);

  useEffect(() => {
    if (!course || !mapRef.current) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

    import("leaflet").then(L => {
      const places = course.places;
      if (places.length === 0) return;

      const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
        .fitBounds(bounds, { padding: [30, 30] });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      // 경로 점선
      if (places.length > 1) {
        L.polyline(places.map(p => [p.lat, p.lng]), {
          color: "#FF6B35", weight: 3, dashArray: "8,6", opacity: 0.6,
        }).addTo(map);
      }

      places.forEach((p, i) => {
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:28px;height:28px;border-radius:50%;background:var(--or);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.2);">${i + 1}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14],
          }),
        }).addTo(map);
      });

      mapInstance.current = map;
    });
  }, [course]);

  const handleLike = async () => {
    if (!course) return;
    const res = await api.post<{ liked: boolean }>(`/api/courses/${courseId}/like`);
    setCourse({ ...course, isLiked: res.liked, likeCount: res.liked ? course.likeCount + 1 : course.likeCount - 1 });
  };

  const handleBookmark = async () => {
    if (!course) return;
    const res = await api.post<{ bookmarked: boolean }>(`/api/courses/${courseId}/bookmark`);
    setCourse({ ...course, isBookmarked: res.bookmarked });
  };

  const handleReport = async () => {
    await api.post(`/api/courses/${courseId}/report`);
    setShowReport(false);
    alert("신고가 접수됐어요.");
  };

  const handleDelete = async () => {
    await api.delete(`/api/courses/${courseId}`);
    setShowDelete(false);
    onBack();
  };

  if (loading) return <NaruLoading message="코스를 불러오는 중!" />;
  if (!course) return <div style={{ padding: 40, textAlign: "center", color: "var(--g400)" }}>코스를 찾을 수 없어요.</div>;

  const photos = course.places.filter(p => p.photoUrl);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      {/* 헤더 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "8px 16px",
        background: "rgba(255,255,255,.95)", backdropFilter: "blur(8px)",
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, border: "none", background: "var(--g100)", borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g700)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{course.title}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleBookmark} style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={course.isBookmarked ? "var(--or)" : "none"} stroke="var(--g700)" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
          <button onClick={() => course?.isMine ? setShowDelete(true) : setShowReport(true)} style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g700)" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </div>

      {/* 지도 */}
      <div ref={mapRef} style={{ height: 220, background: "#E8F0E0" }} />

      {/* 작성자 */}
      <div style={{ padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--g500)" }}>{course.authorNickname}</span>
        <span style={{ fontSize: 12, color: "var(--g400)" }}>{new Date(course.createdAt).toLocaleDateString("ko-KR")}</span>
      </div>

      {/* 사진 스와이프 */}
      {photos.length > 0 && (
        <PhotoSwiper photos={photos} photoIndex={photoIndex} onIndexChange={setPhotoIndex} />
      )}

      {/* 태그 + 좋아요 */}
      <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{
          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: "var(--or-bg)", color: "var(--or-d)",
        }}>{TAG_LABEL[course.tag]}</span>
        <button onClick={handleLike} style={{
          display: "flex", alignItems: "center", gap: 4, border: "none", background: "none",
          color: course.isLiked ? "var(--or)" : "var(--g400)", cursor: "pointer", fontSize: 13,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={course.isLiked ? "var(--or)" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
          </svg>
          {course.likeCount}
        </button>
      </div>

      {/* 장소 목록 */}
      <div style={{ padding: "0 20px" }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>장소 목록</h4>
        {course.places.map((place, i) => (
          <div key={place.id} style={{
            display: "flex", gap: 12, padding: 14, background: "var(--g50)",
            borderRadius: 12, marginBottom: 8,
          }}>
            {place.photoUrl && (
              <img src={place.photoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "var(--or)",
                  color: "#fff", fontSize: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700,
                }}>{i + 1}</div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{place.placeName || place.address}</p>
              </div>
              <p style={{ fontSize: 12, color: "var(--g400)", margin: 0 }}>{place.address}</p>
              {place.memo && <p style={{ fontSize: 12, color: "var(--g500)", margin: "4px 0 0" }}>{place.memo}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* 본앱 유도 */}
      {/* 하단 CTA */}
      {!course.isMine && onStartCourseNav && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
          borderTop: "1px solid var(--g100)", padding: "12px 20px 32px", zIndex: 10,
        }}>
          <button onClick={() => onStartCourseNav(course)} style={{
            width: "100%", padding: 16, borderRadius: 100, border: "none",
            background: "var(--or)", color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>이 코스로 떠나기</button>
        </div>
      )}

      {/* 신고 다이얼로그 */}
      <ConfirmDialog
        isOpen={showReport}
        title="이 코스를 신고할까요?"
        description="부적절한 콘텐츠를 신고하면 검토 후 조치합니다."
        confirmText="신고하기"
        cancelText="취소"
        onConfirm={handleReport}
        onCancel={() => setShowReport(false)}
      />

      {/* 삭제 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDelete}
        title="이 코스를 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
