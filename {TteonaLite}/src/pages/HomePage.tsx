interface Props {
  user: { id: string };
}

export function HomePage({ user }: Props) {
  void user;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
        padding: "0 24px",
        paddingTop: "max(64px, env(safe-area-inset-top))",
      }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#191919", margin: "0 0 8px" }}>
        나의 오늘
      </h1>
      <p style={{ fontSize: "14px", color: "#8B8D97" }}>
        오늘 방문한 장소를 기록해보세요
      </p>
    </div>
  );
}
