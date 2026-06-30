export type WritingMode = 'screenplay' | 'prose' | 'poem' | 'song' | 'notes';

export const MODE_META: Record<WritingMode, { label: string; emoji: string; color: string; font: string }> = {
  screenplay: { label: 'Screenplay', emoji: '🎬', color: '#f5b942', font: 'Courier Prime, Courier New, monospace' },
  prose:      { label: 'Prose',      emoji: '📖', color: '#7eb8d4', font: 'Newsreader, Georgia, serif' },
  poem:       { label: 'Poem',       emoji: '📜', color: '#c084fc', font: 'Playfair Display, Georgia, serif' },
  song:       { label: 'Song',       emoji: '🎵', color: '#4ade80', font: 'Newsreader, Georgia, serif' },
  notes:      { label: 'Notes',      emoji: '📝', color: '#fb923c', font: 'Inter, system-ui, sans-serif' },
};

export const LYNCH_QUOTES = [
  'Ideas are like fish. If you want to catch little fish, you can stay in the shallow water.',
  'But if you want to catch the big fish, you\'ve got to go deeper.',
  'The thing about meditation is: You become more and more you.',
  'Intuition is the key to everything, in painting, filmmaking, business — everything.',
  'Even bad coffee is better than no coffee at all.',
  'There is no road map for the creative journey.',
  'I like things that go into unknown territory.',
  'Cinema is a matter of what\'s in the frame and what\'s out.',
  'Don\'t fear mistakes — there are none.',
  'Absurdity is what I love most in life.',
];
