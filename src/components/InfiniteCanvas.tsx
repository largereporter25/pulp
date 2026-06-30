import React, { useRef, useState, useCallback, useEffect } from "react";
import { CanvasCard } from "../lib/api";

const MODE_COLORS: Record<string, string> = {
  screenplay: "#f5b942", prose: "#7eb8d4",
  poem: "#c084fc", song: "#4ade80", notes: "#fb923c",
};
const MODE_ICONS: Record<string, string> = {
  screenplay: "🎬", prose: "📖", poem: "📜", song: "🎵", notes: "📝",
};

interface Props {
  cards: CanvasCard[];
  onOpen: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
}

export default function InfiniteCanvas({ cards, onOpen, onPositionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const p: Record<string, { x: number; y: number }> = {};
    cards.forEach(c => { p[c.id] = { x: c.x, y: c.y }; });
    setPositions(p);
  }, [cards]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setPanning(true);
      panStart.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
    }
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (panning) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      setTransform(t => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
    }
    if (dragging) {
      const dx = (e.clientX - dragStart.current.mx) / transform.scale;
      const dy = (e.clientY - dragStart.current.my) / transform.scale;
      setPositions(prev => ({
        ...prev,
        [dragging]: { x: dragStart.current.cx + dx, y: dragStart.current.cy + dy },
      }));
    }
  }, [panning, dragging, transform.scale]);

  const onMouseUp = useCallback(() => {
    if (panning) setPanning(false);
    if (dragging) {
      const pos = positions[dragging];
      if (pos) onPositionChange(dragging, pos.x, pos.y);
      setDragging(null);
    }
  }, [panning, dragging, positions, onPositionChange]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(2.5, t.scale * delta)) }));
    } else {
      setTransform(t => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const startCardDrag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    const pos = positions[id] || { x: 0, y: 0 };
    setDragging(id);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: pos.x, cy: pos.y };
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%", overflow: "hidden",
        position: "relative",
        cursor: panning ? "grabbing" : "default",
        background: "#0d0d0d",
        backgroundImage: "radial-gradient(circle, rgba(245,185,66,0.16) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 900, height: 600, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(245,185,66,0.04) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute",
        transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
        transformOrigin: "0 0", willChange: "transform",
      }}>
        {cards.map(card => {
          const pos = positions[card.id] || { x: 0, y: 0 };
          const color = MODE_COLORS[card.mode] || "#f5b942";
          const isDragging = dragging === card.id;
          return (
            <div
              key={card.id}
              style={{
                position: "absolute", left: pos.x, top: pos.y,
                width: 220, background: "#111111",
                border: `1px solid rgba(255,255,255,0.07)`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 6, padding: "14px 16px",
                cursor: isDragging ? "grabbing" : "grab",
                boxShadow: isDragging
                  ? `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px ${color}40`
                  : "0 4px 24px rgba(0,0,0,0.5)",
                transform: isDragging ? "scale(1.03)" : "scale(1)",
                transition: isDragging ? "none" : "box-shadow 0.15s, transform 0.15s",
                zIndex: isDragging ? 1000 : 1,
                userSelect: "none",
              }}
              onMouseDown={e => startCardDrag(e, card.id)}
              onDoubleClick={() => onOpen(card.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: "1rem" }}>{MODE_ICONS[card.mode] || "📄"}</span>
                <span style={{
                  color: "#f0ece0", fontFamily: "Inter, sans-serif",
                  fontSize: "0.82rem", fontWeight: 500,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 155,
                }}>{card.title || "Untitled"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  background: `${color}22`, color,
                  fontSize: "0.62rem", padding: "2px 6px",
                  borderRadius: 3, fontFamily: "Inter, sans-serif",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{card.mode}</span>
                {card.word_count > 0 && (
                  <span style={{ color: "rgba(240,236,224,0.4)", fontSize: "0.62rem", fontFamily: "Inter, sans-serif" }}>
                    {card.word_count.toLocaleString()}w
                  </span>
                )}
              </div>
              {card.updated_at && (
                <div style={{ color: "rgba(240,236,224,0.22)", fontSize: "0.58rem", marginTop: 8, fontFamily: "Inter, sans-serif" }}>
                  {new Date(card.updated_at).toLocaleDateString()}
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: "0.6rem", color: "rgba(245,185,66,0.4)", fontFamily: "Inter, sans-serif" }}>
                double-click to open
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div style={{
        position: "absolute", bottom: 24, left: 24,
        display: "flex", gap: 6, alignItems: "center",
        background: "rgba(26,8,0,0.85)",
        border: "1px solid rgba(245,185,66,0.2)",
        borderRadius: 8, padding: "4px 12px",
        backdropFilter: "blur(8px)",
      }}>
        <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.1) }))}
          style={{ background: "none", border: "none", color: "#f5b942", cursor: "pointer", fontSize: "1rem" }}>−</button>
        <span style={{ color: "rgba(240,236,224,0.5)", fontFamily: "Inter", fontSize: "0.7rem", minWidth: 36, textAlign: "center" }}>
          {Math.round(transform.scale * 100)}%
        </span>
        <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(2.5, t.scale + 0.1) }))}
          style={{ background: "none", border: "none", color: "#f5b942", cursor: "pointer", fontSize: "1rem" }}>+</button>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          style={{ background: "none", border: "none", color: "rgba(245,185,66,0.4)", cursor: "pointer", fontSize: "0.62rem", marginLeft: 4, fontFamily: "Inter" }}>reset</button>
      </div>

      {/* Minimap */}
      <div style={{
        position: "absolute", bottom: 24, right: 24,
        width: 130, height: 90, background: "rgba(13,13,13,0.85)",
        border: "1px solid rgba(245,185,66,0.12)",
        borderRadius: 8, overflow: "hidden", backdropFilter: "blur(8px)",
      }}>
        {cards.map(card => {
          const pos = positions[card.id] || { x: 0, y: 0 };
          return (
            <div key={card.id} style={{
              position: "absolute",
              left: Math.max(2, Math.min(122, (pos.x / 2000) * 130)),
              top: Math.max(2, Math.min(82, (pos.y / 1500) * 90)),
              width: 8, height: 6,
              background: MODE_COLORS[card.mode] || "#f5b942",
              borderRadius: 1, opacity: 0.65,
            }} />
          );
        })}
        <div style={{
          position: "absolute", bottom: 3, left: 0, right: 0,
          textAlign: "center", color: "rgba(245,185,66,0.25)",
          fontFamily: "Inter", fontSize: "0.52rem",
        }}>minimap</div>
      </div>
    </div>
  );
}
