import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  Loader2,
  Download,
  FileText,
  Film,
  Maximize2,
  Minimize2,
  Cloud,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import ScreenplayCanvas from "@/components/ScreenplayCanvas";
import FreeformCanvas from "@/components/FreeformCanvas";
import { estimatePages } from "@/lib/screenplay";
import { toFountain, toPlainText, download, printPDF } from "@/lib/export";
import type { Document, ScreenplayElement, TextBlock } from "@shared/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function Editor() {
  const [, params] = useRoute("/doc/:id");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [focusMode, setFocusMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Document | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(id)
      .then((d) => {
        setDoc(d);
        latest.current = d;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSave("saving");
    saveTimer.current = setTimeout(async () => {
      const d = latest.current;
      if (!d) return;
      try {
        await api.update(d.id, {
          title: d.title,
          content: d.content as ScreenplayElement[] | TextBlock[],
        });
        setSave("saved");
        setTimeout(() => setSave((s) => (s === "saved" ? "idle" : s)), 1800);
      } catch (e: any) {
        setError(e.message);
        setSave("error");
      }
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

  // keyboard: cmd+s save now, cmd+. focus mode
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        scheduleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setFocusMode((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [scheduleSave]);

  if (error) {
    return (
      <div className="studio-bg grain flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-rose-300">{error}</p>
        <button onClick={() => navigate("/")} className="text-amber-glow underline">
          Back to library
        </button>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="studio-bg grain flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-600" />
      </div>
    );
  }

  // stats
  const plain = toPlainText(doc);
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  const pages =
    doc.mode === "screenplay"
      ? estimatePages(doc.content as ScreenplayElement[])
      : Math.max(1, Math.round((words / 250) * 10) / 10);

  return (
    <div className="studio-bg grain min-h-screen">
      {/* Top bar */}
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl transition-opacity",
          focusMode && "opacity-0 hover:opacity-100"
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="btn-press rounded-lg p-2 text-ink-600 hover:bg-ink-850 hover:text-white"
            data-testid="button-back"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Logo size={24} />
          <input
            value={doc.title === "Untitled" ? "" : doc.title}
            onChange={(e) => patch({ title: e.target.value || "Untitled" })}
            placeholder="Untitled"
            className="min-w-0 flex-1 bg-transparent font-serif text-lg text-white outline-none placeholder:text-ink-600"
            data-testid="input-title"
          />

          {/* save indicator */}
          <div className="hidden items-center gap-1.5 text-xs text-ink-600 sm:flex">
            {save === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving
              </>
            )}
            {save === "saved" && (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Saved
              </>
            )}
            {(save === "idle" || save === "error") && (
              <>
                <Cloud className="h-3.5 w-3.5" /> {save === "error" ? "Retry pending" : "Synced"}
              </>
            )}
          </div>

          <button
            onClick={() => setFocusMode((v) => !v)}
            className="btn-press rounded-lg p-2 text-ink-600 hover:bg-ink-850 hover:text-white"
            data-testid="button-focus"
            aria-label="Focus mode"
          >
            {focusMode ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="btn-press flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-sm text-white hover:bg-ink-800"
              data-testid="button-export"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-ink-850 py-1 shadow-2xl scale-in">
                  <button
                    onClick={() => {
                      printPDF(doc);
                      setExportOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-600 hover:bg-ink-800 hover:text-white"
                    data-testid="export-pdf"
                  >
                    <FileText className="h-4 w-4" /> Print / PDF
                  </button>
                  {doc.mode === "screenplay" && (
                    <button
                      onClick={() => {
                        download(`${doc.title || "screenplay"}.fountain`, toFountain(doc));
                        setExportOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-600 hover:bg-ink-800 hover:text-white"
                      data-testid="export-fountain"
                    >
                      <Film className="h-4 w-4" /> Fountain (.fountain)
                    </button>
                  )}
                  <button
                    onClick={() => {
                      download(`${doc.title || "document"}.txt`, toPlainText(doc));
                      setExportOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-600 hover:bg-ink-800 hover:text-white"
                    data-testid="export-txt"
                  >
                    <Download className="h-4 w-4" /> Plain text (.txt)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* The Canvas */}
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-8">
        <div
          className={cn(
            "page-surface mx-auto rounded-xl px-8 py-12 transition-all sm:px-16 sm:py-16",
            focusMode ? "max-w-3xl" : "max-w-4xl"
          )}
          style={{ minHeight: "70vh" }}
        >
          {doc.mode === "screenplay" ? (
            <div className="mx-auto" style={{ maxWidth: "64ch", paddingLeft: focusMode ? 0 : "8.5rem" }}>
              <ScreenplayCanvas
                elements={doc.content as ScreenplayElement[]}
                onChange={(els) => patch({ content: els })}
                focusMode={focusMode}
              />
            </div>
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

      {/* Status bar */}
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-ink-950/85 backdrop-blur-xl transition-opacity",
          focusMode && "opacity-0 hover:opacity-100"
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-2.5 text-xs text-ink-600">
          <span className="capitalize">{doc.mode}</span>
          <div className="flex items-center gap-5">
            <span>{words.toLocaleString()} words</span>
            <span>~{pages} {doc.mode === "screenplay" ? "pages" : "pages"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
