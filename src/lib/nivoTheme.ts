// Shared Nivo dark theme matching app CSS custom properties
import type { PartialTheme } from '@nivo/theming';

export const nivoTheme: PartialTheme = {
  text: { fontSize: 11, fill: '#94a3b8' },
  axis: {
    domain: { line: { stroke: '#334155', strokeWidth: 1 } },
    ticks: { line: { stroke: '#334155', strokeWidth: 1 }, text: { fontSize: 10, fill: '#64748b' } },
    legend: { text: { fontSize: 11, fill: '#94a3b8' } },
  },
  grid: { line: { stroke: '#1e293b', strokeWidth: 1 } },
  legends: { text: { fontSize: 10, fill: '#94a3b8' } },
  labels: { text: { fontSize: 11, fill: '#e2e8f0' } },
  tooltip: {
    container: {
      background: '#1e293b',
      color: '#e2e8f0',
      fontSize: 12,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      border: '1px solid #334155',
    },
  },
};

export const chartColors = [
  '#38bdf8', '#f472b6', '#a78bfa', '#34d399', '#fb923c',
  '#facc15', '#f87171', '#22d3ee', '#818cf8', '#4ade80',
  '#e879f9', '#fbbf24',
];
