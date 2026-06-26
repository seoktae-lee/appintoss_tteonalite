import type { AppTab } from "../api/types";

interface Props {
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { key: AppTab; label: string; icon: string }[] = [
  { key: "home", label: "홈", icon: "M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4z" },
  { key: "explore", label: "탐색", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { key: "settings", label: "설정", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
];

export function BottomTabBar({ tab, onTabChange }: Props) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 82,
      background: "rgba(255,255,255,.97)", backdropFilter: "blur(8px)",
      borderTop: "1px solid var(--g200)", display: "flex",
      alignItems: "flex-start", justifyContent: "space-around", paddingTop: 8, zIndex: 50,
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onTabChange(t.key)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          cursor: "pointer", border: "none", background: "none", padding: "4px 12px",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={tab === t.key ? "var(--or)" : "var(--g400)"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.icon} />
          </svg>
          <small style={{
            fontSize: 10, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? "var(--or)" : "var(--g400)",
          }}>{t.label}</small>
        </button>
      ))}
    </div>
  );
}
