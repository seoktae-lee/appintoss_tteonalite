import tteoniJump from "../assets/mascot/tteoni-jump.png";

export function NaruLoading({ message = "잠시만 기다려줘!" }: { message?: string }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(255,255,255,.95)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 9999,
    }}>
      <style>{`
        @keyframes naruBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-16px) scale(1.05); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
      <img src={tteoniJump} alt="나루" style={{
        height: 100, objectFit: "contain",
        animation: "naruBounce 0.8s ease-in-out infinite",
      }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--g700)", marginTop: 16 }}>{message}</p>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: "var(--or)",
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
