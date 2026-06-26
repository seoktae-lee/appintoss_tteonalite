import { useState } from "react";
import tteoniFont from "../assets/mascot/tteoni-front.png";
import tteoniTravel from "../assets/mascot/tteoni-travel.png";
import tteoniGuide from "../assets/mascot/tteoni-guide.png";

const slides = [
  { img: tteoniFont, title: "안녕, 나는 떠니!", desc: "오늘 하루를 여행처럼 기록해볼까?" },
  { img: tteoniTravel, title: "장소마다 사진을 찍어!", desc: "사진+위치+메모로\n하루 코스가 자동으로 만들어져" },
  { img: tteoniGuide, title: "다른 사람의 코스도\n둘러볼 수 있어!", desc: "인기 데이트/여행 코스를 발견하고\n좋아요와 북마크로 저장해봐" },
];

interface Props { onDone: () => void }

export function OnboardingPage({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === slides.length - 1;
  const s = slides[step];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(180deg, var(--or-100) 0%, #fff 65%)` }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mascotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center" }}>
        <img
          key={step}
          src={s.img}
          alt=""
          style={{ height: 180, objectFit: "contain", marginBottom: 28, animation: "mascotFloat 3s ease-in-out infinite, fadeUp .4s ease-out" }}
        />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--g900)", marginBottom: 10, whiteSpace: "pre-line", animation: "fadeUp .4s ease-out .1s both" }}>
          {s.title}
        </h2>
        <p style={{ fontSize: 15, color: "var(--g500)", lineHeight: 1.6, whiteSpace: "pre-line", animation: "fadeUp .4s ease-out .2s both" }}>
          {s.desc}
        </p>
      </div>
      <div style={{ padding: "0 32px 48px" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8,
              borderRadius: i === step ? 4 : 50,
              background: i === step ? "var(--or)" : "var(--g300)",
              transition: ".2s",
            }} />
          ))}
        </div>
        {isLast ? (
          <button onClick={() => { localStorage.setItem("tteona_onboarding", "done"); onDone(); }} style={{
            width: "100%", padding: 16, borderRadius: 100, border: "none",
            background: "var(--or)", color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>시작하기</button>
        ) : (
          <>
            <button onClick={() => setStep(step + 1)} style={{
              width: "100%", padding: 16, borderRadius: 100, border: "none",
              background: "var(--or)", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>다음</button>
            <button onClick={() => { localStorage.setItem("tteona_onboarding", "done"); onDone(); }} style={{
              width: "100%", padding: 10, background: "none", border: "none",
              color: "var(--g400)", fontSize: 14, cursor: "pointer", marginTop: 4,
            }}>건너뛰기</button>
          </>
        )}
      </div>
    </div>
  );
}
