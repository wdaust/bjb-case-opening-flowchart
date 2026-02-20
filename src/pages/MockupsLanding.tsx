import { Link } from 'react-router-dom';
import {
  Phone, ClipboardCheck, ListChecks, ArrowLeft, ClipboardList,
  CalendarCheck, BarChart3, Stethoscope, PhoneCall,
  Scale, Gavel, Microscope, FileSearch, BookOpen, Activity,
} from 'lucide-react';
import { cn } from '../utils/cn.ts';

// ── MockupNav ────────────────────────────────────────────────────────────

interface MockupNavProps {
  active?: string;
  group?: 'case-opening' | 'treatment-monitoring' | 'discovery' | 'expert-deposition' | 'arbitration-mediation' | 'trial';
}

const caseOpeningTabs = [
  { id: 'client-contact', label: 'Client Contact Pursuit', to: '/performance-infrastructure/mockups/client-contact' },
  { id: 'case-setup', label: 'Case Setup Scoring', to: '/performance-infrastructure/mockups/case-setup' },
  { id: 'task-tracker', label: '53-Task Tracker', to: '/performance-infrastructure/mockups/task-tracker' },
{ id: 'co-matter', label: 'Matter Record', to: '/performance-infrastructure/mockups/co-matter' },
];

const treatmentMonitoringTabs = [
  { id: 'tm-contact', label: 'Contact Pursuit', to: '/performance-infrastructure/mockups/tm-contact' },
  { id: 'tm-appointment', label: 'Appointment Protocol', to: '/performance-infrastructure/mockups/tm-appointment' },
  { id: 'tm-scoring', label: 'Scoring Dashboard', to: '/performance-infrastructure/mockups/tm-scoring' },
  { id: 'tm-tracker', label: '25-Task Tracker', to: '/performance-infrastructure/mockups/tm-tracker' },
  { id: 'tm-metrics', label: 'Scorecard & KPIs', to: '/performance-infrastructure/mockups/tm-metrics' },
  { id: 'tm-matter', label: 'Matter Record', to: '/performance-infrastructure/mockups/tm-matter' },
];

const discoveryTabs = [
  { id: 'disc-contact', label: 'Contact Pursuit', to: '/performance-infrastructure/mockups/disc-contact' },
  { id: 'disc-appointment', label: 'Appointment Protocol', to: '/performance-infrastructure/mockups/disc-appointment' },
  { id: 'disc-scoring', label: 'Scoring Dashboard', to: '/performance-infrastructure/mockups/disc-scoring' },
  { id: 'disc-tracker', label: '26-Task Tracker', to: '/performance-infrastructure/mockups/disc-tracker' },
  { id: 'disc-metrics', label: 'Scorecard & KPIs', to: '/performance-infrastructure/mockups/disc-metrics' },
  { id: 'disc-matter', label: 'Matter Record', to: '/performance-infrastructure/mockups/disc-matter' },
];

const expertDepoTabs = [
  { id: 'exp-contact', label: 'Expert Pursuit', to: '/performance-infrastructure/mockups/exp-contact' },
  { id: 'exp-appointment', label: 'Retention Protocol', to: '/performance-infrastructure/mockups/exp-appointment' },
  { id: 'exp-scoring', label: 'Scoring Dashboard', to: '/performance-infrastructure/mockups/exp-scoring' },
  { id: 'exp-tracker', label: '30-Task Tracker', to: '/performance-infrastructure/mockups/exp-tracker' },
  { id: 'exp-metrics', label: 'Scorecard & Intelligence', to: '/performance-infrastructure/mockups/exp-metrics' },
  { id: 'exp-matter', label: 'Matter Record', to: '/performance-infrastructure/mockups/exp-matter' },
];

const arbMedTabs = [
  { id: 'arbmed-tracker', label: '18-Task Tracker', to: '/performance-infrastructure/mockups/arbmed-tracker' },
  { id: 'arbmed-scoring', label: 'Scoring Dashboard', to: '/performance-infrastructure/mockups/arbmed-scoring' },
  { id: 'arbmed-metrics', label: 'Scorecard & KPIs', to: '/performance-infrastructure/mockups/arbmed-metrics' },
  { id: 'arbmed-matter', label: 'Matter Record', to: '/performance-infrastructure/mockups/arbmed-matter' },
];

const trialTabs = [
  { id: 'trial-tracker', label: '10-Task Tracker', to: '/performance-infrastructure/mockups/trial-tracker' },
  { id: 'trial-scoring', label: 'Scoring Dashboard', to: '/performance-infrastructure/mockups/trial-scoring' },
  { id: 'trial-metrics', label: 'Scorecard & KPIs', to: '/performance-infrastructure/mockups/trial-metrics' },
  { id: 'trial-matter', label: 'Matter Record', to: '/performance-infrastructure/mockups/trial-matter' },
];

export function MockupNav({ active, group = 'case-opening' }: MockupNavProps) {
  const tabs = group === 'trial' ? trialTabs : group === 'arbitration-mediation' ? arbMedTabs : group === 'expert-deposition' ? expertDepoTabs : group === 'discovery' ? discoveryTabs : group === 'treatment-monitoring' ? treatmentMonitoringTabs : caseOpeningTabs;

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1 flex-wrap">
      {tabs.map((tab) => (
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

// ── Card Data ─────────────────────────────────────────────────────────────

const caseOpeningCards = [
  {
    id: 'client-contact',
    title: 'Client Contact Pursuit',
    description:
      'Interactive timeline tracking the 12-step client contact pursuit sequence from initial call through case opening completion. Features SLA countdown timers, automated trigger animations, and connected/not-connected call workflows.',
    icon: Phone,
    color: 'text-blue-500 bg-blue-500/10',
    to: '/performance-infrastructure/mockups/client-contact',
  },
  {
    id: 'case-setup',
    title: 'Case Setup Scoring',
    description:
      'Five interactive scoring systems with gauge visualizations, factor-level rubric inputs, hygiene gates, and action trigger recommendations. Score liability, client profile, policy, treatment strength, and case performance.',
    icon: ClipboardCheck,
    color: 'text-emerald-500 bg-emerald-500/10',
    to: '/performance-infrastructure/mockups/case-setup',
  },
  {
    id: 'task-tracker',
    title: '53-Task Tracker',
    description:
      'Comprehensive task tracker covering all 53 tasks across 13 phases of case opening. Features collapsible phase sections, filterable views by phase, assignee, and status, with progress tracking and visual status indicators.',
    icon: ListChecks,
    color: 'text-violet-500 bg-violet-500/10',
    to: '/performance-infrastructure/mockups/task-tracker',
  },
  {
    id: 'co-matter',
    title: 'Matter Record',
    description:
      'Consolidated Litify-style matter record page combining all 53 tasks, scoring systems, contact pursuit, and metrics into a single tabbed view with shared state and path bar navigation.',
    icon: ClipboardList,
    color: 'text-purple-500 bg-purple-500/10',
    to: '/performance-infrastructure/mockups/co-matter',
  },
];

const treatmentMonitoringCards = [
  {
    id: 'tm-contact',
    title: 'Contact Pursuit',
    description:
      '9-call contact pursuit timeline with 2 automated contact letters and MIA routing. Day-based SLA countdowns from OA, with voicemail + SMS + email auto-triggers on not-connected calls.',
    icon: PhoneCall,
    color: 'text-teal-500 bg-teal-500/10',
    to: '/performance-infrastructure/mockups/tm-contact',
  },
  {
    id: 'tm-appointment',
    title: 'Appointment Protocol',
    description:
      'Interactive 14-section appointment agenda covering treatment status, discovery, liens, scoring, and client concerns. Collapsible sections with checklists, notes, and progress tracking.',
    icon: CalendarCheck,
    color: 'text-teal-600 bg-teal-600/10',
    to: '/performance-infrastructure/mockups/tm-appointment',
  },
  {
    id: 'tm-scoring',
    title: 'Scoring Dashboard',
    description:
      'Five scoring systems re-scored or confirmed "No Change" after each client communication. Same gauge visualizations with treatment monitoring context and governance rules.',
    icon: Stethoscope,
    color: 'text-indigo-500 bg-indigo-500/10',
    to: '/performance-infrastructure/mockups/tm-scoring',
  },
  {
    id: 'tm-tracker',
    title: '25-Task Tracker',
    description:
      '25 tasks across 7 phases from client contact through supportive doc production. Phase-colored sections with filters, progress tracking, and SLA compliance indicators.',
    icon: ListChecks,
    color: 'text-teal-700 bg-teal-700/10',
    to: '/performance-infrastructure/mockups/tm-tracker',
  },
  {
    id: 'tm-metrics',
    title: 'Weekly Scorecard & KPIs',
    description:
      '12 weekly scorecard metrics with RAG status indicators, full KPI library across 6 categories, SLA reference tables, and escalation trigger definitions.',
    icon: BarChart3,
    color: 'text-amber-500 bg-amber-500/10',
    to: '/performance-infrastructure/mockups/tm-metrics',
  },
  {
    id: 'tm-matter',
    title: 'Matter Record',
    description:
      'Consolidated Litify-style matter record page combining all 25 tasks, scoring systems, contact pursuit, and metrics into a single tabbed view with shared state.',
    icon: ClipboardList,
    color: 'text-purple-500 bg-purple-500/10',
    to: '/performance-infrastructure/mockups/tm-matter',
  },
];

const discoveryCards = [
  {
    id: 'disc-contact',
    title: 'Contact Pursuit',
    description:
      '6-call discovery appointment pursuit timeline with 2 automated contact letters, management escalation at day 49, and attorney discovery appointment. Day-based SLA countdowns from complaint filed.',
    icon: Scale,
    color: 'text-blue-700 bg-blue-700/10',
    to: '/performance-infrastructure/mockups/disc-contact',
  },
  {
    id: 'disc-appointment',
    title: 'Appointment Protocol',
    description:
      'Interactive 9-section discovery appointment agenda covering opening/expectations, client goals, accident facts, injuries, prior history, employment, discovery response review, deposition prep, and next steps.',
    icon: Gavel,
    color: 'text-blue-800 bg-blue-800/10',
    to: '/performance-infrastructure/mockups/disc-appointment',
  },
  {
    id: 'disc-scoring',
    title: 'Scoring Dashboard',
    description:
      'Five scoring systems re-scored or confirmed "No Change" after each client communication. Discovery context with gauge visualizations and governance rules.',
    icon: Stethoscope,
    color: 'text-indigo-600 bg-indigo-600/10',
    to: '/performance-infrastructure/mockups/disc-scoring',
  },
  {
    id: 'disc-tracker',
    title: '26-Task Tracker',
    description:
      '26 tasks across 8 phases from discovery through court filing notice. Phase-colored sections with filters, progress tracking, and SLA compliance indicators.',
    icon: ListChecks,
    color: 'text-blue-600 bg-blue-600/10',
    to: '/performance-infrastructure/mockups/disc-tracker',
  },
  {
    id: 'disc-metrics',
    title: 'Weekly Scorecard & KPIs',
    description:
      '12 deposition/discovery scorecard metrics with RAG indicators, KPI library by role, deposition SLA ladder, readiness checklist, and escalation triggers.',
    icon: BarChart3,
    color: 'text-blue-500 bg-blue-500/10',
    to: '/performance-infrastructure/mockups/disc-metrics',
  },
  {
    id: 'disc-matter',
    title: 'Matter Record',
    description:
      'Consolidated Litify-style matter record page combining all 26 tasks, scoring systems, contact pursuit, and metrics into a single tabbed view with shared state.',
    icon: ClipboardList,
    color: 'text-purple-500 bg-purple-500/10',
    to: '/performance-infrastructure/mockups/disc-matter',
  },
];

const expertDepoCards = [
  {
    id: 'exp-contact',
    title: 'Expert Pursuit',
    description:
      'Expert retention & deposition contact pursuit timeline covering non-party depo approval, 3-call retain attempts, 4-call report follow-up, amended report workflow, IME scheduling, and client depo tracking.',
    icon: Microscope,
    color: 'text-stone-600 bg-stone-600/10',
    to: '/performance-infrastructure/mockups/exp-contact',
  },
  {
    id: 'exp-appointment',
    title: 'Retention Protocol',
    description:
      'Interactive 8-section expert retention & follow-up protocol covering expert directive confirmation, 3-attempt contact, retention & scheduling, report follow-up, amendment workflow, IME compliance, and client deposition tracking.',
    icon: BookOpen,
    color: 'text-stone-700 bg-stone-700/10',
    to: '/performance-infrastructure/mockups/exp-appointment',
  },
  {
    id: 'exp-scoring',
    title: 'Scoring Dashboard',
    description:
      'Five scoring systems re-scored or confirmed "No Change" after each expert communication. Expert & deposition context with gauge visualizations and governance rules.',
    icon: Activity,
    color: 'text-amber-800 bg-amber-800/10',
    to: '/performance-infrastructure/mockups/exp-scoring',
  },
  {
    id: 'exp-tracker',
    title: '30-Task Tracker',
    description:
      '30 tasks across 10 phases from non-party deposition approval through system automation. Phase-colored sections with filters, progress tracking, and SLA compliance indicators.',
    icon: ListChecks,
    color: 'text-stone-700 bg-stone-700/10',
    to: '/performance-infrastructure/mockups/exp-tracker',
  },
  {
    id: 'exp-metrics',
    title: 'Scorecard & Intelligence',
    description:
      '15 scorecard metrics, KPI library, SLA enforcement ladder, Expert Performance Index, Defense Pressure/Expert Leverage Dashboard, and Trial Readiness Scorecard across 4 tabs.',
    icon: FileSearch,
    color: 'text-amber-700 bg-amber-700/10',
    to: '/performance-infrastructure/mockups/exp-metrics',
  },
  {
    id: 'exp-matter',
    title: 'Matter Record',
    description:
      'Consolidated Litify-style matter record page combining all 30 tasks, scoring systems, expert pursuit, and metrics into a single tabbed view with shared state.',
    icon: ClipboardList,
    color: 'text-purple-500 bg-purple-500/10',
    to: '/performance-infrastructure/mockups/exp-matter',
  },
];

const arbMedCards = [
  {
    id: 'arbmed-tracker',
    title: '18-Task Tracker',
    description:
      '18 tasks across 6 phases from court notice through mediation doc production. Phase-colored sections with filters, progress tracking, and SLA compliance indicators.',
    icon: ListChecks,
    color: 'text-amber-700 bg-amber-700/10',
    to: '/performance-infrastructure/mockups/arbmed-tracker',
  },
  {
    id: 'arbmed-scoring',
    title: 'Scoring Dashboard',
    description:
      'Five scoring systems re-scored or confirmed "No Change" after each communication. Arbitration/mediation context with gauge visualizations and governance rules.',
    icon: Scale,
    color: 'text-amber-800 bg-amber-800/10',
    to: '/performance-infrastructure/mockups/arbmed-scoring',
  },
  {
    id: 'arbmed-metrics',
    title: 'Scorecard & KPIs',
    description:
      '15 scorecard metrics with RAG indicators, KPI library by role, SLA enforcement ladder, Stage Health Index, and escalation triggers across 4-category weighted scoring.',
    icon: BarChart3,
    color: 'text-amber-600 bg-amber-600/10',
    to: '/performance-infrastructure/mockups/arbmed-metrics',
  },
  {
    id: 'arbmed-matter',
    title: 'Matter Record',
    description:
      'Consolidated Litify-style matter record page combining all 18 tasks, scoring systems, and metrics into a single tabbed view with shared state and path bar navigation.',
    icon: ClipboardList,
    color: 'text-purple-500 bg-purple-500/10',
    to: '/performance-infrastructure/mockups/arbmed-matter',
  },
];

const trialCards = [
  {
    id: 'trial-tracker',
    title: '10-Task Tracker',
    description:
      '10 tasks across 4 phases from court notice through trial readiness verification. Phase-colored sections with filters, progress tracking, and SLA compliance indicators.',
    icon: Gavel,
    color: 'text-violet-700 bg-violet-700/10',
    to: '/performance-infrastructure/mockups/trial-tracker',
  },
  {
    id: 'trial-scoring',
    title: 'Scoring Dashboard',
    description:
      'Five scoring systems re-scored or confirmed "No Change" after each communication. Trial context with gauge visualizations and governance rules.',
    icon: Scale,
    color: 'text-violet-800 bg-violet-800/10',
    to: '/performance-infrastructure/mockups/trial-scoring',
  },
  {
    id: 'trial-metrics',
    title: 'Scorecard & KPIs',
    description:
      '14 scorecard metrics with RAG indicators, KPI library by role, SLA enforcement ladder, Stage Health Index, and escalation triggers across 5-layer weighted scoring.',
    icon: BarChart3,
    color: 'text-violet-600 bg-violet-600/10',
    to: '/performance-infrastructure/mockups/trial-metrics',
  },
  {
    id: 'trial-matter',
    title: 'Matter Record',
    description:
      'Consolidated Litify-style matter record page combining all 10 tasks, scoring systems, and metrics into a single tabbed view with shared state and path bar navigation.',
    icon: ClipboardList,
    color: 'text-purple-500 bg-purple-500/10',
    to: '/performance-infrastructure/mockups/trial-matter',
  },
];

// ── Card Component ────────────────────────────────────────────────────────

function CardGrid({ cards }: { cards: typeof caseOpeningCards }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
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
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-foreground/90">
              {card.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {card.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────

export default function MockupsLanding() {
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
        <h1 className="text-2xl font-bold text-foreground">Mockups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Interactive prototypes for case workflows, scoring systems, and task management.
        </p>
      </div>

      {/* Case Opening Section */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Case Opening</h2>
          <p className="text-sm text-muted-foreground">
            Client contact pursuit, scoring systems, and 53-task tracker for the case opening stage.
          </p>
        </div>
        <CardGrid cards={caseOpeningCards} />
      </div>

      {/* Treatment Monitoring Section */}
      <div className="mb-10">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Treatment Monitoring</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            25-task workflow covering client communication, appointment protocol, scoring, liens, discovery, and admin.
          </p>
        </div>
        <CardGrid cards={treatmentMonitoringCards} />
      </div>

      {/* Discovery Section */}
      <div className="mb-10">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Discovery</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            26-task workflow covering plaintiff discovery responses, client discovery appointments, scoring, deposition preparation, and court filing.
          </p>
        </div>
        <CardGrid cards={discoveryCards} />
      </div>

      {/* Expert & Deposition Section */}
      <div className="mb-10">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Expert &amp; Deposition</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            30-task workflow covering non-party depositions, expert retention, report follow-up, amended reports, IME scheduling, and client deposition tracking.
          </p>
        </div>
        <CardGrid cards={expertDepoCards} />
      </div>

      {/* Arbitration/Mediation Section */}
      <div className="mb-10">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Arbitration/Mediation</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            18-task workflow covering court notice, case prep, De Novo direction, mediation prep, and document production.
          </p>
        </div>
        <CardGrid cards={arbMedCards} />
      </div>

      {/* Trial Section */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Trial</h2>
            <span className="rounded-full bg-violet-700/10 px-2 py-0.5 text-xs font-medium text-violet-700">
              New
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            10-task workflow covering court notice, trial preparation, expert coordination, and readiness verification.
          </p>
        </div>
        <CardGrid cards={trialCards} />
      </div>
    </div>
  );
}
