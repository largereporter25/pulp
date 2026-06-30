import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import type { Document, WritingMode } from "@shared/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onNewDoc: (mode: WritingMode) => void;
  onToggleFocus?: () => void;
}

const STATIC_COMMANDS = [
  { label: "New Screenplay",   action: "new:screenplay" },
  { label: "New Prose",        action: "new:prose" },
  { label: "New Poem",         action: "new:poem" },
  { label: "New Song",         action: "new:song" },
  { label: "New Notes",        action: "new:notes" },
  { label: "Toggle Focus Mode",action: "focus" },
];

export default function CommandPalette({ open, onClose, onNewDoc, onToggleFocus }: Props) {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [active, setActive] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setDocs([]); return; }
    const t = setTimeout(() => {
      api.search(query).then(setDocs).catch(() => setDocs([]));
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const staticFiltered = STATIC_COMMANDS.filter((c) =>
    !query.trim() || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const items = [
    ...docs.map((d) => ({ label: d.title || "Untitled", sub: d.mode, action: `doc:${d.id}` })),
    ...staticFiltered.map((c) => ({ label: c.label, sub: "", action: c.action })),
  ];

  const exec = (action: string) => {
    onClose();
    if (action.startsWith("doc:")) { navigate(`/doc/${action.slice(4)}`); return; }
    if (action.startsWith("new:")) { onNewDoc(action.slice(4) as WritingMode); return; }
    if (action === "focus") { onToggleFocus?.(); return; }
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter" && items[active]) { exec(items[active].action); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (!open) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-white/5 px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search documents or type a command…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-pulp-gold/40"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-pulp-gold/40">No results</div>
          )}
          {items.map((item, i) => (
            <div
              key={item.action + i}
              className={`cmd-item ${i === active ? "active" : ""}`}
              onClick={() => exec(item.action)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="flex-1 truncate">{item.label}</span>
              {item.sub && (
                <span className="ml-2 text-[10px] uppercase tracking-widest text-pulp-gold/40">{item.sub}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
