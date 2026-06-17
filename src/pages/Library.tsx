import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Clapperboard,
  Feather,
  Music,
  BookOpen,
  Plus,
  Search,
  Trash2,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { Wordmark } from "@/components/Logo";
import type { Document, WritingMode } from "@shared/types";
import { MODE_META } from "@shared/types";

const MODE_ICON: Record<WritingMode, any> = {
  screenplay: Clapperboard,
  poem: Feather,
  song: Music,
  prose: BookOpen,
};

const MODE_ACCENT: Record<WritingMode, string> = {
  screenplay: "text-amber-glow",
  poem: "text-emerald-300",
  song: "text-sky-300",
  prose: "text-rose-300",
};

export default function Library() {
  const [, navigate] = useLocation();
  const [docs, setDocs] = useState<Document[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState<WritingMode | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    try {
      setDocs(await api.list());
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create(mode: WritingMode) {
    setCreating(mode);
    try {
      const doc = await api.create({
        mode,
        title: "Untitled",
        content:
          mode === "screenplay"
            ? [{ id: crypto.randomUUID(), type: "scene", text: "" }]
            : [{ id: crypto.randomUUID(), text: "" }],
      });
      navigate(`/doc/${doc.id}`);
    } catch (e: any) {
      setError(e.message);
      setCreating(null);
    }
  }

  async function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const prev = docs;
    setDocs((d) => d?.filter((x) => x.id !== id) ?? null);
    try {
      await api.remove(id);
    } catch {
      setDocs(prev ?? null);
    }
  }

  const filtered =
    docs?.filter((d) => d.title.toLowerCase().includes(query.toLowerCase())) ?? null;

  return (
    <div className="studio-bg grain min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark />
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-ink-850 px-3.5 py-2 sm:flex">
            <Search className="h-4 w-4 text-ink-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your work…"
              className="w-56 bg-transparent text-sm text-white outline-none placeholder:text-ink-600"
              data-testid="input-search"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero */}
        <section className="fade-up py-14 sm:py-20">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-glow/20 bg-amber-glow/5 px-3 py-1 text-xs text-amber-glow">
            <Sparkles className="h-3.5 w-3.5" /> Free forever. No paywalls.
          </div>
          <h1 className="max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            The canvas where every <span className="text-amber-glow italic">script</span> begins.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
            Screenplays, poems, songs and prose — professionally formatted, endlessly,
            in one place. Everything the expensive tools charge for, open to everyone.
          </p>

          <button
            onClick={() => setShowNew((v) => !v)}
            className="btn-press mt-8 inline-flex items-center gap-2 rounded-full bg-amber-glow px-5 py-3 font-medium text-ink-950 hover:brightness-105"
            data-testid="button-new"
          >
            <Plus className="h-5 w-5" /> Start writing
          </button>
        </section>

        {/* Mode picker */}
        {(showNew || (docs && docs.length === 0)) && (
          <section className="fade-up mb-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(Object.keys(MODE_META) as WritingMode[]).map((mode) => {
              const Icon = MODE_ICON[mode];
              const meta = MODE_META[mode];
              return (
                <button
                  key={mode}
                  onClick={() => create(mode)}
                  disabled={creating !== null}
                  className="group btn-press relative overflow-hidden rounded-2xl border border-white/8 bg-ink-850 p-5 text-left transition hover:border-white/20 hover:bg-ink-800 disabled:opacity-60"
                  data-testid={`button-create-${mode}`}
                >
                  <div className={cn("mb-8 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink-800 ring-1 ring-white/5", MODE_ACCENT[mode])}>
                    {creating === mode ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="font-medium text-white">{meta.label}</div>
                  <div className="mt-1 text-xs leading-relaxed text-ink-600">{meta.tagline}</div>
                  <Plus className="absolute right-4 top-4 h-4 w-4 text-ink-600 opacity-0 transition group-hover:opacity-100" />
                </button>
              );
            })}
          </section>
        )}

        {/* Document grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-widest text-ink-600">
              Your work
            </h2>
            {docs && <span className="text-xs text-ink-600">{docs.length} document{docs.length !== 1 ? "s" : ""}</span>}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          {!docs && !error && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/5 bg-ink-850" />
              ))}
            </div>
          )}

          {filtered && filtered.length === 0 && docs && docs.length > 0 && (
            <p className="py-10 text-center text-sm text-ink-600">No documents match "{query}".</p>
          )}

          {filtered && filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((doc) => {
                const Icon = MODE_ICON[doc.mode] ?? FileText;
                const count = Array.isArray(doc.content) ? doc.content.length : 0;
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/doc/${doc.id}`)}
                    className="group fade-up btn-press relative cursor-pointer overflow-hidden rounded-2xl border border-white/8 bg-ink-850 p-5 transition hover:border-white/20 hover:bg-ink-800"
                    data-testid={`card-doc-${doc.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 ring-1 ring-white/5", MODE_ACCENT[doc.mode])}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <button
                        onClick={(e) => remove(doc.id, e)}
                        className="rounded-lg p-1.5 text-ink-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                        data-testid={`button-delete-${doc.id}`}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="mt-4 truncate font-serif text-lg text-white" data-testid={`text-title-${doc.id}`}>
                      {doc.title || "Untitled"}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-600">
                      <span className="capitalize">{doc.mode}</span>
                      <span className="text-ink-700">·</span>
                      <span>{count} block{count !== 1 ? "s" : ""}</span>
                      <span className="text-ink-700">·</span>
                      <span>{timeAgo(doc.updated_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
