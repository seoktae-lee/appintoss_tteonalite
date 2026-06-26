import { useState } from "react";
import { api } from "../api/client";
import tteoniGuide from "../assets/mascot/tteoni-guide.png";

interface Props { onDone: (nickname: string) => void }

export function NicknamePage({ onDone }: Props) {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) { setError("별명을 입력해주세요."); return; }
    if (trimmed.length > 10) { setError("10자 이내로 입력해주세요."); return; }
    setIsLoading(true);
    try {
      await api.patch("/api/auth/me", { nickname: trimmed });
      onDone(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 32px",
      background: "linear-gradient(180deg, var(--or-100) 0%, #fff 50%)",
    }}>
      <img src={tteoniGuide} alt="떠니" style={{ height: 140, objectFit: "contain", marginBottom: 20 }} />
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--g900)", marginBottom: 8 }}>별명을 정해줘!</h2>
      <p style={{ fontSize: 14, color: "var(--g500)", marginBottom: 28 }}>코스에 표시될 이름이야</p>

      <input
        value={nickname}
        onChange={e => { setNickname(e.target.value); setError(null); }}
        placeholder="별명 입력 (10자 이내)"
        maxLength={10}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 12,
          border: `1.5px solid ${error ? "#EF4444" : "var(--g200)"}`,
          fontSize: 16, outline: "none", textAlign: "center",
          fontFamily: "inherit",
        }}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
      />
      {error && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>{error}</p>}
      <p style={{ fontSize: 12, color: "var(--g400)", marginTop: 8 }}>{nickname.length}/10</p>

      <button onClick={handleSubmit} disabled={isLoading || !nickname.trim()} style={{
        width: "100%", padding: 16, borderRadius: 100, border: "none", marginTop: 24,
        background: nickname.trim() ? "var(--or)" : "var(--g200)",
        color: nickname.trim() ? "#fff" : "var(--g400)",
        fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        transition: ".2s",
      }}>
        {isLoading ? "저장 중..." : "시작하기"}
      </button>
    </div>
  );
}
