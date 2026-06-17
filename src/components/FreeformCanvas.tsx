import { useEffect, useRef } from "react";
import type { TextBlock, WritingMode } from "@shared/types";

interface Props {
  mode: WritingMode;
  blocks: TextBlock[];
  onChange: (b: TextBlock[]) => void;
  focusMode: boolean;
}

/**
 * Freeform writing surface for poem / song / prose.
 * A single flowing textarea — but styled per-mode so each
 * format has its own typographic soul.
 */
export default function FreeformCanvas({ mode, blocks, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const text = blocks[0]?.text ?? "";

  const autosize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 480) + "px";
  };
  useEffect(autosize, [text]);

  const set = (v: string) => {
    onChange([{ id: blocks[0]?.id ?? "b1", text: v }]);
  };

  const styles: Record<WritingMode, React.CSSProperties> = {
    poem: {
      fontFamily: '"Newsreader", Georgia, serif',
      fontSize: "20px",
      lineHeight: 1.9,
      textAlign: "center",
      color: "#f4ab11",
      whiteSpace: "pre-wrap",
    },
    song: {
      fontFamily: '"Inter", sans-serif',
      fontSize: "17px",
      lineHeight: 1.85,
      color: "#f4ab11",
      whiteSpace: "pre-wrap",
    },
    prose: {
      fontFamily: '"Newsreader", Georgia, serif',
      fontSize: "19px",
      lineHeight: 1.95,
      color: "rgba(244,171,17,0.92)",
      whiteSpace: "pre-wrap",
    },
    screenplay: {},
  };

  const placeholders: Record<WritingMode, string> = {
    poem: "Let the first line fall…",
    song: "[Verse 1]\nStart with a feeling…\n\n[Chorus]\nThe line they'll remember…",
    prose: "Once upon a page…",
    screenplay: "",
  };

  return (
    <textarea
      ref={ref}
      value={text}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholders[mode]}
      spellCheck
      className="el-input min-h-[480px]"
      data-testid="freeform-input"
      style={styles[mode]}
    />
  );
}
