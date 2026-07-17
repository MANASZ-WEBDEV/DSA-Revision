import { useState } from "react";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import type { PatternTag } from "../../types";

interface Props {
  selectedPatterns: string[];
  onToggle: (pattern: string) => void;
  showGridByDefault?: boolean;
  label?: string;
}

export function PatternSelector({
  selectedPatterns,
  onToggle,
  showGridByDefault = false,
  label = "Patterns",
}: Props) {
  const [showGrid, setShowGrid] = useState(showGridByDefault);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <label style={styles.fieldLabel}>{label}</label>
        <button
          type="button"
          onClick={() => setShowGrid(!showGrid)}
          style={styles.toggleBtn}
        >
          {showGrid ? "Hide All Patterns" : "+ Manage Patterns"}
        </button>
      </div>

      <div style={styles.chipRow}>
        {selectedPatterns.map((p) => (
          <span
            key={p}
            onClick={() => onToggle(p)}
            style={{
              ...styles.chip,
              background: PATTERN_COLORS[p] ?? "var(--bg-sunken)",
              color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)",
              cursor: "pointer",
            }}
            title="Click to remove"
          >
            {p} ✕
          </span>
        ))}
        {selectedPatterns.length === 0 && (
          <span style={styles.emptyText}>No patterns selected</span>
        )}
      </div>

      {showGrid && (
        <div style={styles.grid}>
          {Object.keys(PATTERN_COLORS).map((p) => {
            const selected = selectedPatterns.includes(p as PatternTag);
            return (
              <button
                key={p}
                type="button"
                onClick={() => onToggle(p)}
                style={{
                  ...styles.gridItem,
                  ...(selected
                    ? {
                        background: PATTERN_COLORS[p],
                        color: PATTERN_TEXT_COLORS[p],
                        borderColor: PATTERN_TEXT_COLORS[p],
                      }
                    : {}),
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--caption)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  toggleBtn: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--accent)",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  chipRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  chip: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  emptyText: {
    fontSize: 12,
    color: "var(--caption)",
    fontStyle: "italic",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 6,
    maxHeight: 180,
    overflowY: "auto",
    padding: 8,
    background: "var(--bg-sunken)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  gridItem: {
    fontSize: 11,
    fontWeight: 500,
    padding: "5px 8px",
    borderRadius: 4,
    border: "1px solid var(--border)",
    background: "var(--bg-raised)",
    color: "var(--ink-soft)",
    cursor: "pointer",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textAlign: "left",
    transition: "all 0.12s ease",
  },
};
