import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Clapperboard, Feather, Music, BookOpen, Plus, Trash2, FileText,
  Loader2, ArrowDown, Minus, RotateCcw, StickyNote,
} from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Wordmark } from "@/components/Logo";
import AsciiFish from "@/components/AsciiFish";
import CommandPalette from "@/components/CommandPalette";
import type { Document, WritingMode, CanvasCard } from "@shared/types";
import { MODE_META } from "@shared/types";

const MODE_ICON: Record<WritingMode, any> = {
  screenplay: Clapperboard,
  poem: Feather,
  song: Music,
  prose: BookOpen,
  notes: StickyNote,
};

const MODE_COLOR: Record<WritingMode, string> = {
  screenplay: "#f5b942",
  prose: "#7eb8d4",
  poem: "#c084fc",
  song: "#4ade80",
  notes: "#fb923c",
};

const INITIAL_POSITIONS: Record<WritingMode, { x: number; y: number }> = {
  screenplay: { x: 100, y: 120 },
  prose:      { x: 360, y: 200 },
  poem:       { x: 200, y: 380 },
  song:       { x: 500, y: 130 },
  notes:      { x: 650, y: 300 },
};

export default function Library() {
  const [, navigate] = useLocation();
  const [docs, setDocs] = useState<Document[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<WritingMode | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Canvas state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);
  const dragCard = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({});
  const newCardRef = useRef<string | null>(null);

  async function load() {
    try {
      const d = await api.list();
      setDocs(d);
      // init positions if not set
      const pos: Record<string, { x: number; y: number }> = {};
      let col = 0;
      d.forEach((doc) => {
        pos[doc.id] = {
          x: (doc.canvas_x ?? 0) || 80 + (col % 4) * 260,
          y: (doc.canvas_y ?? 0) || 80 + Math.floor(col / 4) * 200,
        };
        col++;
      });
      setCardPositions(pos);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  // Keyboard shortcut Cmd+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  async function create(mode: WritingMode) {
    setCreating(mode);
    try {
      const doc = await api.create({
        mode,
        title: "Untitled",
        content: mode === "screenplay"
          ? [{ id: crypto.randomUUID(), type: "scene", text: "" }]
          : [{ id: crypto.randomUUID(), text: "" }],
      });
      newCardRef.current = doc.id;
      // position new card near center of current view
      const cx = (window.innerWidth / 2 - transform.x) / transform.scale - 110;
      const cy = (window.innerHeight / 2 - transform.y) / transform.scale - 80;
      setCardPositions((prev) => ({ ...prev, [doc.id]: { x: cx, y: cy } }));
      setDocs((prev) => (prev ? [doc, ...prev] : [doc]));
      setShowNew(false);
      navigate(`/doc/${doc.id}`);
    } catch (e: any) { setError(e.message); setCreating(null); }
  }

  async function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const prev = docs;
    setDocs((d) => d?.filter((x) => x.id !== id) ?? null);
    try { await api.remove(id); } catch { setDocs(prev ?? null); }
  }

  // ── Panning ──
  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && !isDraggingCard)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  }, [transform, isDraggingCard]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (panStart.current && isPanning && !isDraggingCard) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      setTransform((t) => ({ ...t, x: panStart.current!.tx + dx, y: panStart.current!.ty + dy }));
    }
    if (dragCard.current) {
      const dx = (e.clientX - dragCard.current.startX) / transform.scale;
      const dy = (e.clientY - dragCard.current.startY) / transform.scale;
      setCardPositions((prev) => ({
        ...prev,
        [dragCard.current!.id]: {
          x: dragCard.current!.origX + dx,
          y: dragCard.current!.origY + dy,
        },
      }));
    }
  }, [isPanning, isDraggingCard, transform.scale]);

  const onCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingCard && dragCard.current) {
      const id = dragCard.current.id;
      const pos = cardPositions[id];
      if (pos) api.update(id, { canvas_x: pos.x, canvas_y: pos.y }).catch(() => {});
    }
    setIsPanning(false);
    setIsDraggingCard(false);
    dragCard.current = null;
    panStart.current = null;
  }, [isDraggingCard, cardPositions]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      setTransform((t) => {
        const newScale = Math.min(2, Math.max(0.3, t.scale * factor));
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { ...t, scale: newScale };
        const ox = e.clientX - rect.left;
        const oy = e.clientY - rect.top;
        return {
          scale: newScale,
          x: ox - (ox - t.x) * (newScale / t.scale),
          y: oy - (oy - t.y) * (newScale / t.scale),
        };
      });
    } else {
      setTransform((t) => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
    }
  }, []);

  const onCardPointerDown = (e: React.PointerEvent, doc: Document) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    dragCard.current = {
      id: doc.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: cardPositions[doc.id]?.x ?? 0,
      origY: cardPositions[doc.id]?.y ?? 0,
    };
    setIsDraggingCard(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const scalePercent = Math.round(transform.scale * 100);

  return (
    <div
      ref={canvasRef}
      className={`pulp-canvas ${isPanning ? "panning" : ""}`}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onWheel={onWheel}
    >
      {/* Top nav */}
      <header className="absolute left-0 right-0 top-0 z-40" style={{ background: "rgba(26,8,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 px-5 py-3">
          <Wordmark size={22} />
          <div className="flex-1" />
          <button
            onClick={() => setCmdOpen(true)}
            className="mono-label btn-press flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] text-pulp-gold/60 hover:text-pulp-gold"
          >
            ⌘K Search
          </button>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="mono-label btn-press flex items-center gap-1.5 rounded-full border border-pulp-gold/40 bg-pulp-gold/10 px-4 py-2 text-[10px] font-semibold text-pulp-gold hover:bg-pulp-gold hover:text-pulp-red"
            data-testid="button-new"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
      </header>

      {/* Mode picker popover */}
      {showNew && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowNew(false)} />
          <div className="fixed right-5 top-14 z-40 w-48 overflow-hidden rounded-xl border border-white/10 bg-pulp-red-deep/90 py-1 shadow-2xl scale-in">
            {(Object.keys(MODE_META) as WritingMode[]).map((mode) => {
              const Icon = MODE_ICON[mode];
              return (
                <button
                  key={mode}
                  onClick={() => create(mode)}
                  disabled={creating !== null}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-pulp-gold/70 hover:bg-pulp-red-deep hover:text-white disabled:opacity-50"
                  data-testid={`button-create-${mode}`}
                >
                  {creating === mode
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Icon className="h-4 w-4" style={{ color: MODE_COLOR[mode] }} />
                  }
                  {MODE_META[mode].label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Canvas surface */}
      <div
        className="canvas-surface"
        style={{ transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})` }}
      >
        {/* Document cards */}
        {docs?.map((doc) => {
          const Icon = MODE_ICON[doc.mode] ?? FileText;
          const pos = cardPositions[doc.id] ?? { x: 100, y: 100 };
          const isNew = newCardRef.current === doc.id;
          return (
            <div
              key={doc.id}
              className={`doc-card ${isNew ? "card-drop" : ""}`}
              style={{
                left: pos.x,
                top: pos.y,
                borderLeftColor: MODE_COLOR[doc.mode],
              }}
              onPointerDown={(e) => onCardPointerDown(e, doc)}
              onDoubleClick={() => navigate(`/doc/${doc.id}`)}
              data-testid={`card-doc-${doc.id}`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px]"
                  style={{
                    background: `${MODE_COLOR[doc.mode]}20`,
                    color: MODE_COLOR[doc.mode],
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  <Icon className="h-2.5 w-2.5" /> {doc.mode}
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => remove(doc.id, e)}
                  className="rounded p-1 text-pulp-gold/30 hover:text-pulp-gold/80"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <h4 className="mt-3 truncate font-serif text-base leading-tight text-pulp-gold">
                {doc.title || "Untitled"}
              </h4>
              <div
                className="mt-2 text-[10px]"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "rgba(245,185,66,0.45)" }}
              >
                {doc.word_count ?? 0} words · {timeAgo(doc.updated_at)}
              </div>
            </div>
          );
        })}

        {/* Manifesto text watermark on canvas */}
        {docs !== null && docs.length === 0 && (
          <div style={{ position: "absolute", left: 120, top: 220, maxWidth: 480, userSelect: "none", pointerEvents: "none" }}>
            <h2 className="pulp-headline" style={{ fontSize: "3rem", opacity: 0.18 }}>Write something true.</h2>
          </div>
        )}
      </div>

      {/* Swimming fish — shown when < 3 docs */}
      {docs !== null && docs.length < 3 && (
        <AsciiFish swim className="" />
      )}

      {/* Empty state hero */}
      {docs !== null && docs.length === 0 && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="mono-label text-[11px] text-pulp-gold/40 mb-4">Double-click a card to open · Drag to reposition · Ctrl+scroll to zoom</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-xl border border-pulp-gold/30 bg-pulp-red-deep/80 px-4 py-2 text-sm text-pulp-gold">{error}</div>
      )}

      {/* Zoom controls */}
      <div className="fixed bottom-5 left-5 z-50 flex items-center gap-1.5">
        <button onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale * 0.85) }))} className="btn-press flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-pulp-red-dark/80 text-pulp-gold/60 hover:text-pulp-gold"><Minus className="h-3 w-3" /></button>
        <span className="mono-label min-w-[44px] text-center text-[10px] text-pulp-gold/50">{scalePercent}%</span>
        <button onClick={() => setTransform((t) => ({ ...t, scale: Math.min(2, t.scale * 1.18) }))} className="btn-press flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-pulp-red-dark/80 text-pulp-gold/60 hover:text-pulp-gold"><Plus className="h-3 w-3" /></button>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} className="btn-press ml-1 flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-pulp-red-dark/80 text-pulp-gold/60 hover:text-pulp-gold"><RotateCcw className="h-3 w-3" /></button>
      </div>

      {/* Minimap */}
      {docs && docs.length > 0 && (
        <div className="minimap">
          <svg width="120" height="80" style={{ width: "100%", height: "100%" }}>
            {docs.map((doc) => {
              const pos = cardPositions[doc.id] ?? { x: 0, y: 0 };
              const mx = (pos.x / 3000) * 120;
              const my = (pos.y / 2000) * 80;
              return (
                <circle
                  key={doc.id}
                  cx={Math.min(115, Math.max(5, mx))}
                  cy={Math.min(75, Math.max(5, my))}
                  r={4}
                  fill={MODE_COLOR[doc.mode]}
                  opacity={0.7}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNewDoc={(mode) => create(mode)}
      />
    </div>
  );
}
