import type { ScreenplayElementType } from "@shared/types";

/**
 * The screenplay engine: industry-standard element behavior.
 * Mirrors Final Draft / Fountain conventions for Tab/Enter cycling,
 * smart capitalization, and element styling.
 */

export const ELEMENT_LABELS: Record<ScreenplayElementType, string> = {
  scene: "Scene Heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
};

export const ELEMENT_HOTKEYS: Record<ScreenplayElementType, string> = {
  scene: "⌘1",
  action: "⌘2",
  character: "⌘3",
  dialogue: "⌘4",
  parenthetical: "⌘5",
  transition: "⌘6",
};

// What pressing ENTER on a given element creates next.
export const ENTER_NEXT: Record<ScreenplayElementType, ScreenplayElementType> = {
  scene: "action",
  action: "action",
  character: "dialogue",
  dialogue: "action",
  parenthetical: "dialogue",
  transition: "scene",
};

// What pressing TAB cycles to (the rotation pro tools use).
export const TAB_CYCLE: Record<ScreenplayElementType, ScreenplayElementType> = {
  action: "character",
  character: "dialogue",
  dialogue: "parenthetical",
  parenthetical: "dialogue",
  scene: "action",
  transition: "scene",
};

// Element styling on the page — alignment, margins (in ch units), case.
export interface ElementStyle {
  marginLeft: string;
  marginRight: string;
  textAlign: "left" | "center" | "right";
  uppercase: boolean;
  bold: boolean;
  italic: boolean;
  marginTop: string;
  color: string;
}

export function styleFor(type: ScreenplayElementType): ElementStyle {
  switch (type) {
    case "scene":
      return { marginLeft: "0", marginRight: "0", textAlign: "left", uppercase: true, bold: true, italic: false, marginTop: "1.4em", color: "#f3f3f5" };
    case "action":
      return { marginLeft: "0", marginRight: "0", textAlign: "left", uppercase: false, bold: false, italic: false, marginTop: "0.9em", color: "#d6d6db" };
    case "character":
      return { marginLeft: "20ch", marginRight: "0", textAlign: "left", uppercase: true, bold: false, italic: false, marginTop: "1.1em", color: "#f3f3f5" };
    case "parenthetical":
      return { marginLeft: "15ch", marginRight: "18ch", textAlign: "left", uppercase: false, bold: false, italic: true, marginTop: "0.1em", color: "#9a9aa3" };
    case "dialogue":
      return { marginLeft: "10ch", marginRight: "14ch", textAlign: "left", uppercase: false, bold: false, italic: false, marginTop: "0.1em", color: "#e7e7ea" };
    case "transition":
      return { marginLeft: "0", marginRight: "0", textAlign: "right", uppercase: true, bold: false, italic: false, marginTop: "1.1em", color: "#f5b942" };
  }
}

export function placeholderFor(type: ScreenplayElementType): string {
  switch (type) {
    case "scene":
      return "INT. LOCATION - DAY";
    case "action":
      return "Describe what happens…";
    case "character":
      return "CHARACTER NAME";
    case "parenthetical":
      return "(beat)";
    case "dialogue":
      return "What they say…";
    case "transition":
      return "CUT TO:";
  }
}

// Smart auto-detection: infer the element type from raw typed text.
export function autoDetect(text: string, current: ScreenplayElementType): ScreenplayElementType | null {
  const t = text.trim().toUpperCase();
  if (current === "action" || current === "scene") {
    if (/^(INT|EXT|EST|INT\.\/EXT|I\/E)[\.\s]/.test(t)) return "scene";
  }
  if (current === "action") {
    if (/(TO:|FADE OUT\.?|FADE IN:|CUT TO:|DISSOLVE TO:|SMASH CUT:)$/.test(t)) return "transition";
  }
  return null;
}

// Standard pagination heuristic: ~55 lines per US-letter screenplay page.
const LINES_PER_PAGE = 55;
const CHARS_PER_LINE: Record<ScreenplayElementType, number> = {
  scene: 60,
  action: 60,
  character: 38,
  dialogue: 35,
  parenthetical: 25,
  transition: 60,
};

export function estimatePages(elements: { type: ScreenplayElementType; text: string }[]): number {
  let lines = 0;
  for (const el of elements) {
    const width = CHARS_PER_LINE[el.type] || 60;
    const textLines = Math.max(1, Math.ceil((el.text.length || 1) / width));
    lines += textLines + 1; // spacing
  }
  return Math.max(1, Math.round((lines / LINES_PER_PAGE) * 10) / 10);
}
