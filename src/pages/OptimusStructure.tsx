import { useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Optimus Framework — interactive infographic                       */
/* ------------------------------------------------------------------ */

export default function OptimusStructure() {
  const trackRef = useRef<HTMLCanvasElement>(null);
  const feedbackRef = useRef<HTMLCanvasElement>(null);
  const ctRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── draw the "racetrack" around Litify ── */
  const drawTrack = useCallback(() => {
    const canvas = trackRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const W = parent.offsetWidth;
    const H = Math.round(W * 0.40);

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;

    // stadium / rounded-rectangle track (pill shape)
    const trackW = Math.max(18, Math.round(W * 0.055));
    const padX = 16, padY = 12;
    const outerW = W - padX * 2, outerH = H - padY * 2;
    const r = outerH / 2; // corner radius = half height for true stadium

    function stadium(x: number, y: number, w: number, h: number, rad: number) {
      const cr = Math.min(rad, h / 2, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + cr, y);
      ctx.lineTo(x + w - cr, y);
      ctx.arcTo(x + w, y, x + w, y + cr, cr);
      ctx.lineTo(x + w, y + h - cr);
      ctx.arcTo(x + w, y + h, x + w - cr, y + h, cr);
      ctx.lineTo(x + cr, y + h);
      ctx.arcTo(x, y + h, x, y + h - cr, cr);
      ctx.lineTo(x, y + cr);
      ctx.arcTo(x, y, x + cr, y, cr);
      ctx.closePath();
    }

    // outer edge
    stadium(padX, padY, outerW, outerH, r);
    ctx.fillStyle = '#181817';
    ctx.fill();
    ctx.strokeStyle = '#333330';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // inner edge (cut-out)
    const inX = padX + trackW, inY = padY + trackW;
    const inW = outerW - trackW * 2, inH = outerH - trackW * 2;
    const inR = Math.max(0, r - trackW);
    stadium(inX, inY, inW, inH, inR);
    ctx.fillStyle = '#111111';
    ctx.fill();
    ctx.strokeStyle = '#282826';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // track surface — midline dashes for racing feel
    const midX = padX + trackW / 2, midY = padY + trackW / 2;
    const midW = outerW - trackW, midH = outerH - trackW;
    const midR = r - trackW / 2;
    stadium(midX, midY, midW, midH, midR);
    ctx.strokeStyle = '#2a2a26';
    ctx.lineWidth = 0.6;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // helper: get position + outward normal at parameter t (0..1) along stadium midline
    const straightTop = midW - 2 * midR;
    const arcLen = Math.PI * midR;
    const straightBot = straightTop;
    const perim = 2 * straightTop + 2 * arcLen;

    function perimPoint(t: number): { px: number; py: number; nx: number; ny: number } {
      let d = ((t % 1) + 1) % 1 * perim;
      if (d < straightTop) {
        // top straight — normal points up
        return { px: midX + midR + d, py: midY, nx: 0, ny: -1 };
      }
      d -= straightTop;
      if (d < arcLen) {
        // right arc — center is at right end
        const a = d / midR - Math.PI / 2;
        const acx = midX + midW - midR, acy = midY + midH / 2;
        return { px: acx + midR * Math.cos(a), py: acy + midR * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
      }
      d -= arcLen;
      if (d < straightBot) {
        // bottom straight — normal points down, travels right-to-left
        return { px: midX + midW - midR - d, py: midY + midH, nx: 0, ny: 1 };
      }
      d -= straightBot;
      // left arc — center at left end, sweeps from π/2 (bottom) through π to 3π/2 (top)
      const a = Math.PI / 2 + d / midR;
      const acx = midX + midR, acy = midY + midH / 2;
      // position is on the circle, outward normal points away from arc center (i.e. same direction as cos(a),sin(a) but that points inward here — so negate)
      return { px: acx + midR * Math.cos(a), py: acy + midR * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
    }

    // stage gate markers — 8 evenly spaced bold ticks
    const gateCount = 8;
    for (let i = 0; i < gateCount; i++) {
      const { px, py, nx, ny } = perimPoint(i / gateCount);
      const half = trackW / 2 - 1;
      ctx.beginPath();
      ctx.moveTo(px - nx * half, py - ny * half);
      ctx.lineTo(px + nx * half, py + ny * half);
      ctx.strokeStyle = '#777770';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // SLA ticks — smaller, between gates
    const slaCount = 40;
    for (let i = 0; i < slaCount; i++) {
      if (i % (slaCount / gateCount) === 0) continue;
      const { px, py, nx, ny } = perimPoint(i / slaCount);
      const half = trackW / 2 - 4;
      ctx.beginPath();
      ctx.moveTo(px - nx * half, py - ny * half);
      ctx.lineTo(px + nx * half, py + ny * half);
      ctx.strokeStyle = 'rgba(212,83,126,0.4)';
      ctx.lineWidth = 0.7;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // center label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 ${Math.round(W * 0.04)}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = '#8a8a80';
    ctx.fillText('\u2039  Litify  \u203a', cx, cy);
  }, []);

  /* ── draw the feedback arrow: Litify → Control Tower ── */
  const drawFeedback = useCallback(() => {
    const fa = feedbackRef.current;
    const ct = ctRef.current;
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!fa || !ct || !track || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const wrapRect = wrap.getBoundingClientRect();
    const ctRect = ct.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();

    // canvas covers the entire wrapper
    const W = wrap.offsetWidth;
    const H = wrap.offsetHeight;

    fa.width = W * dpr;
    fa.height = H * dpr;
    fa.style.width = W + 'px';
    fa.style.height = H + 'px';

    const ctx = fa.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const color = '#3b82f6';

    // coordinates relative to wrapper
    const trackCenterY = trackRect.top + trackRect.height / 2 - wrapRect.top;
    const trackCenterX = trackRect.left + trackRect.width / 2 - wrapRect.left;
    const ctCenterY = ctRect.top + ctRect.height / 2 - wrapRect.top;
    const ctLeft = ctRect.left - wrapRect.left;

    // left edge — far left of wrapper, well outside the content boxes
    const leftX = Math.max(4, ctLeft - 90);

    // path: track center-left → down to left edge → up to CT level → right into CT
    ctx.beginPath();
    ctx.moveTo(trackCenterX, trackCenterY);
    ctx.lineTo(leftX + 20, trackCenterY);
    ctx.quadraticCurveTo(leftX, trackCenterY, leftX, trackCenterY - 20);
    ctx.lineTo(leftX, ctCenterY + 20);
    ctx.quadraticCurveTo(leftX, ctCenterY, leftX + 20, ctCenterY);
    ctx.lineTo(ctLeft - 8, ctCenterY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.setLineDash([]);

    // arrowhead pointing right into CT
    ctx.beginPath();
    ctx.moveTo(ctLeft - 20, ctCenterY - 5);
    ctx.lineTo(ctLeft - 8, ctCenterY);
    ctx.lineTo(ctLeft - 20, ctCenterY + 5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // vertical label "REAL-TIME DATA"
    ctx.save();
    ctx.translate(leftX + 10, trackCenterY - (trackCenterY - ctCenterY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "600 8px 'IBM Plex Mono', monospace";
    ctx.fillStyle = '#60a5fa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';
    ctx.fillText('REAL-TIME DATA', 0, 0);
    ctx.restore();
  }, []);

  useEffect(() => {
    const render = () => {
      drawTrack();
      requestAnimationFrame(() => drawFeedback());
    };
    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [drawTrack, drawFeedback]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[820px] mx-auto px-12 py-12 pb-20">

        {/* Eyebrow */}
        <p className="text-center text-[9px] tracking-[4px] uppercase text-gray-500 mb-10">
          bjboptimus.com
        </p>

        {/* Wrapper for absolute feedback canvas */}
        <div ref={wrapRef} className="relative">

          {/* Feedback arrow canvas — absolutely positioned over entire layout */}
          <canvas
            ref={feedbackRef}
            className="absolute inset-0 pointer-events-none z-10"
          />

          <div className="grid grid-cols-[1fr_110px] gap-x-6 items-start">
            {/* ── Main column ── */}
            <div className="flex flex-col items-stretch">

              {/* Control Tower */}
              <div
                ref={ctRef}
                className="border-[1.5px] border-violet-500/60 rounded-2xl px-6 py-5 text-center"
                style={{ background: 'rgba(99,82,220,0.08)' }}
              >
                <p className="text-xl font-medium text-violet-200 tracking-tight">Control Tower</p>
                <span className="inline-block mt-2 text-[9px] tracking-[2.5px] uppercase text-violet-400 border border-violet-500/40 rounded-full px-3 py-0.5">
                  Metrics Engine
                </span>
              </div>

              {/* Connector */}
              <div className="flex justify-center py-1.5">
                <svg width="2" height="22"><line x1="1" y1="0" x2="1" y2="22" stroke="#444" strokeWidth="1.5" /></svg>
              </div>

              {/* MOS */}
              <div className="border border-[#333] rounded-xl px-5 py-4 text-center bg-[#161615]">
                <p className="text-2xl font-light text-gray-200 tracking-[3px]">MOS</p>
                <div className="flex justify-center gap-4 mt-2">
                  <span className="text-[9px] tracking-[1.5px] uppercase text-gray-500">Scorecard</span>
                  <span className="text-[9px] tracking-[1.5px] uppercase text-gray-500">Meetings</span>
                  <span className="text-[9px] tracking-[1.5px] uppercase text-gray-500">KPIs</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5 tracking-wide">Management Operating System</p>
              </div>

              {/* Connector */}
              <div className="flex justify-center py-1.5">
                <svg width="2" height="22"><line x1="1" y1="0" x2="1" y2="22" stroke="#444" strokeWidth="1.5" /></svg>
              </div>

              {/* Rocks → Problems */}
              <div className="flex justify-center items-center gap-3">
                <span className="text-sm font-medium text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-5 py-1.5 tracking-wide">
                  Rocks
                </span>
                <span className="text-gray-600 text-xs">&#8594;</span>
                <span className="text-sm font-medium text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-5 py-1.5 tracking-wide">
                  Problems
                </span>
              </div>
              <p className="text-[8px] tracking-[2.5px] uppercase text-gray-600 text-center mt-1">
                Improvement &middot; Improvement &middot; Improvement
              </p>

              {/* Connector */}
              <div className="flex justify-center py-1">
                <svg width="2" height="16"><line x1="1" y1="0" x2="1" y2="16" stroke="#444" strokeWidth="1.5" /></svg>
              </div>

              {/* Stages */}
              <div className="grid grid-cols-4 border border-[#333] rounded-xl overflow-hidden mb-4">
                {(['Intake', 'Pre-Lit', 'Settlement', 'Lit'] as const).map((stage, i) => (
                  <div key={stage} className={`py-3 px-2 text-center relative ${i > 0 ? 'border-l border-[#2a2a2a]' : ''}`}>
                    <p className="text-sm font-medium text-gray-200">{stage}</p>
                    {i < 3 && (
                      <span className="absolute right-[-7px] top-1/2 -translate-y-1/2 text-[11px] text-gray-600 z-[1]">&#8250;</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Accountability + Track */}
              <p className="text-[9px] font-medium tracking-[3px] uppercase text-rose-400/70 text-center mb-1">
                &mdash; Accountability &mdash;
              </p>
              <div>
                <canvas ref={trackRef} className="w-full block" />
              </div>
              <p className="text-[9px] font-medium tracking-[3px] uppercase text-rose-400/70 text-center mt-1">
                &mdash; Accountability &mdash;
              </p>

              {/* Legend */}
              <div className="flex gap-6 justify-center mt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 tracking-wide">
                  <div className="w-[3px] h-[14px] bg-gray-400 rounded-sm shrink-0" />
                  Stage gate
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 tracking-wide">
                  <div className="w-[2px] h-[10px] bg-rose-400 rounded-sm shrink-0" />
                  SLA
                </div>
              </div>

            </div>

            {/* ── Right sidebar ── */}
            <div className="flex flex-col gap-0 pt-1">
              <div className="mb-6">
                <p className="text-[8px] tracking-[2.5px] uppercase text-gray-500 mb-2 pb-1.5 border-b border-[#2a2a2a]">
                  Stage gates
                </p>
                <div className="text-[10px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-2 text-center leading-snug mb-2">
                  Data Hygiene
                </div>
                <div className="text-[10px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-2 text-center leading-snug">
                  Standardized Definitions
                </div>
              </div>
              <div>
                <p className="text-[8px] tracking-[2.5px] uppercase text-gray-500 mb-2 pb-1.5 border-b border-[#2a2a2a]">
                  Feedback loop
                </p>
                <div className="text-[10px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-center leading-snug mb-2">
                  Real-time reporting
                </div>
                <div className="text-[10px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-center leading-snug">
                  Scoring
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer eyebrow */}
        <p className="text-center text-[9px] tracking-[4px] uppercase text-gray-500 mt-10">
          optimus framework
        </p>

      </div>
    </div>
  );
}
