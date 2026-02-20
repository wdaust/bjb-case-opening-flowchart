import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { cn } from '../utils/cn.ts';

const cards = [
  {
    id: 'co-matter',
    title: 'Case Opening Matter Record',
    description:
      'Consolidated Litify-style matter record combining all 53 tasks, scoring systems, contact pursuit, and metrics into a single tabbed view with shared state and path bar navigation.',
    color: 'text-blue-500 bg-blue-500/10',
    to: '/performance-infrastructure/mockups/co-matter',
  },
  {
    id: 'tm-matter',
    title: 'Treatment Monitoring Matter Record',
    description:
      'Consolidated Litify-style matter record combining all 25 tasks, scoring systems, contact pursuit, and metrics into a single tabbed view with shared state.',
    color: 'text-teal-500 bg-teal-500/10',
    to: '/performance-infrastructure/mockups/tm-matter',
  },
  {
    id: 'disc-matter',
    title: 'Discovery Matter Record',
    description:
      'Consolidated Litify-style matter record combining all 26 tasks, scoring systems, contact pursuit, and metrics into a single tabbed view with shared state.',
    color: 'text-indigo-500 bg-indigo-500/10',
    to: '/performance-infrastructure/mockups/disc-matter',
  },
  {
    id: 'exp-matter',
    title: 'Expert & Deposition Matter Record',
    description:
      'Consolidated Litify-style matter record combining all 30 tasks, scoring systems, expert pursuit, and metrics into a single tabbed view with shared state.',
    color: 'text-stone-600 bg-stone-600/10',
    to: '/performance-infrastructure/mockups/exp-matter',
  },
  {
    id: 'arbmed-matter',
    title: 'Arbitration/Mediation Matter Record',
    description:
      'Consolidated Litify-style matter record combining all 18 tasks, scoring systems, and metrics into a single tabbed view with shared state and path bar navigation.',
    color: 'text-amber-700 bg-amber-700/10',
    to: '/performance-infrastructure/mockups/arbmed-matter',
  },
  {
    id: 'trial-matter',
    title: 'Trial Matter Record',
    description:
      'Consolidated Litify-style matter record combining all 10 tasks, scoring systems, and metrics into a single tabbed view with shared state and path bar navigation.',
    color: 'text-violet-700 bg-violet-700/10',
    to: '/performance-infrastructure/mockups/trial-matter',
  },
];

export default function LitifyMockupsLanding() {
  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/performance-infrastructure"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Performance Infrastructure
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Litify Mockups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consolidated Litify-style matter record pages — one per phase group — combining tasks, scoring, contact pursuit, and metrics into a single tabbed view.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.id}
            to={card.to}
            className="group rounded-lg border border-border bg-card p-6 transition-all hover:shadow-md hover:border-foreground/20"
          >
            <div
              className={cn(
                'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg',
                card.color
              )}
            >
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-foreground/90">
              {card.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
