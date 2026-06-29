import { useState } from "react";
import { hapticTap, hapticImpact } from "../hooks/useHaptic";
import type { Course, Place } from "../api/types";

interface Props {
  course: Course;
  onStart: (places: Place[]) => void;
  onBack: () => void;
}

export function CourseEditPage({ course, onStart, onBack }: Props) {
  const [places, setPlaces] = useState<Place[]>([...course.places]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    hapticTap();
    const next = [...places];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setPlaces(next);
  };

  const moveDown = (index: number) => {
    if (index === places.length - 1) return;
    hapticTap();
    const next = [...places];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setPlaces(next);
  };

  const removePlace = (index: number) => {
    hapticTap();
    setPlaces(places.filter((_, i) => i !== index));
  };

  const resetPlaces = () => {
    hapticTap();
    setPlaces([...course.places]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid var(--g100)",
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, border: "none", background: "var(--g100)", borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g700)" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700 }}>코스 편집</span>
        <button onClick={resetPlaces} style={{
          border: "none", background: "none", color: "var(--or)",
          fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>초기화</button>
      </div>

      {/* 안내 */}
      <div style={{ padding: "16px 20px 8px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{course.title}</h3>
        <p style={{ fontSize: 13, color: "var(--g400)", margin: 0 }}>
          방문할 장소를 편집해봐! 순서를 바꾸거나 빼도 돼
        </p>
      </div>

      {/* 장소 리스트 */}
      <div style={{ flex: 1, padding: "8px 20px", overflowY: "auto" }}>
        {places.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--g400)" }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>장소가 모두 제거됐어</p>
            <p style={{ fontSize: 13 }}>초기화 버튼으로 되돌릴 수 있어</p>
          </div>
        ) : (
          places.map((place, i) => (
            <div key={place.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: 12,
              background: "var(--g50)", borderRadius: 14, marginBottom: 8,
            }}>
              {/* 번호 */}
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: "var(--or)",
                color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</div>

              {/* 사진 */}
              {place.photoUrl && (
                <img src={place.photoUrl} alt="" style={{
                  width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0,
                }} />
              )}

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {place.placeName || place.address}
                </p>
                <p style={{ fontSize: 11, color: "var(--g400)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {place.address}
                </p>
              </div>

              {/* 순서 변경 버튼 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{
                  width: 32, height: 32, border: "none", borderRadius: 8,
                  background: i === 0 ? "var(--g100)" : "var(--or-100, #FFF0E6)",
                  cursor: i === 0 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: i === 0 ? 0.3 : 1,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? "var(--g400)" : "var(--or)"} strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button onClick={() => moveDown(i)} disabled={i === places.length - 1} style={{
                  width: 32, height: 32, border: "none", borderRadius: 8,
                  background: i === places.length - 1 ? "var(--g100)" : "var(--or-100, #FFF0E6)",
                  cursor: i === places.length - 1 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: i === places.length - 1 ? 0.3 : 1,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === places.length - 1 ? "var(--g400)" : "var(--or)"} strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* 삭제 버튼 */}
              <button onClick={() => removePlace(i)} style={{
                width: 28, height: 28, border: "none", borderRadius: "50%",
                background: "var(--g200)", cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g500)" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* 변경 요약 */}
      {places.length !== course.places.length && (
        <div style={{ padding: "0 20px 8px" }}>
          <p style={{ fontSize: 12, color: "var(--g400)", textAlign: "center" }}>
            원본 {course.places.length}곳 중 {course.places.length - places.length}곳 제거됨
          </p>
        </div>
      )}

      {/* 하단 CTA */}
      <div style={{ padding: "12px 20px 32px", borderTop: "1px solid var(--g100)" }}>
        <button
          onClick={() => { hapticImpact(); onStart(places); }}
          disabled={places.length === 0}
          style={{
            width: "100%", padding: 16, borderRadius: 100, border: "none",
            background: places.length > 0 ? "var(--or)" : "var(--g200)",
            color: places.length > 0 ? "#fff" : "var(--g400)",
            fontSize: 16, fontWeight: 700, cursor: places.length > 0 ? "pointer" : "default",
            fontFamily: "inherit", boxShadow: places.length > 0 ? "0 6px 20px rgba(255,107,53,.4)" : "none",
          }}
        >
          {places.length > 0 ? `${places.length}곳 코스로 출발하기` : "장소를 추가해줘"}
        </button>
      </div>
    </div>
  );
}
