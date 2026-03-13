import { useState, useEffect, useRef } from 'react';

const TITLE = 'OPTIMUS CONTROL TOWER';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]=/\\|~^';
const RESOLVE_INTERVAL = 80; // ms per character resolve
const SHIMMER_DURATION = 800;
const FADE_DURATION = 600;

interface OptimusIntroProps {
  onComplete: () => void;
}

export function OptimusIntro({ onComplete }: OptimusIntroProps) {
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    TITLE.split('').map((ch) => (ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)])),
  );
  const [phase, setPhase] = useState<'scramble' | 'shimmer' | 'fade'>('scramble');
  const [resolvedCount, setResolvedCount] = useState(0);

  // All mutable animation state in refs to avoid recreating the rAF callback
  const phaseRef = useRef<'scramble' | 'shimmer' | 'fade'>('scramble');
  const resolvedRef = useRef(0);
  const lastResolveTime = useRef(0);
  const phaseStartTime = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let raf = 0;

    const tick = (ts: number) => {
      if (!phaseStartTime.current) phaseStartTime.current = ts;

      if (phaseRef.current === 'scramble') {
        if (ts - lastResolveTime.current >= RESOLVE_INTERVAL) {
          lastResolveTime.current = ts;
          resolvedRef.current += 1;
          setResolvedCount(resolvedRef.current);

          if (resolvedRef.current >= TITLE.length) {
            phaseRef.current = 'shimmer';
            phaseStartTime.current = ts;
            setPhase('shimmer');
          }
        }

        // Scramble unresolved chars
        const rc = resolvedRef.current;
        setDisplayChars(() => {
          const next = TITLE.split('');
          for (let i = rc; i < TITLE.length; i++) {
            if (TITLE[i] === ' ') continue;
            next[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          return next;
        });
      }

      if (phaseRef.current === 'shimmer') {
        if (ts - phaseStartTime.current >= SHIMMER_DURATION) {
          phaseRef.current = 'fade';
          phaseStartTime.current = ts;
          setPhase('fade');
        }
      }

      if (phaseRef.current === 'fade') {
        if (ts - phaseStartTime.current >= FADE_DURATION) {
          onCompleteRef.current();
          return;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // runs once

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
