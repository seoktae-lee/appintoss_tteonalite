import { useEffect, useRef, useState } from "react";
import { useLocation } from "../hooks/useLocation";
import { useWeather } from "../hooks/useWeather";
import { hapticTap, hapticImpact } from "../hooks/useHaptic";
import { api } from "../api/client";
import type { TodaySession, Course } from "../api/types";
import { NaruLoading } from "../components/NaruLoading";
import tteoniWink from "../assets/mascot/tteoni-wink.png";
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
    if (!mapRef.current || !location) return;
    // 코스 변경 시 지도 재생성
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
        .setView([location.lat, location.lng], 8);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.circleMarker([location.lat, location.lng], {
        radius: 8, fillColor: "#FF6B35", fillOpacity: 1, color: "#fff", weight: 3,
      }).addTo(map);

      // 코스 마커 추가 (나루 캐릭터)
      const naruUrl = new URL("../assets/mascot/tteoni-wink.png", import.meta.url).href;
      for (const course of courses) {
        if (course.places.length === 0) continue;
        const first = course.places[0];
        const marker = L.marker([first.lat, first.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="display:flex;flex-direction:column;align-items:center;">
              <img src="${naruUrl}" style="width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2));" />
              <div style="background:#fff;padding:1px 6px;border-radius:4px;margin-top:2px;font-size:9px;font-weight:600;color:#FF6B35;box-shadow:0 1px 3px rgba(0,0,0,.1);white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${course.title}</div>
            </div>`,
            iconSize: [40, 52],
            iconAnchor: [20, 52],
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
        {!location && <NaruLoading message="위치를 가져오는 중!" />}
      </div>

      {/* 상단 바 (날씨 + 검색) */}
      <div style={{ position: "absolute", top: 12, left: 16, right: 16, zIndex: 1000 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,.95)", backdropFilter: "blur(10px)",
          borderRadius: 16, padding: "8px 12px",
          boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        }}>
          {/* 나루 + 날씨 (좌측) */}
          {weather ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: "var(--or-100, #FFF0E6)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                <img src={tteoniWink} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--g900)", margin: 0, whiteSpace: "nowrap" }}>
                  {weather.city} {weather.temperature}° {weatherIcon}
                </p>
                <p style={{ fontSize: 10, color: "var(--g500)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                  {weather.comment}
                </p>
              </div>
            </div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g400)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          )}
          {/* 구분선 */}
          {weather && <div style={{ width: 1, height: 28, background: "var(--g200)", flexShrink: 0 }} />}
          {/* 검색 (우측) */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            {weather && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g400)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            <input
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              placeholder="코스 검색"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", fontFamily: "inherit", padding: "4px 0", minWidth: 0 }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); }} style={{
                background: "var(--g300)", border: "none", borderRadius: "50%", width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, color: "#fff", flexShrink: 0,
              }}>✕</button>
            )}
          </div>
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

      {/* 내 위치 버튼 (우하단) */}
      <button onClick={getLocation} style={{
        position: "absolute", bottom: 80, right: 16, zIndex: 1000,
        width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,.1)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </button>

      {/* 하단 중앙 버튼 */}
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
      </div>
    </div>
  );
}
