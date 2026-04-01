// Mock data generators for NJ LIT Analytics Dashboard

const ATTORNEYS = [
  'J. Martinez', 'R. Chen', 'S. Patel', 'M. O\'Brien', 'K. Washington',
  'L. Kim', 'D. Thompson', 'A. Rossi', 'T. Nguyen', 'B. Foster',
  'P. Garcia', 'N. Williams', 'C. Davis', 'H. Brown', 'E. Wilson',
  'F. Anderson', 'G. Taylor', 'I. Moore', 'V. Jackson', 'W. Harris',
];

const COURTS = [
  'Bergen', 'Essex', 'Hudson', 'Middlesex', 'Monmouth',
  'Morris', 'Passaic', 'Union', 'Camden', 'Ocean',
];

const STATES = ['NJ', 'NY', 'PA', 'CT', 'FL', 'CA'];

const PI_STATUSES = ['Pre-Lit', 'Litigation', 'Discovery', 'Expert/Depo', 'Arb/Med', 'Trial'];

const ACTIVE_STAGES = [
  'Case Opening', 'Discovery', 'Expert', 'Deposition', 'Arb/Med', 'Trial Prep', 'Trial',
];

const NEGOTIATION_STATUSES = [
  'Not Started', 'Demand Sent', 'Counter Received', 'Negotiating', 'Settled', 'Impasse',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomPick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomDate(rng: () => number, startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + rng() * (end - start));
  return d.toISOString().split('T')[0];
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function quarterLabel(date: string): string {
  const d = new Date(date);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

// ─── Resolution Timing ───────────────────────────────────────────

export interface ResolutionRecord {
  id: string;
  matterName: string;
  attorney: string;
  incidentDate: string;
  assignedToLit: string;
  complaintFiled: string;
  resolutionDate: string;
  daysToResolution: number;
  daysComplaintToResolution: number;
  daysAssignedToResolution: number;
  quarter: string;
}

export function getResolutionTimingData(): ResolutionRecord[] {
  const rng = seededRandom(42);
  const records: ResolutionRecord[] = [];
  for (let i = 0; i < 500; i++) {
    const incidentDate = randomDate(rng, 2022, 2024);
    const assignedToLit = addDays(incidentDate, randomInt(rng, 30, 180));
    const complaintFiled = addDays(assignedToLit, randomInt(rng, 20, 120));
    const resolutionDays = randomInt(rng, 180, 900);
    const resolutionDate = addDays(incidentDate, resolutionDays);
    records.push({
      id: `RES-${String(i + 1).padStart(4, '0')}`,
      matterName: `${randomPick(rng, ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'])} v. ${randomPick(rng, ['GEICO', 'State Farm', 'Allstate', 'Progressive', 'Liberty Mutual', 'USAA', 'Nationwide', 'Farmers'])}`,
      attorney: randomPick(rng, ATTORNEYS),
      incidentDate,
      assignedToLit,
      complaintFiled,
      resolutionDate,
      daysToResolution: resolutionDays,
      daysComplaintToResolution: daysBetween(complaintFiled, resolutionDate),
      daysAssignedToResolution: daysBetween(assignedToLit, resolutionDate),
      quarter: quarterLabel(resolutionDate),
    });
  }
  return records;
}

// ─── Complaint & Filing ──────────────────────────────────────────

export interface ComplaintRecord {
  id: string;
  matterName: string;
  attorney: string;
  team: string;
  assignedDate: string;
  complaintFiledDate: string | null;
  daysToFile: number | null;
  status: 'Filed' | 'Pending' | 'Overdue';
  daysOverdue: number;
}

export function getComplaintFilingData(): ComplaintRecord[] {
  const rng = seededRandom(99);
  const teams = ['Team A', 'Team B', 'Team C', 'Team D'];
  const records: ComplaintRecord[] = [];
  for (let i = 0; i < 300; i++) {
    const assignedDate = randomDate(rng, 2025, 2026);
    const filed = rng() > 0.25;
    const daysToFile = filed ? randomInt(rng, 15, 120) : null;
    const complaintFiledDate = filed ? addDays(assignedDate, daysToFile!) : null;
    const today = new Date('2026-03-31');
    const daysSinceAssigned = Math.round((today.getTime() - new Date(assignedDate).getTime()) / 86400000);
    const overdue = !filed && daysSinceAssigned > 60;
    records.push({
      id: `CMP-${String(i + 1).padStart(4, '0')}`,
      matterName: `${randomPick(rng, ['Adams', 'Baker', 'Clark', 'Evans', 'Hall', 'King', 'Lee', 'Moore', 'Price', 'Ross'])} v. ${randomPick(rng, ['GEICO', 'State Farm', 'Allstate', 'Progressive', 'Liberty Mutual'])}`,
      attorney: randomPick(rng, ATTORNEYS),
      team: randomPick(rng, teams),
      assignedDate,
      complaintFiledDate,
      daysToFile,
      status: filed ? 'Filed' : overdue ? 'Overdue' : 'Pending',
      daysOverdue: !filed ? Math.max(0, daysSinceAssigned - 60) : 0,
    });
  }
  return records;
}

// ─── Discovery Timing ────────────────────────────────────────────

export interface DiscoveryRecord {
  id: string;
  matterName: string;
  attorney: string;
  court: string;
  formCReceived: string | null;
  tenDayLetterSent: string | null;
  motionFiledDate: string | null;
  daysToFormC: number | null;
  daysFormCToLetter: number | null;
  daysLetterToMotion: number | null;
}

export function getDiscoveryTimingData(): DiscoveryRecord[] {
  const rng = seededRandom(77);
  const records: DiscoveryRecord[] = [];
  for (let i = 0; i < 400; i++) {
    const baseDate = randomDate(rng, 2024, 2025);
    const hasFormC = rng() > 0.15;
    const hasLetter = hasFormC && rng() > 0.2;
    const hasMotion = hasLetter && rng() > 0.35;
    const daysToFormC = hasFormC ? randomInt(rng, 20, 90) : null;
    const formCReceived = hasFormC ? addDays(baseDate, daysToFormC!) : null;
    const daysFormCToLetter = hasLetter ? randomInt(rng, 10, 60) : null;
    const tenDayLetterSent = hasLetter ? addDays(formCReceived!, daysFormCToLetter!) : null;
    const daysLetterToMotion = hasMotion ? randomInt(rng, 15, 75) : null;
    const motionFiledDate = hasMotion ? addDays(tenDayLetterSent!, daysLetterToMotion!) : null;
    records.push({
      id: `DSC-${String(i + 1).padStart(4, '0')}`,
      matterName: `${randomPick(rng, ['Adams', 'Baker', 'Clark', 'Evans', 'Hall', 'King', 'Lee', 'Moore', 'Price', 'Ross'])} v. ${randomPick(rng, ['GEICO', 'State Farm', 'Allstate', 'Progressive'])}`,
      attorney: randomPick(rng, ATTORNEYS),
      court: randomPick(rng, COURTS),
      formCReceived,
      tenDayLetterSent,
      motionFiledDate,
      daysToFormC,
      daysFormCToLetter,
      daysLetterToMotion,
    });
  }
  return records;
}

// ─── Expert Data ─────────────────────────────────────────────────

export interface ExpertRecord {
  attorney: string;
  unservedCount: number;
  matters: string[];
}

export function getExpertData(): ExpertRecord[] {
  const rng = seededRandom(55);
  return ATTORNEYS.map(attorney => {
    const count = randomInt(rng, 5, 45);
    const matters: string[] = [];
    for (let i = 0; i < count; i++) {
      matters.push(`${randomPick(rng, ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'])} v. ${randomPick(rng, ['GEICO', 'State Farm', 'Allstate'])}`);
    }
    return { attorney, unservedCount: count, matters };
  }).sort((a, b) => b.unservedCount - a.unservedCount);
}

// ─── Inventory Snapshot ──────────────────────────────────────────

export interface MatterRecord {
  id: string;
  matterName: string;
  attorney: string;
  activeStage: string;
  incidentDate: string;
  solDate: string;
  daysToSOL: number;
  piStatus: string;
  state: string;
  negotiationStatus: string;
  caseAgeDays: number;
}

export function getInventorySnapshot(): MatterRecord[] {
  const rng = seededRandom(123);
  const records: MatterRecord[] = [];
  const today = new Date('2026-03-31');
  for (let i = 0; i < 1200; i++) {
    const incidentDate = randomDate(rng, 2022, 2025);
    const solYears = randomPick(rng, [2, 2, 2, 3, 6]);
    const solDate = addDays(incidentDate, solYears * 365);
    const daysToSOL = Math.round((new Date(solDate).getTime() - today.getTime()) / 86400000);
    const caseAgeDays = Math.round((today.getTime() - new Date(incidentDate).getTime()) / 86400000);
    records.push({
      id: `MAT-${String(i + 1).padStart(5, '0')}`,
      matterName: `${randomPick(rng, ['Adams', 'Baker', 'Clark', 'Evans', 'Hall', 'King', 'Lee', 'Moore', 'Price', 'Ross', 'Smith', 'Johnson'])} v. ${randomPick(rng, ['GEICO', 'State Farm', 'Allstate', 'Progressive', 'Liberty Mutual', 'USAA'])}`,
      attorney: randomPick(rng, ATTORNEYS),
      activeStage: randomPick(rng, ACTIVE_STAGES),
      incidentDate,
      solDate,
      daysToSOL,
      piStatus: randomPick(rng, PI_STATUSES),
      state: randomPick(rng, STATES),
      negotiationStatus: randomPick(rng, NEGOTIATION_STATUSES),
      caseAgeDays,
    });
  }
  return records;
}

// ─── Pre-computed KPIs ───────────────────────────────────────────

export interface TimingKPIs {
  medianDaysToResolution: number;
  medianComplaintToResolution: number;
  medianAssignedToResolution: number;
  totalResolutions12mo: number;
  avgDaysToFile: number;
  complaintsThisMonth: number;
  overdueComplaints: { band: string; count: number }[];
  filingComplianceRate: number;
  avgDaysToFormC: number;
  avgFormCToLetter: number;
  avgLetterToMotion: number;
  expertsNotServed: number;
  activeInventory: number;
  mattersSOLUnder90: number;
  avgCaseAge: number;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function getTimingKPIs(): TimingKPIs {
  const resolutions = getResolutionTimingData();
  const complaints = getComplaintFilingData();
  const discovery = getDiscoveryTimingData();
  const experts = getExpertData();
  const inventory = getInventorySnapshot();

  const cutoff = new Date('2025-03-31');
  const recent = resolutions.filter(r => new Date(r.resolutionDate) >= cutoff);

  const filed = complaints.filter(c => c.status === 'Filed' && c.daysToFile != null);
  const overdue = complaints.filter(c => c.status === 'Overdue');

  const bands = [
    { band: '0-14 days', count: overdue.filter(c => c.daysOverdue <= 14).length },
    { band: '15-29 days', count: overdue.filter(c => c.daysOverdue >= 15 && c.daysOverdue <= 29).length },
    { band: '30-59 days', count: overdue.filter(c => c.daysOverdue >= 30 && c.daysOverdue <= 59).length },
    { band: '60-89 days', count: overdue.filter(c => c.daysOverdue >= 60 && c.daysOverdue <= 89).length },
  ];

  const formCDays = discovery.filter(d => d.daysToFormC != null).map(d => d.daysToFormC!);
  const letterDays = discovery.filter(d => d.daysFormCToLetter != null).map(d => d.daysFormCToLetter!);
  const motionDays = discovery.filter(d => d.daysLetterToMotion != null).map(d => d.daysLetterToMotion!);

  return {
    medianDaysToResolution: median(resolutions.map(r => r.daysToResolution)),
    medianComplaintToResolution: median(resolutions.map(r => r.daysComplaintToResolution)),
    medianAssignedToResolution: median(resolutions.map(r => r.daysAssignedToResolution)),
    totalResolutions12mo: recent.length,
    avgDaysToFile: filed.length ? Math.round(filed.reduce((s, c) => s + c.daysToFile!, 0) / filed.length) : 0,
    complaintsThisMonth: complaints.filter(c => c.complaintFiledDate?.startsWith('2026-03')).length,
    overdueComplaints: bands,
    filingComplianceRate: complaints.length ? Math.round((filed.length / complaints.length) * 100) : 0,
    avgDaysToFormC: formCDays.length ? Math.round(formCDays.reduce((a, b) => a + b, 0) / formCDays.length) : 0,
    avgFormCToLetter: letterDays.length ? Math.round(letterDays.reduce((a, b) => a + b, 0) / letterDays.length) : 0,
    avgLetterToMotion: motionDays.length ? Math.round(motionDays.reduce((a, b) => a + b, 0) / motionDays.length) : 0,
    expertsNotServed: experts.reduce((s, e) => s + e.unservedCount, 0),
    activeInventory: inventory.length,
    mattersSOLUnder90: inventory.filter(m => m.daysToSOL > 0 && m.daysToSOL < 90).length,
    avgCaseAge: inventory.length ? Math.round(inventory.reduce((s, m) => s + m.caseAgeDays, 0) / inventory.length) : 0,
  };
}
