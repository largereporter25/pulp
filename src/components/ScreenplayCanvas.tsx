import { useEffect, useRef, useCallback, useState } from "react";
import { nanoid } from "nanoid";
import { ChevronDown } from "lucide-react";
import type { ScreenplayElement, ScreenplayElementType } from "@shared/types";
import {
  styleFor,
  placeholderFor,
  ENTER_NEXT,
  TAB_CYCLE,
  autoDetect,
  ELEMENT_LABELS,
  ELEMENT_SHORT,
  ELEMENT_ORDER,
  ELEMENT_NUMBER,
} from "@/lib/screenplay";
import { cn } from "@/lib/utils";

interface Props {
  elements: ScreenplayElement[];
  onChange: (els: ScreenplayElement[]) => void;
  focusMode: boolean;
  registerType?: (fn: (t: ScreenplayElementType) => void) => void;
  onActiveTypeChange?: (t: ScreenplayElementType | null) => void;
}

export default function ScreenplayCanvas({
  elements,
  onChange,
  focusMode,
  registerType,
  onActiveTypeChange,
}: Props) {
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusId = useRef<string | null>(null);
  const activeId = useRef<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const newEl = (type: ScreenplayElementType, text = ""): ScreenplayElement => ({
    id: nanoid(8),
    type,
    text,
  });

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

  const setType = useCallback(
    (id: string, type: ScreenplayElementType) => {
      onChange(elements.map((e) => (e.id === id ? { ...e, type } : e)));
      focusId.current = id;
      onActiveTypeChange?.(type);
    },
    [elements, onChange, onActiveTypeChange]
  );

  // Expose a "set type of the active element" function to the parent toolbar.
  useEffect(() => {
    registerType?.((t: ScreenplayElementType) => {
      const id = activeId.current ?? elements[elements.length - 1]?.id;
      if (id) setType(id, t);
    });
  }, [registerType, setType, elements]);

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
    const idx = elements.findIndex((x) => x.id === el.id);

    // Element hotkeys: Ctrl/Cmd/Alt + 1..6 — bind all modifiers for reliability.
    if ((e.metaKey || e.ctrlKey || e.altKey) && /^[1-6]$/.test(e.key)) {
      e.preventDefault();
      const target = ELEMENT_ORDER.find((t) => ELEMENT_NUMBER[t] === parseInt(e.key, 10));
      if (target) setType(el.id, target);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const detected = autoDetect(el.text, el.type);
      if (detected && detected !== el.type) update(el.id, { type: detected });
      // double-Enter on empty action → stay (paragraph break)
      const nextType = ENTER_NEXT[detected ?? el.type];
      insertAfter(el.id, nextType);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nextType = e.shiftKey
        ? ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(el.type) + ELEMENT_ORDER.length - 1) % ELEMENT_ORDER.length]
        : TAB_CYCLE[el.type];
      setType(el.id, nextType);
      return;
    }

    if (e.key === "Backspace" && el.text === "" && elements.length > 1) {
      e.preventDefault();
      removeEl(el.id);
      return;
    }

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
        return (
          <div
            key={el.id}
            className="group/elem relative"
            style={{ marginTop: idx === 0 ? 0 : s.marginTop }}
          >
            {/* Per-line element control — click to change type (industry standard) */}
            {!focusMode && (
              <div className="absolute -left-[10.5rem] top-0 hidden w-40 items-start justify-end group-focus-within/elem:flex">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setMenuFor(menuFor === el.id ? null : el.id);
                  }}
                  className="flex items-center gap-1 rounded-md border border-white/10 bg-ink-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-glow/90 hover:bg-ink-700"
                >
                  {ELEMENT_SHORT[el.type]}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {menuFor === el.id && (
                  <>
                    <div className="fixed inset-0 z-20" onMouseDown={() => setMenuFor(null)} />
                    <div className="absolute right-0 top-7 z-30 w-44 overflow-hidden rounded-lg border border-white/10 bg-ink-800 py-1 shadow-2xl">
                      {ELEMENT_ORDER.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setType(el.id, t);
                            setMenuFor(null);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-ink-700",
                            t === el.type ? "text-amber-glow" : "text-ink-600 hover:text-white"
                          )}
                        >
                          {ELEMENT_LABELS[t]}
                          <span className="text-ink-700">⌥{ELEMENT_NUMBER[t]}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <textarea
              ref={(r) => {
                refs.current[el.id] = r;
                autosize(r);
              }}
              rows={1}
              value={el.text}
              spellCheck
              onFocus={() => {
                activeId.current = el.id;
                onActiveTypeChange?.(el.type);
              }}
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
    </div>
  );
}
