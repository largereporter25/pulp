import { useRef, useState, useCallback, useEffect } from 'react';
import type { CanvasDoc } from '../lib/api';
import { MODE_META } from '../types';
import type { WritingMode } from '../types';

interface Props {
  documents: CanvasDoc[];
  onOpen: (id: string) => void;
  onCreate: (mode: WritingMode, x: number, y: number) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

const GRID_SIZE = 32;

export default function InfiniteCanvas({ documents, onOpen, onCreate, onMove, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showModeMenu, setShowModeMenu] = useState<{ x: number; y: number } | null>(null);

  // Pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (dragId) {
      const nx = (e.clientX - offset.x - dragOffset.x) / scale;
      const ny = (e.clientY - offset.y - dragOffset.y) / scale;
      onMove(dragId, nx, ny);
    }
  }, [isPanning, panStart, dragId, offset, scale, dragOffset, onMove]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragId(null);
  }, []);

  // Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(2, Math.max(0.3, s * delta)));
    } else {
      setOffset(o => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
    }
  }, []);

  // Double-click to create
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.doc-card')) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const cx = (e.clientX - rect.left - offset.x) / scale;
    const cy = (e.clientY - rect.top - offset.y) / scale;
    setShowModeMenu({ x: e.clientX, y: e.clientY });
    // Store canvas coords for creation
    (window as any).__pendingCanvasCreate = { x: cx, y: cy };
  }, [offset, scale]);

  // Card drag start
  const startDrag = useCallback((e: React.MouseEvent, id: string, cardX: number, cardY: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const cx = cardX * scale + offset.x;
    const cy = cardY * scale + offset.y;
    setDragId(id);
    setDragOffset({ x: e.clientX - cx, y: e.clientY - cy });
  }, [scale, offset]);

  // Minimap
  const minimapDocs = documents.slice(0, 50);
  const minX = Math.min(0, ...minimapDocs.map(d => d.x));
  const maxX = Math.max(800, ...minimapDocs.map(d => d.x + 240));
  const minY = Math.min(0, ...minimapDocs.map(d => d.y));
  const maxY = Math.max(600, ...minimapDocs.map(d => d.y + 140));
  const mmW = 120, mmH = 80;

  const modes: WritingMode[] = ['screenplay', 'prose', 'poem', 'song', 'notes'];

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none"
      style={{ background: 'transparent', cursor: isPanning ? 'grabbing' : dragId ? 'grabbing' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(244,171,17,0.16) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundPosition: `${offset.x % (GRID_SIZE * scale)}px ${offset.y % (GRID_SIZE * scale)}px`,
        }}
      />

      {/* Canvas transform layer */}
      <div
        className="absolute"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {documents.map(doc => {
          const meta = MODE_META[doc.mode as WritingMode] || MODE_META.prose;
          return (
            <div
              key={doc.id}
              className="doc-card absolute group"
              style={{
                left: doc.x,
                top: doc.y,
                width: 240,
                cursor: dragId === doc.id ? 'grabbing' : 'grab',
              }}
              onMouseDown={e => startDrag(e, doc.id, doc.x, doc.y)}
            >
              <div
                className="rounded-lg p-4 transition-all duration-150 group-hover:scale-105"
                style={{
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${meta.color}`,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(245,185,66,0.15)', color: '#f5b942' }}
                      onClick={e => { e.stopPropagation(); onOpen(doc.id); }}
                    >
                      Open
                    </button>
                    <button
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,50,50,0.15)', color: '#ff6464' }}
                      onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div
                  className="font-semibold truncate mb-1"
                  style={{ color: '#f0ece0', fontFamily: 'Inter, system-ui', fontSize: 13 }}
                  onDoubleClick={e => { e.stopPropagation(); onOpen(doc.id); }}
                >
                  {doc.title || 'Untitled'}
                </div>
                <div className="flex gap-2 items-center" style={{ color: 'rgba(240,236,224,0.4)', fontSize: 11 }}>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span>{doc.word_count} words</span>
                </div>
                <div style={{ color: 'rgba(240,236,224,0.25)', fontSize: 10, marginTop: 4 }}>
                  {new Date(doc.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div
        className="absolute bottom-4 left-4 flex gap-2 items-center"
        style={{ zIndex: 10 }}
      >
        {[['−', 0.9], ['100%', 1], ['+', 1.1]].map(([label, factor]) => (
          <button
            key={String(label)}
            className="px-2 py-1 rounded text-xs font-mono transition-all"
            style={{
              background: '#1a0800',
              border: '1px solid rgba(245,185,66,0.2)',
              color: '#f5b942',
            }}
            onClick={() =>
              label === '100%'
                ? setScale(1)
                : setScale(s => Math.min(2, Math.max(0.3, s * (factor as number))))
            }
          >
            {label === '100%' ? `${Math.round(scale * 100)}%` : label}
          </button>
        ))}
        <button
          className="px-2 py-1 rounded text-xs"
          style={{ background: '#1a0800', border: '1px solid rgba(245,185,66,0.2)', color: 'rgba(245,185,66,0.5)' }}
          onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); }}
        >
          Reset
        </button>
      </div>

      {/* Minimap */}
      {documents.length > 0 && (
        <div
          className="absolute bottom-4 right-4"
          style={{
            width: mmW,
            height: mmH,
            background: 'rgba(17,17,17,0.85)',
            border: '1px solid rgba(245,185,66,0.15)',
            borderRadius: 6,
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {minimapDocs.map(doc => {
            const meta = MODE_META[doc.mode as WritingMode] || MODE_META.prose;
            const mx = ((doc.x - minX) / (maxX - minX)) * mmW;
            const my = ((doc.y - minY) / (maxY - minY)) * mmH;
            return (
              <div
                key={doc.id}
                className="absolute"
                style={{
                  left: mx,
                  top: my,
                  width: 8,
                  height: 5,
                  background: meta.color,
                  borderRadius: 1,
                  opacity: 0.7,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Mode picker popover */}
      {showModeMenu && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 19 }}
            onClick={() => setShowModeMenu(null)}
          />
          <div
            className="fixed rounded-xl overflow-hidden"
            style={{
              left: showModeMenu.x,
              top: showModeMenu.y,
              background: '#1a0800',
              border: '1px solid rgba(245,185,66,0.2)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              zIndex: 20,
              minWidth: 200,
            }}
          >
            <div className="px-3 py-2" style={{ color: 'rgba(240,236,224,0.4)', fontSize: 11 }}>New document</div>
            {(['screenplay','prose','poem','song','notes'] as WritingMode[]).map(mode => {
              const m = MODE_META[mode];
              return (
                <button
                  key={mode}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{ color: '#f0ece0', fontFamily: 'Inter, system-ui', fontSize: 13 }}
                  onClick={() => {
                    const p = (window as any).__pendingCanvasCreate || { x: 100, y: 100 };
                    onCreate(mode, p.x, p.y);
                    setShowModeMenu(null);
                  }}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: `${m.color}22`, color: m.color }}>
                    {mode}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none"
        style={{ color: 'rgba(245,185,66,0.18)', fontSize: 12, fontFamily: 'Inter, system-ui', zIndex: 1 }}
      >
        Double-click anywhere to create · Alt+drag to pan · Ctrl+scroll to zoom
      </div>
    </div>
  );
}
