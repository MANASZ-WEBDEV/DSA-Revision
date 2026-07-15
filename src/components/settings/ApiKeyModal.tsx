import { useState } from "react";
import { PROVIDERS } from "../../lib/llm";
import type { ProviderId } from "../../lib/llm";
import { LanguageIcon, LANGUAGES } from "../layout/LanguageIcon";
import type { CodeLanguage } from "../layout/LanguageIcon";

interface Props {
  providerId: ProviderId;
  model: string;
  keys: Record<ProviderId, string>;
  codeLanguage: CodeLanguage;
  onSetProvider: (id: ProviderId) => void;
  onSetModel: (m: string) => void;
  onSetKey: (id: ProviderId, key: string) => void;
  onSetCodeLanguage: (lang: CodeLanguage) => void;
  onClose: () => void;
}

export function ApiKeyModal({
  providerId, model, keys, codeLanguage,
  onSetProvider, onSetModel, onSetKey, onSetCodeLanguage, onClose,
}: Props) {
  // Local draft state — only commit on Save
  const [draftProvider, setDraftProvider] = useState<ProviderId>(providerId);
  const [draftModel,    setDraftModel]    = useState(model);
  const [draftKeys,     setDraftKeys]     = useState({ ...keys });
  const [draftLang,     setDraftLang]     = useState<CodeLanguage>(codeLanguage);

  const provider = PROVIDERS.find((p) => p.id === draftProvider)!;
  const draftKey = draftKeys[draftProvider];
  const keyValid = draftKey.startsWith(provider.keyPrefix);

  function handleProviderSwitch(id: ProviderId) {
    setDraftProvider(id);
    setDraftModel(PROVIDERS.find((p) => p.id === id)!.models[0].id);
  }

  function handleSave() {
    onSetProvider(draftProvider);
    onSetModel(draftModel);
    onSetCodeLanguage(draftLang);
    // Save all keys (user may have typed into multiple tabs)
    (Object.keys(draftKeys) as ProviderId[]).forEach((id) => {
      if (draftKeys[id]) onSetKey(id, draftKeys[id]);
    });
    onClose();
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={s.title}>LLM provider</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Provider tabs */}
        <div style={s.tabs}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderSwitch(p.id)}
              style={{
                ...s.tab,
                ...(draftProvider === p.id ? s.tabActive : {}),
              }}
            >
              <span>{p.logo}</span>
              <span style={{ fontSize: 12 }}>{p.id === "anthropic" ? "Claude" : p.id === "gemini" ? "Gemini" : "Groq"}</span>
              {keys[p.id] && <span style={s.checkDot} />}
            </button>
          ))}
        </div>

        {/* Provider detail */}
        <div style={s.providerBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{provider.name}</div>
              <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}>{provider.freeNote}</div>
            </div>
            <a
              href={provider.keyUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
            >
              Get key →
            </a>
          </div>

          {/* Model selector */}
          <label style={s.label}>Model</label>
          <select
            value={draftModel}
            onChange={(e) => setDraftModel(e.target.value)}
            style={s.select}
          >
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          {/* API key input */}
          <label htmlFor={`api-key-${draftProvider}`} style={{ ...s.label, marginTop: 14 }}>API key</label>
          <input
            id={`api-key-${draftProvider}`}
            name={`api_key_${draftProvider}`}
            type="password"
            value={draftKeys[draftProvider]}
            onChange={(e) => setDraftKeys((prev) => ({ ...prev, [draftProvider]: e.target.value }))}
            placeholder={provider.keyPlaceholder}
            style={s.input}
            autoFocus
          />
          {draftKey && !keyValid && (
            <p style={{ fontSize: 12, color: "var(--urgent)", margin: "4px 0 0" }}>
              Key should start with "{provider.keyPrefix}"
            </p>
          )}
        </div>

        {/* Code hint language preference */}
        <div style={{ marginTop: 16 }}>
          <label style={s.label}>Code hint language</label>
          <div style={s.langGrid}>
            {LANGUAGES.map((lang) => {
              const active = draftLang === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setDraftLang(lang.id)}
                  style={{ ...s.langChip, ...(active ? s.langChipActive : {}) }}
                  className="btn-press"
                >
                  <LanguageIcon id={lang.id} size={11} />
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--caption)", margin: "6px 0 0", lineHeight: 1.4 }}>
            Controls the syntax style of generated code hints. "Any" = pseudocode.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            style={{ ...s.saveBtn, opacity: (!draftKey || keyValid) ? 1 : 0.5 }}
          >
            Save & use {provider.id === "anthropic" ? "Claude" : provider.id === "gemini" ? "Gemini" : "Groq"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay:     { position: "fixed", inset: 0, background: "rgba(20, 18, 14, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" },
  modal:       { background: "var(--bg-raised)", borderRadius: 14, padding: "22px 24px", width: "100%", maxWidth: 460, boxShadow: "var(--shadow-lg)" },
  title:       { margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)" },
  closeBtn:    { background: "none", border: "none", fontSize: 16, color: "var(--caption)", cursor: "pointer", padding: "4px 6px" },
  tabs:        { display: "flex", gap: 6, marginBottom: 16 },
  tab:         { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-sunken)", cursor: "pointer", position: "relative" },
  tabActive:   { borderColor: "var(--accent)", background: "var(--accent-soft)" },
  checkDot:    { position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" },
  providerBox: { background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 16px" },
  label:       { display: "block", fontSize: 11, fontWeight: 600, color: "var(--caption)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 },
  select:      { width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", background: "var(--bg-raised)", outline: "none", color: "var(--ink)" },
  input:       { width: "100%", boxSizing: "border-box" as const, padding: "9px 11px", fontSize: 13, border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", outline: "none", marginTop: 2, background: "var(--bg-raised)", color: "var(--ink)" },
  cancelBtn:   { padding: "8px 16px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, cursor: "pointer", color: "var(--ink-soft)" },
  saveBtn:     { padding: "8px 18px", background: "var(--ink)", border: "none", borderRadius: "var(--radius)", fontSize: 14, color: "var(--bg)", fontWeight: 500, cursor: "pointer" },
  langGrid:    { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  langChip:    { display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-raised)", color: "var(--ink-soft)", fontSize: 12, cursor: "pointer", transition: "all 0.12s ease" },
  langChipActive: { borderColor: "var(--accent)", color: "var(--ink)", background: "color-mix(in srgb, var(--accent) 12%, transparent)" },
};
