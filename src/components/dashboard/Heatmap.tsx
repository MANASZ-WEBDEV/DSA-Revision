import type { ReviewEvent } from "../../types";

interface Props {
  events: ReviewEvent[];
  weeks?: number; // how many weeks back to show (default ~26 for compact view)
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const CELL = 11;
const GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function Heatmap({ events, weeks = 26 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build count-per-day map
  const counts = new Map<string, number>();
  for (const e of events) {
    const day = localDateStr(new Date(e.reviewed_at));
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  // Find the most recent Saturday to align the grid (week ends on Sat)
  const endDate = new Date(today);
  const totalDays = weeks * 7;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - totalDays + 1);
  // Roll back to the most recent Sunday so columns align to calendar weeks
  const startDow = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDow);

  const days: { date: Date; dateStr: string; count: number }[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dateStr = localDateStr(cursor);
    days.push({ date: new Date(cursor), dateStr, count: counts.get(dateStr) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const numCols = Math.ceil(days.length / 7);
  const width = numCols * (CELL + GAP) + 28;
  const height = 7 * (CELL + GAP) + 16;

  function intensity(count: number): string {
    if (count === 0) return "var(--bg-sunken)";
    if (count <= 2) return "var(--easy-soft)";
    if (count <= 5) return "color-mix(in srgb, var(--accent) 45%, var(--bg-sunken))";
    if (count <= 9) return "color-mix(in srgb, var(--accent) 75%, var(--bg-sunken))";
    return "var(--accent)";
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={height} style={{ display: "block" }}>
        {/* Day-of-week labels */}
        {DAY_LABELS.map((label, row) =>
          label ? (
            <text
              key={row}
              x={0}
              y={row * (CELL + GAP) + 9 + 8}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--caption)"
            >
              {label.slice(0, 3)}
            </text>
          ) : null
        )}

        {/* Cells */}
        {days.map((d, i) => {
          const col = Math.floor(i / 7);
          const row = i % 7;
          const isFuture = d.date > today;
          return (
            <rect
              key={d.dateStr}
              x={28 + col * (CELL + GAP)}
              y={row * (CELL + GAP) + 8}
              width={CELL}
              height={CELL}
              rx={2.5}
              fill={isFuture ? "transparent" : intensity(d.count)}
              stroke={d.count > 0 ? "transparent" : "var(--border)"}
              strokeWidth={0.5}
            >
              <title>{`${d.dateStr}: ${d.count} review${d.count === 1 ? "" : "s"}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
