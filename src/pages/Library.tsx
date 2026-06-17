import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Clapperboard,
  Feather,
  Music,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Loader2,
  ArrowDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Wordmark } from "@/components/Logo";
import AsciiFish from "@/components/AsciiFish";
import type { Document, WritingMode } from "@shared/types";
import { MODE_META } from "@shared/types";

const MODE_ICON: Record<WritingMode, any> = {
  screenplay: Clapperboard,
  poem: Feather,
  song: Music,
  prose: BookOpen,
};

export default function Library() {
  const [, navigate] = useLocation();
  const [docs, setDocs] = useState<Document[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const scrollToWork = () =>
    document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="pulp-bg min-h-screen">
      {/* Top nav */}
      <header className="absolute left-0 right-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 sm:px-10">
          <Wordmark size={26} />
          <button
            onClick={scrollToWork}
            className="mono-label btn-press text-[11px] text-pulp-gold/70 hover:text-pulp-gold"
            data-testid="nav-work"
          >
            Your Work ↓
          </button>
        </div>
      </header>

      {/* ===== HERO (pulp.to manifesto) ===== */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 sm:px-10">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Headline */}
          <div className="fade-up">
            <h1 className="pulp-headline text-[3.2rem] sm:text-[4.5rem] lg:text-[5rem]">
              creative
              <br />
              infrastructure
              <br />
              for the world.
            </h1>
          </div>
          {/* ASCII fish */}
          <div className="hidden justify-center lg:flex">
            <AsciiFish />
          </div>
        </div>

        {/* bottom-left lab line */}
        <div className="mono-label absolute bottom-8 left-6 text-[11px] text-pulp-gold/70 sm:left-10">
          Pulp is a media + AI lab.
        </div>
        <button
          onClick={scrollToWork}
          className="btn-press absolute bottom-8 right-6 hidden items-center gap-2 text-pulp-gold/60 hover:text-pulp-gold sm:right-10 sm:flex"
          data-testid="scroll-down"
        >
          <span className="mono-label text-[11px]">Start writing</span>
          <ArrowDown className="h-4 w-4" />
        </button>
      </section>

      {/* ===== Manifesto quote (Ideas are like fish) ===== */}
      <section className="px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="pulp-headline mb-10 text-[2.6rem] sm:text-[3.6rem]">
            Ideas are like fish.
          </h2>
          <div className="space-y-6 font-serif text-lg leading-relaxed text-pulp-gold/90 sm:text-xl">
            <p>
              If you want to catch little fish, you can stay in the shallow water. But if you
              want to catch the big fish, you've got to go deeper. Down deep, the fish are more
              powerful and more pure.
            </p>
            <p>
              An idea is a thought that holds more than you think it does when you receive it.
              But in that first moment there is a spark — enough to get you started, because
              whatever follows is a process of action and reaction.
            </p>
            <p>Stay true to yourself. Let your voice ring out, and don't let anybody fiddle with it.</p>
            <p className="font-serif text-base italic text-pulp-gold/60">
              — David Lynch, <span className="not-italic">Catching the Big Fish</span>
            </p>
          </div>
        </div>
      </section>

      {/* ===== Your Work / Library ===== */}
      <section id="work" className="border-t border-pulp-gold/15 px-6 pb-28 pt-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mono-label mb-2 text-[11px] text-pulp-gold/60">Your Work</div>
              <h3 className="pulp-headline text-[2rem] sm:text-[2.6rem]">Write something true.</h3>
            </div>
            <button
              onClick={() => setShowNew((v) => !v)}
              className="mono-label btn-press flex items-center gap-2 rounded-full border border-pulp-gold/40 bg-pulp-gold/10 px-5 py-2.5 text-[11px] font-semibold text-pulp-gold hover:bg-pulp-gold hover:text-pulp-red"
              data-testid="button-new"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          </div>

          {/* Mode picker */}
          {(showNew || (docs && docs.length === 0)) && (
            <div className="fade-up mb-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(Object.keys(MODE_META) as WritingMode[]).map((mode) => {
                const Icon = MODE_ICON[mode];
                const meta = MODE_META[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => create(mode)}
                    disabled={creating !== null}
                    className="group btn-press relative overflow-hidden rounded-2xl border border-pulp-gold/25 bg-pulp-red-deep/40 p-5 text-left transition hover:border-pulp-gold/60 hover:bg-pulp-red-deep/70 disabled:opacity-60"
                    data-testid={`button-create-${mode}`}
                  >
                    <div className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-pulp-gold/25 text-pulp-gold">
                      {creating === mode ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="font-serif text-lg text-pulp-gold">{meta.label}</div>
                    <div className="mono-label mt-1.5 text-[10px] leading-relaxed text-pulp-gold/55">
                      {meta.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-pulp-gold/30 bg-pulp-red-deep/50 p-4 text-sm text-pulp-gold">
              {error}
            </div>
          )}

          {!docs && !error && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl border border-pulp-gold/15 bg-pulp-red-deep/30"
                />
              ))}
            </div>
          )}

          {docs && docs.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc) => {
                const Icon = MODE_ICON[doc.mode] ?? FileText;
                const count = Array.isArray(doc.content) ? doc.content.length : 0;
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/doc/${doc.id}`)}
                    className="group fade-up btn-press relative cursor-pointer overflow-hidden rounded-2xl border border-pulp-gold/25 bg-pulp-red-deep/40 p-5 transition hover:border-pulp-gold/60 hover:bg-pulp-red-deep/70"
                    data-testid={`card-doc-${doc.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pulp-gold/25 text-pulp-gold">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <button
                        onClick={(e) => remove(doc.id, e)}
                        className="rounded-lg p-1.5 text-pulp-gold/40 opacity-0 transition hover:bg-pulp-gold/10 hover:text-pulp-gold group-hover:opacity-100"
                        data-testid={`button-delete-${doc.id}`}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h4
                      className="mt-4 truncate font-serif text-xl text-pulp-gold"
                      data-testid={`text-title-${doc.id}`}
                    >
                      {doc.title || "Untitled"}
                    </h4>
                    <div className="mono-label mt-2 flex items-center gap-2 text-[10px] text-pulp-gold/55">
                      <span>{doc.mode}</span>
                      <span>·</span>
                      <span>{count} block{count !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{timeAgo(doc.updated_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="mx-auto mt-24 max-w-[1400px] border-t border-pulp-gold/15 pt-8">
          <div className="mono-label flex items-center justify-between text-[10px] text-pulp-gold/45">
            <span>Pulp © {new Date().getFullYear()}</span>
            <span>Free, forever.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
