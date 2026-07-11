import { useState } from "react";
import { s } from "./layoutStyles";
import { formatRelativeTime } from "../../lib/sm2";

interface UserMenuProps {
  user: any;
  signOut: () => void;
  syncStatus: "synced" | "syncing" | "offline" | "local";
  lastSyncedAt: Date | null;
  setShowLogin: (show: boolean) => void;
}

export function UserMenu({
  user,
  signOut,
  syncStatus,
  lastSyncedAt,
  setShowLogin
}: UserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => setShowLogin(true)}
        style={{ ...s.providerBtn, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
        className="btn-press"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>
        Sync
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={s.avatarBtn}
        className="btn-press"
      >
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="Profile" style={s.avatarImg} />
        ) : (
          <div style={s.avatarInitials}>
            {user.email ? user.email.charAt(0).toUpperCase() : "?"}
          </div>
        )}
      </button>

      {menuOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 98, background: "transparent" }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{ ...s.dropdownMenu, zIndex: 99 }}>
            <div style={s.dropdownHeader}>
              <div style={s.dropdownEmail}>{user.email}</div>
              <div
                style={{
                  ...s.dropdownSync,
                  color: syncStatus === "synced" ? "var(--easy)" : syncStatus === "syncing" ? "var(--medium)" : syncStatus === "offline" ? "var(--hard)" : "var(--caption)",
                  cursor: lastSyncedAt ? "help" : "default"
                }}
                title={lastSyncedAt ? `Last synced at ${lastSyncedAt.toLocaleTimeString()}` : undefined}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: syncStatus === "synced" ? "var(--easy)" : syncStatus === "syncing" ? "var(--medium)" : syncStatus === "offline" ? "var(--hard)" : "var(--caption)",
                  display: "inline-block",
                  marginRight: 6
                }} />
                <span style={{ fontSize: 10, textTransform: "capitalize" }}>
                  {syncStatus === "synced" && lastSyncedAt
                    ? `Synced ${formatRelativeTime(lastSyncedAt)}`
                    : syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Syncing..." : syncStatus === "offline" ? "Offline" : "Local mode"}
                </span>
              </div>
            </div>

            <button
              onClick={() => { setMenuOpen(false); signOut(); }}
              style={{ ...s.dropdownItem, color: "var(--hard)", fontWeight: 500 }}
              className="dropdown-item"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
