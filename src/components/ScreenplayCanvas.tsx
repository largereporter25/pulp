import { useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import type { ScreenplayElement, ScreenplayElementType } from "@shared/types";
import {
  styleFor,
  placeholderFor,
  ENTER_NEXT,
  TAB_CYCLE,
  autoDetect,
  ELEMENT_LABELS,
} from "@/lib/screenplay";
import { cn } from "@/lib/utils";

interface Props {
  elements: ScreenplayElement[];
  onChange: (els: ScreenplayElement[]) => void;
  focusMode: boolean;
}

const ALL_TYPES: ScreenplayElementType[] = [
  "scene",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
];

export default function ScreenplayCanvas({ elements, onChange, focusMode }: Props) {
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusId = useRef<string | null>(null);

  const newEl = (type: ScreenplayElementType, text = ""): ScreenplayElement => ({
    id: nanoid(8),
    type,
    text,
  });

  // autosize textareas
  const autosize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    Object.values(refs.current).forEach(autosize);
  });

  useEffect(() => {
    if (focusId.current && refs.current[focusId.current]) {
      const el = refs.current[focusId.current]!;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      focusId.current = null;
    }
  }, [elements]);

  const update = useCallback(
    (id: string, patch: Partial<ScreenplayElement>) => {
      onChange(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [elements, onChange]
  );

  const setType = (id: string, type: ScreenplayElementType) => {
    onChange(elements.map((e) => (e.id === id ? { ...e, type } : e)));
    focusId.current = id;
  };

  const insertAfter = (id: string, type: ScreenplayElementType) => {
    const idx = elements.findIndex((e) => e.id === id);
    const el = newEl(type);
    const next = [...elements.slice(0, idx + 1), el, ...elements.slice(idx + 1)];
    focusId.current = el.id;
    onChange(next);
  };

  const removeEl = (id: string) => {
    if (elements.length <= 1) return;
    const idx = elements.findIndex((e) => e.id === id);
    const prev = elements[idx - 1];
    const next = elements.filter((e) => e.id !== id);
    if (prev) focusId.current = prev.id;
    onChange(next);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, el: ScreenplayElement) => {
    // Element hotkeys ⌘/Ctrl + 1..6
    if ((e.metaKey || e.ctrlKey) && /^[1-6]$/.test(e.key)) {
      e.preventDefault();
      setType(el.id, ALL_TYPES[parseInt(e.key, 10) - 1]);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // auto-detect transitions/scene before moving on
      const detected = autoDetect(el.text, el.type);
      if (detected && detected !== el.type) update(el.id, { type: detected });
      const nextType = ENTER_NEXT[detected ?? el.type];
      insertAfter(el.id, nextType);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nextType = e.shiftKey
        ? ALL_TYPES[(ALL_TYPES.indexOf(el.type) + ALL_TYPES.length - 1) % ALL_TYPES.length]
        : TAB_CYCLE[el.type];
      setType(el.id, nextType);
      return;
    }

    if (e.key === "Backspace" && el.text === "" && elements.length > 1) {
      e.preventDefault();
      removeEl(el.id);
      return;
    }

    // Up/down navigation across elements at edges
    const idx = elements.findIndex((x) => x.id === el.id);
    if (e.key === "ArrowUp") {
      const ta = e.currentTarget;
      if (ta.selectionStart === 0 && idx > 0) {
        e.preventDefault();
        refs.current[elements[idx - 1].id]?.focus();
      }
    }
    if (e.key === "ArrowDown") {
      const ta = e.currentTarget;
      if (ta.selectionStart === ta.value.length && idx < elements.length - 1) {
        e.preventDefault();
        refs.current[elements[idx + 1].id]?.focus();
      }
    }
  };

  return (
    <div className="script-font">
      {elements.map((el, idx) => {
        const s = styleFor(el.type);
        const isActive = true;
        return (
          <div
            key={el.id}
            className="group/elem relative"
            style={{ marginTop: idx === 0 ? 0 : s.marginTop }}
          >
            {/* element type tag on hover */}
            {!focusMode && (
              <span className="pointer-events-none absolute -left-[8.5rem] top-1 hidden w-32 select-none text-right text-[10px] uppercase tracking-widest text-ink-600 group-focus-within/elem:block">
                {ELEMENT_LABELS[el.type]}
              </span>
            )}
            <textarea
              ref={(r) => {
                refs.current[el.id] = r;
                autosize(r);
              }}
              rows={1}
              value={el.text}
              spellCheck
              onChange={(e) => {
                let v = e.target.value;
                if (s.uppercase) v = v.toUpperCase();
                update(el.id, { text: v });
              }}
              onKeyDown={(e) => handleKey(e, el)}
              placeholder={placeholderFor(el.type)}
              className="el-input"
              data-testid={`el-${el.type}-${idx}`}
              style={{
                marginLeft: s.marginLeft,
                marginRight: s.marginRight,
                textAlign: s.textAlign,
                fontWeight: s.bold ? 700 : 400,
                fontStyle: s.italic ? "italic" : "normal",
                color: s.color,
                textTransform: s.uppercase ? "uppercase" : "none",
              }}
            />
          </div>
        );
      })}

      {/* element type quick bar */}
      {!focusMode && (
        <div className="mt-10 flex flex-wrap gap-1.5 border-t border-white/5 pt-5">
          {ALL_TYPES.map((t, i) => (
            <span
              key={t}
              className="rounded-md border border-white/8 bg-ink-850 px-2 py-1 text-[11px] text-ink-600"
            >
              {ELEMENT_LABELS[t]} <span className="text-ink-700">⌘{i + 1}</span>
            </span>
          ))}
          <span className="rounded-md px-2 py-1 text-[11px] text-ink-600">
            Tab cycles · Enter continues
          </span>
        </div>
      )}
    </div>
  );
}
