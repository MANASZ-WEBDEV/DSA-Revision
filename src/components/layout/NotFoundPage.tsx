import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

// Sorted array of "pages" the binary search runs against.
const ARRAY = [3, 8, 14, 19, 25, 31, 38, 44, 50, 57, 63, 69, 75, 81, 88];
const TARGET = 47; // deliberately absent from ARRAY

export function NotFoundPage() {
  const navigate = useNavigate();
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(ARRAY.length - 1);
  const [mid, setMid] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [revealCode, setRevealCode] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let l = 0;
    let h = ARRAY.length - 1;
    let s = 0;

    function tick() {
      if (l > h) {
        setMid(null);
        setDone(true);
        return;
      }
      const m = Math.floor((l + h) / 2);
      setLow(l);
      setHigh(h);
      setMid(m);
      s += 1;
      setStep(s);

      if (ARRAY[m] === TARGET) {
        setDone(true);
        return;
      } else if (ARRAY[m] < TARGET) {
        l = m + 1;
      } else {
        h = m - 1;
      }
      timerRef.current = setTimeout(tick, 750);
    }

    timerRef.current = setTimeout(tick, 500);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="dsa-404-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .dsa-404-root {
          --bg: var(--bg);
          --surface: var(--bg-sunken);
          --surface-solid: var(--bg-raised);
          --border: var(--border);
          --text: var(--ink);
          --muted: var(--ink-soft);
          --teal: var(--accent);
          --amber: var(--medium);
          --rose: var(--hard);
          --mono: var(--font-mono), monospace;
          --sans: var(--font-sans), sans-serif;
          --display: var(--font-display), serif;

          color: var(--text);
          font-family: var(--sans);
          min-height: 70vh;
          padding: 24px 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .dsa-404-inner {
          width: 100%;
          max-width: 680px;
        }

        .crumb {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .crumb:hover { color: var(--teal); }

        .hero-card {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.01), transparent);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .badge {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.02em;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
        }
        .badge.status { color: var(--rose); border-color: color-mix(in srgb, var(--rose) 40%, var(--border)); background: color-mix(in srgb, var(--rose) 8%, transparent); }
        .badge.complexity { color: var(--teal); border-color: color-mix(in srgb, var(--teal) 40%, var(--border)); background: color-mix(in srgb, var(--teal) 8%, transparent); }
        .badge.tag { color: var(--muted); }

        .headline {
          font-family: var(--display);
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 600;
          line-height: 1.2;
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }
        .headline em {
          font-style: italic;
          color: var(--teal);
        }

        .subtext {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 0 0 24px;
          max-width: 52ch;
        }

        .array-wrap {
          display: flex;
          justify-content: center;
          gap: 6px;
          padding: 16px 4px 8px;
          flex-wrap: wrap;
        }

        .cell {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 12.5px;
          color: var(--muted);
          position: relative;
          transition: all 0.3s ease;
          background: var(--surface-solid);
        }
        .cell.in-range {
          border-color: color-mix(in srgb, var(--teal) 35%, var(--border));
          color: var(--text);
        }
        .cell.eliminated {
          opacity: 0.25;
        }
        .cell.mid {
          border-color: var(--amber);
          color: var(--amber);
          background: color-mix(in srgb, var(--amber) 12%, var(--surface-solid));
          transform: translateY(-2px);
        }
        .cell .ptr {
          position: absolute;
          top: -16px;
          font-size: 8px;
          font-family: var(--mono);
          color: var(--amber);
        }

        .recall-box {
          margin-top: 18px;
          border: 1px solid color-mix(in srgb, var(--rose) 35%, var(--border));
          background: color-mix(in srgb, var(--rose) 6%, transparent);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .recall-label {
          font-family: var(--mono);
          font-size: 9.5px;
          letter-spacing: 0.08em;
          color: var(--muted);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .recall-msg {
          font-family: var(--mono);
          font-size: 13.5px;
          color: var(--text);
        }
        .recall-msg .kw { color: var(--rose); }
        .recall-msg .cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: var(--rose);
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }

        .code-toggle {
          margin-top: 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .code-toggle summary {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--teal);
          padding: 10px 14px;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }
        .code-toggle summary::-webkit-details-marker { display: none; }
        .code-body {
          font-family: var(--mono);
          font-size: 12px;
          line-height: 1.7;
          color: var(--muted);
          padding: 4px 14px 14px;
          white-space: pre;
          overflow-x: auto;
        }
        .code-body .hl { color: var(--rose); }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .btn-404 {
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          transition: all 0.15s ease;
        }
        .btn-404.primary {
          background: var(--teal);
          color: var(--bg);
          border-color: var(--teal);
        }
        .btn-404.primary:hover { filter: brightness(1.08); }
        .btn-404:not(.primary):hover { border-color: var(--teal); color: var(--teal); }

        .footnote {
          margin-top: 18px;
          font-size: 11px;
          color: var(--muted);
          font-family: var(--mono);
        }

        @media (prefers-reduced-motion: reduce) {
          .cell { transition: none; }
          .recall-msg .cursor { animation: none; }
        }
      `}</style>

      <div className="dsa-404-inner">
        <span className="crumb" onClick={() => navigate("/")}>← Back to Dashboard</span>

        <div className="hero-card">
          <div className="badge-row">
            <span className="badge status">status: 404</span>
            <span className="badge complexity">time: O(log n)</span>
            <span className="badge tag">binary search</span>
          </div>

          <h1 className="headline">
            Searched every <em>page</em>. This one isn't in the array.
          </h1>
          <p className="subtext">
            The URL you followed doesn't match any known route — a card was
            probably deleted, or the link's outdated. Binary search just
            proved it in {step || "…"} comparisons instead of checking all{" "}
            {ARRAY.length}.
          </p>

          <div className="array-wrap" aria-hidden="true">
            {ARRAY.map((val, i) => {
              const inRange = i >= low && i <= high && !done;
              const isMid = i === mid && !done;
              const eliminated = !inRange && !isMid;
              return (
                <div
                  key={i}
                  className={`cell ${isMid ? "mid" : inRange ? "in-range" : "eliminated"}`}
                >
                  {isMid && <span className="ptr">mid</span>}
                  {val}
                </div>
              );
            })}
          </div>

          <div className="recall-box">
            <div className="recall-label">Recall Trigger</div>
            <div className="recall-msg">
              {done ? (
                <>
                  <span className="kw">while</span> (low ≤ high) exited early
                  — target not found.{" "}
                  <span className="kw">return</span> null
                  <span className="cursor" />
                </>
              ) : (
                <>
                  narrowing range… low={low}, high={high}
                  <span className="cursor" />
                </>
              )}
            </div>
          </div>

          <details className="code-toggle" open={revealCode} onToggle={(e: any) => setRevealCode(e.target.open)}>
            <summary>
              Why this happened
              <span>{revealCode ? "−" : "+"}</span>
            </summary>
            <div className="code-body">
{`Possible reasons this route wasn't found:
  · the URL was typed or pasted incorrectly
  · the card or page was deleted or renamed
  · you followed an outdated or shared link

`}<span className="hl">return null;</span>{`  // ← you are here`}
            </div>
          </details>

          <div className="actions">
            <button className="btn-404 primary" onClick={() => navigate("/")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Go to Dashboard
            </button>
            <button className="btn-404" onClick={() => navigate("/library")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
              Browse Library
            </button>
            <button
              className="btn-404"
              onClick={() =>
                navigate("/feedback", {
                  state: {
                    category: "bug",
                    message: `Broken link report:\nI tried to reach "${window.location.pathname}"\n\n(Add any extra detail below.)`
                  }
                })
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v5"/><path d="M12 16h.01"/></svg>
              Report broken link
            </button>
          </div>
        </div>

        <div className="footnote">// error boundary caught nothing — this route simply doesn't exist</div>
      </div>
    </div>
  );
}
