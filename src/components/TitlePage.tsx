import type { TitlePage as TP } from "@shared/types";

interface Props {
  value: TP;
  onChange: (tp: TP) => void;
  docTitle: string;
}

const field =
  "w-full bg-transparent text-center outline-none placeholder:text-pulp-gold/45 caret-pulp-gold";

export default function TitlePage({ value, onChange, docTitle }: Props) {
  const set = (k: keyof TP, v: string) => onChange({ ...value, [k]: v });

  return (
    <div className="script-font flex min-h-[60vh] flex-col items-center justify-center py-16">
      <div className="w-full max-w-lg space-y-2 text-center">
        <input
          value={value.title || ""}
          onChange={(e) => set("title", e.target.value.toUpperCase())}
          placeholder={(docTitle || "TITLE").toUpperCase()}
          className={`${field} text-2xl font-bold uppercase tracking-wide text-white`}
          data-testid="tp-title"
        />
        <div className="py-6 text-sm text-pulp-gold/60">written by</div>
        <input
          value={value.author || ""}
          onChange={(e) => set("author", e.target.value)}
          placeholder="Author Name"
          className={`${field} text-lg text-pulp-gold/90`}
          data-testid="tp-author"
        />
        <input
          value={value.basedOn || ""}
          onChange={(e) => set("basedOn", e.target.value)}
          placeholder="based on… (optional)"
          className={`${field} pt-6 text-sm italic text-pulp-gold/70`}
          data-testid="tp-basedon"
        />
      </div>

      <div className="mt-24 w-full max-w-lg space-y-1.5 text-left">
        <input
          value={value.draftDate || ""}
          onChange={(e) => set("draftDate", e.target.value)}
          placeholder="Draft date"
          className="w-full bg-transparent text-left text-xs text-pulp-gold/75 outline-none placeholder:text-pulp-gold/45 caret-pulp-gold"
          data-testid="tp-date"
        />
        <textarea
          value={value.contact || ""}
          onChange={(e) => set("contact", e.target.value)}
          placeholder={"Contact\nemail · phone · representation"}
          rows={3}
          className="w-full resize-none bg-transparent text-left text-xs text-pulp-gold/75 outline-none placeholder:text-pulp-gold/45 caret-pulp-gold"
          data-testid="tp-contact"
        />
      </div>
    </div>
  );
}
