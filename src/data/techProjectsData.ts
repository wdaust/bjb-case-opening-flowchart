// ── Tech Projects — Types, Constants, Label Maps, Helpers ──────────────────
// Shared data definitions for the Tech Projects tracking page.

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectCategory = 'infrastructure' | 'application' | 'integration' | 'vendor' | 'security' | 'process';
export type ProjectStatus = 'backlog' | 'planning' | 'in-progress' | 'in-review' | 'done' | 'on-hold' | 'blocked';
export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectHealth = 'green' | 'amber' | 'red';
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

export interface ProjectTask {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  notes?: string;
}

export interface ProjectNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  pinned?: boolean;
}

export interface TechProject {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  health: ProjectHealth;
  owner: string;
  stakeholders: string[];
  startDate: string;
  targetDate: string;
  completedDate?: string;
  progress: number; // 0-100
  tags: string[];
  tasks: ProjectTask[];
  notes: ProjectNote[];
  createdAt: string;
  updatedAt: string;
}

export interface TechProjectsStore {
  projects: TechProject[];
  version: number;
}

// ─── Label Maps ──────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  backlog: 'Backlog',
  planning: 'Planning',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
  'on-hold': 'On Hold',
  blocked: 'Blocked',
};

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  infrastructure: 'Infrastructure',
  application: 'Application',
  integration: 'Integration',
  vendor: 'Vendor',
  security: 'Security',
  process: 'Process',
};

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const HEALTH_LABELS: Record<ProjectHealth, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red: 'Off Track',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

// ─── Color Maps (dark-theme safe) ────────────────────────────────────────────

export const PRIORITY_COLORS: Record<ProjectPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  high:     { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium:   { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  low:      { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
};

export const HEALTH_DOT_COLORS: Record<ProjectHealth, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  backlog:      { bg: 'bg-gray-500/15', text: 'text-gray-400' },
  planning:     { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  'in-progress':{ bg: 'bg-blue-500/15', text: 'text-blue-400' },
  'in-review':  { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  done:         { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  'on-hold':    { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  blocked:      { bg: 'bg-red-500/15', text: 'text-red-400' },
};

export const CATEGORY_COLORS: Record<ProjectCategory, { bg: string; text: string }> = {
  infrastructure: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  application:    { bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
  integration:    { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  vendor:         { bg: 'bg-pink-500/15', text: 'text-pink-400' },
  security:       { bg: 'bg-red-500/15', text: 'text-red-400' },
  process:        { bg: 'bg-teal-500/15', text: 'text-teal-400' },
};

// ─── Chart Colors ────────────────────────────────────────────────────────────

export const STATUS_CHART_COLORS: Record<ProjectStatus, string> = {
  backlog: '#6b7280', planning: '#8b5cf6', 'in-progress': '#3b82f6',
  'in-review': '#f59e0b', done: '#10b981', 'on-hold': '#4b5563', blocked: '#ef4444',
};

export const PRIORITY_CHART_COLORS: Record<ProjectPriority, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#6b7280',
};

// ─── Kanban Configuration ────────────────────────────────────────────────────

export const KANBAN_COLUMNS: { status: ProjectStatus; label: string; muted?: boolean }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'planning', label: 'Planning' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'in-review', label: 'In Review' },
  { status: 'done', label: 'Done' },
  { status: 'on-hold', label: 'On Hold', muted: true },
  { status: 'blocked', label: 'Blocked', muted: true },
];

// ─── Team Members (for dropdowns) ────────────────────────────────────────────

export const TEAM_MEMBERS = ['David', 'Michael', 'Sarah', 'James', 'Robert', 'Unassigned'];

// ─── All values (for filter dropdowns) ───────────────────────────────────────

export const ALL_STATUSES: ProjectStatus[] = ['backlog', 'planning', 'in-progress', 'in-review', 'done', 'on-hold', 'blocked'];
export const ALL_PRIORITIES: ProjectPriority[] = ['critical', 'high', 'medium', 'low'];
export const ALL_HEALTHS: ProjectHealth[] = ['green', 'amber', 'red'];
export const ALL_CATEGORIES: ProjectCategory[] = ['infrastructure', 'application', 'integration', 'vendor', 'security', 'process'];

// ─── Factory Functions ───────────────────────────────────────────────────────

export function createEmptyProject(): TechProject {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    category: 'application',
    status: 'backlog',
    priority: 'medium',
    health: 'green',
    owner: '',
    stakeholders: [],
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    progress: 0,
    tags: [],
    tasks: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyTask(): ProjectTask {
  return { id: crypto.randomUUID(), title: '', assignee: 'Unassigned', status: 'todo', priority: 'medium' };
}

export function createEmptyNote(author: string): ProjectNote {
  return { id: crypto.randomUUID(), author, content: '', createdAt: new Date().toISOString(), pinned: false };
}

// ─── Computed Stats ──────────────────────────────────────────────────────────

export function computeStats(projects: TechProject[]) {
  const active = projects.filter(p => ['planning', 'in-progress', 'in-review'].includes(p.status));
  const onTrack = projects.filter(p => p.health === 'green' && p.status !== 'done');
  const atRisk = projects.filter(p => (p.health === 'amber' || p.health === 'red') && p.status !== 'done');

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const completedThisMonth = projects.filter(p => p.status === 'done' && p.completedDate?.startsWith(thisMonth));

  const overdueTasks = projects.reduce((count, p) =>
    count + p.tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).length, 0);

  return {
    activeCount: active.length,
    onTrackCount: onTrack.length,
    atRiskCount: atRisk.length,
    overdueTasks,
    completedThisMonth: completedThisMonth.length,
  };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_PROJECTS: TechProject[] = [
  {
    id: 'proj-1', name: 'Litify Case Management Migration',
    description: 'Migrate case management workflows from legacy system to Litify. Includes data migration, custom object configuration, and user training.',
    category: 'vendor', status: 'in-progress', priority: 'critical', health: 'amber',
    owner: 'David', stakeholders: ['Michael', 'Sarah', 'Legal Team'],
    startDate: '2026-01-15', targetDate: '2026-06-30', progress: 35,
    tags: ['litify', 'migration', 'legal'],
    tasks: [
      { id: 't1', title: 'Data mapping document', assignee: 'David', status: 'done', priority: 'high' },
      { id: 't2', title: 'Custom object configuration', assignee: 'David', status: 'in-progress', priority: 'high', dueDate: '2026-04-01' },
      { id: 't3', title: 'User acceptance testing', assignee: 'Sarah', status: 'todo', priority: 'medium', dueDate: '2026-05-15' },
      { id: 't4', title: 'Data migration scripts', assignee: 'James', status: 'in-progress', priority: 'high', dueDate: '2026-04-15' },
      { id: 't5', title: 'Training materials', assignee: 'Sarah', status: 'todo', priority: 'medium', dueDate: '2026-06-01' },
    ],
    notes: [
      { id: 'n1', author: 'David', content: 'Vendor confirmed API access for data migration. Need to schedule kickoff with legal team.', createdAt: '2026-02-10T14:00:00Z', pinned: true },
      { id: 'n2', author: 'Michael', content: 'Budget approved for Phase 1. Phase 2 funding pending Q2 review.', createdAt: '2026-01-20T10:00:00Z' },
    ],
    createdAt: '2026-01-10T09:00:00Z', updatedAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'proj-2', name: 'Network Infrastructure Upgrade',
    description: 'Upgrade office switches, APs, and cabling for increased bandwidth and new VoIP system.',
    category: 'infrastructure', status: 'planning', priority: 'high', health: 'green',
    owner: 'James', stakeholders: ['Robert', 'Facilities'],
    startDate: '2026-03-01', targetDate: '2026-05-15', progress: 15,
    tags: ['network', 'hardware', 'voip'],
    tasks: [
      { id: 't6', title: 'Network assessment', assignee: 'James', status: 'done', priority: 'high' },
      { id: 't7', title: 'Vendor quotes for equipment', assignee: 'James', status: 'in-progress', priority: 'high', dueDate: '2026-03-20' },
      { id: 't8', title: 'Installation schedule', assignee: 'Robert', status: 'todo', priority: 'medium', dueDate: '2026-04-01' },
    ],
    notes: [{ id: 'n3', author: 'James', content: 'Current switches 5+ years old. Replace before warranty expires.', createdAt: '2026-02-28T09:00:00Z' }],
    createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-03-10T11:00:00Z',
  },
  {
    id: 'proj-3', name: 'Salesforce Integration — Email Sync',
    description: 'Integrate Salesforce with email for automatic logging of client communications.',
    category: 'integration', status: 'in-review', priority: 'medium', health: 'green',
    owner: 'Sarah', stakeholders: ['David', 'Sales Team'],
    startDate: '2026-01-05', targetDate: '2026-03-31', progress: 85,
    tags: ['salesforce', 'email', 'integration'],
    tasks: [
      { id: 't9', title: 'API connector development', assignee: 'Sarah', status: 'done', priority: 'high' },
      { id: 't10', title: 'Email template mapping', assignee: 'Sarah', status: 'done', priority: 'medium' },
      { id: 't11', title: 'QA testing', assignee: 'Michael', status: 'in-progress', priority: 'high', dueDate: '2026-03-25' },
      { id: 't12', title: 'Documentation', assignee: 'Sarah', status: 'done', priority: 'low' },
    ],
    notes: [{ id: 'n4', author: 'Sarah', content: 'Integration passing all test cases. Ready for final QA.', createdAt: '2026-03-15T16:00:00Z', pinned: true }],
    createdAt: '2026-01-02T09:00:00Z', updatedAt: '2026-03-16T10:00:00Z',
  },
  {
    id: 'proj-4', name: 'Security Audit & Remediation',
    description: 'Annual security audit: pen testing, vulnerability scanning, and remediation.',
    category: 'security', status: 'in-progress', priority: 'critical', health: 'red',
    owner: 'Robert', stakeholders: ['David', 'Compliance'],
    startDate: '2026-02-01', targetDate: '2026-04-30', progress: 45,
    tags: ['security', 'audit', 'compliance'],
    tasks: [
      { id: 't13', title: 'External pen test', assignee: 'Robert', status: 'done', priority: 'high' },
      { id: 't14', title: 'Remediation — Critical vulns', assignee: 'Robert', status: 'in-progress', priority: 'high', dueDate: '2026-03-15' },
      { id: 't15', title: 'Remediation — High vulns', assignee: 'James', status: 'blocked', priority: 'high', dueDate: '2026-04-01', notes: 'Waiting for vendor patch' },
      { id: 't16', title: 'Compliance report', assignee: 'Robert', status: 'todo', priority: 'high', dueDate: '2026-04-30' },
    ],
    notes: [
      { id: 'n5', author: 'Robert', content: 'Pen test found 3 critical, 7 high vulnerabilities. Remediation underway.', createdAt: '2026-02-20T11:00:00Z', pinned: true },
      { id: 'n6', author: 'David', content: 'Escalated to vendor. Patch expected by March 25.', createdAt: '2026-03-10T14:30:00Z' },
    ],
    createdAt: '2026-01-25T09:00:00Z', updatedAt: '2026-03-12T15:00:00Z',
  },
  {
    id: 'proj-5', name: 'Document Management System',
    description: 'Implement new DMS for firm-wide file organization and client document sharing.',
    category: 'application', status: 'backlog', priority: 'medium', health: 'green',
    owner: 'Michael', stakeholders: ['All Departments'],
    startDate: '2026-04-01', targetDate: '2026-09-30', progress: 0,
    tags: ['dms', 'documents', 'collaboration'],
    tasks: [],
    notes: [{ id: 'n7', author: 'Michael', content: 'Evaluating iManage, NetDocuments, and SharePoint. Demos scheduled for April.', createdAt: '2026-03-01T10:00:00Z' }],
    createdAt: '2026-02-20T09:00:00Z', updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'proj-6', name: 'VoIP Phone System Rollout',
    description: 'Replace legacy PBX with cloud VoIP. Handset deployment, softphone setup, number porting.',
    category: 'infrastructure', status: 'done', priority: 'high', health: 'green',
    owner: 'James', stakeholders: ['All Staff'],
    startDate: '2025-10-01', targetDate: '2026-02-28', completedDate: '2026-02-25', progress: 100,
    tags: ['voip', 'telecom', 'completed'],
    tasks: [
      { id: 't17', title: 'Vendor selection', assignee: 'James', status: 'done', priority: 'high' },
      { id: 't18', title: 'Number porting', assignee: 'James', status: 'done', priority: 'high' },
      { id: 't19', title: 'Handset deployment', assignee: 'Robert', status: 'done', priority: 'high' },
      { id: 't20', title: 'User training', assignee: 'Sarah', status: 'done', priority: 'medium' },
    ],
    notes: [{ id: 'n8', author: 'James', content: 'Project completed ahead of schedule. All numbers ported successfully.', createdAt: '2026-02-25T17:00:00Z', pinned: true }],
    createdAt: '2025-09-15T09:00:00Z', updatedAt: '2026-02-25T17:00:00Z',
  },
  {
    id: 'proj-7', name: 'IT Onboarding Automation',
    description: 'Automate new hire provisioning: account creation, hardware, licensing, and access.',
    category: 'process', status: 'planning', priority: 'low', health: 'green',
    owner: 'Sarah', stakeholders: ['HR', 'David'],
    startDate: '2026-04-15', targetDate: '2026-07-31', progress: 5,
    tags: ['automation', 'onboarding', 'hr'],
    tasks: [{ id: 't21', title: 'Current process documentation', assignee: 'Sarah', status: 'in-progress', priority: 'medium', dueDate: '2026-04-01' }],
    notes: [],
    createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-03-10T11:00:00Z',
  },
  {
    id: 'proj-8', name: 'Backup & Disaster Recovery Update',
    description: 'Update backup strategy and DR procedures. Test failover and document recovery.',
    category: 'infrastructure', status: 'on-hold', priority: 'high', health: 'amber',
    owner: 'Robert', stakeholders: ['David', 'James'],
    startDate: '2026-02-15', targetDate: '2026-05-31', progress: 20,
    tags: ['backup', 'disaster-recovery', 'infrastructure'],
    tasks: [
      { id: 't22', title: 'Audit current backup coverage', assignee: 'Robert', status: 'done', priority: 'high' },
      { id: 't23', title: 'Cloud backup configuration', assignee: 'Robert', status: 'todo', priority: 'high', dueDate: '2026-04-15' },
      { id: 't24', title: 'DR test simulation', assignee: 'James', status: 'todo', priority: 'high', dueDate: '2026-05-01' },
    ],
    notes: [{ id: 'n9', author: 'Robert', content: 'On hold pending network upgrade. Cloud backup depends on new switches.', createdAt: '2026-03-05T09:00:00Z', pinned: true }],
    createdAt: '2026-02-10T09:00:00Z', updatedAt: '2026-03-05T09:00:00Z',
  },
];
