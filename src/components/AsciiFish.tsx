import { useEffect, useRef, useState } from 'react';
import { LYNCH_QUOTES } from '../types';

const FISH_FRAMES = [
  `><(((°>`,
  `><(((°> `,
  ` ><(((°>`,
];

export default function AsciiFish() {
  const [x, setX] = useState(-200);
  const [y, setY] = useState(50);
  const [hovered, setHovered] = useState(false);
  const [quote, setQuote] = useState('');
  const [frame, setFrame] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const randomQuote = LYNCH_QUOTES[Math.floor(Math.random() * LYNCH_QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    if (hovered) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const DURATION = 60000; // 60s per pass
    const BASE_Y = window.innerHeight * 0.5;
    const AMPLITUDE = 80;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) % DURATION;
      const progress = elapsed / DURATION; // 0..1
      const newX = -220 + progress * (window.innerWidth + 440);
      const newY = BASE_Y + Math.sin(progress * Math.PI * 6) * AMPLITUDE;
      setX(newX);
      setY(newY);
      setFrame(Math.floor(timestamp / 400) % FISH_FRAMES.length);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hovered]);

  return (
    <div
      className="fixed pointer-events-none"
      style={{ left: x, top: y, zIndex: 0 }}
    >
      <div
        className="pointer-events-auto cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className="font-mono text-2xl select-none transition-all duration-300"
          style={{
            color: hovered ? '#f5b942' : 'rgba(245,185,66,0.3)',
            textShadow: hovered ? '0 0 20px rgba(245,185,66,0.6)' : 'none',
            filter: hovered ? 'brightness(1.3)' : 'none',
          }}
        >
          {FISH_FRAMES[frame]}
        </span>
        {hovered && (
          <div
            className="absolute left-10 -top-8 whitespace-nowrap text-sm italic"
            style={{ color: '#f5b942', fontFamily: 'Playfair Display, Georgia, serif', maxWidth: 360, whiteSpace: 'normal' }}
          >
            &ldquo;{quote}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
