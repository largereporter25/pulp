import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "wouter";
import { api, CanvasCard } from "../lib/api";
import InfiniteCanvas from "../components/InfiniteCanvas";
import AsciiFish from "../components/AsciiFish";

const MODES = [
  { id: "screenplay", label: "Screenplay", icon: "🎬" },
  { id: "prose", label: "Prose", icon: "📖" },
  { id: "poem", label: "Poem", icon: "📜" },
  { id: "song", label: "Song", icon: "🎵" },
  { id: "notes", label: "Notes", icon: "📝" },
];

export default function Library() {
  const [, navigate] = useNavigate();
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const loadCanvas = useCallback(async () => {
    try {
      const state = await api.getCanvasState();
      setCards(state.documents);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCanvas(); }, [loadCanvas]);

  const createDoc = async (mode: string) => {
    setShowNewMenu(false);
    const idx = cards.length;
    const doc = await api.createDocument({
      title: "Untitled", mode: mode as any,
      canvas_x: 120 + (idx % 4) * 280,
      canvas_y: 120 + Math.floor(idx / 4) * 220,
    });
    navigate(`/doc/${doc.id}`);
  };

  const handlePositionChange = useCallback(async (id: string, x: number, y: number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
    await api.updateCanvasPositions([{ id, x, y }]);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) { loadCanvas(); return; }
    const results = await api.search(searchQuery);
    setCards(results.map(d => ({
      id: d.id, title: d.title, mode: d.mode,
      x: d.canvas_x, y: d.canvas_y,
      word_count: d.word_count, page_count: d.page_count,
      tags: d.tags, updated_at: d.updated_at,
    })));
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#0d0d0d" }}>
      <header style={{
        height: 48, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
        background: "#1a0800",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0, zIndex: 100, position: "relative",
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic", fontWeight: 700,
          fontSize: "1.3rem", color: "#f5b942",
          letterSpacing: "0.03em", userSelect: "none",
        }}>Pulp</div>

        {showSearch ? (
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 400, margin: "0 24px" }}>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setShowSearch(false); }}
              placeholder="Search your writing..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(245,185,66,0.3)",
                borderRadius: 6, padding: "6px 12px",
                color: "#f0ece0", fontFamily: "Inter, sans-serif", fontSize: "0.82rem",
                outline: "none",
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            style={{
              flex: 1, maxWidth: 400, margin: "0 24px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6, padding: "6px 14px",
              color: "rgba(240,236,224,0.3)",
              fontFamily: "Inter, sans-serif", fontSize: "0.82rem",
              cursor: "text", textAlign: "left",
            }}>⌘K  Search...</button>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", position: "relative" }}>
          <button
            onClick={() => setShowNewMenu(m => !m)}
            style={{
              background: "#f5b942", color: "#1a0800",
              border: "none", borderRadius: 6,
              padding: "6px 16px", fontFamily: "Inter, sans-serif",
              fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
            }}>+ New</button>

          {showNewMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#1a0800",
              border: "1px solid rgba(245,185,66,0.2)",
              borderRadius: 10, overflow: "hidden",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              minWidth: 180, zIndex: 200,
              animation: "scaleIn 0.15s ease-out",
            }}>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => createDoc(m.id)}
                  style={{
                    display: "block", width: "100%",
                    background: "none", border: "none",
                    textAlign: "left", padding: "10px 16px",
                    color: "#f0ece0", fontFamily: "Inter, sans-serif",
                    fontSize: "0.85rem", cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,185,66,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  {m.icon}  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {loading ? (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(245,185,66,0.4)", fontFamily: "Inter, sans-serif", fontSize: "0.85rem",
          }}>Loading your canvas...</div>
        ) : (
          <>
            {cards.length < 4 && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <AsciiFish />
              </div>
            )}
            {cards.length === 0 && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                pointerEvents: "none", gap: 16, zIndex: 1,
              }}>
                <div style={{
                  color: "rgba(245,185,66,0.35)",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic", fontSize: "1.5rem",
                }}>The canvas is empty.</div>
                <div style={{
                  color: "rgba(240,236,224,0.18)",
                  fontFamily: "Inter, sans-serif", fontSize: "0.82rem",
                }}>Press + New to begin writing.</div>
              </div>
            )}
            <InfiniteCanvas
              cards={cards}
              onOpen={id => navigate(`/doc/${id}`)}
              onPositionChange={handlePositionChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
