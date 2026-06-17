import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ScreenplayElementType } from "@shared/types";
import {
  ELEMENT_ORDER,
  ELEMENT_LABELS,
  ELEMENT_SHORT,
  ELEMENT_NUMBER,
  COMMON_TRANSITIONS,
} from "@/lib/screenplay";
import { cn } from "@/lib/utils";

interface Props {
  activeType: ScreenplayElementType | null;
  onSetType: (t: ScreenplayElementType) => void;
  onInsertTransition: (text: string) => void;
}

export default function FormatToolbar({ activeType, onSetType, onInsertTransition }: Props) {
  const [transOpen, setTransOpen] = useState(false);

  return (
    <div className="flex flex-1 items-center gap-1">
      {ELEMENT_ORDER.filter((t) => t !== "transition").map((t) => {
        const active = activeType === t;
        return (
          <button
            key={t}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSetType(t);
            }}
            title={`${ELEMENT_LABELS[t]} · ⌥${ELEMENT_NUMBER[t]}`}
            className={cn(
              "btn-press flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
              active ? "bg-pulp-gold text-pulp-red-dark" : "text-pulp-gold/85 hover:bg-pulp-red-deep/80 hover:text-white"
            )}
            data-testid={`fmt-${t}`}
          >
            {ELEMENT_SHORT[t]}
            <span className={cn("text-[10px]", active ? "text-pulp-red" : "text-pulp-gold/60")}>
              ⌥{ELEMENT_NUMBER[t]}
            </span>
          </button>
        );
      })}

      {/* Transition — button + sibling dropdown (not nested) */}
      <div className="relative shrink-0">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSetType("transition");
            setTransOpen((v) => !v);
          }}
          title="Transition · ⌥6"
          className={cn(
            "btn-press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
            activeType === "transition"
              ? "bg-pulp-gold text-pulp-red-dark"
              : "text-pulp-gold/85 hover:bg-pulp-red-deep/80 hover:text-white"
          )}
          data-testid="fmt-transition"
        >
          {ELEMENT_SHORT.transition}
          <span className={cn("text-[10px]", activeType === "transition" ? "text-pulp-red" : "text-pulp-gold/60")}>
            ⌥6
          </span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>

        {transOpen && (
          <>
            <div className="fixed inset-0 z-40" onMouseDown={() => setTransOpen(false)} />
            <div className="absolute left-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-white/10 bg-pulp-red-deep/80 py-1 text-left shadow-2xl scale-in">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-pulp-gold/60">
                Insert transition
              </div>
              {COMMON_TRANSITIONS.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onInsertTransition(tr);
                    setTransOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left font-mono text-xs text-pulp-gold/85 hover:bg-pulp-red-deep hover:text-white"
                >
                  {tr}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
