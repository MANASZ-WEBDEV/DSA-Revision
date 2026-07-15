/**
 * SVG monogram icons for code-hint languages — same inline SVG pattern
 * as ProviderIcon.tsx, so it fits the existing icon system.
 */

export type CodeLanguage = "cpp" | "python" | "java" | "javascript" | "rust" | "any";

export const LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "any",        label: "Any (pseudocode)" },
  { id: "cpp",        label: "C++" },
  { id: "python",     label: "Python" },
  { id: "java",       label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "rust",       label: "Rust" },
];

interface LanguageIconProps {
  id: CodeLanguage;
  size?: number;
}

export function LanguageIcon({ id, size = 14 }: LanguageIconProps) {
  const wrap = (children: React.ReactNode, color: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 6,
        height: size + 6,
        borderRadius: 4,
        fontSize: size * 0.62,
        fontWeight: 700,
        fontFamily: "monospace",
        color,
        border: `1px solid ${color}`,
      }}
    >
      {children}
    </span>
  );

  switch (id) {
    case "cpp":
      return wrap("C++", "#00599C");
    case "python":
      return wrap("Py", "#FFD43B");
    case "java":
      return wrap("Jv", "#E76F00");
    case "javascript":
      return wrap("JS", "#F7DF1E");
    case "rust":
      return wrap("Rs", "#DEA584");
    case "any":
      return wrap("*", "var(--caption)");
    default:
      return wrap("?", "var(--caption)");
  }
}
