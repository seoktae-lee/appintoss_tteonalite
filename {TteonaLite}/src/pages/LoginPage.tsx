import { useState } from "react";

interface Props {
  onLoginSuccess: (user: { id: string }) => void;
}

export function LoginPage({ onLoginSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // TODO: 토스 로그인 연동
      onLoginSuccess({ id: "temp-user" });
    } catch (e) {
      console.error("[로그인 실패]", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #FFF3EE 0%, #ffffff 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "0 24px",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#FF6B35", marginBottom: "8px" }}>
        떠나라이트
      </h1>
      <p style={{ fontSize: "15px", color: "#8B8D97", marginBottom: "48px" }}>
        오늘 하루를 여행처럼 기록해요
      </p>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          width: "100%",
          maxWidth: "320px",
          height: "54px",
          borderRadius: "14px",
          border: "none",
          backgroundColor: "#FF6B35",
          color: "#ffffff",
          fontSize: "17px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {isLoading ? "로그인 중..." : "토스로 시작하기"}
      </button>
    </div>
  );
}
