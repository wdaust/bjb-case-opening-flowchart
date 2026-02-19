// ── Mock Data for Litigation Dashboard System ──────────────────────────
// ~200 cases reflecting a 20-30 attorney PI/med-mal firm

export type Stage = "opening" | "treatment" | "discovery" | "expert-depo" | "adr" | "trial";

export interface GateItem {
  name: string;
  completed: boolean;
}

export interface Deadline {
  type: "SOL" | "trial" | "expert" | "discovery" | "court" | "motion" | "depo";
  date: string;
  description: string;
}

export interface LitCase {
  id: string;
  title: string;
  caseType: string;
  stage: Stage;
  stageEntryDate: string;
  openDate: string;
  attorney: string;
  pod: string;
  office: string;
  venue: string;
  status: string;
  slaTarget: number;
  lastActivityDate: string;
  nextAction: string;
  nextActionDue: string;
  nextActionOwner: string;
  exposureAmount: number;
  expectedValue: number;
  evConfidence: number;
  riskFlags: string[];
  gateChecklist: GateItem[];
  deadlines: Deadline[];
  hardCostsRemaining: number;
}

export interface Attorney {
  id: string;
  name: string;
  pod: string;
  office: string;
  role: string;
  caseCount: number;
  overSlaCount: number;
  stallCount: number;
  nextActionCoverage: number;
  throughputWeekly: number;
}

export interface WeeklyMetric {
  week: string;
  newIn: number;
  closedOut: number;
  overSla: number;
  stallCount: number;
  nextActionPct: number;
  ev: number;
  throughput: number;
}

// ── Stage metadata ──────────────────────────────────────────────────────
export const stageLabels: Record<Stage, string> = {
  opening: "Case Opening",
  treatment: "Treatment Monitoring",
  discovery: "Discovery",
  "expert-depo": "Expert & Deposition",
  adr: "ADR (Arb/Mediation)",
  trial: "Trial",
};

export const stageOrder: Stage[] = ["opening", "treatment", "discovery", "expert-depo", "adr", "trial"];

export const stageSlaTargets: Record<Stage, number> = {
  opening: 30,
  treatment: 180,
  discovery: 120,
  "expert-depo": 90,
  adr: 60,
  trial: 45,
};

// ── Gate checklists per stage ───────────────────────────────────────────
const gateTemplates: Record<Stage, string[]> = {
  opening: ["Client signed retainer", "Insurance info obtained", "Medical records requested", "Police report ordered", "LOP sent to providers", "Intake memo completed"],
  treatment: ["All providers identified", "Treatment plan documented", "PIP/MedPay exhausted", "Records collected >80%", "Max medical improvement reached", "Treatment summary drafted"],
  discovery: ["Interrogatories served", "Document requests served", "Depositions noticed", "Expert disclosure deadline set", "IME scheduled or waived", "Discovery responses reviewed"],
  "expert-depo": ["Expert retained", "Expert report received", "Deposition of plaintiff taken", "Deposition of defendant taken", "IME report received", "Expert deposition completed"],
  adr: ["Mediation brief filed", "Settlement demand sent", "Mediator selected", "Mediation date confirmed", "Authority obtained", "Settlement evaluation completed"],
  trial: ["Trial brief filed", "Witness list finalized", "Exhibit list submitted", "Jury instructions drafted", "Motions in limine filed", "Trial preparation complete"],
};

// ── Attorneys ───────────────────────────────────────────────────────────
export const attorneys: Attorney[] = [
  { id: "att-01", name: "Sarah Chen", pod: "Hartford Lit Team", office: "Hartford", role: "Senior Associate", caseCount: 42, overSlaCount: 3, stallCount: 1, nextActionCoverage: 0.95, throughputWeekly: 2.1 },
  { id: "att-02", name: "Marcus Rivera", pod: "Hartford Lit Team", office: "Hartford", role: "Partner", caseCount: 28, overSlaCount: 1, stallCount: 0, nextActionCoverage: 0.98, throughputWeekly: 1.8 },
  { id: "att-03", name: "Jennifer Walsh", pod: "Hartford Lit Team", office: "Hartford", role: "Associate", caseCount: 38, overSlaCount: 5, stallCount: 2, nextActionCoverage: 0.87, throughputWeekly: 1.5 },
  { id: "att-04", name: "David Kim", pod: "NYC Lit Team", office: "NYC", role: "Senior Associate", caseCount: 45, overSlaCount: 4, stallCount: 1, nextActionCoverage: 0.92, throughputWeekly: 2.3 },
  { id: "att-05", name: "Rachel Thompson", pod: "NYC Lit Team", office: "NYC", role: "Partner", caseCount: 22, overSlaCount: 0, stallCount: 0, nextActionCoverage: 1.0, throughputWeekly: 1.2 },
  { id: "att-06", name: "James O'Brien", pod: "NYC Lit Team", office: "NYC", role: "Associate", caseCount: 35, overSlaCount: 6, stallCount: 3, nextActionCoverage: 0.82, throughputWeekly: 1.4 },
  { id: "att-07", name: "Maria Santos", pod: "Chicago Lit Team", office: "Chicago", role: "Senior Associate", caseCount: 40, overSlaCount: 2, stallCount: 1, nextActionCoverage: 0.93, throughputWeekly: 2.0 },
  { id: "att-08", name: "Robert Chen", pod: "Chicago Lit Team", office: "Chicago", role: "Partner", caseCount: 25, overSlaCount: 1, stallCount: 0, nextActionCoverage: 0.97, throughputWeekly: 1.6 },
  { id: "att-09", name: "Emily Watson", pod: "Chicago Lit Team", office: "Chicago", role: "Associate", caseCount: 36, overSlaCount: 4, stallCount: 2, nextActionCoverage: 0.88, throughputWeekly: 1.3 },
  { id: "att-10", name: "Michael Torres", pod: "Hartford Lit Team", office: "Hartford", role: "Associate", caseCount: 33, overSlaCount: 3, stallCount: 1, nextActionCoverage: 0.90, throughputWeekly: 1.7 },
  { id: "att-11", name: "Lisa Park", pod: "NYC Lit Team", office: "NYC", role: "Senior Associate", caseCount: 30, overSlaCount: 2, stallCount: 0, nextActionCoverage: 0.94, throughputWeekly: 1.9 },
  { id: "att-12", name: "Andrew Miller", pod: "Chicago Lit Team", office: "Chicago", role: "Associate", caseCount: 34, overSlaCount: 5, stallCount: 2, nextActionCoverage: 0.85, throughputWeekly: 1.1 },
  { id: "att-13", name: "Nicole Foster", pod: "Hartford Lit Team", office: "Hartford", role: "Senior Associate", caseCount: 29, overSlaCount: 1, stallCount: 0, nextActionCoverage: 0.96, throughputWeekly: 2.2 },
  { id: "att-14", name: "Christopher Lee", pod: "NYC Lit Team", office: "NYC", role: "Associate", caseCount: 37, overSlaCount: 4, stallCount: 1, nextActionCoverage: 0.89, throughputWeekly: 1.6 },
  { id: "att-15", name: "Amanda Hughes", pod: "Chicago Lit Team", office: "Chicago", role: "Associate", caseCount: 31, overSlaCount: 3, stallCount: 1, nextActionCoverage: 0.91, throughputWeekly: 1.5 },
  { id: "att-16", name: "Daniel Brooks", pod: "Hartford Lit Team", office: "Hartford", role: "Partner", caseCount: 20, overSlaCount: 0, stallCount: 0, nextActionCoverage: 0.99, throughputWeekly: 1.0 },
  { id: "att-17", name: "Stephanie Nguyen", pod: "NYC Lit Team", office: "NYC", role: "Senior Associate", caseCount: 32, overSlaCount: 2, stallCount: 1, nextActionCoverage: 0.93, throughputWeekly: 1.8 },
  { id: "att-18", name: "Kevin Martinez", pod: "Chicago Lit Team", office: "Chicago", role: "Senior Associate", caseCount: 27, overSlaCount: 1, stallCount: 0, nextActionCoverage: 0.95, throughputWeekly: 2.0 },
  { id: "att-19", name: "Patricia Adams", pod: "Hartford Lit Team", office: "Hartford", role: "Associate", caseCount: 39, overSlaCount: 5, stallCount: 2, nextActionCoverage: 0.86, throughputWeekly: 1.4 },
  { id: "att-20", name: "Brian Wilson", pod: "NYC Lit Team", office: "NYC", role: "Associate", caseCount: 26, overSlaCount: 2, stallCount: 1, nextActionCoverage: 0.92, throughputWeekly: 1.3 },
  { id: "att-21", name: "Laura Garcia", pod: "Chicago Lit Team", office: "Chicago", role: "Partner", caseCount: 18, overSlaCount: 0, stallCount: 0, nextActionCoverage: 1.0, throughputWeekly: 0.9 },
  { id: "att-22", name: "Thomas Wright", pod: "Hartford Lit Team", office: "Hartford", role: "Associate", caseCount: 41, overSlaCount: 6, stallCount: 3, nextActionCoverage: 0.83, throughputWeekly: 1.2 },
  { id: "att-23", name: "Jessica Patel", pod: "NYC Lit Team", office: "NYC", role: "Associate", caseCount: 24, overSlaCount: 1, stallCount: 0, nextActionCoverage: 0.94, throughputWeekly: 1.7 },
  { id: "att-24", name: "Ryan Cooper", pod: "Chicago Lit Team", office: "Chicago", role: "Associate", caseCount: 35, overSlaCount: 3, stallCount: 1, nextActionCoverage: 0.90, throughputWeekly: 1.5 },
  { id: "att-25", name: "Megan Hall", pod: "Hartford Lit Team", office: "Hartford", role: "Senior Associate", caseCount: 28, overSlaCount: 1, stallCount: 0, nextActionCoverage: 0.96, throughputWeekly: 2.1 },
];

// ── Helper to generate dates ────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date("2026-02-19");
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date("2026-02-19");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function makeGates(stage: Stage, completedCount: number): GateItem[] {
  return gateTemplates[stage].map((name, i) => ({ name, completed: i < completedCount }));
}

// ── Generate ~200 cases ─────────────────────────────────────────────────
const caseNames = [
  "Martinez v. ABC Corp", "Johnson v. City Hospital", "Williams v. Metro Transit",
  "Brown v. National Insurance", "Davis v. Premier Auto", "Garcia v. Westside Medical",
  "Rodriguez v. SafeWay Trucking", "Wilson v. Downtown Mall", "Anderson v. State Farm",
  "Thomas v. Dr. Harrison", "Taylor v. General Motors", "Moore v. Riverside Health",
  "Jackson v. FedEx Ground", "White v. Allstate Ins", "Harris v. CVS Pharmacy",
  "Martin v. Target Corp", "Thompson v. Uber Tech", "Robinson v. Holiday Inn",
  "Clark v. Amazon Fulfillment", "Lewis v. Progressive Ins",
  "Lee v. Northeast Hospital", "Walker v. USPS", "Hall v. Walmart Inc",
  "Allen v. Dr. Patel", "Young v. Lyft Inc", "Hernandez v. Construction Co",
  "King v. Delta Airlines", "Wright v. Home Depot", "Lopez v. MetroHealth",
  "Hill v. Geico Ins", "Scott v. Verizon", "Green v. Dominos Pizza",
  "Adams v. Sprint Corp", "Baker v. UPS Inc", "Gonzalez v. Chipotle",
  "Nelson v. Staples Inc", "Carter v. Marriott Hotel", "Mitchell v. Southwest Airlines",
  "Perez v. Tesla Inc", "Roberts v. Dr. Kim", "Turner v. Best Buy",
  "Phillips v. AT&T Corp", "Campbell v. Costco", "Parker v. JetBlue",
  "Evans v. McDonald's Corp", "Edwards v. Hilton Hotels", "Collins v. Nike Inc",
  "Stewart v. Starbucks", "Sanchez v. City Transit", "Morris v. Blue Cross",
  "Rogers v. CVS Health", "Reed v. Walgreens", "Cook v. General Electric",
  "Morgan v. Boeing Corp", "Bell v. JP Morgan", "Murphy v. Wells Fargo",
  "Bailey v. Chase Bank", "Rivera v. Cigna Health", "Cooper v. UnitedHealth",
  "Richardson v. Aetna", "Cox v. Anthem Inc", "Howard v. Kaiser Perm",
  "Ward v. Mayo Clinic", "Torres v. Cleveland Clinic", "Peterson v. Johns Hopkins",
  "Gray v. Mass General", "Ramirez v. NYU Langone", "James v. Mount Sinai",
  "Watson v. Stanford Health", "Brooks v. UCLA Medical", "Kelly v. Northwestern Med",
  "Sanders v. Rush Medical", "Price v. Hartford Hospital", "Bennett v. Yale New Haven",
  "Wood v. Bridgeport Hospital", "Barnes v. St. Francis Med", "Ross v. Midstate Med",
  "Henderson v. Day Kimball", "Coleman v. Bristol Hospital", "Jenkins v. Waterbury Hosp",
  "Perry v. Danbury Hospital", "Powell v. Greenwich Hosp", "Long v. Norwalk Hospital",
  "Patterson v. Stamford Hosp", "Hughes v. New Milford Hosp", "Flores v. Sharon Hospital",
  "Washington v. Windham Hosp", "Butler v. Lawrence Mem", "Simmons v. Backus Hospital",
  "Foster v. Rockville General", "Bryant v. Manchester Mem", "Alexander v. Johnson Mem",
  "Russell v. MidHudson Reg", "Griffin v. Vassar Brothers", "Diaz v. Good Sam Hospital",
  "Hayes v. Northern Westchester", "Myers v. Phelps Memorial", "Ford v. St. Lukes Cornwall",
  "Hamilton v. Orange Regional", "Graham v. Bon Secours", "Sullivan v. Montefiore",
  "Wallace v. Jacobi Medical", "Woods v. Lincoln Medical", "Cole v. Harlem Hospital",
  "West v. Metropolitan Hosp", "Jordan v. Bellevue Hospital", "Owens v. NYU Brooklyn",
  "Reynolds v. Kings County", "Fisher v. Maimonides Med", "Ellis v. Methodist Hospital",
  "Harrison v. Long Island Jewish", "Gibson v. North Shore Univ", "McDonald v. Winthrop Univ",
  "Cruz v. Southside Hospital", "Marshall v. Huntington Hosp", "Ortiz v. Good Sam Med NY",
  "Gomez v. Stony Brook Med", "Murray v. Peconic Bay Med", "Freeman v. East End Health",
  "Wells v. Southampton Hosp", "Webb v. Central Suffolk", "Simpson v. Brookhaven Med",
  "Stevens v. Mather Hospital", "Tucker v. St. Charles Hosp", "Porter v. John T. Mather",
  "Hunter v. St. Catherine Med", "Hicks v. Mercy Medical", "Crawford v. Nassau Univ",
  "Henry v. South Nassau Comm", "Boyd v. Franklin Gen Hosp", "Mason v. Glen Cove Hospital",
  "Morales v. Syosset Hospital", "Kennedy v. Plainview Hosp", "Warren v. North Shore LIJ",
  "Dixon v. Forest Hills Hosp", "Burns v. Elmhurst Hospital", "Gordon v. Flushing Hospital",
  "Shaw v. Jamaica Hospital", "Holmes v. Queens Hospital", "Rice v. NewYork Presbyterian",
  "Robertson v. Columbia Med", "Hunt v. Weill Cornell", "Black v. HSS Hospital",
  "Daniels v. Lenox Hill", "Palmer v. Mount Sinai West", "Mills v. Mount Sinai Beth",
  "Nichols v. St. Lukes Roosevelt", "Grant v. NYU Tisch", "Knight v. Bellevue Rehab",
  "Ferguson v. VA Manhattan", "Rose v. Coler Goldwater", "Stone v. Metropolitan Rehab",
  "Hawkins v. Rusk Institute", "Dunn v. Hospital for Joint", "Perkins v. Sloan Kettering",
  "Hudson v. NY Eye & Ear", "Spencer v. Manhattan Eye", "Gardner v. Gracie Square",
  "Stephens v. Payne Whitney", "Payne v. Silver Hill Hosp", "Pierce v. Four Winds Hosp",
  "Berry v. Westchester Med", "Matthews v. White Plains", "Arnold v. Burke Rehab",
  "Wagner v. Blythedale Child", "Francis v. Phelps Mem Rehab", "Fuller v. Helen Hayes Hosp",
  "Howard v. Nyack Hospital", "Sanders v. Valley Hospital", "Meyer v. Pascack Valley",
  "Garrett v. Holy Name Med", "Willis v. Hackensack Med", "Hopkins v. Bergen Regional",
  "Powers v. Valley Med Center", "McCarthy v. Overlook Med", "Quinn v. Morristown Med",
  "Russell v. St. Barnabas", "Romero v. Clara Maass", "Andrews v. Community Med",
  "Gregory v. Trinitas Regional", "Oliver v. JFK Medical", "Kim v. Robert Wood Johnson",
  "Herrera v. St. Peters Univ", "Stone v. Raritan Bay Med", "Boyd v. CentraState Med",
  "Ramirez v. Bayshore Comm", "Palmer v. Riverview Med", "Foster v. Jersey Shore Univ",
  "Webb v. Monmouth Medical", "Barnes v. Ocean Medical", "Hayes v. Southern Ocean",
  "Grant v. AtlantiCare Reg", "Murray v. Shore Medical", "Fleming v. Cape Regional",
  "Kim v. Cooper University", "Boyd v. Virtua Memorial", "Reeves v. Lourdes Medical",
  "Park v. Kennedy Health", "Chen v. Inspira Medical", "Nguyen v. Salem Medical",
];

const caseTypes = ["PI", "Med Mal", "Product Liability", "Premises Liability", "Auto Accident", "Wrongful Death"];
const venues = ["CT Superior", "SDNY", "NDIL", "EDNY", "CT Federal", "NJ Superior", "NY Supreme"];
const offices = ["Hartford", "NYC", "Chicago"];
const pods = ["Hartford Lit Team", "NYC Lit Team", "Chicago Lit Team"];

const nextActions = [
  "Schedule deposition of Dr. Smith", "Follow up on outstanding records", "File motion to compel",
  "Review expert report draft", "Prepare mediation brief", "Send settlement demand letter",
  "Schedule IME appointment", "Review discovery responses", "Prepare trial exhibits",
  "Depose opposing expert", "File motion for summary judgment", "Conduct client interview",
  "Request updated medical records", "Draft interrogatory responses", "Review insurance coverage",
  "Schedule case conference", "Prepare demand package", "Review billing records",
  "Send LOP to new provider", "File amended complaint", "Serve supplemental discovery",
  "Arrange interpreter for depo", "Review opposing expert report", "Prepare case status memo",
];

function buildCases(): LitCase[] {
  const result: LitCase[] = [];
  const stageDistribution: Stage[] = [];
  // Weighted: more cases in treatment/discovery
  for (let i = 0; i < 25; i++) stageDistribution.push("opening");
  for (let i = 0; i < 55; i++) stageDistribution.push("treatment");
  for (let i = 0; i < 50; i++) stageDistribution.push("discovery");
  for (let i = 0; i < 35; i++) stageDistribution.push("expert-depo");
  for (let i = 0; i < 20; i++) stageDistribution.push("adr");
  for (let i = 0; i < 15; i++) stageDistribution.push("trial");

  for (let i = 0; i < 200; i++) {
    const stage = stageDistribution[i % stageDistribution.length];
    const attIdx = i % attorneys.length;
    const att = attorneys[attIdx];
    const officeIdx = offices.indexOf(att.office);
    const caseTypeIdx = i % caseTypes.length;
    const venueIdx = (i + officeIdx) % venues.length;
    const openDaysAgo = 60 + (i * 7) % 600;
    const stageDaysAgo = 5 + (i * 3) % (stageSlaTargets[stage] + 40);
    const lastActivityDaysAgo = (i * 2) % 35;
    const nextActionDays = 3 + (i * 5) % 30;
    const completedGates = Math.min(Math.floor((i % 7)), gateTemplates[stage].length);
    const isOverSla = stageDaysAgo > stageSlaTargets[stage];
    const isStale = lastActivityDaysAgo > 21;
    const riskFlags: string[] = [];
    if (isOverSla) riskFlags.push("Over SLA");
    if (isStale) riskFlags.push("Silent stall");
    if (i % 12 === 0) riskFlags.push("SOL < 60 days");
    if (i % 15 === 0) riskFlags.push("Expert deadline");
    if (i % 20 === 0) riskFlags.push("Coverage issue");
    if (i % 18 === 0) riskFlags.push("Lien dispute");

    const exposureAmount = 100000 + ((i * 47) % 900000);
    const evConfidence = 0.4 + ((i * 13) % 55) / 100;
    const deadlines: Deadline[] = [];
    if (i % 8 === 0) deadlines.push({ type: "SOL", date: daysFromNow(15 + (i % 45)), description: "Statute of limitations expiry" });
    if (i % 10 === 0) deadlines.push({ type: "trial", date: daysFromNow(30 + (i % 90)), description: "Trial date" });
    if (i % 6 === 0) deadlines.push({ type: "expert", date: daysFromNow(10 + (i % 60)), description: "Expert disclosure deadline" });
    if (i % 7 === 0) deadlines.push({ type: "discovery", date: daysFromNow(5 + (i % 40)), description: "Discovery close date" });
    if (i % 9 === 0) deadlines.push({ type: "depo", date: daysFromNow(7 + (i % 30)), description: "Deposition scheduled" });

    const year = 2024 + Math.floor(i / 100);
    const caseNum = String(i + 1).padStart(4, "0");

    result.push({
      id: `C-${year}-${caseNum}`,
      title: caseNames[i % caseNames.length],
      caseType: caseTypes[caseTypeIdx],
      stage,
      stageEntryDate: daysAgo(stageDaysAgo),
      openDate: daysAgo(openDaysAgo),
      attorney: att.name,
      pod: pods[officeIdx],
      office: att.office,
      venue: venues[venueIdx],
      status: i < 185 ? "active" : i < 195 ? "settled" : "closed",
      slaTarget: stageSlaTargets[stage],
      lastActivityDate: daysAgo(lastActivityDaysAgo),
      nextAction: nextActions[i % nextActions.length],
      nextActionDue: daysFromNow(nextActionDays),
      nextActionOwner: att.name,
      exposureAmount,
      expectedValue: Math.round(exposureAmount * evConfidence),
      evConfidence,
      riskFlags,
      gateChecklist: makeGates(stage, completedGates),
      deadlines,
      hardCostsRemaining: 5000 + ((i * 31) % 80000),
    });
  }
  return result;
}

export const cases: LitCase[] = buildCases();

// ── Pre-computed aggregates ─────────────────────────────────────────────
export function getActiveCases(allCases: LitCase[] = cases) {
  return allCases.filter(c => c.status === "active");
}

export function getCasesByStage(stage: Stage, allCases: LitCase[] = cases) {
  return allCases.filter(c => c.stage === stage && c.status === "active");
}

export function getCasesByAttorney(attorneyName: string, allCases: LitCase[] = cases) {
  return allCases.filter(c => c.attorney === attorneyName);
}

export function getOverSlaCases(allCases: LitCase[] = cases) {
  return allCases.filter(c => c.riskFlags.includes("Over SLA") && c.status === "active");
}

export function getStalledCases(allCases: LitCase[] = cases) {
  return allCases.filter(c => c.riskFlags.includes("Silent stall") && c.status === "active");
}

export function getUpcomingDeadlines(days: number = 90, allCases: LitCase[] = cases) {
  const cutoff = daysFromNow(days);
  const today = "2026-02-19";
  return allCases
    .filter(c => c.status === "active")
    .flatMap(c => c.deadlines.map(d => ({ ...d, caseId: c.id, caseTitle: c.title, attorney: c.attorney, stage: c.stage })))
    .filter(d => d.date >= today && d.date <= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDaysInStage(c: LitCase): number {
  const entry = new Date(c.stageEntryDate);
  const now = new Date("2026-02-19");
  return Math.floor((now.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSlaStatus(c: LitCase): "ok" | "warning" | "breach" {
  const days = getDaysInStage(c);
  if (days > c.slaTarget) return "breach";
  if (days > c.slaTarget * 0.8) return "warning";
  return "ok";
}

// ── Aging bands ─────────────────────────────────────────────────────────
export const agingBands = ["0-30d", "31-60d", "61-90d", "91-120d", "120d+"] as const;
export type AgingBand = typeof agingBands[number];

export function getAgingBand(days: number): AgingBand {
  if (days <= 30) return "0-30d";
  if (days <= 60) return "31-60d";
  if (days <= 90) return "61-90d";
  if (days <= 120) return "91-120d";
  return "120d+";
}

export function getAgingDistribution(stageCases: LitCase[]): Record<AgingBand, number> {
  const dist: Record<AgingBand, number> = { "0-30d": 0, "31-60d": 0, "61-90d": 0, "91-120d": 0, "120d+": 0 };
  stageCases.forEach(c => {
    const band = getAgingBand(getDaysInStage(c));
    dist[band]++;
  });
  return dist;
}

// ── Control Tower aggregates ────────────────────────────────────────────
export function getControlTowerData() {
  const active = getActiveCases();
  const totalActive = active.length;
  const overSla = getOverSlaCases();
  const stalled = getStalledCases();
  const totalEV = active.reduce((sum, c) => sum + c.expectedValue, 0);

  const stageCounts = stageOrder.map(s => ({
    stage: s,
    label: stageLabels[s],
    count: getCasesByStage(s).length,
    overSla: getCasesByStage(s).filter(c => c.riskFlags.includes("Over SLA")).length,
    avgAge: Math.round(getCasesByStage(s).reduce((sum, c) => sum + getDaysInStage(c), 0) / Math.max(getCasesByStage(s).length, 1)),
  }));

  return {
    totalActive,
    newIn30d: 42,
    closedOut30d: 38,
    overSlaPct: Math.round((overSla.length / totalActive) * 1000) / 10,
    stallPct: Math.round((stalled.length / totalActive) * 1000) / 10,
    totalEV,
    stageCounts,
    deadlines: getUpcomingDeadlines(90),
  };
}

// ── Stage Command aggregates ────────────────────────────────────────────
export function getStageCommandData(stage: Stage) {
  const stageCases = getCasesByStage(stage);
  const total = stageCases.length;
  const ages = stageCases.map(getDaysInStage).sort((a, b) => a - b);
  const medianAge = ages.length > 0 ? ages[Math.floor(ages.length / 2)] : 0;
  const p90Age = ages.length > 0 ? ages[Math.floor(ages.length * 0.9)] : 0;
  const overSla = stageCases.filter(c => c.riskFlags.includes("Over SLA")).length;
  const overSlaPct = total > 0 ? Math.round((overSla / total) * 100) : 0;

  const attorneyDist = new Map<string, number>();
  stageCases.forEach(c => attorneyDist.set(c.attorney, (attorneyDist.get(c.attorney) || 0) + 1));

  const gateCompletion: Record<string, number> = {};
  const template = gateTemplates[stage];
  template.forEach((gateName, idx) => {
    const completed = stageCases.filter(c => c.gateChecklist[idx]?.completed).length;
    gateCompletion[gateName] = total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  return {
    total,
    medianAge,
    p90Age,
    overSla,
    overSlaPct,
    slaTarget: stageSlaTargets[stage],
    aging: getAgingDistribution(stageCases),
    attorneyDistribution: Array.from(attorneyDist.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    gateCompletion,
    priorityQueue: stageCases
      .map(c => ({ ...c, daysInStage: getDaysInStage(c), slaStatus: getSlaStatus(c) }))
      .sort((a, b) => {
        if (a.slaStatus === "breach" && b.slaStatus !== "breach") return -1;
        if (b.slaStatus === "breach" && a.slaStatus !== "breach") return 1;
        return b.daysInStage - a.daysInStage;
      }),
  };
}

// ── Throughput data (13-week trailing) ──────────────────────────────────
export function getWeeklyThroughput(): WeeklyMetric[] {
  const weeks: WeeklyMetric[] = [];
  for (let w = 12; w >= 0; w--) {
    weeks.push({
      week: `W${13 - w}`,
      newIn: 8 + (w % 5),
      closedOut: 6 + ((w + 2) % 6),
      overSla: 15 + (w % 8),
      stallCount: 5 + (w % 4),
      nextActionPct: 88 + (w % 7),
      ev: 120 + (w * 2),
      throughput: 5 + ((w + 1) % 4),
    });
  }
  return weeks;
}

// ── Forecast data ───────────────────────────────────────────────────────
export function getForecastData() {
  const active = getActiveCases();
  const totalEV = active.reduce((sum, c) => sum + c.expectedValue, 0);
  const monthlyTrend = [
    { month: "Sep 25", ev: 115.2 }, { month: "Oct 25", ev: 118.5 },
    { month: "Nov 25", ev: 117.8 }, { month: "Dec 25", ev: 120.1 },
    { month: "Jan 26", ev: 122.3 }, { month: "Feb 26", ev: totalEV / 1000000 },
  ];

  return {
    totalEV,
    monthlyTrend,
    expectedFees: Math.round(totalEV * 0.33),
    closeMonthForecast: 12,
    historicalAccuracy: [
      { month: "Sep 25", predicted: 14, actual: 12 },
      { month: "Oct 25", predicted: 11, actual: 13 },
      { month: "Nov 25", predicted: 15, actual: 14 },
      { month: "Dec 25", predicted: 10, actual: 9 },
      { month: "Jan 26", predicted: 13, actual: 12 },
    ],
  };
}
