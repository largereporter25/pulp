import { useState } from 'react';

/**
 * The pulp.to manifesto — the opening invocation.
 * Shows "creative infrastructure for the world." and a short,
 * attributed David Lynch line, then dissolves into the canvas.
 */
export default function Manifesto({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    setLeaving(true);
    setTimeout(onEnter, 700);
  };

  return (
    <div
      data-testid="manifesto"
      onClick={enter}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col justify-center px-8 sm:px-16"
      style={{
        background:
          'radial-gradient(120% 90% at 22% 18%, rgba(255,120,60,0.22), transparent 48%),' +
          'radial-gradient(90% 80% at 80% 60%, rgba(160,20,0,0.32), transparent 55%),' +
          '#c81d05',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* top-left wordmark */}
      <div
        className="absolute left-8 top-7 text-lg font-semibold sm:left-16"
        style={{ color: '#f4ab11', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.22em' }}
      >
        PULP
      </div>

      {/* headline */}
      <h1
        className="max-w-4xl"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 800,
          color: '#f4ab11',
          lineHeight: 0.95,
          letterSpacing: '-0.01em',
          fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
          textShadow: '3px 4px 0 rgba(25,3,0,0.5)',
        }}
      >
        creative
        <br />
        infrastructure
        <br />
        for the world.
      </h1>

      {/* Lynch quote — short, attributed */}
      <div className="mt-10 max-w-xl" style={{ color: 'rgba(244,171,17,0.85)' }}>
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 'clamp(1.05rem, 2.2vw, 1.5rem)',
            lineHeight: 1.5,
          }}
        >
          “Ideas are like fish. If you want to catch the big fish, you’ve got to go deeper.”
        </p>
        <p
          className="mt-3"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(244,171,17,0.55)',
          }}
        >
          — David Lynch, Catching the Big Fish
        </p>
      </div>

      {/* bottom hints */}
      <div
        className="absolute bottom-8 left-8 sm:left-16"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(244,171,17,0.6)',
        }}
      >
        Pulp is a media + AI lab.
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); enter(); }}
        className="absolute bottom-7 right-8 flex items-center gap-2 sm:right-16"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(244,171,17,0.75)',
        }}
        data-testid="enter-canvas"
      >
        Enter the canvas →
      </button>
    </div>
  );
}
