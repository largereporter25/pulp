import React, { useEffect, useRef, useCallback, useState } from "react";
import { Doc } from "../lib/api";

const MODE_FONT: Record<string, string> = {
  screenplay: "'Courier Prime', 'Courier New', monospace",
  prose: "'Newsreader', Georgia, serif",
  poem: "'Playfair Display', Georgia, serif",
  song: "'Newsreader', Georgia, serif",
  notes: "Inter, sans-serif",
};
const MODE_COLORS: Record<string, string> = {
  screenplay: "#f5b942", prose: "#7eb8d4",
  poem: "#c084fc", song: "#4ade80", notes: "#fb923c",
};
const PAGE_WIDTH: Record<string, number> = {
  screenplay: 680, prose: 720, poem: 600, song: 640, notes: 760,
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function textToJson(text: string, mode: string) {
  return {
    version: 2, mode,
    raw: text,
    nodes: text.split("\n").map(line => ({ type: "paragraph", text: line })),
  };
}

interface Props { doc: Doc; onSave: (p: Partial<Doc>) => void; focusMode: boolean; }

export default function PulpEditor({ doc, onSave, focusMode }: Props) {
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const raw = (doc.content as any)?.raw ?? "";
    setText(raw);
    setWordCount(countWords(raw));
  }, [doc.id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setWordCount(countWords(val));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave({
        content: textToJson(val, doc.mode),
        word_count: countWords(val),
        page_count: parseFloat((countWords(val) / 250).toFixed(1)),
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1800);
    }, 900);
  }, [doc.mode, onSave]);

  const modeColor = MODE_COLORS[doc.mode] || "#f5b942";
  const maxW = (PAGE_WIDTH[doc.mode] || 700) + "px";

  const placeholder =
    doc.mode === "screenplay" ? "INT. LOCATION - DAY\n\nBegin your scene..."
    : doc.mode === "poem" ? "Let the lines breathe..."
    : doc.mode === "song" ? "VERSE\n\nWrite your lyrics..."
    : doc.mode === "notes" ? "Start writing. Use [[link]] to connect ideas..."
    : "Begin writing...";

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: focusMode ? 60 : 80, paddingBottom: 120,
      overflowY: "auto", position: "relative",
      background: "#0d0d0d",
      backgroundImage: "radial-gradient(circle, rgba(245,185,66,0.10) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
    }}>
      <div style={{
        position: "fixed", top: "30%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 900, height: 600, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(245,185,66,0.05) 0%, transparent 70%)",
        zIndex: 0,
      }} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: maxW, minHeight: "100vh",
        background: "#111111",
        borderRadius: 4,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.6)",
        padding: "60px 56px 160px",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 4, pointerEvents: "none",
          opacity: 0.35,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }} />
        <div style={{
          position: "absolute", top: 18, right: 18,
          background: `${modeColor}22`, color: modeColor,
          fontFamily: "Inter, sans-serif", fontSize: "0.62rem",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "3px 8px", borderRadius: 3, pointerEvents: "none",
        }}>{doc.mode}</div>
        <textarea
          value={text}
          onChange={handleChange}
          placeholder={placeholder}
          spellCheck
          autoFocus
          style={{
            width: "100%", minHeight: "80vh",
            background: "transparent", border: "none", outline: "none", resize: "none",
            color: "#f0ece0",
            fontFamily: MODE_FONT[doc.mode] || MODE_FONT.prose,
            fontSize: doc.mode === "screenplay" ? "13px" : "16px",
            lineHeight: doc.mode === "poem" ? 2.2 : 1.8,
            letterSpacing: "0.01em",
            caretColor: modeColor,
            position: "relative", zIndex: 1,
          }}
        />
      </div>
      {showSaved && (
        <div style={{
          position: "fixed", top: 60, right: 24,
          background: "rgba(26,8,0,0.92)",
          border: "1px solid rgba(245,185,66,0.3)",
          color: "#f5b942", fontFamily: "Inter", fontSize: "0.72rem",
          padding: "6px 14px", borderRadius: 6, zIndex: 9999,
          animation: "fadeInOut 1.8s ease forwards",
        }}>✓ Synced</div>
      )}
    </div>
  );
}
