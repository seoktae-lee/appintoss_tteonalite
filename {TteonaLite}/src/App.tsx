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
import { NaruLoading } from "./components/NaruLoading";
import { useTodaySession } from "./hooks/useTodaySession";
import { clearAuth, api } from "./api/client";
import type { User, AppTab, LoginResponse, Course } from "./api/types";

type SubPage = "tabs" | "recording" | "course-detail" | "archive" | "resume-sheet";

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
  const { session, startSession, addPlace, removePlace, finishSession, checkActive, discardSession } = useTodaySession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadCourses = async () => {
    try {
      const res = await api.get<{ courses: Course[] }>("/api/courses/explore");
      setCourses(res.courses);
    } catch {}
  };

  useState(() => { loadCourses(); });

  const handleStartRecording = async () => {
    if (session && session.places.length > 0) {
      setSubPage("recording");
      return;
    }
    // 장소 0개인 빈 세션은 폐기 후 새로 시작
    if (session && session.places.length === 0) {
      await discardSession();
    }
    setIsTransitioning(true);
    try {
      await startSession();
      // startSession 내부에서 setSession이 호출되므로 약간 대기
      await new Promise(r => setTimeout(r, 100));
      setSubPage("recording");
    } catch {
      setSubPage("tabs");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleFinishRecording = async (data: { title?: string; tag?: string; isPublic?: boolean }) => {
    await finishSession(data);
    setSubPage("tabs");
    loadCourses();
  };

  // 로딩
  if (isTransitioning) {
    return <NaruLoading message="잠시만 기다려줘!" />;
  }

  // 기록 모드 — session 없으면 로딩 표시 (서버에서 불러오는 중)
  if (subPage === "recording" && !session) {
    return <NaruLoading message="기록을 불러오는 중!" />;
  }
  if (subPage === "recording" && session) {
    return (
      <RecordingPage
        session={session}
        onAddPlace={addPlace}
        onRemovePlace={removePlace}
        onFinish={handleFinishRecording}
        onBack={() => setSubPage("tabs")}
      />
    );
  }

  // 이어하기 시트 (장소 1개 이상일 때만)
  if (subPage === "resume-sheet" && session && session.places.length > 0) {
    return (
      <div style={{
        minHeight: "100vh", background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "flex-end",
      }}>
        <div style={{
          width: "100%", background: "#fff", borderRadius: "20px 20px 0 0",
          padding: "28px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{ width: 36, height: 4, background: "var(--g300)", borderRadius: 2, marginBottom: 20 }} />
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "var(--or-100)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>오늘 기록이 남아있어요</h2>
          <p style={{ fontSize: 14, color: "var(--g400)", marginBottom: 24 }}>
            장소 {session.places.length}곳 · {new Date(session.startedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={async () => {
              setIsTransitioning(true);
              try {
                await checkActive();
                await new Promise(r => setTimeout(r, 100));
                setSubPage("recording");
              } finally {
                setIsTransitioning(false);
              }
            }} style={{
              width: "100%", padding: 16, borderRadius: 100, border: "none",
              background: "var(--or)", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              이어서 기록하기
            </button>
            <button onClick={async () => {
              setIsTransitioning(true);
              try {
                await discardSession();
                setSubPage("tabs");
              } finally {
                setIsTransitioning(false);
              }
            }} style={{
              width: "100%", padding: 14, borderRadius: 100,
              border: "1.5px solid var(--g200)", background: "#fff",
              color: "var(--g700)", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g500)" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
              새로 시작하기
            </button>
          </div>
        </div>
      </div>
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
          onResumeRecording={() => setSubPage("resume-sheet")}
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
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--or-100)", flexShrink: 0 }}>
              <img src={new URL("./assets/mascot/tteoni-front.png", import.meta.url).href} alt="나루" style={{ width: 64, height: 64, objectFit: "cover", marginTop: -4, marginLeft: -10 }} />
            </div>
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
            <div onClick={() => window.open("https://seoktae-lee.github.io/appintoss_tteonalite_terms/", "_blank")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 15, borderBottom: "1px solid var(--g100)", cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>이용약관</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g300)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div onClick={() => window.open("https://apps.apple.com/kr/app/%EB%96%A0%EB%82%98/id6767218543", "_blank")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 15, cursor: "pointer" }}>
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
