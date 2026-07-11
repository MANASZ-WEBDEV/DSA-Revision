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
        ☁️ Sync
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
              <span style={{ marginRight: 8, fontSize: 14 }}>🚪</span>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
