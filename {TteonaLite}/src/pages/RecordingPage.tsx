import { useState, useRef, useEffect } from "react";
import { useLocation } from "../hooks/useLocation";
import { hapticTap, hapticImpact, hapticNotification } from "../hooks/useHaptic";
import { uploadPhoto } from "../api/client";
import { ConfirmDialog } from "@toss/tds-mobile";
import type { TodaySession, Place, CourseTag } from "../api/types";
import { NaruLoading } from "../components/NaruLoading";
import "leaflet/dist/leaflet.css";

interface Props {
  session: TodaySession;
  referencePlaces?: Place[] | null;
  onAddPlace: (data: { lat: number; lng: number; memo?: string; photoUrl?: string; placeName?: string }) => Promise<Place>;
  onRemovePlace: (placeId: string) => Promise<void>;
  onFinish: (data: { title?: string; tag?: string; isPublic?: boolean; isAnonymous?: boolean }) => Promise<any>;
  onBack: () => void;
}

export function RecordingPage({ session, referencePlaces, onAddPlace, onRemovePlace, onFinish, onBack }: Props) {
  const { location, getLocation } = useLocation();
  const [memo, setMemo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [customPlaceName, setCustomPlaceName] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [showGuide, setShowGuide] = useState(!!referencePlaces);
  const [removePlaceId, setRemovePlaceId] = useState<string | null>(null);
  const [finishTag, setFinishTag] = useState<string>("etc");
  const [finishTitle, setFinishTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const [nextDistance, setNextDistance] = useState<string | null>(null);
  const [nextDistanceMeters, setNextDistanceMeters] = useState<number | null>(null);
  const [nextPlaceName, setNextPlaceName] = useState<string | null>(null);

  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(m: number): string {
    return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
  }

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (!location || !referencePlaces || referencePlaces.length === 0) {
      setNextDistance(null);
      setNextDistanceMeters(null);
      setNextPlaceName(null);
      return;
    }
    const nextIdx = session.places.length;
    if (nextIdx >= referencePlaces.length) {
      setNextDistance(null);
      setNextDistanceMeters(null);
      setNextPlaceName(null);
      return;
    }
    const next = referencePlaces[nextIdx];
    const dist = calcDistance(location.lat, location.lng, next.lat, next.lng);
    setNextDistance(formatDistance(dist));
    setNextDistanceMeters(dist);
    setNextPlaceName(next.placeName || next.address.split(" ").slice(-2).join(" "));
  }, [location, session.places.length, referencePlaces]);

  useEffect(() => {
    if (!mapRef.current || !location) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
        .setView([location.lat, location.lng], 16);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      // 내 위치
      L.circleMarker([location.lat, location.lng], {
        radius: 8, fillColor: "#FF6B35", fillOpacity: 1, color: "#fff", weight: 3,
      }).addTo(map);

      // 참조 코스 경로 (점선 + 회색 마커)
      if (referencePlaces && referencePlaces.length > 0) {
        if (referencePlaces.length > 1) {
          L.polyline(referencePlaces.map(p => [p.lat, p.lng]), {
            color: "#AAAAAA", weight: 2.5, dashArray: "6,6", opacity: 0.5,
          }).addTo(map);
        }
        referencePlaces.forEach((rp, i) => {
          const visited = i < session.places.length;
          const isNext = i === session.places.length;
          L.marker([rp.lat, rp.lng], {
            icon: L.divIcon({
              className: "",
              html: `<div style="width:${isNext ? 32 : 24}px;height:${isNext ? 32 : 24}px;border-radius:50%;background:${visited ? "#ccc" : isNext ? "#FF6B35" : "#999"};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${isNext ? 13 : 10}px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.15);opacity:${visited ? 0.4 : 1};border:${isNext ? "3px solid #fff" : "none"};">${visited ? "✓" : i + 1}</div>`,
              iconSize: [isNext ? 32 : 24, isNext ? 32 : 24],
              iconAnchor: [isNext ? 16 : 12, isNext ? 16 : 12],
            }),
          }).addTo(map);
        });

        // 현재 위치 → 다음 장소 연결선
        const nextIdx = session.places.length;
        if (nextIdx < referencePlaces.length) {
          const next = referencePlaces[nextIdx];
          L.polyline([[location.lat, location.lng], [next.lat, next.lng]], {
            color: "#FF6B35", weight: 2, dashArray: "4,8", opacity: 0.7,
          }).addTo(map);
        }
      }

      // 내가 기록한 장소 (오렌지 마커)
      session.places.forEach((p, i) => {
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
  }, [location, session.places.length, referencePlaces]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowMemo(true);
  };

  const handleConfirmPlace = async () => {
    if (!pendingFile || !location) return;
    setIsUploading(true);
    try {
      const photoUrl = await uploadPhoto(pendingFile);
      await onAddPlace({ lat: location.lat, lng: location.lng, memo: memo || undefined, photoUrl, ...(customPlaceName.trim() ? { placeName: customPlaceName.trim() } : {}) });
      hapticNotification();
      setMemo("");
      setPendingFile(null);
      setShowMemo(false);
    } catch (err) {
      alert("장소 추가 실패: " + (err instanceof Error ? err.message : ""));
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsFetchingLocation(true);
    setCustomPlaceName("");
    try {
      await getLocation();
      if (location) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json&accept-language=ko&zoom=18`, {
            headers: { "User-Agent": "TteonaLite/1.0" }
          });
          const data = await res.json();
          const addr = data.address;
          setCurrentAddress(addr?.road ? `${addr.city || addr.county || ""} ${addr.road}` : data.display_name?.split(",").slice(0, 2).join(" ") || "현재 위치");
        } catch {
          setCurrentAddress("현재 위치");
        }
      }
    } finally {
      setIsFetchingLocation(false);
    }
    setShowLocationConfirm(true);
  };

  const handleConfirmLocation = () => {
    setShowLocationConfirm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFinish = async () => {
    try {
      await onFinish({ title: finishTitle || undefined, tag: finishTag, isPublic, isAnonymous });
      setShowFinishSheet(false);
    } catch (err) {
      alert("저장 실패: " + (err instanceof Error ? err.message : ""));
    }
  };

  // 숨겨진 파일 input
  const hiddenInput = (
    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: "none" }} />
  );

  if (isFetchingLocation) return <NaruLoading message="위치를 찾고 있어!" />;
  if (isUploading) return <NaruLoading message="장소를 저장하는 중!" />;
  if (!location) return <NaruLoading message="위치를 찾고 있어!" />;

  return (<>
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 상단 바 */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: "50%", background: "rgba(60,60,60,.7)",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          borderRadius: 100, background: "rgba(40,40,40,.85)", backdropFilter: "blur(4px)",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4444" }} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>나의 오늘 기록 중</span>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: "var(--or)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 700,
          boxShadow: "0 3px 10px rgba(255,107,53,.4)",
        }}>
          {session.places.length}곳
        </div>
      </div>

      {/* 다음 장소 거리 안내 */}
      {nextDistance && nextPlaceName && (
        <div style={{
          position: "absolute", top: 56, left: 16, right: 16, zIndex: 1000,
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,.95)", backdropFilter: "blur(8px)",
          borderRadius: 12, padding: "10px 14px",
          boxShadow: "0 2px 10px rgba(0,0,0,.08)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "var(--or-100)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: "var(--g400)", margin: 0 }}>다음 장소</p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextPlaceName}</p>
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: 8, background: "var(--or)",
            color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>{nextDistance}</div>
        </div>
      )}

      {/* 지도 */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {/* 참조 코스 가이드 */}
      {referencePlaces && referencePlaces.length > 0 && (
        <div style={{ background: "#fff", borderTop: "1px solid var(--g100)" }}>
          <button onClick={() => setShowGuide(!showGuide)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2">
                <path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--or-d)" }}>
                코스 가이드 ({referencePlaces.length}곳)
              </span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g400)" strokeWidth="2"
              style={{ transform: showGuide ? "rotate(180deg)" : "none", transition: ".2s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showGuide && (
            <div style={{ padding: "0 16px 10px", display: "flex", gap: 8, overflowX: "auto" }}>
              {referencePlaces.map((rp, i) => {
                const visited = session.places.length > i;
                return (
                  <div key={rp.id} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                    background: visited ? "var(--or-100)" : "var(--g50)",
                    border: `1px solid ${visited ? "var(--or)" : "var(--g200)"}`,
                    borderRadius: 10, flexShrink: 0, minWidth: 0,
                    opacity: visited ? 0.6 : 1,
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: visited ? "var(--or)" : "var(--g300)",
                      color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{visited ? "✓" : i + 1}</span>
                    {rp.photoUrl && (
                      <img src={rp.photoUrl} alt="" style={{
                        width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0,
                      }} />
                    )}
                    <span style={{
                      fontSize: 11, color: visited ? "var(--g400)" : "var(--g700)", fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80,
                      textDecoration: visited ? "line-through" : "none",
                    }}>
                      {rp.placeName || rp.address.split(" ").slice(-2).join(" ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 장소 칩 */}
      {session.places.length > 0 && (
        <div style={{ padding: "8px 16px 0", background: "#fff" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {session.places.map((p, i) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 6px 6px 12px",
                background: "var(--g50)", border: "1px solid var(--g200)", borderRadius: 100,
                fontSize: 12, color: "var(--g700)", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", background: "var(--or)",
                  color: "#fff", fontSize: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700,
                }}>{i + 1}</span>
                {p.placeName || p.address.split(" ").slice(-2).join(" ")}
                <button onClick={() => { hapticTap(); setRemovePlaceId(p.id); }} style={{
                  width: 18, height: 18, borderRadius: "50%", background: "var(--g300)",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0,
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hiddenInput}

      {/* 위치 확인 바텀시트 */}
      {showLocationConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 2000,
          display: "flex", alignItems: "flex-end",
        }}>
          <div style={{
            width: "100%", background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 36px",
          }}>
            <div style={{ width: 36, height: 4, background: "var(--g300)", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>여기서 촬영할까요?</h3>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: 14,
              background: "var(--g50)", borderRadius: 12, marginBottom: 12,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{currentAddress || "위치를 확인하는 중..."}</p>
                <p style={{ fontSize: 11, color: "var(--g400)", margin: "2px 0 0" }}>
                  {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : ""}
                </p>
              </div>
            </div>
            <input
              value={customPlaceName}
              onChange={e => setCustomPlaceName(e.target.value)}
              placeholder="장소명 직접 입력 (선택)"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid var(--g200)", fontSize: 14, outline: "none",
                fontFamily: "inherit", marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowLocationConfirm(false); setCustomPlaceName(""); }} style={{
                flex: 1, padding: 14, borderRadius: 100, border: "1.5px solid var(--g200)",
                background: "#fff", color: "var(--g500)", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>취소</button>
              <button onClick={handleConfirmLocation} style={{
                flex: 1, padding: 14, borderRadius: 100, border: "none",
                background: "var(--or)", color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>사진 촬영</button>
            </div>
          </div>
        </div>
      )}

      {/* 메모 입력 바텀시트 */}
      {showMemo && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 2000,
          display: "flex", alignItems: "flex-end",
        }}>
          <div style={{
            width: "100%", background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 36px",
          }}>
            <div style={{ width: 36, height: 4, background: "var(--g300)", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>장소 추가</h3>
            <p style={{ fontSize: 13, color: "var(--g400)", marginBottom: 16 }}>
              {pendingFile?.name ? "사진이 선택됐어! 메모를 남겨봐" : ""}
            </p>
            {pendingFile && (
              <img
                src={URL.createObjectURL(pendingFile)}
                alt=""
                style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 12 }}
              />
            )}
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="이 장소에 대한 메모 (선택)"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "1.5px solid var(--g200)", fontSize: 14, outline: "none",
                fontFamily: "inherit", marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowMemo(false); setPendingFile(null); setMemo(""); }} style={{
                flex: 1, padding: 14, borderRadius: 100, border: "1.5px solid var(--g200)",
                background: "#fff", color: "var(--g500)", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>취소</button>
              <button onClick={handleConfirmPlace} disabled={isUploading} style={{
                flex: 1, padding: 14, borderRadius: 100, border: "none",
                background: "var(--or)", color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                opacity: isUploading ? 0.6 : 1,
              }}>{isUploading ? "저장 중..." : "장소 추가"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div style={{ padding: "12px 16px 24px", background: "#fff", display: "flex", gap: 10 }}>
        {(() => {
          const nearEnough = !referencePlaces || nextDistanceMeters === null || nextDistanceMeters <= 500;
          return (
            <button
              onClick={() => { if (nearEnough) { hapticImpact(); handleTakePhoto(); } }}
              disabled={!nearEnough}
              style={{
                flex: 1, padding: 14, borderRadius: 100, border: "none",
                background: nearEnough ? "var(--or)" : "var(--g200)",
                color: nearEnough ? "#fff" : "var(--g400)",
                fontSize: 15, fontWeight: 700,
                cursor: nearEnough ? "pointer" : "default",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
              {nearEnough ? "여기서 촬영" : `${nextDistance} 남았어요`}
            </button>
          );
        })()}
        {session.places.length > 0 && (
          <button onClick={() => {
            const today = new Date();
            setFinishTitle(`${today.getMonth() + 1}월 ${today.getDate()}일 코스`);
            setShowFinishSheet(true);
          }} style={{
            flex: 1, padding: 14, borderRadius: 100,
            border: "1.5px solid var(--or)", background: "#fff",
            color: "var(--or-d)", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>오늘 종료</button>
        )}
      </div>

      {/* 코스 저장 바텀시트 */}
      {showFinishSheet && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 2000,
          display: "flex", alignItems: "flex-end",
        }}>
          <div style={{
            width: "100%", background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 36px", maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ width: 36, height: 4, background: "var(--g300)", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>오늘을 마칠까요?</h3>
            <p style={{ fontSize: 13, color: "var(--g400)", marginBottom: 20 }}>
              방문한 장소 {session.places.length}곳이 기록됐어요
            </p>

            {/* 코스 이름 */}
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--g700)", display: "block", marginBottom: 6 }}>코스 이름</label>
            <input
              value={finishTitle}
              onChange={e => setFinishTitle(e.target.value)}
              placeholder="코스 이름을 입력해봐"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid var(--g200)", fontSize: 14, outline: "none",
                fontFamily: "inherit", marginBottom: 16,
              }}
            />

            {/* 태그 선택 */}
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--g700)", display: "block", marginBottom: 8 }}>태그</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[
                { key: "date", label: "데이트" },
                { key: "travel", label: "여행" },
                { key: "food", label: "맛집탐방" },
                { key: "cafe", label: "카페투어" },
                { key: "walk", label: "산책" },
                { key: "etc", label: "기타" },
              ].map(t => (
                <button key={t.key} onClick={() => setFinishTag(t.key)} style={{
                  padding: "7px 14px", borderRadius: 100, fontSize: 13,
                  fontWeight: finishTag === t.key ? 600 : 500,
                  border: `1.5px solid ${finishTag === t.key ? "var(--or)" : "var(--g200)"}`,
                  background: finishTag === t.key ? "var(--or)" : "#fff",
                  color: finishTag === t.key ? "#fff" : "var(--g500)",
                  cursor: "pointer", fontFamily: "inherit",
                }}>{t.label}</button>
              ))}
            </div>

            {/* 공개 설정 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 0", borderTop: "1px solid var(--g100)",
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>코스 공개하기</p>
                <p style={{ fontSize: 12, color: "var(--g400)", margin: "2px 0 0" }}>다른 유저가 내 코스를 볼 수 있어요</p>
              </div>
              <button onClick={() => setIsPublic(!isPublic)} style={{
                width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                background: isPublic ? "var(--or)" : "var(--g300)", padding: 2,
                display: "flex", alignItems: isPublic ? "center" : "center",
                justifyContent: isPublic ? "flex-end" : "flex-start", transition: ".2s",
              }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </button>
            </div>

            {/* 익명 설정 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 0", borderTop: "1px solid var(--g100)",
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>익명으로 등록</p>
                <p style={{ fontSize: 12, color: "var(--g400)", margin: "2px 0 0" }}>별명 대신 '익명'으로 표시돼요</p>
              </div>
              <button onClick={() => setIsAnonymous(!isAnonymous)} style={{
                width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                background: isAnonymous ? "var(--or)" : "var(--g300)", padding: 2,
                display: "flex", alignItems: "center",
                justifyContent: isAnonymous ? "flex-end" : "flex-start", transition: ".2s",
              }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </button>
            </div>

            {/* 버튼 */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowFinishSheet(false)} style={{
                flex: 1, padding: 14, borderRadius: 100, border: "1.5px solid var(--g200)",
                background: "#fff", color: "var(--g500)", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>계속 기록할게요</button>
              <button onClick={handleFinish} style={{
                flex: 1, padding: 14, borderRadius: 100, border: "none",
                background: "var(--or)", color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>코스 저장하기</button>
            </div>
          </div>
        </div>
      )}

    </div>

    <ConfirmDialog
      open={!!removePlaceId}
      title={<ConfirmDialog.Title>이 장소를 삭제할까요?</ConfirmDialog.Title>}
      description={<ConfirmDialog.Description>삭제하면 되돌릴 수 없어요.</ConfirmDialog.Description>}
      cancelButton={<ConfirmDialog.CancelButton onClick={() => setRemovePlaceId(null)}>취소</ConfirmDialog.CancelButton>}
      confirmButton={<ConfirmDialog.ConfirmButton color="danger" onClick={() => {
        if (removePlaceId) { onRemovePlace(removePlaceId); hapticNotification(); }
        setRemovePlaceId(null);
      }}>삭제</ConfirmDialog.ConfirmButton>}
      onClose={() => setRemovePlaceId(null)}
    />
  </>
  );
}
