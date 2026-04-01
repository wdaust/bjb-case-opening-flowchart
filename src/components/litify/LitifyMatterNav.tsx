import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.ts';

const matterTabs = [
  { id: 'intake-matter', label: 'Intake', to: '/performance-infrastructure/mockups/intake-matter' },
  { id: 'prelit-matter', label: 'Pre-LIT', to: '/performance-infrastructure/mockups/prelit-matter' },
  { id: 'medrec-matter', label: 'Med Records', to: '/performance-infrastructure/mockups/medrec-matter' },
  { id: 'claims-matter', label: 'Claims', to: '/performance-infrastructure/mockups/claims-matter' },
  { id: 'co-matter', label: 'Case Opening', to: '/performance-infrastructure/mockups/co-matter' },
  { id: 'tm-matter', label: 'Treatment Mon', to: '/performance-infrastructure/mockups/tm-matter' },
  { id: 'disc-matter', label: 'Discovery', to: '/performance-infrastructure/mockups/disc-matter' },
  { id: 'exp-matter', label: 'Expert & Depo', to: '/performance-infrastructure/mockups/exp-matter' },
  { id: 'arbmed-matter', label: 'Arb/Med', to: '/performance-infrastructure/mockups/arbmed-matter' },
  { id: 'trial-matter', label: 'Trial', to: '/performance-infrastructure/mockups/trial-matter' },
] as const;

export type MatterId = (typeof matterTabs)[number]['id'];

interface LitifyMatterNavProps {
  active: MatterId;
}

export function LitifyMatterNav({ active }: LitifyMatterNavProps) {
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1 flex-wrap">
      {matterTabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
