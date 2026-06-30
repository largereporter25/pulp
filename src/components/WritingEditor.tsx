import { useEffect, useRef, useCallback } from 'react';
import type { WritingMode } from '../types';
import { MODE_META } from '../types';

interface Props {
  docId: string;
  mode: WritingMode;
  content: string;
  onChange: (content: string, wordCount: number) => void;
  focusMode: boolean;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Screenplay element types in cycle order
const SCREENPLAY_CYCLE = ['scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'] as const;
type ScreenplayElement = typeof SCREENPLAY_CYCLE[number];

const ELEMENT_STYLES: Record<ScreenplayElement, React.CSSProperties> = {
  scene_heading: { textTransform: 'uppercase', fontWeight: 700, marginTop: '1.5rem' },
  action: { marginTop: '0.5rem' },
  character: { textTransform: 'uppercase', textAlign: 'center', marginTop: '1rem', marginLeft: '35%', width: '30%' },
  dialogue: { textAlign: 'left', marginLeft: '20%', width: '60%', marginTop: 0 },
  parenthetical: { textAlign: 'center', marginLeft: '28%', width: '44%', fontStyle: 'italic', fontSize: '0.9em' },
  transition: { textTransform: 'uppercase', textAlign: 'right', marginTop: '1rem' },
};

export default function WritingEditor({ docId, mode, content, onChange, focusMode }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const currentElementRef = useRef<ScreenplayElement>('action');
  const composingRef = useRef(false);

  const meta = MODE_META[mode];

  // Parse JSON content to text, or use raw
  const getInitialContent = useCallback(() => {
    if (!content) return '';
    try {
      const pm = JSON.parse(content);
      const lines: string[] = [];
      const walk = (node: any) => {
        if (node.type === 'text') lines.push(node.text || '');
        (node.content || []).forEach(walk);
        if (['paragraph','scene_heading','action','character','dialogue','parenthetical','transition','heading'].includes(node.type)) {
          lines.push('\n');
        }
      };
      walk(pm);
      return lines.join('').trim();
    } catch {
      return content;
    }
  }, [content]);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.textContent) {
      editorRef.current.textContent = getInitialContent();
    }
  }, [docId]);

  const handleInput = useCallback(() => {
    if (composingRef.current) return;
    const text = editorRef.current?.textContent || '';
    const wc = countWords(text);
    // Store as simple text JSON
    const simpleContent = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
    onChange(simpleContent, wc);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (mode !== 'screenplay') return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = SCREENPLAY_CYCLE.indexOf(currentElementRef.current);
      const next = SCREENPLAY_CYCLE[e.shiftKey ? (idx - 1 + SCREENPLAY_CYCLE.length) % SCREENPLAY_CYCLE.length : (idx + 1) % SCREENPLAY_CYCLE.length];
      currentElementRef.current = next;
      // Visual feedback: update a data attribute
      if (editorRef.current) {
        editorRef.current.dataset.element = next;
      }
    }
  }, [mode]);

  const placeholders: Partial<Record<WritingMode, string>> = {
    screenplay: 'INT. LOCATION — DAY\n\nBegin your screenplay. Tab cycles element types.\nScene Heading → Action → Character → Dialogue → Parenthetical → Transition',
    prose: 'Begin writing...\n\nYour story, essay, or article starts here.',
    poem: 'The first line of your poem.\n\nBreath.\nBegin.',
    song: 'VERSE\n\nYour opening lyrics...\n\nCHORUS\n\nThe hook that stays.',
    notes: '# Your Notes\n\nWrite freely. Use [[links]] to connect ideas.\nMarkdown is supported.',
  };

  const getEditorStyle = (): React.CSSProperties => ({
    fontFamily: meta.font,
    fontSize: mode === 'screenplay' ? '13px' : mode === 'poem' ? '18px' : '15px',
    lineHeight: mode === 'poem' ? 2.2 : mode === 'screenplay' ? 1.8 : 1.75,
    color: '#f0ece0',
    caretColor: '#f5b942',
    outline: 'none',
    minHeight: '100%',
    padding: '80px 72px 200px',
    whiteSpace: mode === 'screenplay' ? 'pre-wrap' : 'pre-wrap',
    wordBreak: 'break-word',
    maxWidth: mode === 'screenplay' ? 680 : mode === 'poem' ? 560 : 720,
    margin: '0 auto',
    position: 'relative',
    cursor: 'text',
  });

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'transparent' }}>
      {/* Ambient glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: 0, left: 0, right: 0, height: '60vh',
          background: 'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(245,185,66,0.03) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />
      {/* The page card */}
      <div
        className="relative mx-auto my-16 rounded"
        style={{
          maxWidth: mode === 'screenplay' ? 720 : mode === 'poem' ? 640 : 800,
          background: '#111111',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.6)',
          minHeight: 'calc(100vh - 8rem)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Paper noise texture */}
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
            opacity: 0.4,
          }}
        />
        {/* Mode indicator top of page */}
        <div
          className="flex items-center gap-2 px-16 pt-8 pb-0"
          style={{ color: `${meta.color}66`, fontSize: 11, fontFamily: 'Inter, system-ui', letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          <span>{meta.emoji}</span>
          <span>{meta.label}</span>
          {mode === 'screenplay' && (
            <span className="ml-auto" style={{ color: 'rgba(245,185,66,0.3)' }}>
              Tab: cycle element type
            </span>
          )}
        </div>

        {/* Actual editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          data-element="action"
          style={getEditorStyle()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => (composingRef.current = true)}
          onCompositionEnd={() => { composingRef.current = false; handleInput(); }}
          data-placeholder={placeholders[mode]}
          className="pulp-editor"
        />
      </div>
    </div>
  );
}
