import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import type { Document } from '../lib/api';
import type { WritingMode } from '../types';
import { MODE_META } from '../types';
import WritingEditor from '../components/WritingEditor';

interface Props {
  docId: string;
  onBack: () => void;
}

type SaveState = 'saved' | 'saving' | 'unsaved';

export default function Editor({ docId, onBack }: Props) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [focusMode, setFocusMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getDocument(docId).then(setDoc).catch(console.error);
  }, [docId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === '.') { e.preventDefault(); setFocusMode(f => !f); }
      if (mod && e.key === 'e') { e.preventDefault(); setShowExport(s => !s); }
      if (mod && e.key === 's') { e.preventDefault(); if (doc) persistDoc(doc); }
      if (e.key === 'Escape') { setFocusMode(false); setShowExport(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc]);

  const persistDoc = useCallback(async (d: Document) => {
    setSaveState('saving');
    try {
      await api.updateDocument(d.id, { title: d.title, content: d.content, word_count: d.word_count });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, []);

  const handleChange = useCallback((content: string, wordCount: number) => {
    if (!doc) return;
    const updated = { ...doc, content, word_count: wordCount };
    setDoc(updated);
    setSaveState('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistDoc(updated), 1500);
  }, [doc, persistDoc]);

  const handleTitleChange = useCallback((title: string) => {
    if (!doc) return;
    const updated = { ...doc, title };
    setDoc(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistDoc(updated), 1500);
  }, [doc, persistDoc]);

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0d0d0d' }}>
        <div style={{ color: 'rgba(245,185,66,0.3)', fontFamily: 'Inter' }}>Loading...</div>
      </div>
    );
  }

  const meta = MODE_META[doc.mode as WritingMode] || MODE_META.prose;

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: '#0d0d0d', fontFamily: meta.font }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 transition-opacity duration-300"
        style={{
          height: 48,
          background: '#1a0800',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          opacity: focusMode ? 0 : 1,
          position: 'relative',
          zIndex: 20,
        }}
        onMouseEnter={focusMode ? () => {} : undefined}
      >
        <button
          className="text-sm transition-colors btn-press"
          style={{ color: 'rgba(245,185,66,0.5)', fontFamily: 'Inter' }}
          onClick={onBack}
        >
          ← Canvas
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

        <span style={{ fontSize: 16 }}>{meta.emoji}</span>

        {titleEditing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#f0ece0', fontFamily: 'Inter', maxWidth: 400 }}
            value={doc.title}
            onChange={e => handleTitleChange(e.target.value)}
            onBlur={() => setTitleEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setTitleEditing(false)}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: '#f0ece0', fontFamily: 'Inter', maxWidth: 400 }}
            onClick={() => setTitleEditing(true)}
          >
            {doc.title || 'Untitled'}
          </span>
        )}

        <div className="flex-1" />

        {/* Save state */}
        <div
          className="text-xs transition-opacity duration-500"
          style={{
            color: saveState === 'saved' ? 'rgba(74,222,128,0.6)' : saveState === 'saving' ? 'rgba(245,185,66,0.6)' : 'rgba(255,100,100,0.6)',
            fontFamily: 'Inter',
            opacity: saveState === 'saved' ? 0.6 : 1,
          }}
        >
          {saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? '◌ Saving...' : '● Unsaved'}
        </div>

        {/* Focus mode */}
        <button
          className="text-xs px-2 py-1 rounded transition-all btn-press"
          style={{
            background: focusMode ? 'rgba(245,185,66,0.15)' : 'transparent',
            color: focusMode ? '#f5b942' : 'rgba(245,185,66,0.4)',
            border: '1px solid rgba(245,185,66,0.15)',
            fontFamily: 'Inter',
          }}
          onClick={() => setFocusMode(f => !f)}
          title="Focus Mode (⌘.)" 
        >
          ⌘.
        </button>

        {/* Export */}
        <div className="relative">
          <button
            className="text-xs px-3 py-1.5 rounded transition-all btn-press"
            style={{
              background: 'rgba(245,185,66,0.1)',
              border: '1px solid rgba(245,185,66,0.2)',
              color: '#f5b942',
              fontFamily: 'Inter',
            }}
            onClick={() => setShowExport(s => !s)}
          >
            Export ▾
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0" style={{ zIndex: 29 }} onClick={() => setShowExport(false)} />
              <div
                className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden"
                style={{
                  background: '#1a0800',
                  border: '1px solid rgba(245,185,66,0.2)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                  zIndex: 30,
                  minWidth: 180,
                }}
              >
                {(['pdf', 'fountain', 'docx', 'txt'] as const).map(fmt => (
                  <a
                    key={fmt}
                    href={api.exportUrl(doc.id, fmt)}
                    download
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: '#f0ece0', fontFamily: 'Inter' }}
                    onClick={() => setShowExport(false)}
                  >
                    <span style={{ color: meta.color }}>
                      {fmt === 'pdf' ? '📄' : fmt === 'fountain' ? '⛲' : fmt === 'docx' ? '📝' : '📋'}
                    </span>
                    <span>.{fmt}</span>
                    {fmt === 'fountain' && doc.mode !== 'screenplay' && (
                      <span style={{ color: 'rgba(240,236,224,0.3)', fontSize: 10 }}>screenplay only</span>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Editor */}
      <WritingEditor
        docId={doc.id}
        mode={doc.mode as WritingMode}
        content={doc.content}
        onChange={handleChange}
        focusMode={focusMode}
      />

      {/* Footer status bar */}
      <footer
        className="flex items-center justify-between px-6 transition-opacity duration-300"
        style={{
          height: 32,
          background: '#1a0800',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
          opacity: focusMode ? 0 : 1,
          fontSize: 11,
          fontFamily: 'Inter, system-ui',
          color: 'rgba(240,236,224,0.35)',
          zIndex: 20,
        }}
      >
        <div className="flex gap-3 items-center">
          <span style={{ color: meta.color }}>{meta.emoji} {meta.label}</span>
          <span>·</span>
          <span>⌘. Focus</span>
          <span>·</span>
          <span>⌘E Export</span>
        </div>
        <div className="flex gap-3">
          <span>{doc.word_count} words</span>
          {doc.mode === 'screenplay' && <span>~{Math.max(1, Math.round(doc.word_count / 170))} pages</span>}
          <span>·</span>
          <span>Tab: next element</span>
        </div>
      </footer>
    </div>
  );
}
