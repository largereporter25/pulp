import type { ScreenplayElement } from "@shared/types";

interface Props {
  elements: ScreenplayElement[];
  onJump: (idx: number) => void;
}

export default function ScriptSidebar({ elements, onJump }: Props) {
  const scenes = elements
    .map((el, idx) => ({ ...el, idx }))
    .filter((el) => el.type === "scene");

  const characters = Array.from(
    new Set(elements.filter((el) => el.type === "character" && el.text.trim()).map((el) => el.text.trim()))
  );

  return (
    <aside className="doc-sidebar">
      <div>
        <div className="mono-label mb-2 text-[10px] text-pulp-gold/50">Scenes ({scenes.length})</div>
        {scenes.length === 0 && (
          <p className="text-[11px] text-pulp-gold/30">No scene headings yet.</p>
        )}
        <ul className="space-y-1">
          {scenes.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onJump(s.idx)}
                className="w-full truncate rounded px-2 py-1 text-left text-[11px] text-pulp-gold/70 hover:bg-pulp-red-deep/60 hover:text-white"
              >
                {s.text || "(untitled scene)"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mono-label mb-2 text-[10px] text-pulp-gold/50">Characters ({characters.length})</div>
        {characters.length === 0 && (
          <p className="text-[11px] text-pulp-gold/30">No characters yet.</p>
        )}
        <ul className="space-y-1">
          {characters.map((c) => (
            <li key={c} className="truncate rounded px-2 py-1 text-[11px] text-pulp-gold/70">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
