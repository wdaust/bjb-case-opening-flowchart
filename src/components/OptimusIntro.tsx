import { useState, useEffect, useRef } from 'react';

const TITLE = 'OPTIMUS CONTROL TOWER';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?<>{}[]=/|~';
const RESOLVE_INTERVAL = 60; // ms per character resolve
const SCRAMBLE_INTERVAL = 40; // ms between scramble visual updates
const SHIMMER_DURATION = 800;
const FADE_DURATION = 600;

interface OptimusIntroProps {
  onComplete: () => void;
}

export function OptimusIntro({ onComplete }: OptimusIntroProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [phase, setPhase] = useState<'scramble' | 'shimmer' | 'fade'>('scramble');

  useEffect(() => {
    let raf = 0;
    let resolved = 0;
    let lastResolve = 0;
    let lastScramble = 0;
    let phaseStart = 0;
    let currentPhase: 'scramble' | 'shimmer' | 'fade' = 'scramble';

    // Pre-create span elements
    const container = canvasRef.current;
    if (!container) return;
    const spans: HTMLSpanElement[] = [];
    for (let i = 0; i < TITLE.length; i++) {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      if (TITLE[i] === ' ') {
        span.style.minWidth = '0.35em';
        span.textContent = ' ';
      } else {
        span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        span.style.opacity = '0.6';
      }
      container.appendChild(span);
      spans.push(span);
    }

    const tick = (ts: number) => {
      if (!phaseStart) {
        phaseStart = ts;
        lastResolve = ts;
        lastScramble = ts;
      }

      if (currentPhase === 'scramble') {
        // Resolve one letter
        if (ts - lastResolve >= RESOLVE_INTERVAL) {
          // Skip spaces
          while (resolved < TITLE.length && TITLE[resolved] === ' ') {
            resolved++;
          }
          if (resolved < TITLE.length) {
            spans[resolved].textContent = TITLE[resolved];
            spans[resolved].style.opacity = '1';
            spans[resolved].style.textShadow = '0 0 30px #00d4ff, 0 0 60px #00d4ffaa, 0 0 80px #00d4ff55';
            // Clear glow on previous
            if (resolved > 0) {
              spans[resolved - 1].style.textShadow = '';
            }
            resolved++;
            lastResolve = ts;
          }
          if (resolved >= TITLE.length) {
            // Clear last glow
            spans[TITLE.length - 1].style.textShadow = '';
            currentPhase = 'shimmer';
            setPhase('shimmer');
            phaseStart = ts;
          }
        }

        // Scramble unresolved chars (throttled)
        if (ts - lastScramble >= SCRAMBLE_INTERVAL) {
          for (let i = resolved; i < TITLE.length; i++) {
            if (TITLE[i] === ' ') continue;
            spans[i].textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          lastScramble = ts;
        }
      }

      if (currentPhase === 'shimmer') {
        if (ts - phaseStart >= SHIMMER_DURATION) {
          currentPhase = 'fade';
          setPhase('fade');
          phaseStart = ts;
        }
      }

      if (currentPhase === 'fade') {
        if (ts - phaseStart >= FADE_DURATION) {
          onCompleteRef.current();
          return;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      container.innerHTML = '';
    };
  }, []);

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
          ref={canvasRef}
          className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-[0.15em] whitespace-nowrap"
          style={{
            color: '#00d4ff',
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
              : {}),
          }}
        />
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
