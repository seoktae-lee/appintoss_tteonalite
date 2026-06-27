import { useEffect, useRef, useState } from "react";
import { useLocation } from "../hooks/useLocation";
import { useWeather } from "../hooks/useWeather";
import { hapticTap, hapticImpact } from "../hooks/useHaptic";
import { api } from "../api/client";
import type { TodaySession, Course } from "../api/types";
import tteoniGuide from "../assets/mascot/tteoni-guide.png";
import "leaflet/dist/leaflet.css";

interface Props {
  nickname: string;
  session: TodaySession | null;
  courses: Course[];
  onStartRecording: () => void;
  onResumeRecording: () => void;
  onCourseDetail: (id: string) => void;
}

export function HomePage({ nickname, session, courses, onStartRecording, onResumeRecording, onCourseDetail }: Props) {
  const { location, getLocation } = useLocation();
  const { weather, icon: weatherIcon } = useWeather(location?.lat, location?.lng);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get<{ courses: Course[] }>(`/api/courses/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.courses);
    } catch { setSearchResults([]); }
  };

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!location) return;

    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
        .setView([location.lat, location.lng], 8);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.circleMarker([location.lat, location.lng], {
        radius: 8, fillColor: "#FF6B35", fillOpacity: 1, color: "#fff", weight: 3,
      }).addTo(map);

      // 코스 마커 추가
      for (const course of courses) {
        if (course.places.length === 0) continue;
        const first = course.places[0];
        const marker = L.marker([first.lat, first.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:36px;height:36px;border-radius:50%;background:var(--or);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(255,107,53,.4);color:#fff;font-size:12px;font-weight:700;">${course.places.length}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map);
        marker.on("click", () => onCourseDetail(course.id));
      }

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [location, courses, onCourseDetail]);

  return (
    <div style={{ position: "relative", height: "calc(100vh - 82px)" }}>
      {/* 지도 */}
      <div ref={mapRef} style={{ position: "absolute", inset: 0 }}>
        {!location && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E8F0E0" }}>
            <div style={{ textAlign: "center" }}>
              <img src={tteoniGuide} alt="" style={{ height: 80, opacity: 0.6 }} />
              <p style={{ color: "var(--g400)", fontSize: 13, marginTop: 8 }}>위치를 가져오는 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* 검색바 (플로팅) */}
      <div style={{ position: "absolute", top: 12, left: 16, right: 16, zIndex: 1000 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.95)",
          backdropFilter: "blur(8px)", borderRadius: 14, padding: "6px 14px",
          boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g400)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setShowSearch(true)}
            placeholder="코스명, 지역 검색"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", fontFamily: "inherit", padding: "6px 0" }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); }} style={{
              background: "var(--g300)", border: "none", borderRadius: "50%", width: 20, height: 20,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, color: "#fff",
            }}>✕</button>
          )}
        </div>
        {/* 검색 결과 드롭다운 */}
        {showSearch && searchResults.length > 0 && (
          <div style={{
            marginTop: 6, background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,.12)",
            maxHeight: 300, overflowY: "auto",
          }}>
            {searchResults.map(c => (
              <div key={c.id} onClick={() => { hapticTap(); setShowSearch(false); setSearchQuery(""); setSearchResults([]); onCourseDetail(c.id); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                borderBottom: "1px solid var(--g100)", cursor: "pointer",
              }}>
                {c.places[0]?.photoUrl && (
                  <img src={c.places[0].photoUrl} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: "var(--g400)", margin: "2px 0 0" }}>
                    {c.authorNickname} · 장소 {c.places.length}곳
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 날씨 위젯 */}
      {weather && (
        <div style={{
          position: "absolute", top: 62, left: 16, right: 16, zIndex: 1000,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
            borderRadius: 12, padding: "8px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}>
            <span style={{ fontSize: 20 }}>{weatherIcon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--g900)", margin: 0 }}>
                {weather.city} {weather.temperature}° · {weather.comment}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 하단 플로팅 버튼 */}
      <div style={{
        position: "absolute", bottom: 16, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        {session && session.places.length > 0 && (
          <button onClick={() => { hapticTap(); onResumeRecording(); }} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "#fff", border: "none", borderRadius: 16, padding: "10px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,.1)", cursor: "pointer",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span style={{ fontSize: 10, color: "var(--or)", fontWeight: 600 }}>이어하기</span>
          </button>
        )}
        <button onClick={() => { hapticImpact(); onStartRecording(); }} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "14px 28px",
          borderRadius: 100, border: "none", background: "var(--or)", color: "#fff",
          fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 6px 20px rgba(255,107,53,.4)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          나의 오늘
        </button>
        <button onClick={getLocation} style={{
          width: 48, height: 48, borderRadius: "50%", background: "#fff", border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,.1)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </button>
      </div>
    </div>
  );
}
