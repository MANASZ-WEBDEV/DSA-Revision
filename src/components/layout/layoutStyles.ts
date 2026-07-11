import type React from "react";

export const s: Record<string, React.CSSProperties> = {
  logo: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 16,
    color: "var(--ink)",
    cursor: "pointer",
    marginRight: 10,
    letterSpacing: "-0.01em",
    display: "flex",
    alignItems: "center",
    textDecoration: "none"
  },
  navLinks: {
    display: "flex",
    gap: 2,
    flex: 1
  },
  navBtn: {
    background: "none",
    border: "none",
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    color: "var(--ink-soft)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    textDecoration: "none",
    transition: "background 0.15s ease, color 0.15s ease"
  },
  navActive: {
    background: "var(--bg-sunken)",
    color: "var(--ink)",
    fontWeight: 500
  },
  pill: {
    background: "var(--urgent)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 10
  },
  providerBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: 13,
    color: "var(--ink-soft)",
    transition: "border-color 0.15s ease"
  },
  primaryBtn: {
    padding: "10px 22px",
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer"
  },
  avatarBtn: {
    background: "none",
    padding: 0,
    cursor: "pointer",
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid var(--border-strong)",
    transition: "border-color 0.15s ease"
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  avatarInitials: {
    width: "100%",
    height: "100%",
    background: "var(--accent-soft)",
    color: "var(--accent-ink)",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 220,
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-lg)",
    padding: "6px 0",
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 0.15s ease both"
  },
  dropdownHeader: {
    padding: "8px 12px"
  },
  dropdownEmail: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
    wordBreak: "break-all"
  },
  dropdownSync: {
    fontSize: 11,
    color: "var(--caption)",
    marginTop: 4,
    display: "flex",
    alignItems: "center"
  },
  dropdownDivider: {
    height: 1,
    background: "var(--border)",
    margin: "4px 0"
  },
  dropdownItem: {
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "var(--ink-soft)",
    cursor: "pointer",
    transition: "background 0.1s ease",
    textAlign: "left"
  },
  navProviderBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 11,
    color: "var(--ink-soft)",
    transition: "border-color 0.15s ease",
    alignSelf: "center",
    height: 28
  },
  footer: {
    borderTop: "1px solid var(--border)",
    background: "var(--bg-raised)",
    padding: "20px 0",
    marginTop: "auto"
  },
  footerInner: {
    maxWidth: 880,
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "var(--caption)",
    flexWrap: "wrap",
    gap: 12
  },
  footerLinks: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  footerLink: {
    color: "var(--caption)",
    textDecoration: "underline",
    cursor: "pointer",
    transition: "color 0.15s ease"
  }
};
