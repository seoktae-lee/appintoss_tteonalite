import { useState, useRef, useEffect } from "react";
import { ConfirmDialog } from "@toss/tds-mobile";
import { useLocation } from "../hooks/useLocation";
import { uploadPhoto } from "../api/client";
import type { TodaySession, Place, CourseTag } from "../api/types";
import { NaruLoading } from "../components/NaruLoading";
import "leaflet/dist/leaflet.css";

interface Props {
  session: TodaySession;
  onAddPlace: (data: { lat: number; lng: number; memo?: string; photoUrl?: string }) => Promise<Place>;
  onFinish: (data: { title?: string; tag?: string; isPublic?: boolean }) => Promise<any>;
  onBack: () => void;
}

export function RecordingPage({ session, onAddPlace, onFinish, onBack }: Props) {
  const { location, getLocation } = useLocation();
  const [memo, setMemo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (!mapRef.current || !location || mode !== "map") return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
        .setView([location.lat, location.lng], 16);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      L.circleMarker([location.lat, location.lng], {
        radius: 8, fillColor: "#FF6B35", fillOpacity: 1, color: "#fff", weight: 3,
      }).addTo(map);

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
  }, [location, mode, session.places.length]);

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
      await onAddPlace({ lat: location.lat, lng: location.lng, memo: memo || undefined, photoUrl });
      setMemo("");
      setPendingFile(null);
      setShowMemo(false);
    } catch (err) {
      alert("장소 추가 실패: " + (err instanceof Error ? err.message : ""));
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFinish = async () => {
    try {
      await onFinish({});
      setShowFinishDialog(false);
    } catch (err) {
      alert("저장 실패: " + (err instanceof Error ? err.message : ""));
    }
  };

  // 숨겨진 파일 input
  const hiddenInput = (
    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: "none" }} />
  );

  if (isUploading) return <NaruLoading message="장소를 저장하는 중!" />;

  return (
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

      {/* 지도 */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {/* 장소 칩 */}
      {session.places.length > 0 && (
        <div style={{ padding: "8px 16px 0", background: "#fff" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {session.places.map((p, i) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                background: "var(--g50)", border: "1px solid var(--g200)", borderRadius: 100,
                fontSize: 12, color: "var(--g700)", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", background: "var(--or)",
                  color: "#fff", fontSize: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700,
                }}>{i + 1}</span>
                {p.placeName || p.address.split(" ").slice(-2).join(" ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {hiddenInput}

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
        <button onClick={handleTakePhoto} style={{
          flex: 1, padding: 14, borderRadius: 100, border: "none",
          background: "var(--or)", color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          여기서 촬영
        </button>
        {session.places.length > 0 && (
          <button onClick={() => setShowFinishDialog(true)} style={{
            flex: 1, padding: 14, borderRadius: 100,
            border: "1.5px solid var(--or)", background: "#fff",
            color: "var(--or-d)", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>오늘 종료</button>
        )}
      </div>

      {/* 종료 다이얼로그 */}
      <ConfirmDialog
        isOpen={showFinishDialog}
        title="오늘을 마칠까요?"
        description={`방문한 장소 ${session.places.length}곳이 기록됐어요`}
        confirmText="코스로 저장하기"
        cancelText="계속 기록할게요"
        onConfirm={handleFinish}
        onCancel={() => setShowFinishDialog(false)}
      />
    </div>
  );
}
