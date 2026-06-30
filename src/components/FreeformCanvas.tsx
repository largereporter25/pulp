import { useEffect, useRef, useState } from "react";
import type { TextBlock, WritingMode } from "@shared/types";

interface Props {
  mode: WritingMode;
  blocks: TextBlock[];
  onChange: (b: TextBlock[]) => void;
  focusMode: boolean;
}

const SONG_LABELS = ["VERSE", "CHORUS", "BRIDGE", "PRE-CHORUS", "OUTRO", "HOOK"];

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  if (word.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}
function syllablesInLine(line: string): number {
  return line.trim().split(/\s+/).reduce((s, w) => s + countSyllables(w), 0);
}

export default function FreeformCanvas({ mode, blocks, onChange, focusMode }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const text = blocks[0]?.text ?? "";
  const [songLabelIdx, setSongLabelIdx] = useState(0);
  const [showSyllables, setShowSyllables] = useState(false);
  const [centered, setCentered] = useState(mode === "poem");

  const autosize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 480) + "px";
  };
  useEffect(autosize, [text]);

  const set = (v: string) => onChange([{ id: blocks[0]?.id ?? "b1", text: v }]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode === "song" && (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      const label = SONG_LABELS[songLabelIdx % SONG_LABELS.length];
      setSongLabelIdx((i) => i + 1);
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const before = text.slice(0, start);
      const after = text.slice(start);
      const insert = `[${label}]\n`;
      set(before + insert + after);
    }
  };

  const styles: Record<WritingMode, React.CSSProperties> = {
    poem: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontStyle: "italic",
      fontSize: "20px",
      lineHeight: 2.2,
      textAlign: centered ? "center" : "left",
      color: "#f0ece0",
      whiteSpace: "pre-wrap",
    },
    song: {
      fontFamily: '"Inter", sans-serif',
      fontSize: "17px",
      lineHeight: 1.85,
      color: "#f0ece0",
      whiteSpace: "pre-wrap",
    },
    prose: {
      fontFamily: '"Newsreader", Georgia, serif',
      fontSize: "19px",
      lineHeight: 1.95,
      color: "rgba(240,236,224,0.92)",
      whiteSpace: "pre-wrap",
    },
    notes: {
      fontFamily: '"Newsreader", Georgia, serif',
      fontSize: "17px",
      lineHeight: 1.9,
      color: "rgba(240,236,224,0.9)",
      whiteSpace: "pre-wrap",
    },
    screenplay: {},
  };

  const placeholders: Record<WritingMode, string> = {
    poem: "Let the first line fall…",
    song: "[Verse 1]\nStart with a feeling…\n\n[Chorus]\nThe line they'll remember…",
    prose: "Once upon a page…",
    notes: "Start with a thought. Use [[Title]] to link to other documents.\n\n#tag your ideas.",
    screenplay: "",
  };

  // Render song with [LABEL] badges highlighted
  const renderSongPreview = () => {
    if (mode !== "song") return null;
    const lines = text.split("\n");
    return (
      <div style={{ ...styles.song, position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none", padding: 0 }}>
        {lines.map((line, i) => {
          const labelMatch = line.match(/^\[([A-Z \-]+)\]$/);
          if (labelMatch) {
            return (
              <div key={i} style={{ lineHeight: "1.85" }}>
                <span style={{
                  background: "rgba(245,185,66,0.15)",
                  color: "#f5b942",
                  borderRadius: 4,
                  padding: "1px 7px",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "JetBrains Mono, monospace",
                }}>{labelMatch[1]}</span>
              </div>
            );
          }
          return <div key={i} style={{ lineHeight: "1.85", visibility: "hidden" }}>{line || "\u00a0"}</div>;
        })}
      </div>
    );
  };

  // Syllable counter overlay for poems
  const renderSyllables = () => {
    if (mode !== "poem" || !showSyllables) return null;
    return (
      <div style={{ position: "absolute", top: 0, right: "-48px", pointerEvents: "none" }}>
        {text.split("\n").map((line, i) => (
          <div key={i} style={{
            height: "calc(20px * 2.2)",
            display: "flex",
            alignItems: "center",
            fontSize: 10,
            color: "rgba(245,185,66,0.4)",
            fontFamily: "JetBrains Mono, monospace",
          }}>
            {line.trim() ? syllablesInLine(line) : ""}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar for poem/song/notes */}
      {!focusMode && mode !== "screenplay" && mode !== "prose" && (
        <div className="mb-3 flex items-center gap-3">
          {mode === "poem" && (
            <>
              <button
                onClick={() => setCentered((v) => !v)}
                className="mono-label btn-press rounded px-2 py-1 text-[9px]"
                style={{ color: centered ? "#f5b942" : "rgba(245,185,66,0.4)", border: "1px solid rgba(245,185,66,0.2)" }}
              >
                {centered ? "Centered" : "Left-align"}
              </button>
              <button
                onClick={() => setShowSyllables((v) => !v)}
                className="mono-label btn-press rounded px-2 py-1 text-[9px]"
                style={{ color: showSyllables ? "#f5b942" : "rgba(245,185,66,0.4)", border: "1px solid rgba(245,185,66,0.2)" }}
              >
                {showSyllables ? "Syllables on" : "Syllables"}
              </button>
            </>
          )}
          {mode === "song" && (
            <button
              onClick={() => {
                const label = SONG_LABELS[songLabelIdx % SONG_LABELS.length];
                setSongLabelIdx((i) => i + 1);
                set(text + (text ? "\n" : "") + `[${label}]\n`);
              }}
              className="mono-label btn-press rounded px-2 py-1 text-[9px]"
              style={{ color: "rgba(245,185,66,0.7)", border: "1px solid rgba(245,185,66,0.2)" }}
            >
              + Label
            </button>
          )}
        </div>
      )}
      <div style={{ position: "relative" }}>
        {mode === "song" && renderSongPreview()}
        {renderSyllables()}
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => set(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholders[mode]}
          spellCheck
          className={`el-input min-h-[480px] ${mode === "notes" ? "notes-surface" : ""}`}
          data-testid="freeform-input"
          style={styles[mode]}
        />
      </div>
    </div>
  );
}
