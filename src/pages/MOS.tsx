import { useState, useEffect, useRef, useCallback } from 'react';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs.tsx';
import { initDb, loadGenericSection, saveGenericSection, loadApprovals, saveApprovals } from '../utils/db.ts';
import {
  Telescope, Users, BarChart3, Zap, Settings, Target,
  LayoutDashboard, ChevronDown, Plus, X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KPI {
  metric: string;
  goal: string;
}

interface PersonGroup {
  name: string;
  title: string;
  kpis: KPI[];
}

interface DivisionData {
  id: string;
  title: string;
  people: PersonGroup[];
}

interface RockOwner {
  name: string;
  emptyRows: number;
}

interface JaidenMetric {
  metric: string;
  target: string;
}

interface MeetingItem {
  section: string;
  time: string;
  purpose: string;
  highlight?: boolean;
}

interface MosIssue {
  description: string;
  raisedBy: string;
  date: string;
  priority: 'low' | 'med' | 'high';
  status: 'open' | 'resolved';
}

type SyncStatus = '' | 'Loading...' | 'Saving...' | 'Synced' | 'Saved' | 'Offline — changes not saved' | 'Save failed';

// ─── Data ────────────────────────────────────────────────────────────────────

const WEEK_HEADERS = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12','W13'];

const executiveLeaders = [
  { leader: 'Matt', divisions: 'Pre-LIT, Med Records, Claims, Workers Comp, NSA, Tech' },
  { leader: 'Ryan', divisions: 'LIT, PIP Arbs, Medical Marketing, Law Firm Marketing, Employment' },
  { leader: 'John', divisions: 'Intake, Marketing, Business LIT, Law Firm Marketing, Employment' },
  { leader: 'Frank / Mike', divisions: 'Finance, AR Billing' },
];

const departmentLeads = [
  { name: 'Brittany Hale', dept: 'Pre-LIT' },
  { name: 'Kennia Delgado', dept: 'LIT Paralegal' },
  { name: 'Marc Borden', dept: 'LIT Attorney' },
  { name: 'Amy Estrada', dept: 'Medical Marketing' },
  { name: 'Kevin Maleike', dept: 'Referrals' },
  { name: 'Marques Burgess', dept: 'Intake' },
  { name: 'Raphael Haddock', dept: 'Marketing' },
  { name: 'Michelle Brignola', dept: 'PIP Arbs' },
  { name: 'Ken Thayer', dept: 'Workers Comp' },
  { name: 'Mike Fortunato', dept: 'Employment' },
  { name: 'Kamran Ali', dept: 'NSA/IDR' },
  { name: 'Jaiden Johnson', dept: 'Treatment (BOC)' },
];

const vtoQuestions = [
  { num: 1, title: 'Core Values', desc: "The guiding principles that define BJB's culture and decision-making" },
  { num: 2, title: 'Core Focus (Purpose / Niche)', desc: 'Why BJB exists and what it does best' },
  { num: 3, title: '10-Year Target', desc: 'The big, long-range goal that drives the firm forward' },
  { num: 4, title: 'Marketing Strategy', desc: 'Target market, three uniques, proven process, guarantee' },
  { num: 5, title: '3-Year Picture', desc: 'Revenue, profit, measurables, and what BJB looks like in 3 years' },
  { num: 6, title: '1-Year Plan', desc: 'Revenue/profit targets and 3-7 goals for the year' },
  { num: 7, title: 'Quarterly Rocks', desc: 'The 3-7 most important priorities for the next 90 days' },
  { num: 8, title: 'Issues List', desc: 'Strategic issues to be solved, parked, or eliminated' },
];

const overviewCards = [
  { icon: Telescope, title: 'Vision', desc: 'Where are we going and why?' },
  { icon: Users, title: 'People', desc: 'Right people, right seats' },
  { icon: BarChart3, title: 'Data', desc: 'Weekly scorecards drive accountability' },
  { icon: Zap, title: 'Issues', desc: 'Identify, Discuss, Solve' },
  { icon: Settings, title: 'Process', desc: 'Document and follow the core processes' },
  { icon: Target, title: 'Traction', desc: 'Rocks + meeting pulse = execution' },
];

const divisions: DivisionData[] = [
  {
    id: 'div1',
    title: 'Division 1 — Matt (Pre-LIT / LIT / Claims / Med Records)',
    people: [
      {
        name: 'Brittany Hale', title: 'Pre-LIT',
        kpis: [
          { metric: 'Demand-ready cases pushed to LIT', goal: '8/wk' },
          { metric: 'Treatment grade A cases', goal: '60%' },
          { metric: 'Treatment grade B cases', goal: '30%' },
          { metric: 'Treatment grade C cases', goal: '<10%' },
          { metric: 'Treatment gaps >30 days', goal: '<15' },
          { metric: 'Active pre-lit cases', goal: 'Track' },
          { metric: 'Treatment follow-ups completed', goal: '50/wk' },
          { metric: 'Avg time to first treatment', goal: '<14 days' },
          { metric: 'Client contact compliance', goal: '>90%' },
          { metric: 'Liability grade A', goal: '50%' },
          { metric: 'Liability grade B', goal: '35%' },
          { metric: 'Liability grade C', goal: '<15%' },
          { metric: 'Provider coordination calls', goal: '25/wk' },
          { metric: 'Medical records requested', goal: 'Track' },
          { metric: 'Medical records received', goal: 'Track' },
          { metric: 'Cases with complete records', goal: '>80%' },
          { metric: 'UM/UIM identification', goal: '100%' },
          { metric: 'Lien resolution touches', goal: '10/wk' },
          { metric: 'Demand packages prepared', goal: '5/wk' },
        ],
      },
      {
        name: 'Kennia Delgado', title: 'LIT Paralegal',
        kpis: [
          { metric: 'Outstanding treatment touches (>5)', goal: '<5' },
          { metric: 'Overdue complaint filings (55 days)', goal: '0' },
          { metric: 'Service pending >35 days', goal: '<40' },
          { metric: 'Total pending service', goal: '<160' },
          { metric: 'Outstanding plaintiff discovery', goal: '<20' },
          { metric: 'Outstanding defendant discovery', goal: '<15' },
          { metric: 'Outstanding answers', goal: '<10' },
          { metric: '10-day letters timely', goal: '>80%' },
        ],
      },
      {
        name: 'Marc Borden', title: 'LIT Attorney',
        kpis: [
          { metric: 'Active LIT cases', goal: 'Track' },
          { metric: 'Settlement dollars', goal: 'Goal' },
          { metric: 'Settlement % to goal', goal: '100%' },
          { metric: 'Avg settlement value', goal: 'Track' },
          { metric: 'Avg time on desk (TOD)', goal: 'Track' },
          { metric: 'Filing timeliness', goal: '>95%' },
          { metric: 'Service timeliness', goal: '>90%' },
          { metric: 'Plaintiff discovery compliance', goal: '>90%' },
          { metric: 'Defendant discovery follow-up', goal: '>85%' },
          { metric: 'Interrogatory responses', goal: 'Track' },
          { metric: 'Document production', goal: 'Track' },
          { metric: 'Motion practice filed', goal: 'Track' },
          { metric: 'Motions granted rate', goal: '>60%' },
          { metric: 'Depositions scheduled', goal: 'Track' },
          { metric: 'Depositions completed', goal: 'Track' },
          { metric: 'Expert reports obtained', goal: 'Track' },
          { metric: 'IME responses', goal: 'Track' },
          { metric: 'Mediation scheduled', goal: 'Track' },
          { metric: 'Mediation settlement rate', goal: '>40%' },
          { metric: 'Trial-ready cases', goal: 'Track' },
          { metric: 'Data completeness score', goal: '>90%' },
          { metric: 'Client service score', goal: '>4.5' },
          { metric: 'Case status updates', goal: 'Weekly' },
          { metric: 'Billing compliance', goal: '>95%' },
        ],
      },
    ],
  },
  {
    id: 'div2',
    title: 'Division 2 — John/Ryan (Medical Marketing / Referrals / Intake / Marketing)',
    people: [
      {
        name: 'Amy Estrada', title: 'Medical Marketing',
        kpis: [
          { metric: 'Outbound calls', goal: '250/wk' },
          { metric: 'Appointments set', goal: '25/wk' },
          { metric: 'Appointments completed', goal: '20/wk' },
          { metric: 'Referrals generated', goal: '25/wk' },
          { metric: 'Conversion rate', goal: '>50%' },
        ],
      },
      {
        name: 'Kevin Maleike', title: 'Referrals',
        kpis: [
          { metric: 'Referrals received', goal: 'Track' },
          { metric: 'Referral conversion rate', goal: '>40%' },
          { metric: 'New referral sources', goal: '3/mo' },
          { metric: 'Active referral sources', goal: 'Track' },
          { metric: 'Revenue from referrals', goal: 'Track' },
          { metric: 'Dormant sources reactivated', goal: '2/mo' },
          { metric: 'Source engagement meetings', goal: '5/wk' },
          { metric: 'Medical provider referrals', goal: 'Track' },
          { metric: 'Attorney referrals', goal: 'Track' },
          { metric: 'Community referrals', goal: 'Track' },
          { metric: 'Referral follow-up time', goal: '<24hrs' },
          { metric: 'Source satisfaction score', goal: '>4.0' },
          { metric: 'Pipeline value', goal: 'Track' },
          { metric: 'Referral quality score', goal: 'Track' },
          { metric: 'Source retention rate', goal: '>80%' },
          { metric: 'New agreements signed', goal: '2/mo' },
          { metric: 'Marketing materials distributed', goal: 'Track' },
          { metric: 'Co-marketing events', goal: '1/mo' },
        ],
      },
      {
        name: 'Marques Burgess', title: 'Intake',
        kpis: [
          { metric: 'New leads', goal: 'Track' },
          { metric: 'Signed cases', goal: 'Goal' },
          { metric: 'Conversion rate', goal: '>25%' },
          { metric: 'Time to first contact', goal: '<5 min' },
          { metric: 'SLA compliance', goal: '>95%' },
          { metric: 'Callback attempts (3x)', goal: '100%' },
          { metric: 'Qualified leads', goal: 'Track' },
          { metric: 'Missed calls', goal: '<5%' },
          { metric: 'Answered rate', goal: '>95%' },
          { metric: 'Spanish intake available', goal: '100%' },
          { metric: 'After-hours coverage', goal: '100%' },
          { metric: 'Lead source tracking', goal: '100%' },
          { metric: 'Intake quality score', goal: '>4.0' },
          { metric: 'Fee agreement completion', goal: '100%' },
          { metric: 'Client onboarding time', goal: '<48hrs' },
          { metric: 'Retainer sent same day', goal: '>90%' },
          { metric: 'Welcome packet sent', goal: '>90%' },
          { metric: 'Initial docs collected', goal: '>80%' },
          { metric: 'CRM data accuracy', goal: '>95%' },
          { metric: 'Intake survey completion', goal: '>80%' },
        ],
      },
      {
        name: 'Raphael Haddock', title: 'Marketing',
        kpis: [
          { metric: 'Calls by content page', goal: 'Track' },
          { metric: 'Calls by geo market', goal: 'Track' },
          { metric: 'Inbound calls', goal: 'Track' },
          { metric: 'Qualified leads from marketing', goal: 'Track' },
          { metric: 'Signed cases from marketing', goal: 'Goal' },
          { metric: 'Marketing conversion rate', goal: 'Track' },
          { metric: 'Cost per signed case', goal: 'Track' },
          { metric: 'Website traffic', goal: 'Track' },
        ],
      },
    ],
  },
  {
    id: 'div3',
    title: 'Division 3 — Ryan/Matt (PIP Arbs, Workers Comp, Employment, NSA, Tech)',
    people: [
      {
        name: 'Michelle Brignola', title: 'PIP Arbs',
        kpis: [
          { metric: 'Active PIP cases', goal: 'Track' },
          { metric: 'New filings', goal: 'Track' },
          { metric: 'Hearings scheduled', goal: 'Track' },
          { metric: 'Hearings completed', goal: 'Track' },
          { metric: 'Awards received', goal: 'Track' },
          { metric: 'Dollars awarded', goal: 'Goal' },
          { metric: 'Time to hearing', goal: 'Track' },
          { metric: 'Success rate', goal: '>60%' },
          { metric: 'Appeals filed', goal: 'Track' },
          { metric: 'Appeals won', goal: 'Track' },
          { metric: 'Settlement offers', goal: 'Track' },
          { metric: 'Pre-hearing settlements', goal: 'Track' },
          { metric: 'Documentation compliance', goal: '>95%' },
          { metric: 'Client communication', goal: 'Weekly' },
        ],
      },
      {
        name: 'Ken Thayer', title: 'Workers Comp',
        kpis: [
          { metric: 'Active WC cases', goal: 'Track' },
          { metric: 'New cases weekly', goal: 'Track' },
          { metric: 'Cases resolved weekly', goal: 'Track' },
          { metric: 'Settlement dollars', goal: 'Goal' },
          { metric: 'Hearings attended', goal: 'Track' },
          { metric: 'Claim petitions filed', goal: 'Track' },
          { metric: 'Treatment authorizations', goal: 'Track' },
          { metric: 'Escalations to attorney', goal: 'Track' },
          { metric: 'Medical evidence obtained', goal: 'Track' },
        ],
      },
      {
        name: 'Mike Fortunato', title: 'Employment',
        kpis: [
          { metric: 'Active employment cases', goal: 'Track' },
          { metric: 'New intakes weekly', goal: 'Track' },
          { metric: 'EEOC filings', goal: 'Track' },
          { metric: 'State filings', goal: 'Track' },
          { metric: 'Settlements', goal: 'Goal' },
          { metric: 'Client satisfaction', goal: '>4.0' },
        ],
      },
      {
        name: 'Kamran Ali', title: 'NSA/IDR',
        kpis: [
          { metric: 'Active NSA disputes', goal: 'Track' },
          { metric: 'IDR filings submitted', goal: 'Track' },
          { metric: 'IDR determinations received', goal: 'Track' },
          { metric: 'Win rate', goal: '>50%' },
          { metric: 'Average award', goal: 'Track' },
          { metric: 'Turnaround time', goal: '<30 days' },
          { metric: 'Revenue collected', goal: 'Goal' },
        ],
      },
    ],
  },
];

const departmentScorecards = [
  'Pre-LIT', 'LIT Paralegal', 'LIT Attorney', 'Medical Marketing',
  'Referrals', 'Intake', 'Marketing', 'PIP Arbs', 'Workers Comp',
  'Employment', 'NSA/IDR', 'Treatment (BOC)',
];

const rockOwners: RockOwner[] = [
  { name: 'Matt', emptyRows: 3 },
  { name: 'Ryan', emptyRows: 3 },
  { name: 'John', emptyRows: 3 },
  { name: 'Jaiden', emptyRows: 2 },
];

const jaidenMetrics: JaidenMetric[] = [
  { metric: 'Active treatment cases', target: 'Track' },
  { metric: 'Provider onboarding', target: '3/mo' },
  { metric: 'Treatment compliance rate', target: '>85%' },
  { metric: 'Client satisfaction', target: '>4.5' },
  { metric: 'Revenue', target: 'Goal' },
  { metric: 'Cost per case', target: 'Track' },
];

const meetingAgenda: MeetingItem[] = [
  { section: 'Segue', time: '5 min', purpose: 'Good news — personal and professional' },
  { section: 'Scorecard', time: '5 min', purpose: 'Review weekly numbers, on/off track' },
  { section: 'Rock Review', time: '5 min', purpose: 'Each rock: on-track or off-track' },
  { section: 'Customer/Employee Headlines', time: '5 min', purpose: 'Quick wins and concerns' },
  { section: 'To-Do List', time: '5 min', purpose: 'Review last week completions' },
  { section: 'IDS', time: '60 min', purpose: 'Identify, Discuss, Solve — #1 priority', highlight: true },
  { section: 'Conclude', time: '5 min', purpose: 'Recap to-dos, rate meeting 1-10, cascade messages' },
];

const coreProcesses = [
  { name: 'Case Opening & Intake' },
  { name: 'Treatment Monitoring' },
  { name: 'Written Discovery' },
  { name: 'Expert & Deposition' },
  { name: 'Arbitration & Mediation' },
  { name: 'Trial Preparation' },
];

const quarterlySteps = [
  'Review prior quarter — what worked, what didn\'t',
  'Review V/TO — confirm or update',
  'Establish company Rocks for the next quarter',
  'Each leader sets individual Rocks',
  'Tackle #1 issue from the Issues List',
  'Next steps and action items',
  'Conclude with organizational checkup',
  'Everyone rates the session 1-10',
];

const sidebarSections = [
  { id: 'overview', label: 'MOS Overview', bold: true },
  { id: 'vision', label: '1. Vision (V/TO)', bold: false },
  { id: 'people', label: '2. People (Accountability)', bold: false },
  { id: 'data', label: '3. Data (Scorecards)', bold: false },
  { id: 'issues', label: '4. Issues (IDS)', bold: false },
  { id: 'process', label: '5. Process', bold: false },
  { id: 'traction', label: '6. Traction (Rocks + Meetings)', bold: false },
  { id: 'approval', label: 'Approval & Notes', bold: true },
];

const APPROVAL_KEYS = [
  { key: 'mos-vision', label: 'Vision/Traction Organizer reviewed' },
  { key: 'mos-accountability', label: 'Accountability chart confirmed' },
  { key: 'mos-scorecards', label: 'Weekly scorecards active' },
  { key: 'mos-issues', label: 'Issues list populated' },
  { key: 'mos-processes', label: 'Core processes documented' },
  { key: 'mos-rocks', label: 'Quarterly rocks set' },
];

// ─── Debounced save hook ─────────────────────────────────────────────────────

function useDebouncedSave<T>(sectionId: string, data: T, delay: number, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [, setSyncState] = useState<SyncStatus>('');
  const syncCallbackRef = useRef<((s: SyncStatus) => void) | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    setSyncState('Saving...');
    syncCallbackRef.current?.('Saving...');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const ok = await saveGenericSection(sectionId, data);
      const status: SyncStatus = ok ? 'Saved' : 'Save failed';
      setSyncState(status);
      syncCallbackRef.current?.(status);
      if (ok) setTimeout(() => { setSyncState(''); syncCallbackRef.current?.(''); }, 2000);
    }, delay);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), sectionId, delay, enabled]);

  return { setSyncCallback: (cb: (s: SyncStatus) => void) => { syncCallbackRef.current = cb; } };
}

// ─── Reusable components ─────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className={`w-4 h-4 text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`}
    />
  );
}

function CollapsibleSection({
  id, title, badge, open, onToggle, children,
}: {
  id?: string; title: string; badge?: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div id={id} className="rounded-lg border border-[#2a2a2a] bg-[#111] shadow-sm mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1a1a1a] transition-colors text-left"
      >
        <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
          {badge !== undefined && (
            <span
              className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: '#10b981' }}
            >
              {badge}
            </span>
          )}
          {title}
        </h3>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="border-t border-[#2a2a2a] px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

function SubCollapsibleSection({
  id, title, open, onToggle, children,
}: {
  id?: string; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div id={id} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] shadow-sm mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#222] transition-colors text-left"
      >
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="border-t border-[#2a2a2a] px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Editable Scorecard Table ────────────────────────────────────────────────

function ScorecardTable({
  people, divId, scorecardData, onCellChange,
}: {
  people: PersonGroup[];
  divId: string;
  scorecardData: Record<string, Record<string, Record<number, Record<number, string>>>>;
  onCellChange: (divId: string, person: string, kpiIdx: number, weekIdx: number, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-[#2a2a2a] whitespace-nowrap">
        <thead>
          <tr className="bg-[#1a1a1a]">
            <th className="px-2 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300 w-8">#</th>
            <th className="px-2 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">KPI / Metric</th>
            <th className="px-2 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300 w-16">Goal</th>
            {WEEK_HEADERS.map((w) => (
              <th key={w} className="px-2 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300 w-12">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <PersonKPIRows
              key={person.name}
              person={person}
              divId={divId}
              scorecardData={scorecardData}
              onCellChange={onCellChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonKPIRows({
  person, divId, scorecardData, onCellChange,
}: {
  person: PersonGroup;
  divId: string;
  scorecardData: Record<string, Record<string, Record<number, Record<number, string>>>>;
  onCellChange: (divId: string, person: string, kpiIdx: number, weekIdx: number, value: string) => void;
}) {
  return (
    <>
      <tr className="bg-emerald-900/20 border-b border-[#2a2a2a]">
        <td className="px-2 py-2 font-semibold text-emerald-400" colSpan={16}>
          {person.name} — {person.title}
        </td>
      </tr>
      {person.kpis.map((kpi, kpiIdx) => (
        <tr key={kpiIdx} className="border-b border-[#2a2a2a] hover:bg-[#222]">
          <td className="px-2 py-1 text-gray-400"></td>
          <td className="px-2 py-1 text-gray-300">{kpi.metric}</td>
          <td className="px-2 py-1 text-center text-gray-300">{kpi.goal}</td>
          {WEEK_HEADERS.map((_, weekIdx) => (
            <td key={weekIdx} className="px-0 py-0">
              <input
                type="text"
                className="w-full bg-transparent text-center text-xs text-gray-200 outline-none px-1 py-1 border border-transparent rounded hover:border-[#333] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={scorecardData?.[divId]?.[person.name]?.[kpiIdx]?.[weekIdx] ?? ''}
                onChange={(e) => onCellChange(divId, person.name, kpiIdx, weekIdx, e.target.value)}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Editable Rocks Table ────────────────────────────────────────────────────

const ROCK_CYCLE = ['', 'on-track', 'off-track', 'done'] as const;
type RockStatus = typeof ROCK_CYCLE[number];

function RockStatusDot({ value, onClick, size = 'md' }: { value: RockStatus; onClick: () => void; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const bg = value === 'on-track' ? 'bg-emerald-500 border-emerald-500'
    : value === 'off-track' ? 'bg-red-500 border-red-500'
    : value === 'done' ? 'bg-white border-white'
    : 'bg-transparent border-[#444]';
  return (
    <button
      onClick={onClick}
      className={`${sz} rounded-full border-2 ${bg} inline-block cursor-pointer transition-all`}
      title={value || 'empty — click to cycle'}
    />
  );
}

function RocksTable({
  rocksData, onDescChange, onStatusChange, onWeekStatusChange,
}: {
  rocksData: Record<string, { description: string; status: RockStatus; weeks: Record<number, RockStatus> }[]>;
  onDescChange: (owner: string, rowIdx: number, value: string) => void;
  onStatusChange: (owner: string, rowIdx: number) => void;
  onWeekStatusChange: (owner: string, rowIdx: number, weekIdx: number) => void;
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-xs border border-[#2a2a2a] whitespace-nowrap">
        <thead>
          <tr className="bg-[#1a1a1a]">
            <th className="px-2 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Responsible</th>
            <th className="px-2 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Rock</th>
            <th className="px-2 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Status</th>
            {WEEK_HEADERS.map((w) => (
              <th key={w} className="px-2 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300 w-10">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rockOwners.map((owner) => {
            const rows = rocksData[owner.name] || Array.from({ length: owner.emptyRows }, () => ({ description: '', status: '' as RockStatus, weeks: {} }));
            return (
              <RockOwnerRows
                key={owner.name}
                ownerName={owner.name}
                rows={rows}
                onDescChange={onDescChange}
                onStatusChange={onStatusChange}
                onWeekStatusChange={onWeekStatusChange}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RockOwnerRows({
  ownerName, rows, onDescChange, onStatusChange, onWeekStatusChange,
}: {
  ownerName: string;
  rows: { description: string; status: RockStatus; weeks: Record<number, RockStatus> }[];
  onDescChange: (owner: string, rowIdx: number, value: string) => void;
  onStatusChange: (owner: string, rowIdx: number) => void;
  onWeekStatusChange: (owner: string, rowIdx: number, weekIdx: number) => void;
}) {
  return (
    <>
      <tr className="bg-emerald-900/20 border-b border-[#2a2a2a]">
        <td className="px-2 py-1 font-semibold text-emerald-400">{ownerName}</td>
        <td className="px-2 py-1" colSpan={2 + WEEK_HEADERS.length}></td>
      </tr>
      {rows.map((row, rowIdx) => (
        <tr key={rowIdx} className="border-b border-[#2a2a2a]">
          <td className="px-2 py-1"></td>
          <td className="px-0 py-0">
            <input
              type="text"
              className="w-full bg-transparent text-xs text-gray-200 outline-none px-2 py-1 border border-transparent rounded hover:border-[#333] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Rock description..."
              value={row.description}
              onChange={(e) => onDescChange(ownerName, rowIdx, e.target.value)}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <RockStatusDot value={row.status} onClick={() => onStatusChange(ownerName, rowIdx)} />
          </td>
          {WEEK_HEADERS.map((_, weekIdx) => (
            <td key={weekIdx} className="px-2 py-1 text-center">
              <RockStatusDot
                value={(row.weeks[weekIdx] || '') as RockStatus}
                onClick={() => onWeekStatusChange(ownerName, rowIdx, weekIdx)}
                size="sm"
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Editable Jaiden Metrics ─────────────────────────────────────────────────

function JaidenMetricsTable({
  jaidenData, onCellChange,
}: {
  jaidenData: Record<number, Record<number, string>>;
  onCellChange: (metricIdx: number, weekIdx: number, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-xs border border-[#2a2a2a] whitespace-nowrap">
        <thead>
          <tr className="bg-[#1a1a1a]">
            <th className="px-2 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Metric</th>
            <th className="px-2 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Target</th>
            {WEEK_HEADERS.map((w) => (
              <th key={w} className="px-2 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300 w-12">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jaidenMetrics.map((m, mIdx) => (
            <tr key={mIdx} className="border-b border-[#2a2a2a] hover:bg-[#222]">
              <td className="px-2 py-1 text-gray-300">{m.metric}</td>
              <td className="px-2 py-1 text-center text-gray-300">{m.target}</td>
              {WEEK_HEADERS.map((_, weekIdx) => (
                <td key={weekIdx} className="px-0 py-0">
                  <input
                    type="text"
                    className="w-full bg-transparent text-center text-xs text-gray-200 outline-none px-1 py-1 border border-transparent rounded hover:border-[#333] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={jaidenData?.[mIdx]?.[weekIdx] ?? ''}
                    onChange={(e) => onCellChange(mIdx, weekIdx, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Issues List ─────────────────────────────────────────────────────────────

function IssuesList({
  issues, type, onUpdate,
}: {
  issues: MosIssue[];
  type: string;
  onUpdate: (issues: MosIssue[]) => void;
}) {
  const addIssue = () => {
    onUpdate([...issues, {
      description: '',
      raisedBy: '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority: 'med',
      status: 'open',
    }]);
  };

  const updateField = (idx: number, field: keyof MosIssue, value: string) => {
    const next = [...issues];
    (next[idx] as unknown as Record<string, string>)[field] = value;
    onUpdate(next);
  };

  const toggleStatus = (idx: number) => {
    const next = [...issues];
    next[idx].status = next[idx].status === 'resolved' ? 'open' : 'resolved';
    onUpdate(next);
  };

  const removeIssue = (idx: number) => {
    onUpdate(issues.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-5">
      {issues.length === 0 ? (
        <p className="text-xs text-gray-500 py-3">No issues yet. Click "Add Issue" to create one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-[#2a2a2a]">
            <thead>
              <tr className="bg-[#1a1a1a]">
                {['#', 'Issue', 'Raised By', 'Date', 'Priority', 'Status', ''].map((h) => (
                  <th key={h} className={`px-3 py-2 ${h === 'Priority' || h === 'Status' || h === '' ? 'text-center' : 'text-left'} font-semibold border-b border-[#2a2a2a] text-gray-300`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, idx) => (
                <tr key={`${type}-${idx}`} className="border-b border-[#2a2a2a]">
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                  <td className="px-1 py-0">
                    <input
                      type="text"
                      className="w-full bg-transparent text-xs text-gray-200 outline-none px-2 py-1 border border-transparent rounded hover:border-[#333] focus:border-emerald-500"
                      value={issue.description}
                      onChange={(e) => updateField(idx, 'description', e.target.value)}
                      placeholder="Describe the issue..."
                    />
                  </td>
                  <td className="px-1 py-0">
                    <input
                      type="text"
                      className="w-24 bg-transparent text-xs text-gray-200 outline-none px-2 py-1 border border-transparent rounded hover:border-[#333] focus:border-emerald-500"
                      value={issue.raisedBy}
                      onChange={(e) => updateField(idx, 'raisedBy', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-500">{issue.date}</td>
                  <td className="px-3 py-2 text-center">
                    <select
                      className={`text-xs bg-transparent border border-[#2a2a2a] rounded px-1 py-0.5 ${
                        issue.priority === 'high' ? 'text-red-400 font-semibold' : issue.priority === 'med' ? 'text-yellow-400' : 'text-gray-500'
                      }`}
                      value={issue.priority}
                      onChange={(e) => updateField(idx, 'priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="med">Med</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleStatus(idx)}
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer select-none ${
                        issue.status === 'resolved' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-yellow-900/40 text-yellow-400'
                      }`}
                    >
                      {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => removeIssue(idx)} className="text-gray-500 hover:text-red-400 transition-colors" title="Remove">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={addIssue}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-800 rounded-md hover:bg-emerald-900/30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Issue
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MOS() {
  // Section toggle state
  const [sections, setSections] = useState<Record<string, boolean>>({
    overview: true, vision: true, people: true, data: true, issues: true, process: true, traction: true, approval: true,
  });
  const [divSections, setDivSections] = useState<Record<string, boolean>>({
    div1: true, div2: true, div3: true, deptScorecard: true,
  });

  // Interactive data
  const [scorecardData, setScorecardData] = useState<Record<string, Record<string, Record<number, Record<number, string>>>>>({});
  const [rocksData, setRocksData] = useState<Record<string, { description: string; status: RockStatus; weeks: Record<number, RockStatus> }[]>>({});
  const [jaidenData, setJaidenData] = useState<Record<number, Record<number, string>>>({});
  const [issuesCompany, setIssuesCompany] = useState<MosIssue[]>([]);
  const [issuesDept, setIssuesDept] = useState<MosIssue[]>([]);
  const [approvalState, setApprovalState] = useState<Record<string, { checked: boolean; date: string }>>({});
  const [notes, setNotes] = useState('');

  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('');
  const [, setDbReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Debounced saves
  useDebouncedSave('mos-scorecards', scorecardData, 800, dataLoaded);
  useDebouncedSave('mos-rocks', rocksData, 800, dataLoaded);
  useDebouncedSave('mos-jaiden', jaidenData, 800, dataLoaded);
  useDebouncedSave('mos-issues-company', { issues: issuesCompany }, 300, dataLoaded);
  useDebouncedSave('mos-issues-dept', { issues: issuesDept }, 300, dataLoaded);

  // Approval + notes debounced save
  const apprTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveApprDebounced = useCallback((cb: Record<string, { checked: boolean; date: string }>, n: string, delay: number) => {
    clearTimeout(apprTimerRef.current);
    apprTimerRef.current = setTimeout(async () => {
      setSyncStatus('Saving...');
      const ok = await saveApprovals('mos', cb, n);
      setSyncStatus(ok ? 'Saved' : 'Save failed');
      if (ok) setTimeout(() => setSyncStatus(''), 2000);
    }, delay);
  }, []);

  // Load all data on mount
  useEffect(() => {
    (async () => {
      setSyncStatus('Loading...');
      const ok = await initDb();
      setDbReady(ok);
      if (!ok) { setSyncStatus('Offline — changes not saved'); return; }

      const [sc, rk, jd, ic, id, appr] = await Promise.all([
        loadGenericSection<typeof scorecardData>('mos-scorecards'),
        loadGenericSection<typeof rocksData>('mos-rocks'),
        loadGenericSection<typeof jaidenData>('mos-jaiden'),
        loadGenericSection<{ issues: MosIssue[] }>('mos-issues-company'),
        loadGenericSection<{ issues: MosIssue[] }>('mos-issues-dept'),
        loadApprovals('mos'),
      ]);

      if (sc) setScorecardData(sc);
      if (rk) setRocksData(rk);
      if (jd) setJaidenData(jd);
      if (ic?.issues) setIssuesCompany(ic.issues);
      if (id?.issues) setIssuesDept(id.issues);
      if (appr) {
        setApprovalState(appr.checkboxes || {});
        setNotes(appr.notes || '');
      }

      setDataLoaded(true);
      setSyncStatus('Synced');
      setTimeout(() => setSyncStatus(''), 3000);
    })();
  }, []);

  // Handlers
  const toggle = (key: string) => setSections((s) => ({ ...s, [key]: !s[key] }));
  const toggleDiv = (key: string) => setDivSections((s) => ({ ...s, [key]: !s[key] }));
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleScorecardChange = useCallback((divId: string, person: string, kpiIdx: number, weekIdx: number, value: string) => {
    setScorecardData((prev) => {
      const next = { ...prev };
      if (!next[divId]) next[divId] = {};
      if (!next[divId][person]) next[divId][person] = {};
      if (!next[divId][person][kpiIdx]) next[divId][person][kpiIdx] = {};
      next[divId][person][kpiIdx] = { ...next[divId][person][kpiIdx], [weekIdx]: value };
      return next;
    });
  }, []);

  const handleRockDescChange = useCallback((owner: string, rowIdx: number, value: string) => {
    setRocksData((prev) => {
      const next = { ...prev };
      const ownerData = rockOwners.find((o) => o.name === owner);
      if (!next[owner]) next[owner] = Array.from({ length: ownerData?.emptyRows || 3 }, () => ({ description: '', status: '' as RockStatus, weeks: {} }));
      next[owner] = [...next[owner]];
      next[owner][rowIdx] = { ...next[owner][rowIdx], description: value };
      return next;
    });
  }, []);

  const handleRockStatusChange = useCallback((owner: string, rowIdx: number) => {
    setRocksData((prev) => {
      const next = { ...prev };
      const ownerData = rockOwners.find((o) => o.name === owner);
      if (!next[owner]) next[owner] = Array.from({ length: ownerData?.emptyRows || 3 }, () => ({ description: '', status: '' as RockStatus, weeks: {} }));
      next[owner] = [...next[owner]];
      const cur = next[owner][rowIdx].status;
      const curIdx = ROCK_CYCLE.indexOf(cur || '');
      next[owner][rowIdx] = { ...next[owner][rowIdx], status: ROCK_CYCLE[(curIdx + 1) % ROCK_CYCLE.length] };
      return next;
    });
  }, []);

  const handleRockWeekStatusChange = useCallback((owner: string, rowIdx: number, weekIdx: number) => {
    setRocksData((prev) => {
      const next = { ...prev };
      const ownerData = rockOwners.find((o) => o.name === owner);
      if (!next[owner]) next[owner] = Array.from({ length: ownerData?.emptyRows || 3 }, () => ({ description: '', status: '' as RockStatus, weeks: {} }));
      next[owner] = [...next[owner]];
      const weeks = { ...next[owner][rowIdx].weeks };
      const cur = (weeks[weekIdx] || '') as RockStatus;
      const curIdx = ROCK_CYCLE.indexOf(cur);
      weeks[weekIdx] = ROCK_CYCLE[(curIdx + 1) % ROCK_CYCLE.length];
      next[owner][rowIdx] = { ...next[owner][rowIdx], weeks };
      return next;
    });
  }, []);

  const handleJaidenChange = useCallback((metricIdx: number, weekIdx: number, value: string) => {
    setJaidenData((prev) => {
      const next = { ...prev };
      if (!next[metricIdx]) next[metricIdx] = {};
      next[metricIdx] = { ...next[metricIdx], [weekIdx]: value };
      return next;
    });
  }, []);

  const handleApprovalToggle = useCallback((key: string) => {
    setApprovalState((prev) => {
      const next = { ...prev };
      const isChecked = !next[key]?.checked;
      next[key] = { checked: isChecked, date: isChecked ? new Date().toLocaleDateString() : '' };
      saveApprDebounced(next, notes, 200);
      return next;
    });
  }, [notes, saveApprDebounced]);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    saveApprDebounced(approvalState, value, 1200);
  }, [approvalState, saveApprDebounced]);

  const syncColor = syncStatus === 'Synced' || syncStatus === 'Saved' ? '#10b981'
    : syncStatus === 'Save failed' || syncStatus.startsWith('Offline') ? '#ef4444'
    : syncStatus ? '#737373' : 'transparent';

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[{ label: 'Development', path: '/performance-infrastructure' }, { label: 'MOS' }]} />

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col shrink-0">
          <div className="sticky top-6">
            <div className="pb-4 border-b border-[#2a2a2a] mb-3">
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">MOS Framework</h2>
              <p className="text-[11px] text-gray-500 mt-1">v2.0 · March 2026</p>
            </div>
            <nav className="space-y-0.5">
              {sidebarSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors hover:bg-[#222] hover:text-white ${
                    s.bold ? 'font-semibold text-white' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 max-w-5xl">
          {/* Header */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-lg font-bold text-white">BJB Management Operating System (MOS)</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  A structured framework for running the firm with discipline, accountability, and alignment
                </p>
              </div>
              <div className="flex items-center gap-3">
                {syncStatus && (
                  <span className="text-[11px] font-medium" style={{ color: syncColor }}>{syncStatus}</span>
                )}
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ background: '#10b981' }}
                >
                  v2.0 · March 2026
                </span>
              </div>
            </div>
          </div>

          {/* OVERVIEW */}
          <CollapsibleSection
            id="overview"
            title="MOS Overview"
            badge={<LayoutDashboard className="w-4 h-4" />}
            open={sections.overview}
            onToggle={() => toggle('overview')}
          >
            <p className="text-sm text-gray-400 mb-6">
              The <strong className="text-gray-200">Management Operating System (MOS)</strong> is BJB's structured
              framework for running the firm, inspired by EOS (Entrepreneurial Operating System). It provides a
              complete set of tools and disciplines to align the leadership team, drive accountability, and ensure
              consistent execution across all departments. MOS is built on six key components:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overviewCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg border border-[#2a2a2a] p-4 hover:shadow-md transition-shadow bg-[#222]"
                >
                  <div
                    className="w-10 h-10 rounded-lg inline-flex items-center justify-center mb-3 text-white"
                    style={{ background: '#10b981' }}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{card.title}</h4>
                  <p className="text-xs text-gray-500">{card.desc}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* 1. VISION */}
          <CollapsibleSection
            id="vision"
            title="Vision — V/TO (Vision/Traction Organizer)"
            badge={1}
            open={sections.vision}
            onToggle={() => toggle('vision')}
          >
            <p className="text-sm text-gray-400 mb-4">
              The V/TO captures the firm's vision and plan on two pages. It answers eight fundamental questions:
            </p>
            <div className="space-y-3 mb-5">
              {vtoQuestions.map((q) => (
                <div key={q.num} className="rounded-md border border-[#2a2a2a] p-3 bg-[#222]">
                  <span className="font-semibold text-white">{q.num}. {q.title}</span>
                  <p className="text-xs text-gray-500 mt-1">{q.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-md border-l-4 p-4 bg-emerald-900/20 text-sm text-gray-300" style={{ borderColor: '#10b981' }}>
              <strong>Note:</strong> The V/TO is a living 2-page document reviewed quarterly at the annual and quarterly planning sessions.
            </div>
          </CollapsibleSection>

          {/* 2. PEOPLE */}
          <CollapsibleSection
            id="people"
            title="People — Accountability Chart"
            badge={2}
            open={sections.people}
            onToggle={() => toggle('people')}
          >
            <h4 className="text-sm font-semibold text-white mb-3">Executive Level</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Leader</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Divisions</th>
                  </tr>
                </thead>
                <tbody>
                  {executiveLeaders.map((e) => (
                    <tr key={e.leader} className="border-b border-[#2a2a2a]">
                      <td className="px-3 py-2 font-medium text-gray-200">{e.leader}</td>
                      <td className="px-3 py-2 text-gray-400">{e.divisions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold text-white mb-3">Department Leads</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Department Lead</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentLeads.map((d) => (
                    <tr key={d.name} className="border-b border-[#2a2a2a]">
                      <td className="px-3 py-2 text-gray-300">{d.name}</td>
                      <td className="px-3 py-2 text-gray-400">{d.dept}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold text-white mb-3">GWC Assessment Template</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Name</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Gets It</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Wants It</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Capacity</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Fit?</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((i) => (
                    <tr key={i} className="border-b border-[#2a2a2a]">
                      <td className="px-3 py-2 text-gray-400">&nbsp;</td>
                      <td className="px-3 py-2 text-center text-gray-500">{'\u2610'}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{'\u2610'}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{'\u2610'}</td>
                      <td className="px-3 py-2 text-center text-gray-500">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-md border-l-4 p-4 bg-emerald-900/20 text-sm text-gray-300" style={{ borderColor: '#10b981' }}>
              <strong>Note:</strong> Every seat has one person accountable. Use GWC (Gets it, Wants it, Capacity to do it) to evaluate fit.
            </div>
          </CollapsibleSection>

          {/* 3. DATA */}
          <CollapsibleSection
            id="data"
            title="Data — Weekly Scorecards"
            badge={3}
            open={sections.data}
            onToggle={() => toggle('data')}
          >
            <p className="text-sm text-gray-400 mb-5">
              Executive-level scorecards organized by division. Each metric is reviewed weekly at the L10 meeting — on-track or off-track. <strong className="text-gray-300">Click any week cell to enter data.</strong>
            </p>

            {divisions.map((div) => (
              <SubCollapsibleSection
                key={div.id}
                id={div.id}
                title={div.title}
                open={divSections[div.id] ?? true}
                onToggle={() => toggleDiv(div.id)}
              >
                <ScorecardTable
                  people={div.people}
                  divId={div.id}
                  scorecardData={scorecardData}
                  onCellChange={handleScorecardChange}
                />
              </SubCollapsibleSection>
            ))}

            <SubCollapsibleSection
              id="deptScorecard"
              title="Department-Level Scorecards"
              open={divSections.deptScorecard ?? true}
              onToggle={() => toggleDiv('deptScorecard')}
            >
              <p className="text-sm text-gray-400 mb-4">Each department maintains two scorecard tiers:</p>
              <ul className="text-sm text-gray-400 mb-5 list-disc pl-5 space-y-1">
                <li><strong className="text-gray-200">Manager Meeting with Team Lead</strong> — Team Lead reports their departmental KPIs</li>
                <li><strong className="text-gray-200">Team Lead Meeting with Team</strong> — Individual team members report their personal KPIs</li>
              </ul>
              <p className="text-xs text-gray-500 mb-4">
                Below is the template structure for each department. Populate with department-specific metrics during quarterly planning.
              </p>
              <div className="space-y-4">
                {departmentScorecards.map((dept, i) => (
                  <div key={dept} className={i < departmentScorecards.length - 1 ? 'border-b border-[#2a2a2a] pb-3' : 'pb-3'}>
                    <h5 className="text-xs font-bold text-emerald-400 mb-2">{dept}</h5>
                    <EmptyWeekTable headers={['Name', 'Metric', 'Weekly Goal']} />
                  </div>
                ))}
              </div>
            </SubCollapsibleSection>
          </CollapsibleSection>

          {/* 4. ISSUES */}
          <CollapsibleSection
            id="issues"
            title="Issues — IDS Process"
            badge={4}
            open={sections.issues}
            onToggle={() => toggle('issues')}
          >
            <h4 className="text-sm font-semibold text-white mb-3">Company-Level Issues List</h4>
            <IssuesList issues={issuesCompany} type="company" onUpdate={setIssuesCompany} />

            <h4 className="text-sm font-semibold text-white mb-3">Department-Level Issues List</h4>
            <IssuesList issues={issuesDept} type="dept" onUpdate={setIssuesDept} />

            <h4 className="text-sm font-semibold text-white mb-4">IDS Methodology</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {[
                { letter: 'I', word: 'Identify', desc: 'Name the root issue, not the symptom. Dig deeper with "what\'s the real issue here?"' },
                { letter: 'D', word: 'Discuss', desc: 'Open, honest, solutions-focused discussion. Everyone speaks. Stay on topic. No tangents.' },
                { letter: 'S', word: 'Solve', desc: 'Decide on the solution. Assign a To-Do (7-day action item) or Rock (90-day priority) with a single owner.' },
              ].map((ids) => (
                <div
                  key={ids.letter}
                  className="rounded-lg border-l-4 p-4 bg-[#222] border border-[#2a2a2a]"
                  style={{ borderLeftColor: '#10b981' }}
                >
                  <h5 className="text-sm font-bold text-white mb-2">{ids.letter} — {ids.word}</h5>
                  <p className="text-xs text-gray-500">{ids.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-md border-l-4 p-4 bg-emerald-900/20 text-sm text-gray-300" style={{ borderColor: '#10b981' }}>
              <strong>Note:</strong> IDS is the heartbeat of the Level 10 Meeting. Spend 60 of 90 minutes here.
            </div>
          </CollapsibleSection>

          {/* 5. PROCESS */}
          <CollapsibleSection
            id="process"
            title="Process — Core Processes"
            badge={5}
            open={sections.process}
            onToggle={() => toggle('process')}
          >
            <h4 className="text-sm font-semibold text-white mb-3">Documented Processes</h4>
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-xs border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Process</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Spec Link</th>
                  </tr>
                </thead>
                <tbody>
                  {coreProcesses.map((p) => (
                    <tr key={p.name} className="border-b border-[#2a2a2a]">
                      <td className="px-3 py-2 text-gray-300">{p.name}</td>
                      <td className="px-3 py-2">
                        <span className="text-emerald-400 hover:underline cursor-pointer">View Spec &rarr;</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold text-white mb-3">Process Documentation Template</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    {['Process Name', 'Owner', 'Key Steps', 'Last Reviewed'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((i) => (
                    <tr key={i} className="border-b border-[#2a2a2a]">
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-md border-l-4 p-4 bg-emerald-900/20 text-sm text-gray-300" style={{ borderColor: '#10b981' }}>
              <strong>80/20 Rule:</strong> Document the 20% of steps that produce 80% of results. Keep it simple, keep it followed.
            </div>
          </CollapsibleSection>

          {/* 6. TRACTION */}
          <CollapsibleSection
            id="traction"
            title="Traction — Rocks + Meeting Pulse"
            badge={6}
            open={sections.traction}
            onToggle={() => toggle('traction')}
          >
            <h4 className="text-sm font-semibold text-white mb-3">Rocks — Q2 2026</h4>
            <p className="text-xs text-gray-500 mb-3">Click rock description to edit. Click status dots to cycle: empty → on-track (green) → off-track (red) → done (white).</p>
            <RocksTable
              rocksData={rocksData}
              onDescChange={handleRockDescChange}
              onStatusChange={handleRockStatusChange}
              onWeekStatusChange={handleRockWeekStatusChange}
            />

            <h4 className="text-sm font-semibold text-white mb-3">Jaiden Johnson — Misc Metrics</h4>
            <JaidenMetricsTable jaidenData={jaidenData} onCellChange={handleJaidenChange} />

            {/* Meeting Pulse */}
            <h4 className="text-sm font-semibold text-white mb-3">Meeting Pulse</h4>
            <h5 className="text-xs font-semibold text-gray-200 mb-2">Weekly: Level 10 Meeting (90 min)</h5>
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-xs border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Section</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-[#2a2a2a] text-gray-300">Time</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#2a2a2a] text-gray-300">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {meetingAgenda.map((item) => (
                    <tr key={item.section} className={`border-b border-[#2a2a2a] ${item.highlight ? 'bg-emerald-900/20' : ''}`}>
                      <td className={`px-3 py-2 ${item.highlight ? 'font-bold text-emerald-400' : 'font-medium text-gray-300'}`}>{item.section}</td>
                      <td className={`px-3 py-2 text-center ${item.highlight ? 'font-bold text-emerald-400' : 'text-gray-400'}`}>{item.time}</td>
                      <td className={`px-3 py-2 ${item.highlight ? 'font-medium text-emerald-400' : 'text-gray-400'}`}>{item.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h5 className="text-xs font-semibold text-gray-200 mb-3">Two-Tier Meeting Structure</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {[
                { title: 'Executive L10', desc: 'Matt, Ryan, John, Frank/Mike reviewing division scorecards' },
                { title: 'Department L10', desc: 'Manager with Team Lead reviewing department scorecard' },
                { title: 'Team L10', desc: 'Team Lead with Team Members reviewing individual KPIs' },
              ].map((tier) => (
                <div key={tier.title} className="rounded-lg border border-[#2a2a2a] p-3 bg-[#222]">
                  <h6 className="text-xs font-bold text-white mb-1">{tier.title}</h6>
                  <p className="text-xs text-gray-500">{tier.desc}</p>
                </div>
              ))}
            </div>

            <h5 className="text-xs font-semibold text-gray-200 mb-2">Quarterly Planning (Full Day — 8 Steps)</h5>
            <ol className="text-xs text-gray-400 list-decimal pl-5 space-y-1 mb-5">
              {quarterlySteps.map((step) => (<li key={step}>{step}</li>))}
            </ol>

            <h5 className="text-xs font-semibold text-gray-200 mb-2">Annual Planning (2-Day Extended Session)</h5>
            <p className="text-xs text-gray-400">
              Extended session to reset the V/TO, establish 1-year plan, set annual goals, define Q1 Rocks, and align the leadership team.
            </p>
          </CollapsibleSection>

          {/* APPROVAL & NOTES */}
          <CollapsibleSection
            id="approval"
            title="Approval & Notes"
            open={sections.approval}
            onToggle={() => toggle('approval')}
          >
            <h4 className="text-sm font-semibold text-white mb-4">MOS Implementation Checklist</h4>
            <div className="space-y-3 mb-6">
              {APPROVAL_KEYS.map((item) => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={approvalState[item.key]?.checked || false}
                    onChange={() => handleApprovalToggle(item.key)}
                    className="w-4 h-4 rounded border-[#444] bg-transparent accent-emerald-500"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
                  {approvalState[item.key]?.date && (
                    <span className="text-[10px] text-gray-500 ml-auto">({approvalState[item.key].date})</span>
                  )}
                </label>
              ))}
            </div>

            <h4 className="text-sm font-semibold text-white mb-3">Notes</h4>
            <textarea
              className="w-full h-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm text-gray-300 outline-none resize-y focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-gray-600"
              placeholder="Meeting notes, action items, or observations..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
            />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

// ─── Empty Week Table (used by dept scorecards) ──────────────────────────────

function EmptyWeekTable({ headers }: { headers: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-[#2a2a2a] whitespace-nowrap">
        <thead>
          <tr className="bg-[#1a1a1a]">
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 text-left border-b border-[#2a2a2a] text-gray-300 font-semibold">{h}</th>
            ))}
            {WEEK_HEADERS.map((w) => (
              <th key={w} className="px-2 py-1 text-center border-b border-[#2a2a2a] text-gray-300 w-10 font-semibold">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1].map((i) => (
            <tr key={i} className="border-b border-[#2a2a2a]">
              {headers.map((h) => (<td key={h} className="px-2 py-1"></td>))}
              {WEEK_HEADERS.map((w) => (<td key={w} className="px-2 py-1"></td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
