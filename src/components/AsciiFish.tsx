import { useEffect, useRef, useState } from "react";

const QUOTES = [
  "Ideas are like fish. If you want to catch the big fish, you've got to go deeper.",
  "The thing about meditation is: you become more and more you.",
  "Negativity is the enemy of creativity.",
  "Desires are memories from our future.",
  "I don't think that people accept the fact that life doesn't make sense. I find that people who get stuck in their lives very often have this problem.",
];

const FRAMES = ["  ><(((º>  ", "  ><(((°>  ", "  ><(((o>  ", "  ><(((°>  "];

export default function AsciiFish() {
  const [x, setX] = useState(-120);
  const [y, setY] = useState(50);
  const [frame, setFrame] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const animRef = useRef<number | null>(null);
  const startTime = useRef(Date.now());
  const frameCount = useRef(0);

  useEffect(() => {
    const animate = () => {
      if (!hovered) {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const vw = window.innerWidth;
        const progress = (elapsed % 60) / 60;
        setX(-150 + progress * (vw + 300));
        setY(40 + Math.sin(elapsed * 0.4) * 18);
        frameCount.current++;
        if (frameCount.current % 20 === 0) setFrame(f => (f + 1) % FRAMES.length);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [hovered]);

  return (
    <div
      style={{ position: "absolute", left: x, top: `${y}%`, willChange: "transform", zIndex: 0, pointerEvents: "auto" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: "1.5rem", color: "#f5b942",
        opacity: hovered ? 1 : 0.5,
        transition: "opacity 0.3s", cursor: "pointer", display: "block",
        userSelect: "none",
      }}>
        {hovered ? "  ><(((●>  " : FRAMES[frame]}
      </span>
      {hovered && (
        <div style={{
          position: "absolute", top: "2.2rem", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(26,8,0,0.97)",
          border: "1px solid rgba(245,185,66,0.35)",
          borderRadius: 8, padding: "12px 18px", maxWidth: 300,
          whiteSpace: "normal", color: "#f5b942",
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic", fontSize: "0.88rem", lineHeight: 1.6,
          zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          animation: "scaleIn 0.15s ease-out",
        }}>
          "{QUOTES[quoteIdx]}"
          <div style={{
            color: "rgba(245,185,66,0.5)", fontSize: "0.7rem",
            marginTop: 6, fontStyle: "normal", fontFamily: "Inter, sans-serif",
          }}>— David Lynch</div>
        </div>
      )}
    </div>
  );
}
