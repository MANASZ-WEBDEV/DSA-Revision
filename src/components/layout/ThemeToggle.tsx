interface Props {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={s.btn}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    cursor: "pointer",
    color: "var(--ink-soft)",
    flexShrink: 0,
  },
};
