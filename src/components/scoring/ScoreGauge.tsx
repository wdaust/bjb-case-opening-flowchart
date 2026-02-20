

interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  size?: number;
  label?: string;
}

function getColor(percentage: number): string {
  if (percentage >= 80) return '#22c55e'; // green-500
  if (percentage >= 60) return '#3b82f6'; // blue-500
  if (percentage >= 40) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

export function ScoreGauge({ score, maxScore, size = 120, label }: ScoreGaugeProps) {
  const strokeWidth = size > 100 ? 8 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  const dashOffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;
  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground font-bold"
          fontSize={size * 0.22}
        >
          {score.toFixed(1)}
        </text>
      </svg>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
