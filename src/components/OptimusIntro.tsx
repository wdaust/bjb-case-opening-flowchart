import { useState, useEffect, useRef, useCallback } from 'react';

const TITLE = 'OPTIMUS CONTROL TOWER';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]=/\\|~^';
const RESOLVE_INTERVAL = 80; // ms per character resolve
const SHIMMER_DURATION = 800; // ms for chrome shine sweep
const FADE_DURATION = 600; // ms for overlay fade-out

interface OptimusIntroProps {
  onComplete: () => void;
}

export function OptimusIntro({ onComplete }: OptimusIntroProps) {
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    TITLE.split('').map((ch) => (ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)])),
  );
  const [resolvedCount, setResolvedCount] = useState(0);
  const [phase, setPhase] = useState<'scramble' | 'shimmer' | 'fade'>('scramble');
  const rafRef = useRef<number>(0);
  const lastResolveRef = useRef(0);
  const startTimeRef = useRef(0);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      if (phase === 'scramble') {
        // Resolve one letter every RESOLVE_INTERVAL ms
        if (timestamp - lastResolveRef.current >= RESOLVE_INTERVAL) {
          lastResolveRef.current = timestamp;
          setResolvedCount((prev) => {
            const next = prev + 1;
            if (next >= TITLE.length) {
              setPhase('shimmer');
              startTimeRef.current = timestamp;
            }
            return next;
          });
        }

        // Scramble unresolved characters every frame
        setDisplayChars((prev) => {
          const next = [...prev];
          for (let i = resolvedCount; i < TITLE.length; i++) {
            if (TITLE[i] === ' ') continue;
            next[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          // Ensure resolved chars show correct letter
          for (let i = 0; i < resolvedCount; i++) {
            next[i] = TITLE[i];
          }
          return next;
        });
      }

      if (phase === 'shimmer') {
        const elapsed = timestamp - startTimeRef.current;
        if (elapsed >= SHIMMER_DURATION) {
          setPhase('fade');
          startTimeRef.current = timestamp;
        }
      }

      if (phase === 'fade') {
        const elapsed = timestamp - startTimeRef.current;
        if (elapsed >= FADE_DURATION) {
          onComplete();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [phase, resolvedCount, onComplete],
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      style={{
        opacity: phase === 'fade' ? 0 : 1,
        transition: phase === 'fade' ? `opacity ${FADE_DURATION}ms ease-out` : undefined,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div className="text-center px-4">
        <h1
          className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-[0.15em] whitespace-nowrap"
          style={{
            textShadow: '0 0 20px #00d4ff, 0 0 40px #00d4ff55',
            ...(phase === 'shimmer'
              ? {
                  background: 'linear-gradient(90deg, #00d4ff 0%, #ffffff 50%, #00d4ff 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'optimus-shimmer 0.8s ease-in-out forwards',
                }
              : { color: '#00d4ff' }),
          }}
        >
          {displayChars.map((ch, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                minWidth: ch === ' ' ? '0.35em' : undefined,
                opacity: i < resolvedCount || TITLE[i] === ' ' ? 1 : 0.6,
                textShadow:
                  i === resolvedCount - 1 && phase === 'scramble'
                    ? '0 0 30px #00d4ff, 0 0 60px #00d4ffaa, 0 0 80px #00d4ff55'
                    : undefined,
              }}
            >
              {ch}
            </span>
          ))}
        </h1>
      </div>

      <style>{`
        @keyframes optimus-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
