import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { api, Doc } from "../lib/api";
import PulpEditor from "../components/PulpEditor";

const MODE_COLORS: Record<string, string> = {
  screenplay: "#f5b942", prose: "#7eb8d4",
  poem: "#c084fc", song: "#4ade80", notes: "#fb923c",
};

export default function Editor() {
  const [match, params] = useRoute("/doc/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? "";
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getDocument(id)
      .then(d => { setDoc(d); setTitle(d.title || "Untitled"); setLoading(false); })
      .catch(() => navigate("/"));
  }, [id]);

  const save = useCallback(async (payload: Partial<Doc>) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.updateDocument(id, payload);
      setDoc(updated); setLastSaved(new Date());
    } finally { setSaving(false); }
  }, [id]);

  const saveTitle = useCallback(async () => {
    if (!id || !title) return;
    await save({ title });
  }, [id, title, save]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") { e.preventDefault(); setFocusMode(f => !f); }
      if ((e.metaKey || e.ctrlKey) && e.key === "e") { e.preventDefault(); setShowExport(m => !m); }
      if (e.key === "Escape") setShowExport(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (loading || !match) return (
    <div style={{
      width: "100vw", height: "100vh", background: "#0d0d0d",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(245,185,66,0.4)", fontFamily: "Inter",
    }}>Loading...</div>
  );
  if (!doc) return null;

  const modeColor = MODE_COLORS[doc.mode] || "#f5b942";

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#0d0d0d" }}>
      <header style={{
        height: 48, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
        background: "#1a0800",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0, zIndex: 100,
        opacity: focusMode ? 0 : 1,
        transition: "opacity 0.3s",
        pointerEvents: focusMode ? "none" : "all",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none", border: "none",
              color: "rgba(240,236,224,0.4)", cursor: "pointer", fontSize: "1.1rem",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f5b942")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,236,224,0.4)")}
          >←</button>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic", fontWeight: 700,
            fontSize: "1.1rem", color: "#f5b942",
          }}>Pulp</span>
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === "Enter") { (e.target as HTMLElement).blur(); saveTitle(); } }}
          style={{
            background: "none", border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            color: "#f0ece0", textAlign: "center",
            fontFamily: "Inter, sans-serif", fontWeight: 400,
            fontSize: "0.9rem", padding: "2px 8px",
            outline: "none", minWidth: 160, maxWidth: 320,
          }}
          onFocus={e => (e.currentTarget.style.borderBottomColor = modeColor)}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saving && <span style={{ color: "rgba(245,185,66,0.4)", fontFamily: "Inter", fontSize: "0.7rem" }}>saving...</span>}
          {lastSaved && !saving && (
            <span style={{ color: "rgba(245,185,66,0.35)", fontFamily: "Inter", fontSize: "0.7rem" }}>
              saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => setFocusMode(f => !f)}
            style={{
              background: focusMode ? "rgba(245,185,66,0.15)" : "none",
              border: "1px solid rgba(245,185,66,0.2)",
              borderRadius: 5, padding: "4px 10px",
              color: "rgba(245,185,66,0.7)",
              fontFamily: "Inter", fontSize: "0.72rem", cursor: "pointer",
            }}>Focus</button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowExport(m => !m)}
              style={{
                background: "rgba(245,185,66,0.12)",
                border: "1px solid rgba(245,185,66,0.25)",
                borderRadius: 5, padding: "4px 12px",
                color: "#f5b942", fontFamily: "Inter", fontSize: "0.72rem", cursor: "pointer",
              }}>Export ▾</button>
            {showExport && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#1a0800",
                border: "1px solid rgba(245,185,66,0.2)",
                borderRadius: 8, overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                minWidth: 160, zIndex: 200,
              }}>
                {(["pdf", "fountain", "docx", "txt"] as const).map(fmt => (
                  <a
                    key={fmt}
                    href={api.exportUrl(doc.id, fmt)}
                    download
                    onClick={() => setShowExport(false)}
                    style={{
                      display: "block", padding: "10px 16px",
                      color: "#f0ece0", fontFamily: "Inter", fontSize: "0.82rem",
                      textDecoration: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,185,66,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    ↓ .{fmt.toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <PulpEditor doc={doc} onSave={save} focusMode={focusMode} />

      <footer style={{
        height: 32, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
        background: "rgba(26,8,0,0.9)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
        opacity: focusMode ? 0 : 1, transition: "opacity 0.3s",
      }}>
        <span style={{ color: modeColor, fontFamily: "Inter", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7 }}>{doc.mode}</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ color: "rgba(240,236,224,0.3)", fontFamily: "Inter", fontSize: "0.62rem" }}>
            {(doc.word_count || 0).toLocaleString()} words
          </span>
          {doc.mode === "screenplay" && (
            <span style={{ color: "rgba(240,236,224,0.3)", fontFamily: "Inter", fontSize: "0.62rem" }}>
              ~{(doc.page_count || 0).toFixed(1)} pages
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
