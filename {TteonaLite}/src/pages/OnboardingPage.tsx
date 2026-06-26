import { useState, useEffect } from "react";
import tteoniFont from "../assets/mascot/tteoni-front.png";
import tteoniTravel from "../assets/mascot/tteoni-travel.png";
import tteoniGuide from "../assets/mascot/tteoni-guide.png";

const slides = [
  {
    img: tteoniFont,
    title: "안녕, 나는 나루!",
    desc: "방문한 장소를 사진으로 남기면\n하루 코스가 자동으로 완성돼!",
    features: [
      { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", label: "장소 기록" },
      { icon: "M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4z", label: "코스 탐색" },
      { icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z", label: "좋아요" },
    ],
  },
  {
    img: tteoniTravel,
    title: "장소마다 사진을 찍어!",
    desc: "사진+위치+메모로\n하루 코스가 자동으로 만들어져",
    features: [
      { icon: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z", label: "사진 촬영" },
      { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", label: "위치 자동" },
      { icon: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", label: "메모 작성" },
    ],
  },
  {
    img: tteoniGuide,
    title: "다른 사람의 코스도\n둘러볼 수 있어!",
    desc: "인기 데이트/여행 코스를 발견하고\n좋아요와 북마크로 저장해봐",
    features: [
      { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "코스 탐색" },
      { icon: "M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z", label: "북마크" },
      { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "아카이브" },
    ],
  },
];

interface Props { onDone: () => void }

export function OnboardingPage({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const isLast = step === slides.length - 1;
  const s = slides[step];

  useEffect(() => {
    if (step !== 0) return;
    const fullText = s.title;
    setTypedText("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [step]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(180deg, var(--or-100) 0%, #fff 65%)`, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes mascotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes drift { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      {/* 배경 장식 */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* 여행 경로 점선 */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.06 }}>
          <path d="M-20 120 Q80 80, 160 140 T340 100 T500 160" fill="none" stroke="#FF6B35" strokeWidth="2" strokeDasharray="8,8" />
          <path d="M-40 300 Q100 250, 200 320 T420 280" fill="none" stroke="#FF6B35" strokeWidth="2" strokeDasharray="8,8" />
          <path d="M60 500 Q180 460, 280 520 T500 480" fill="none" stroke="#FF6B35" strokeWidth="1.5" strokeDasharray="6,6" />
          {/* 핀 마커 */}
          <circle cx="160" cy="140" r="4" fill="#FF6B35" opacity="0.5" />
          <circle cx="340" cy="100" r="3" fill="#FF6B35" opacity="0.4" />
          <circle cx="200" cy="320" r="4" fill="#FF6B35" opacity="0.5" />
          <circle cx="280" cy="520" r="3" fill="#FF6B35" opacity="0.3" />
        </svg>
        {/* 동그란 장식 */}
        <div style={{ position: "absolute", top: "8%", right: "-8%", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,107,53,.04)" }} />
        <div style={{ position: "absolute", bottom: "25%", left: "-10%", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,107,53,.03)" }} />
        <div style={{ position: "absolute", top: "45%", right: "5%", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,107,53,.03)" }} />
      </div>

      <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <img
          src={s.img}
          alt=""
          style={{ height: 180, objectFit: "contain", marginBottom: 28, animation: "mascotFloat 3s ease-in-out infinite, fadeUp .4s ease-out" }}
        />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--g900)", marginBottom: 10, whiteSpace: "pre-line", animation: step === 0 ? "none" : "fadeUp .4s ease-out .1s both" }}>
          {step === 0 ? (
            <>{typedText}<span style={{ animation: "blink 1s step-end infinite", opacity: typedText.length < s.title.length ? 1 : 0 }}>|</span></>
          ) : s.title}
        </h2>
        <p style={{ fontSize: 15, color: "var(--g500)", lineHeight: 1.6, whiteSpace: "pre-line", animation: "fadeUp .4s ease-out .2s both" }}>
          {s.desc}
        </p>
        {s.features && (
          <div key={step} style={{ display: "flex", gap: 16, marginTop: 24, animation: "fadeUp .4s ease-out .3s both" }}>
            {s.features.map((f, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: "var(--or-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <span style={{ fontSize: 11, color: "var(--g500)", fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        )}
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
