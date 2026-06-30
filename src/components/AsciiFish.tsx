import { useMemo, useEffect, useRef, useState, useCallback } from "react";

const MASK = [
  "                                        ##  ",
  "                  ####            ####  ##  ",
  "              ###########      #########    ",
  "           ################  ###############",
  "         ###########################     ###",
  "       ################################      ",
  "     #####################################   ",
  "   ###  #####################################",
  "  ##      ###################################",
  " ##   ##  ###################################",
  "  ##      ###################################",
  "   ###  #####################################",
  "     #####################################   ",
  "       ################################      ",
  "         ###########################     ###",
  "           ################  ###############",
  "              ###########      #########    ",
  "                  ####            ####  ##  ",
  "                                        ##  ",
];

const WORD = "pulp ";

const LYNCH_QUOTES = [
  "Ideas are like fish. If you want to catch little fish, you can stay in the shallow water. But if you want to catch the big fish, you've got to go deeper.",
  "Desire for an idea is like bait. When you're fishing, you have to have patience.",
  "The more you dive inward, the richer the ocean gets.",
  "Intuition is the key to everything, in painting, filmmaking, business — everything.",
  "Staying true to yourself and your ideas is the most important thing.",
  "Negativity is the enemy of creativity.",
  "Keep your eye on the donut, not on the hole.",
];

function buildFish(): string {
  let wi = 0;
  return MASK.map((row) =>
    row.split("").map((c) => {
      if (c === "#") { const ch = WORD[wi++ % WORD.length]; return ch === " " ? "·" : ch; }
      wi++; return " ";
    }).join("")
  ).join("\n");
}

export default function AsciiFish({ className = "", swim = false }: { className?: string; swim?: boolean }) {
  const art = useMemo(buildFish, []);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const pausePosRef = useRef({ x: -200, y: 0 });
  const [pos, setPos] = useState({ x: -200, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [modalQuote, setModalQuote] = useState<string | null>(null);

  const animate = useCallback((ts: number) => {
    if (!startRef.current) startRef.current = ts;
    if (pausedRef.current) { rafRef.current = requestAnimationFrame(animate); return; }
    const elapsed = (ts - startRef.current) / 1000;
    const cycle = 60;
    const frac = (elapsed % cycle) / cycle;
    const x = -220 + frac * (window.innerWidth + 440);
    const y = Math.sin(elapsed * 0.5) * 38;
    pausePosRef.current = { x, y };
    setPos({ x, y });
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!swim) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [swim, animate]);

  useEffect(() => { pausedRef.current = hovered; }, [hovered]);

  if (swim) {
    return (
      <>
        <div
          className="ascii-fish-wrapper"
          style={{ left: pos.x, transform: `translateY(${pos.y}px)`, position: "fixed" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setModalQuote(LYNCH_QUOTES[Math.floor(Math.random() * LYNCH_QUOTES.length)])}
        >
          <pre aria-hidden className={`ascii-fish ${className}`}>{art}</pre>
          <span className="ascii-fish-quote">Ideas are like fish.</span>
        </div>
        {modalQuote && (
          <div className="fish-modal-overlay" onClick={() => setModalQuote(null)}>
            <p className="fish-modal-quote">&ldquo;{modalQuote}&rdquo;</p>
          </div>
        )}
      </>
    );
  }

  return (
    <pre aria-hidden className={`ascii-fish ${className}`} data-testid="ascii-fish">{art}</pre>
  );
}
