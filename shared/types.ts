export type ScreenplayElementType =
  | "scene"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export interface ScreenplayElement {
  id: string;
  type: ScreenplayElementType;
  text: string;
}

export interface TextBlock {
  id: string;
  text: string;
}

export const WRITING_MODES = ["screenplay", "poem", "song", "prose", "notes"] as const;
export type WritingMode = (typeof WRITING_MODES)[number];

export interface TitlePage {
  title: string;
  author: string;
  basedOn: string;
  contact: string;
  draftDate: string;
}

export interface Document {
  id: string;
  title: string;
  mode: WritingMode;
  content: ScreenplayElement[] | TextBlock[];
  synopsis: string;
  canvas_x: number;
  canvas_y: number;
  tags: string[];
  word_count: number;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface CanvasCard {
  id: string;
  title: string;
  mode: WritingMode;
  canvas_x: number;
  canvas_y: number;
  word_count: number;
  updated_at: string;
}

export const MODE_META: Record<
  WritingMode,
  { label: string; tagline: string; icon: string; color: string }
> = {
  screenplay: { label: "Screenplay", tagline: "Industry-standard film & TV format", icon: "clapperboard", color: "#f5b942" },
  poem:       { label: "Poem",       tagline: "Free verse on an open canvas",      icon: "feather",     color: "#c084fc" },
  song:       { label: "Song",       tagline: "Verses, choruses & lyric structure", icon: "music",      color: "#4ade80" },
  prose:      { label: "Prose",      tagline: "Novels, essays & short stories",    icon: "book-open",  color: "#7eb8d4" },
  notes:      { label: "Notes",      tagline: "Linked notes, wiki & journal",      icon: "sticky-note", color: "#fb923c" },
};
