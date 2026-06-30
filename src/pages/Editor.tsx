import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Check, Loader2, Download, FileText, Film,
  Maximize2, Minimize2, Cloud, FileSignature, Clapperboard,
  PanelRight, PanelRightClose,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import ScreenplayCanvas from "@/components/ScreenplayCanvas";
import FreeformCanvas from "@/components/FreeformCanvas";
import FormatToolbar from "@/components/FormatToolbar";
import TitlePageView from "@/components/TitlePage";
import ScriptSidebar from "@/components/ScriptSidebar";
import CommandPalette from "@/components/CommandPalette";
import { estimatePages } from "@/lib/screenplay";
import { toFountain, toPlainText, download, printPDF } from "@/lib/export";
import type {
  Document, ScreenplayElement, ScreenplayElementType,
  TextBlock, TitlePage,
} from "@shared/types";
import { nanoid } from "nanoid";

type SaveState = "idle" | "saving" | "saved" | "error";
const EMPTY_TP: TitlePage = { title: "", author: "", basedOn: "", contact: "", draftDate: "" };

function parseTP(synopsis: string): TitlePage {
  try { const o = JSON.parse(synopsis || "{}"); return { ...EMPTY_TP, ...o }; }
  catch { return EMPTY_TP; }
}

export default function Editor() {
  const [, params] = useRoute("/doc/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [doc, setDoc] = useState<Document | null>(null);
  const [tp, setTp] = useState<TitlePage>(EMPTY_TP);
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [focusMode, setFocusMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState<"title" | "script">("script");
  const [activeType, setActiveType] = useState<ScreenplayElementType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Document | null>(null);
  const setTypeFn = useRef<((t: ScreenplayElementType) => void) | null>(null);
  const elRefs = useRef<Record<number, HTMLElement | null>>({});

  useEffect(() => {
    if (!id) return;
    api.get(id)
      .then((d) => { setDoc(d); latest.current = d; setTp(parseTP(d.synopsis)); })
      .catch((e) => setError(e.message));
  }, [id]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSave("saving");
    saveTimer.current = setTimeout(async () => {
      const d = latest.current;
      if (!d) return;
      try {
        await api.update(d.id, { title: d.title, content: d.content as any, synopsis: d.synopsis });
        setSave("saved");
        setTimeout(() => setSave((s) => (s === "saved" ? "idle" : s)), 1800);
      } catch (e: any) { setError(e.message); setSave("error"); }
    }, 700);
  }, []);

  const patch = (p: Partial<Document>) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...p };
      latest.current = next;
      return next;
    });
    scheduleSave();
  };

  const updateTP = (next: TitlePage) => {
    setTp(next);
    patch({ synopsis: JSON.stringify(next) });
  };

  const insertTransition = (text: string) => {
    if (!doc || doc.mode !== "screenplay") return;
    const els = doc.content as ScreenplayElement[];
    const next: ScreenplayElement[] = [
      ...els,
      { id: nanoid(8), type: "transition", text },
      { id: nanoid(8), type: "scene", text: "" },
    ];
    patch({ content: next });
  };

  const jumpToScene = (idx: number) => {
    const el = elRefs.current[idx];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); scheduleSave(); }
      if ((e.metaKey || e.ctrlKey) && e.key === ".") { e.preventDefault(); setFocusMode((v) => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); setSidebarOpen((v) => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [scheduleSave]);

  if (error) return (
    <div className="pulp-bg flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-rose-300">{error}</p>
      <button onClick={() => navigate("/")} className="text-pulp-gold underline">Back to library</button>
    </div>
  );

  if (!doc) return (
    <div className="pulp-bg flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-pulp-gold/60" />
    </div>
  );

  const isScript = doc.mode === "screenplay";
  const plain = toPlainText(doc);
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  const pages = isScript
    ? estimatePages(doc.content as ScreenplayElement[])
    : Math.max(1, Math.round((words / 250) * 10) / 10);

  const exportDoc: Document = { ...doc, title: tp.title || doc.title };
  const maxW = isScript ? "max-w-3xl" : "max-w-[720px]";

  return (
    <div className="pulp-bg min-h-screen flex flex-col">
      <div className="page-glow" />

      {/* Top bar */}
      <header className={cn(
        "sticky top-0 z-30 border-b border-white/5 bg-pulp-red-dark/85 backdrop-blur-xl transition-opacity",
        focusMode && "opacity-0 hover:opacity-100"
      )}>
        <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="btn-press rounded-lg p-2 text-pulp-gold/60 hover:bg-pulp-red-deep/60 hover:text-white" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Logo size={22} />
          <input
            value={doc.title === "Untitled" ? "" : doc.title}
            onChange={(e) => patch({ title: e.target.value || "Untitled" })}
            placeholder="Untitled"
            className="min-w-0 flex-1 bg-transparent font-serif text-lg text-white outline-none placeholder:text-pulp-gold/60"
          />
          <div className="hidden items-center gap-1.5 text-xs text-pulp-gold/60 sm:flex">
            {save === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving</>}
            {save === "saved"  && <><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved</>}
            {(save === "idle" || save === "error") && <><Cloud className="h-3.5 w-3.5" /> {save === "error" ? "Retry pending" : "Synced"}</>}
          </div>
          {isScript && (
            <button onClick={() => setSidebarOpen((v) => !v)} className="btn-press rounded-lg p-2 text-pulp-gold/60 hover:bg-pulp-red-deep/60 hover:text-white" aria-label="Sidebar">
              {sidebarOpen ? <PanelRightClose className="h-[18px] w-[18px]" /> : <PanelRight className="h-[18px] w-[18px]" />}
            </button>
          )}
          <button onClick={() => setFocusMode((v) => !v)} className="btn-press rounded-lg p-2 text-pulp-gold/60 hover:bg-pulp-red-deep/60 hover:text-white" aria-label="Focus">
            {focusMode ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
          </button>
          <div className="relative">
            <button onClick={() => setExportOpen((v) => !v)} className="btn-press flex items-center gap-1.5 rounded-lg border border-white/10 bg-pulp-red-deep/60 px-3 py-2 text-sm text-white hover:bg-pulp-red-deep/80">
              <Download className="h-4 w-4" /> Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-pulp-red-deep/60 py-1 shadow-2xl scale-in">
                  <button onClick={() => { printPDF(exportDoc, tp); setExportOpen(false); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-pulp-gold/60 hover:bg-pulp-red-deep/80 hover:text-white">
                    <FileText className="h-4 w-4" /> Print / PDF
                  </button>
                  {isScript && (
                    <button onClick={() => { download(`${exportDoc.title || "screenplay"}.fountain`, toFountain(exportDoc, tp)); setExportOpen(false); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-pulp-gold/60 hover:bg-pulp-red-deep/80 hover:text-white">
                      <Film className="h-4 w-4" /> Fountain (.fountain)
                    </button>
                  )}
                  <button onClick={() => { download(`${exportDoc.title || "document"}.txt`, toPlainText(doc)); setExportOpen(false); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-pulp-gold/60 hover:bg-pulp-red-deep/80 hover:text-white">
                    <Download className="h-4 w-4" /> Plain text (.txt)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {isScript && !focusMode && (
          <div className="border-t border-white/5">
            <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-2">
              <div className="flex items-center rounded-lg border border-white/10 bg-pulp-red-deep/60 p-0.5">
                <button onClick={() => setView("title")} className={cn("btn-press flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition", view === "title" ? "bg-pulp-red-deep text-white" : "text-pulp-gold/60 hover:text-white")}>
                  <FileSignature className="h-3.5 w-3.5" /> Title Page
                </button>
                <button onClick={() => setView("script")} className={cn("btn-press flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition", view === "script" ? "bg-pulp-red-deep text-white" : "text-pulp-gold/60 hover:text-white")}>
                  <Clapperboard className="h-3.5 w-3.5" /> Script
                </button>
              </div>
              <div className="h-5 w-px bg-white/10" />
              {view === "script" && <FormatToolbar activeType={activeType} onSetType={(t) => setTypeFn.current?.(t)} onInsertTransition={insertTransition} />}
            </div>
          </div>
        )}
      </header>

      {/* Body: canvas + optional sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 pb-32 pt-8">
          <div className={cn("page-surface mx-auto px-8 py-12 sm:px-16 sm:py-16", maxW, focusMode ? "max-w-3xl" : "")} style={{ minHeight: "70vh" }}>
            {isScript ? (
              view === "title" ? (
                <TitlePageView value={tp} onChange={updateTP} docTitle={doc.title} />
              ) : (
                <div className={cn("mx-auto", focusMode ? "pl-0" : "pl-0 sm:pl-36")} style={{ maxWidth: "62ch" }}>
                  <ScreenplayCanvas
                    elements={doc.content as ScreenplayElement[]}
                    onChange={(els) => patch({ content: els })}
                    focusMode={focusMode}
                    registerType={(fn) => (setTypeFn.current = fn)}
                    onActiveTypeChange={setActiveType}
                  />
                  {!focusMode && (
                    <div className="mt-10 border-t border-white/5 pt-4 text-[11px] text-pulp-gold/60">
                      <span className="text-pulp-gold/75">Tab</span> cycles element ·{" "}
                      <span className="text-pulp-gold/75">Enter</span> continues ·{" "}
                      <span className="text-pulp-gold/75">⌥1–6</span> sets type
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="mx-auto max-w-2xl">
                <FreeformCanvas
                  mode={doc.mode}
                  blocks={doc.content as TextBlock[]}
                  onChange={(b) => patch({ content: b })}
                  focusMode={focusMode}
                />
              </div>
            )}
          </div>
        </main>

        {/* Screenplay sidebar */}
        {isScript && sidebarOpen && !focusMode && (
          <ScriptSidebar
            elements={doc.content as ScreenplayElement[]}
            onJump={jumpToScene}
          />
        )}
      </div>

      {/* Footer */}
      <footer className={cn(
        "fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-pulp-red-dark/85 backdrop-blur-xl transition-opacity",
        focusMode && "opacity-0 hover:opacity-100"
      )}>
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-5 py-2.5 text-xs text-pulp-gold/60">
          <span className="capitalize">{doc.mode}{isScript && view === "title" ? " · Title Page" : ""}</span>
          <div className="flex items-center gap-5">
            <span>{words.toLocaleString()} words</span>
            <span>~{pages} pages</span>
          </div>
        </div>
      </footer>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNewDoc={async (mode) => {
          const d = await api.create({ mode, title: "Untitled", content: mode === "screenplay" ? [{ id: nanoid(8), type: "scene", text: "" }] : [{ id: nanoid(8), text: "" }] });
          navigate(`/doc/${d.id}`);
        }}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />
    </div>
  );
}
