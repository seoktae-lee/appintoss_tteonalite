import { useState } from "react";
import { OnboardingPage } from "./pages/OnboardingPage";
import { LoginPage } from "./pages/LoginPage";
import { NicknamePage } from "./pages/NicknamePage";
import { HomePage } from "./pages/HomePage";
import { RecordingPage } from "./pages/RecordingPage";
import { ExploreTab } from "./pages/ExploreTab";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { ArchivePage } from "./pages/ArchivePage";
import { BottomTabBar } from "./components/BottomTabBar";
import { useTodaySession } from "./hooks/useTodaySession";
import { clearAuth, api } from "./api/client";
import type { User, AppTab, LoginResponse, Course } from "./api/types";

type SubPage = "tabs" | "recording" | "course-detail" | "archive";

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

  return <LoggedInApp user={user} tab={tab} setTab={setTab} subPage={subPage} setSubPage={setSubPage} onLogout={handleWithdraw} />;
}

interface LoggedInProps {
  user: User;
  tab: AppTab;
  setTab: (t: AppTab) => void;
  subPage: SubPage;
  setSubPage: (p: SubPage) => void;
  onLogout: () => void;
}

function LoggedInApp({ user, tab, setTab, subPage, setSubPage, onLogout }: LoggedInProps) {
  const { session, startSession, addPlace, finishSession, checkActive } = useTodaySession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const res = await api.get<{ courses: Course[] }>("/api/courses/explore");
      setCourses(res.courses);
    } catch {}
  };

  useState(() => { loadCourses(); });

  const handleStartRecording = async () => {
    if (session) {
      setSubPage("recording");
      return;
    }
    await startSession();
    setSubPage("recording");
  };

  const handleFinishRecording = async (data: { title?: string; tag?: string; isPublic?: boolean }) => {
    await finishSession(data);
    setSubPage("tabs");
    loadCourses();
  };

  // 기록 모드
  if (subPage === "recording" && session) {
    return (
      <RecordingPage
        session={session}
        onAddPlace={addPlace}
        onFinish={handleFinishRecording}
        onBack={() => setSubPage("tabs")}
      />
    );
  }

  // 아카이브
  if (subPage === "archive") {
    return (
      <ArchivePage
        onBack={() => setSubPage("tabs")}
        onCourseDetail={(id) => { setSelectedCourseId(id); setSubPage("course-detail"); }}
      />
    );
  }

  // 코스 상세
  if (subPage === "course-detail" && selectedCourseId) {
    return (
      <CourseDetailPage
        courseId={selectedCourseId}
        onBack={() => setSubPage("tabs")}
        onStartCourseNav={(course) => {
          // 이 코스로 떠나기 (기록 모드 시작)
          handleStartRecording();
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {tab === "home" && (
        <HomePage
          nickname={user.nickname || ""}
          session={session}
          courses={courses}
          onStartRecording={handleStartRecording}
          onResumeRecording={() => setSubPage("recording")}
          onCourseDetail={(id) => { setSelectedCourseId(id); setSubPage("course-detail"); }}
        />
      )}
      {tab === "explore" && (
        <ExploreTab onCourseDetail={(id) => { setSelectedCourseId(id); setSubPage("course-detail"); }} />
      )}
      {tab === "settings" && (
        <div style={{ padding: "20px 20px 100px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>설정</h2>
          <div style={{ background: "var(--g50)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--or-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🍊</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>{user.nickname}</p>
              <p style={{ fontSize: 12, color: "var(--g400)" }}>코스 {courses.filter(c => c.isMine).length}개</p>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--g100)" }}>
            <div onClick={() => setSubPage("archive")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 15, borderBottom: "1px solid var(--g100)", cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>코스 아카이브</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g300)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 15, borderBottom: "1px solid var(--g100)", cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>이용약관</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g300)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 15, cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>떠나 앱 다운로드</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g300)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <button onClick={onLogout} style={{
            width: "100%", marginTop: 32, padding: 12, border: "none", background: "none",
            color: "var(--g400)", fontSize: 13, cursor: "pointer", textDecoration: "underline",
          }}>서비스 탈퇴</button>
        </div>
      )}
      <BottomTabBar tab={tab} onTabChange={setTab} />
    </div>
  );
}

export default App;
