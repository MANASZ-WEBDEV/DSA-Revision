/**
 * SVG icons for LLM providers — replaces cross-platform-inconsistent emoji.
 * Uses the same inline SVG pattern as NavIcon in Navbar.tsx.
 */

interface ProviderIconProps {
  id: string;
  size?: number;
}

export function ProviderIcon({ id, size = 14 }: ProviderIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (id) {
    // Anthropic (Claude) — a sparkle/burst shape
    case "anthropic":
      return (
        <svg {...props} style={{ color: "var(--medium)" }}>
          <path d="M12 3v18M5.6 5.6l12.8 12.8M3 12h18M5.6 18.4L18.4 5.6" />
        </svg>
      );

    // Google (Gemini) — a diamond/gem shape
    case "gemini":
      return (
        <svg {...props} style={{ color: "#4285F4" }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      );

    // Groq — a lightning bolt for speed
    case "groq":
      return (
        <svg {...props} style={{ color: "var(--medium)" }}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );

    default:
      return <span style={{ fontSize: size }}>●</span>;
  }
}
