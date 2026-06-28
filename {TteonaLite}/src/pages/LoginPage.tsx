import { useState, useEffect } from "react";
import { appLogin, getAnonymousKey } from "@apps-in-toss/web-framework";
import { api, saveAuth } from "../api/client";
import type { LoginResponse } from "../api/types";
import tteoniFont from "../assets/mascot/tteoni-front.png";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AIT === "true";

interface Props {
  onLoginSuccess: (user: LoginResponse["user"]) => void;
}

export function LoginPage({ onLoginSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 100); }, []);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let anonymousKey: string;
      if (DEV_BYPASS) {
        anonymousKey = "dev-bypass-key";
      } else {
        const keyResult = await getAnonymousKey();
        if (!keyResult || keyResult === "ERROR") throw new Error("유저 식별키를 가져올 수 없어요.");
        anonymousKey = typeof keyResult === "object" && "hash" in keyResult ? keyResult.hash : String(keyResult);
      }
      let authorizationCode: string | undefined;
      let referrer: string | undefined;
      if (!DEV_BYPASS) {
        try {
          const loginResult = await appLogin();
          if (loginResult && typeof loginResult === "object") {
            authorizationCode = (loginResult as { authorizationCode?: string }).authorizationCode;
            referrer = (loginResult as { referrer?: string }).referrer;
          }
        } catch {}
      }
      const response = await api.post<LoginResponse>("/api/auth/login", {
        anonymousKey,
        ...(authorizationCode ? { authorizationCode, referrer } : {}),
      });
      saveAuth(response.token);
      onLoginSuccess(response.user);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(180deg, var(--or-100) 0%, #fff 65%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 32px", textAlign: "center",
    }}>
      <style>{`
        @keyframes mascotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <img src={tteoniFont} alt="나루" style={{
        height: 200, objectFit: "contain",
        animation: ready ? "mascotFloat 3s ease-in-out infinite" : "none",
      }} />
      <p style={{
        fontSize: 16, color: "var(--g500)", lineHeight: 1.7,
        margin: "20px 0 40px", opacity: ready ? 1 : 0,
        animation: ready ? "fadeUp 0.5s ease-out 0.2s both" : "none",
      }}>
        오늘 하루를 여행처럼 기록하고<br/>친구와 공유해봐!
      </p>
      {errorMsg && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 16 }}>{errorMsg}</p>}
      <div style={{ width: "100%", opacity: ready ? 1 : 0, animation: ready ? "fadeUp 0.5s ease-out 0.5s both" : "none" }}>
        <button onClick={handleLogin} disabled={isLoading} style={{
          width: "100%", height: 54, borderRadius: 100, border: "none",
          backgroundColor: "var(--or)", color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
          opacity: isLoading ? 0.7 : 1,
        }}>
          {isLoading ? "로그인 중..." : "토스로 시작하기"}
        </button>
        <p style={{ fontSize: 11, color: "var(--g400)", marginTop: 12 }}>시작하면 이용약관에 동의합니다</p>
      </div>
    </div>
  );
}
