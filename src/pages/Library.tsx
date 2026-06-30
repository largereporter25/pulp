import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { CanvasDoc } from '../lib/api';
import type { WritingMode } from '../types';
import { MODE_META } from '../types';
import InfiniteCanvas from '../components/InfiniteCanvas';
import LivingFish from '../components/LivingFish';

interface Props {
  onOpen: (id: string) => void;
}

export default function Library({ onOpen }: Props) {
  const [docs, setDocs] = useState<CanvasDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const loadDocs = useCallback(async () => {
    try {
      const state = await api.getCanvasState();
      setDocs(state.documents);
    } catch (err) {
      console.error('Failed to load canvas state', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCreate = useCallback(async (mode: WritingMode, x: number, y: number) => {
    try {
      const doc = await api.createDocument({ title: 'Untitled', mode, canvas_x: x, canvas_y: y });
      setDocs(prev => [...prev, {
        id: doc.id, title: doc.title, mode: doc.mode,
        x: doc.canvas_x, y: doc.canvas_y,
        word_count: 0, page_count: 0, updated_at: doc.updated_at,
      }]);
      onOpen(doc.id);
    } catch (err) {
      console.error('Failed to create document', err);
    }
  }, [onOpen]);

  const handleMove = useCallback(async (id: string, x: number, y: number) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, x, y } : d));
    // Debounce persist
    clearTimeout((window as any).__moveDebounce);
    (window as any).__moveDebounce = setTimeout(() => {
      api.updateCanvasPositions([{ id, x, y }]).catch(console.error);
    }, 600);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await api.deleteDocument(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  }, []);

  return (
    <div
      className="w-screen h-screen flex flex-col"
      style={{
        background:
          'radial-gradient(120% 90% at 22% 18%, rgba(255,120,60,0.20), transparent 48%),' +
          'radial-gradient(90% 80% at 80% 60%, rgba(160,20,0,0.30), transparent 55%),' +
          '#c81d05',
      }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6"
        style={{
          height: 48,
          background: 'rgba(120,14,2,0.55)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(244,171,17,0.18)',
          flexShrink: 0,
          zIndex: 30,
          position: 'relative',
        }}
      >
        <div
          className="font-bold tracking-wider text-lg"
          style={{ color: '#f5b942', fontFamily: 'Inter, system-ui', letterSpacing: '0.2em' }}
        >
          PULP
        </div>

        <div className="flex-1" />

        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm"
          style={{
            background: 'rgba(245,185,66,0.08)',
            border: '1px solid rgba(245,185,66,0.15)',
            color: 'rgba(240,236,224,0.5)',
            fontFamily: 'Inter, system-ui',
          }}
          onClick={() => setShowSearch(true)}
        >
          <span>⌕</span>
          <span>Search</span>
          <span className="text-xs opacity-50">⌘K</span>
        </button>

        {/* New doc button */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all btn-press"
            style={{
              background: '#f5b942',
              color: '#0d0d0d',
              fontFamily: 'Inter, system-ui',
            }}
            onClick={() => {
              (window as any).__pendingCanvasCreate = { x: 100 + Math.random() * 400, y: 100 + Math.random() * 200 };
              const modes: WritingMode[] = ['screenplay','prose','poem','song','notes'];
              const mode = modes[0];
              handleCreate(mode, (window as any).__pendingCanvasCreate.x, (window as any).__pendingCanvasCreate.y);
            }}
          >
            + New
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div style={{ color: 'rgba(245,185,66,0.4)', fontFamily: 'Inter', fontSize: 14 }}>Loading canvas...</div>
          </div>
        ) : (
          <>
            <LivingFish />
            <InfiniteCanvas
              documents={docs}
              onOpen={onOpen}
              onCreate={handleCreate}
              onMove={handleMove}
              onDelete={handleDelete}
            />
            {docs.length === 0 && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ zIndex: 5 }}
              >
                <div
                  className="text-6xl font-bold tracking-widest mb-4"
                  style={{ color: 'rgba(245,185,66,0.08)', fontFamily: 'Inter, system-ui' }}
                >
                  PULP
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'rgba(245,185,66,0.25)', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
                >
                  Double-click the canvas to begin your first document
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search modal */}
      {showSearch && (
        <div
          className="fixed inset-0 flex items-start justify-center pt-24"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setShowSearch(false); }}
        >
          <div
            className="w-full max-w-lg rounded-xl overflow-hidden"
            style={{
              background: '#1a0800',
              border: '1px solid rgba(245,185,66,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            <input
              autoFocus
              className="w-full px-5 py-4 text-base bg-transparent outline-none"
              style={{ color: '#f0ece0', fontFamily: 'Inter, system-ui', borderBottom: '1px solid rgba(245,185,66,0.1)' }}
              placeholder="Search documents..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <SearchResults q={searchQ} onOpen={(id) => { onOpen(id); setShowSearch(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResults({ q, onOpen }: { q: string; onOpen: (id: string) => void }) {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.search(q).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (!results.length && q) {
    return <div className="px-5 py-4 text-sm" style={{ color: 'rgba(240,236,224,0.3)', fontFamily: 'Inter' }}>No results</div>;
  }

  return (
    <div>
      {results.map(r => {
        const meta = MODE_META[r.mode as WritingMode] || MODE_META.prose;
        return (
          <button
            key={r.id}
            className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/5 transition-colors"
            onClick={() => onOpen(r.id)}
          >
            <span>{meta.emoji}</span>
            <div>
              <div style={{ color: '#f0ece0', fontFamily: 'Inter', fontSize: 13 }}>{r.title}</div>
              <div style={{ color: 'rgba(240,236,224,0.35)', fontSize: 11 }}>{r.snippet?.slice(0, 80)}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
