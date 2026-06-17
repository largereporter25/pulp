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

export const WRITING_MODES = ["screenplay", "poem", "song", "prose"] as const;
export type WritingMode = (typeof WRITING_MODES)[number];

export interface Document {
  id: string;
  title: string;
  mode: WritingMode;
  content: ScreenplayElement[] | TextBlock[];
  synopsis: string;
  created_at: string;
  updated_at: string;
}

export const MODE_META: Record<
  WritingMode,
  { label: string; tagline: string; icon: string }
> = {
  screenplay: { label: "Screenplay", tagline: "Industry-standard film & TV format", icon: "clapperboard" },
  poem: { label: "Poem", tagline: "Free verse on an open canvas", icon: "feather" },
  song: { label: "Song", tagline: "Verses, choruses & lyric structure", icon: "music" },
  prose: { label: "Prose", tagline: "Novels, essays & short stories", icon: "book-open" },
};
