import { useState } from "react";
import { OnboardingPage } from "./pages/OnboardingPage";
import { LoginPage } from "./pages/LoginPage";
import { NicknamePage } from "./pages/NicknamePage";
import { BottomTabBar } from "./components/BottomTabBar";
import { clearAuth } from "./api/client";
import type { User, AppTab, LoginResponse } from "./api/types";

type SubPage = "tabs" | "recording" | "place-select" | "camera" | "course-detail" | "course-nav" | "course-edit" | "archive";

function App() {
  const [onboardingSeen, setOnboardingSeen] = useState(
    () => localStorage.getItem("tteona_onboarding") === "done"
  );
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("tteona_user");
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [tab, setTab] = useState<AppTab>("home");
  const [subPage, setSubPage] = useState<SubPage>("tabs");

  const handleLoginSuccess = (loggedInUser: LoginResponse["user"]) => {
    localStorage.setItem("tteona_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleWithdraw = () => {
    clearAuth();
    localStorage.removeItem("tteona_user");
    localStorage.removeItem("tteona_onboarding");
    setUser(null);
    setOnboardingSeen(false);
  };

  if (!onboardingSeen) {
    return <OnboardingPage onDone={() => setOnboardingSeen(true)} />;
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!user.nickname) {
    return (
      <NicknamePage onDone={(nickname) => {
        const updated = { ...user, nickname };
        localStorage.setItem("tteona_user", JSON.stringify(updated));
        setUser(updated);
      }} />
    );
  }

  // 서브페이지들은 이후 개발에서 추가
  if (subPage !== "tabs") {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setSubPage("tabs")} style={{ marginBottom: 12, padding: "8px 16px", border: "1px solid var(--g200)", borderRadius: 8, background: "#fff", cursor: "pointer" }}>
          ← 뒤로
        </button>
        <p style={{ color: "var(--g500)" }}>서브페이지: {subPage} (개발 중)</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 82 }}>
      {tab === "home" && (
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>홈 (지도)</h2>
          <p style={{ color: "var(--g500)", fontSize: 14 }}>홈탭 개발 예정</p>
          <button onClick={() => setSubPage("recording")} style={{
            width: "100%", marginTop: 20, padding: 16, borderRadius: 100, border: "none",
            background: "var(--or)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
          }}>나의 오늘</button>
        </div>
      )}
      {tab === "explore" && (
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>코스 탐색</h2>
          <p style={{ color: "var(--g500)", fontSize: 14 }}>탐색탭 개발 예정</p>
        </div>
      )}
      {tab === "settings" && (
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>설정</h2>
          <p style={{ color: "var(--g500)", fontSize: 14, marginBottom: 20 }}>닉네임: {user.nickname}</p>
          <button onClick={handleWithdraw} style={{
            padding: "10px 20px", border: "none", background: "none",
            color: "var(--g400)", fontSize: 13, cursor: "pointer", textDecoration: "underline",
          }}>서비스 탈퇴</button>
        </div>
      )}
      <BottomTabBar tab={tab} onTabChange={setTab} />
    </div>
  );
}

export default App;
