import { useEffect, useRef, useState } from 'react';

/**
 * The Living Pulping Fish — the breathing background of the canvas.
 *
 * Frames + motion path are generated server-side in Python
 * (GET /api/v2/fish/frames). This component only plays them back:
 * it cycles the "pulp" body-text frames (the pulse) while drifting
 * the whole fish slowly across the canvas along the Python sine path.
 */
interface FishData {
  frames: string[];
  path: number[];
  width: number;
  height: number;
}

export default function LivingFish() {
  const [data, setData] = useState<FishData | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [pos, setPos] = useState({ x: -300, yT: 0 });
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Fetch the Python-generated fish once.
  useEffect(() => {
    fetch('/api/v2/fish/frames?count=16')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  // Pulse the body text (frame cycling) — the "pulping".
  useEffect(() => {
    if (!data) return;
    const id = setInterval(
      () => setFrameIdx((i) => (i + 1) % data.frames.length),
      420
    );
    return () => clearInterval(id);
  }, [data]);

  // Drift the fish slowly across the canvas using the Python path.
  useEffect(() => {
    if (!data) return;
    const DURATION = 90000; // 90s per slow pass
    const animate = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = ((t - startRef.current) % DURATION) / DURATION; // 0..1
      const vw = window.innerWidth;
      const x = -340 + elapsed * (vw + 680);
      const pathIdx = Math.floor(elapsed * data.path.length) % data.path.length;
      const yT = data.path[pathIdx]; // -1..1
      setPos({ x, yT });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data]);

  if (!data) return null;

  return (
    <div
      aria-hidden
      data-testid="living-fish"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <pre
        style={{
          position: 'absolute',
          left: pos.x,
          top: `calc(45% + ${pos.yT * 14}vh)`,
          margin: 0,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 'clamp(10px, 1.5vw, 20px)',
          lineHeight: 1.05,
          letterSpacing: '0.12em',
          color: 'rgba(244,171,17,0.10)',
          whiteSpace: 'pre',
          userSelect: 'none',
          transform: `scaleX(1)`,
          transition: 'top 0.4s ease-out',
          textShadow: '0 0 24px rgba(244,171,17,0.06)',
        }}
      >
        {data.frames[frameIdx]}
      </pre>
    </div>
  );
}
