// ── Types ──────────────────────────────────────────────────────────

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type BlockStatus = "calls" | "no-calls" | "contact" | "appointment" | "time-off";

export interface ContactDetail {
  contactName: string;
  phone: string;
  caseId: string;
  outcome: string;
  transcript: string;
}

export interface AppointmentDetail {
  clientName: string;
  phone: string;
  caseId: string;
  appointmentDate: string;
  appointmentType: string;
  notes: string;
}

export interface TimeBlock {
  time: string;
  calls: number;
  status: BlockStatus;
  contactDetail?: ContactDetail;
  appointmentDetail?: AppointmentDetail;
}

export interface SessionDayRow {
  day: DayOfWeek;
  blocks: TimeBlock[];
}

export interface CallSession {
  sessionNumber: number;
  timeRange: string;
  contactsMade: number;
  totalZeros: number;
  callAttempts: number;
  grid: SessionDayRow[];
}

export type DispositionCode =
  | "Relatives: VM Drop"
  | "Relatives: No VM"
  | "Relatives: Negative Outcome"
  | "No Contact Made: Voicemail Drop"
  | "No Contact Made: Relative: VM Drop"
  | "No Contact Made: Relative: no VM"
  | "No Contact Made: Mailbox Full/Not Setup"
  | "No Contact Made: Left Voicemail"
  | "No Contact Made: Invalid Number"
  | "No Contact Made: Disconnects"
  | "No Contact Made: 1st call-no answer"
  | "Made Contact: Wrong Person"
  | "Made Contact: Made Contact (positive)";

export interface DispositionRow {
  code: DispositionCode;
  bySession: [number, number, number, number, number];
  total: number;
}

export interface DailyCallStats {
  day: DayOfWeek;
  totalCalls: number;
  contactsMade: number;
  contactRate: number;
  appointments: number;
  avgCallTime: string;
}

export interface CallAgent {
  id: string;
  name: string;
  team: string;
}

export interface AgentPayBreakdown {
  payForCalling: number;
  aptPayBonus: number;
  callingBonus: number;
  totalPay: number;
}

export interface AgentCallData {
  agent: CallAgent;
  totalCalls: number;
  avgCallsPerDay: number;
  zeroCallBlocks: number;
  appointmentsSet: number;
  contactsMade: number;
  activeCallingPct: number;
  activeCallTime: string;
  sessions: CallSession[];
  dailyStats: DailyCallStats[];
  dispositions: DispositionRow[];
  pay: AgentPayBreakdown;
  weeklyTrend: number[];
}

export interface CallTeamOverview {
  totalCalls: number;
  avgCallsPerDay: number;
  zeroCallBlocks: number;
  appointmentsSet: number;
  contactsMade: number;
  activeCallingPct: number;
  activeCallTime: string;
  totalAgents: number;
  sessions: CallSession[];
  dailyStats: DailyCallStats[];
  dispositions: DispositionRow[];
  weeklyTrend: number[];
}

export interface AgentLeaderboardRow {
  agentId: string;
  name: string;
  team: string;
  totalCalls: number;
  contactRate: number;
  contactToAptRate: number;
  appointmentsSet: number;
  zeroCallBlocks: number;
  activeCallingPct: number;
}

export interface AgentDailyGoal {
  agentId: string;
  name: string;
  day: DayOfWeek;
  target: number;
  actual: number;
  pct: number;
  metGoal: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SESSION_DEFS: { start: string; end: string; timeRange: string; blocks: number }[] = [
  { start: "09:30", end: "10:55", timeRange: "9:30 - 10:55 AM", blocks: 18 },
  { start: "11:30", end: "12:55", timeRange: "11:30 AM - 12:55 PM", blocks: 18 },
  { start: "13:30", end: "14:55", timeRange: "1:30 - 2:55 PM", blocks: 18 },
  { start: "15:30", end: "16:55", timeRange: "3:30 - 4:55 PM", blocks: 18 },
  { start: "17:30", end: "18:25", timeRange: "5:30 - 6:25 PM", blocks: 12 },
];

const DISPOSITION_CODES: DispositionCode[] = [
  "Relatives: VM Drop",
  "Relatives: No VM",
  "Relatives: Negative Outcome",
  "No Contact Made: Voicemail Drop",
  "No Contact Made: Relative: VM Drop",
  "No Contact Made: Relative: no VM",
  "No Contact Made: Mailbox Full/Not Setup",
  "No Contact Made: Left Voicemail",
  "No Contact Made: Invalid Number",
  "No Contact Made: Disconnects",
  "No Contact Made: 1st call-no answer",
  "Made Contact: Wrong Person",
  "Made Contact: Made Contact (positive)",
];

const AGENTS: CallAgent[] = [
  { id: "ag-1", name: "Sarah Mitchell", team: "Team Alpha" },
  { id: "ag-2", name: "James Rivera", team: "Team Alpha" },
  { id: "ag-3", name: "Aisha Patel", team: "Team Alpha" },
  { id: "ag-4", name: "Carlos Mendez", team: "Team Alpha" },
  { id: "ag-5", name: "Emily Chen", team: "Team Bravo" },
  { id: "ag-6", name: "David Johnson", team: "Team Bravo" },
  { id: "ag-7", name: "Maria Gonzalez", team: "Team Bravo" },
  { id: "ag-8", name: "Tyler Brooks", team: "Team Bravo" },
];

// ── Mock Data Arrays for Hover Details ────────────────────────────

const MOCK_NAMES = [
  "Maria Torres", "Robert Williams", "Jennifer Adams", "Michael Brown",
  "Patricia Garcia", "Christopher Lee", "Amanda Wilson", "Daniel Martinez",
  "Stephanie Clark", "Andrew Taylor", "Nicole Anderson", "Kevin Thomas",
  "Laura Jackson", "Brian White", "Rachel Harris",
];

const MOCK_OUTCOMES = [
  "Interested — callback scheduled",
  "Needs more info — sending brochure",
  "Ready to proceed — appointment set",
  "Not interested at this time",
  "Requested call back next week",
  "Spouse needs to be present — rescheduling",
  "Wants to discuss with attorney first",
  "Positive — moving forward with consultation",
];

const MOCK_TRANSCRIPTS = [
  "Caller explained the situation regarding their case. Client expressed interest and requested a follow-up call next week.",
  "Left detailed voicemail. Previous attempts went to voicemail as well. Client returned call within the hour.",
  "Spoke with client about their options. They are considering next steps and will call back after reviewing documents.",
  "Client was receptive to the consultation offer. Confirmed availability for Thursday afternoon.",
  "Discussed case details and timeline expectations. Client asked about fees and was satisfied with the explanation.",
  "Initial contact went well. Client has questions about the process and wants to schedule a consultation.",
  "Client mentioned they were referred by a friend. Very interested in moving forward quickly.",
  "Brief conversation — client is currently at work. Agreed to a callback this evening at 6 PM.",
];

const MOCK_APT_TYPES = ["Initial Consultation", "Follow-up", "Document Review", "Case Evaluation"];

const MOCK_APT_NOTES = [
  "Client prefers afternoon appointments. Referred by existing client.",
  "Follow-up from last week's initial call. Has documents ready for review.",
  "Needs Spanish interpreter. Confirmed with office manager.",
  "Client is bringing spouse. Allow extra 15 minutes.",
  "Urgent matter — client needs consultation before court date next Friday.",
  "Returning client from 2024 case. New matter related to previous issue.",
];

// ── Deterministic pseudo-random ────────────────────────────────────

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function seededInt(seed: number, min: number, max: number): number {
  return min + Math.floor(seeded(seed) * (max - min + 1));
}

function seededPick<T>(seed: number, arr: T[]): T {
  return arr[seededInt(seed, 0, arr.length - 1)];
}

// ── Detail Generators ─────────────────────────────────────────────

function generateContactDetail(seed: number): ContactDetail {
  const name = seededPick(seed, MOCK_NAMES);
  const areaCode = seededInt(seed + 10, 200, 999);
  const mid = seededInt(seed + 20, 100, 999);
  const last = seededInt(seed + 30, 1000, 9999);
  const caseYear = 2024 + seededInt(seed + 40, 0, 2);
  const caseNum = seededInt(seed + 50, 100, 9999);
  return {
    contactName: name,
    phone: `(${areaCode}) ${mid}-${last}`,
    caseId: `CAS-${caseYear}-${String(caseNum).padStart(4, "0")}`,
    outcome: seededPick(seed + 60, MOCK_OUTCOMES),
    transcript: seededPick(seed + 70, MOCK_TRANSCRIPTS),
  };
}

function generateAppointmentDetail(seed: number, weekIndex: number): AppointmentDetail {
  const name = seededPick(seed + 100, MOCK_NAMES);
  const areaCode = seededInt(seed + 110, 200, 999);
  const mid = seededInt(seed + 120, 100, 999);
  const last = seededInt(seed + 130, 1000, 9999);
  const caseYear = 2024 + seededInt(seed + 140, 0, 2);
  const caseNum = seededInt(seed + 150, 100, 9999);

  // Generate appointment date in the future relative to the week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - weekIndex * 7);
  const aptOffset = seededInt(seed + 160, 1, 10);
  const aptDate = new Date(weekStart);
  aptDate.setDate(aptDate.getDate() + aptOffset);
  const hours = seededInt(seed + 170, 9, 16);
  const minutes = seededPick(seed + 180, [0, 15, 30, 45]);
  aptDate.setHours(hours, minutes);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMin = String(minutes).padStart(2, "0");

  return {
    clientName: name,
    phone: `(${areaCode}) ${mid}-${last}`,
    caseId: `CAS-${caseYear}-${String(caseNum).padStart(4, "0")}`,
    appointmentDate: `${monthNames[aptDate.getMonth()]} ${aptDate.getDate()}, ${aptDate.getFullYear()} at ${displayHour}:${displayMin} ${ampm}`,
    appointmentType: seededPick(seed + 190, MOCK_APT_TYPES),
    notes: seededPick(seed + 200, MOCK_APT_NOTES),
  };
}

// ── Generators ─────────────────────────────────────────────────────

function generateTimeBlocks(sessionIdx: number, dayIdx: number, agentIdx: number, weekIndex: number = 0): TimeBlock[] {
  const def = SESSION_DEFS[sessionIdx];
  const [startH, startM] = def.start.split(":").map(Number);
  const blocks: TimeBlock[] = [];
  const weekOffset = weekIndex * 100000;

  for (let b = 0; b < def.blocks; b++) {
    const totalMin = startM + b * 5;
    const h = startH + Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const seed = weekOffset + agentIdx * 10000 + sessionIdx * 1000 + dayIdx * 100 + b;
    const roll = seeded(seed);

    let status: BlockStatus;
    let calls: number;

    if (roll < 0.08) {
      status = "no-calls";
      calls = 0;
    } else if (roll < 0.14) {
      status = "contact";
      calls = seededInt(seed + 1, 1, 3);
    } else if (roll < 0.18) {
      status = "appointment";
      calls = seededInt(seed + 2, 1, 2);
    } else if (roll < 0.21) {
      status = "time-off";
      calls = 0;
    } else {
      status = "calls";
      calls = seededInt(seed + 3, 1, 4);
    }

    const block: TimeBlock = { time, calls, status };

    if (status === "contact") {
      block.contactDetail = generateContactDetail(seed * 7 + 3);
    } else if (status === "appointment") {
      block.appointmentDetail = generateAppointmentDetail(seed * 7 + 5, weekIndex);
    }

    blocks.push(block);
  }

  return blocks;
}

function generateSession(sessionIdx: number, agentIdx: number, weekIndex: number = 0): CallSession {
  const grid: SessionDayRow[] = DAYS.map((day, dayIdx) => ({
    day,
    blocks: generateTimeBlocks(sessionIdx, dayIdx, agentIdx, weekIndex),
  }));

  let contactsMade = 0;
  let totalZeros = 0;
  let callAttempts = 0;

  for (const row of grid) {
    for (const block of row.blocks) {
      callAttempts += block.calls;
      if (block.status === "contact" || block.status === "appointment") contactsMade++;
      if (block.status === "no-calls") totalZeros++;
    }
  }

  return {
    sessionNumber: sessionIdx + 1,
    timeRange: SESSION_DEFS[sessionIdx].timeRange,
    contactsMade,
    totalZeros,
    callAttempts,
    grid,
  };
}

function generateDispositions(agentIdx: number, weekIndex: number = 0): DispositionRow[] {
  const weekOffset = weekIndex * 50000;
  return DISPOSITION_CODES.map((code, codeIdx) => {
    const bySession: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (let s = 0; s < 5; s++) {
      const seed = weekOffset + agentIdx * 1000 + codeIdx * 100 + s * 10 + 7;
      const weight = codeIdx >= 7 ? 2.5 : codeIdx >= 3 ? 1.5 : 1;
      bySession[s] = Math.round(seededInt(seed, 0, 8) * weight);
    }
    const total = bySession.reduce((a, b) => a + b, 0);
    return { code, bySession, total };
  });
}

function generateDailyStats(sessions: CallSession[], weekIndex: number = 0): DailyCallStats[] {
  return DAYS.map((day, dayIdx) => {
    let totalCalls = 0;
    let contacts = 0;
    let appointments = 0;

    for (const session of sessions) {
      const row = session.grid[dayIdx];
      for (const block of row.blocks) {
        totalCalls += block.calls;
        if (block.status === "contact") contacts++;
        if (block.status === "appointment") appointments++;
      }
    }

    const contactRate = totalCalls > 0 ? Math.round((contacts / totalCalls) * 100) : 0;
    const seedBase = (weekIndex + 1) * 1000;
    const avgMin = seededInt(seedBase + dayIdx * 13 + 42, 1, 3);
    const avgSec = seededInt(seedBase + dayIdx * 17 + 23, 10, 55);

    return {
      day,
      totalCalls,
      contactsMade: contacts,
      contactRate,
      appointments,
      avgCallTime: `${avgMin}:${String(avgSec).padStart(2, "0")}`,
    };
  });
}

function generateAgentData(agentIdx: number, weekIndex: number = 0): AgentCallData {
  const agent = AGENTS[agentIdx];
  const sessions = Array.from({ length: 5 }, (_, i) => generateSession(i, agentIdx, weekIndex));
  const dailyStats = generateDailyStats(sessions, weekIndex);
  const dispositions = generateDispositions(agentIdx, weekIndex);

  let totalCalls = 0;
  let zeroCallBlocks = 0;
  let appointmentsSet = 0;
  let contactsMade = 0;

  for (const s of sessions) {
    totalCalls += s.callAttempts;
    zeroCallBlocks += s.totalZeros;
    for (const row of s.grid) {
      for (const block of row.blocks) {
        if (block.status === "appointment") appointmentsSet++;
        if (block.status === "contact") contactsMade++;
      }
    }
  }

  const avgCallsPerDay = Math.round(totalCalls / 5);
  const totalBlocks = sessions.reduce((sum, s) => sum + s.grid.reduce((rs, r) => rs + r.blocks.length, 0), 0);
  const activeBlocks = totalBlocks - zeroCallBlocks;
  const activeCallingPct = Math.round((activeBlocks / totalBlocks) * 100);

  const weekSeedOffset = weekIndex * 7777;
  const totalMinutes = seededInt(weekSeedOffset + agentIdx * 99 + 55, 180, 320);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const payForCalling = seededInt(weekSeedOffset + agentIdx * 77 + 11, 400, 650);
  const aptPayBonus = appointmentsSet * seededInt(weekSeedOffset + agentIdx * 33 + 22, 15, 35);
  const callingBonus = totalCalls > 150 ? seededInt(weekSeedOffset + agentIdx * 44 + 33, 50, 150) : 0;
  const totalPay = payForCalling + aptPayBonus + callingBonus;

  const weeklyTrend = dailyStats.map(d => d.totalCalls);

  return {
    agent,
    totalCalls,
    avgCallsPerDay,
    zeroCallBlocks,
    appointmentsSet,
    contactsMade,
    activeCallingPct,
    activeCallTime: `${hours}h ${mins}m`,
    sessions,
    dailyStats,
    dispositions,
    pay: { payForCalling, aptPayBonus, callingBonus, totalPay },
    weeklyTrend,
  };
}

// ── Aggregated Team Heatmap Helper ────────────────────────────────

const STATUS_PRIORITY: Record<BlockStatus, number> = {
  "appointment": 5,
  "contact": 4,
  "time-off": 3,
  "no-calls": 2,
  "calls": 1,
};

function aggregateGrids(allAgentSessions: CallSession[][]): SessionDayRow[] {
  const firstAgent = allAgentSessions[0];
  if (!firstAgent || firstAgent.length === 0) return [];

  // We aggregate per-session, but this helper is called per session index
  // Actually we need to aggregate across agents for a given session
  return DAYS.map((day, dayIdx) => {
    const blockCount = firstAgent[0]?.grid[dayIdx]?.blocks.length ?? 0;
    const blocks: TimeBlock[] = [];

    for (let b = 0; b < blockCount; b++) {
      let totalCalls = 0;
      let bestStatus: BlockStatus = "calls";
      let bestPriority = 0;
      let bestContactDetail: ContactDetail | undefined;
      let bestAppointmentDetail: AppointmentDetail | undefined;

      for (const agentSessions of allAgentSessions) {
        // For a given session, get this agent's block
        const agentBlock = agentSessions[0]?.grid[dayIdx]?.blocks[b];
        if (!agentBlock) continue;
        totalCalls += agentBlock.calls;
        const priority = STATUS_PRIORITY[agentBlock.status];
        if (priority > bestPriority) {
          bestPriority = priority;
          bestStatus = agentBlock.status;
          bestContactDetail = agentBlock.contactDetail;
          bestAppointmentDetail = agentBlock.appointmentDetail;
        }
      }

      const time = firstAgent[0]?.grid[dayIdx]?.blocks[b]?.time ?? "";
      const block: TimeBlock = { time, calls: totalCalls, status: bestStatus };
      if (bestContactDetail) block.contactDetail = bestContactDetail;
      if (bestAppointmentDetail) block.appointmentDetail = bestAppointmentDetail;
      blocks.push(block);
    }

    return { day, blocks };
  });
}

// ── Public API ─────────────────────────────────────────────────────

export function getCallAgents(): CallAgent[] {
  return AGENTS;
}

export function getAvailableWeeks(): { label: string; value: number }[] {
  const weeks: { label: string; value: number }[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(now);
    // Go to Monday of this week, then subtract i weeks
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset - i * 7);

    const friday = new Date(weekStart);
    friday.setDate(friday.getDate() + 4);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} – ${monthNames[friday.getMonth()]} ${friday.getDate()}, ${friday.getFullYear()}`;
    weeks.push({ label, value: i });
  }

  return weeks;
}

export function getAgentCallData(agentId: string, weekIndex: number = 0): AgentCallData {
  const idx = AGENTS.findIndex(a => a.id === agentId);
  if (idx === -1) return generateAgentData(0, weekIndex);
  return generateAgentData(idx, weekIndex);
}

export function getCallTeamOverview(weekIndex: number = 0): CallTeamOverview {
  const allAgents = AGENTS.map((_, i) => generateAgentData(i, weekIndex));

  const totalCalls = allAgents.reduce((s, a) => s + a.totalCalls, 0);
  const avgCallsPerDay = Math.round(totalCalls / 5);
  const zeroCallBlocks = allAgents.reduce((s, a) => s + a.zeroCallBlocks, 0);
  const appointmentsSet = allAgents.reduce((s, a) => s + a.appointmentsSet, 0);
  const contactsMade = allAgents.reduce((s, a) => s + a.contactsMade, 0);
  const activeCallingPct = Math.round(
    allAgents.reduce((s, a) => s + a.activeCallingPct, 0) / allAgents.length
  );

  const totalMinutes = allAgents.reduce((s, a) => {
    const parts = a.activeCallTime.split(/h |m/);
    return s + parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }, 0);
  const avgMinutes = Math.round(totalMinutes / allAgents.length);
  const hours = Math.floor(avgMinutes / 60);
  const mins = avgMinutes % 60;

  // Aggregate sessions with proper cell-by-cell aggregation
  const sessions: CallSession[] = Array.from({ length: 5 }, (_, sIdx) => {
    const agentSessions = allAgents.map(a => a.sessions[sIdx]);
    const sessionContactsMade = agentSessions.reduce((s, ses) => s + ses.contactsMade, 0);
    const totalZeros = agentSessions.reduce((s, ses) => s + ses.totalZeros, 0);
    const callAttempts = agentSessions.reduce((s, ses) => s + ses.callAttempts, 0);

    // Aggregate grids cell-by-cell across all agents
    const grid = aggregateGrids(allAgents.map(a => [a.sessions[sIdx]]));

    return {
      sessionNumber: sIdx + 1,
      timeRange: SESSION_DEFS[sIdx].timeRange,
      contactsMade: sessionContactsMade,
      totalZeros,
      callAttempts,
      grid,
    };
  });

  // Aggregate daily stats
  const dailyStats: DailyCallStats[] = DAYS.map((day, dayIdx) => {
    const totalDayCalls = allAgents.reduce((s, a) => s + a.dailyStats[dayIdx].totalCalls, 0);
    const totalContacts = allAgents.reduce((s, a) => s + a.dailyStats[dayIdx].contactsMade, 0);
    const totalAppointments = allAgents.reduce((s, a) => s + a.dailyStats[dayIdx].appointments, 0);
    const contactRate = totalDayCalls > 0 ? Math.round((totalContacts / totalDayCalls) * 100) : 0;
    return {
      day,
      totalCalls: totalDayCalls,
      contactsMade: totalContacts,
      contactRate,
      appointments: totalAppointments,
      avgCallTime: allAgents[0].dailyStats[dayIdx].avgCallTime,
    };
  });

  // Aggregate dispositions
  const dispositions: DispositionRow[] = DISPOSITION_CODES.map((code, codeIdx) => {
    const bySession: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (const a of allAgents) {
      for (let s = 0; s < 5; s++) {
        bySession[s] += a.dispositions[codeIdx].bySession[s];
      }
    }
    const total = bySession.reduce((a, b) => a + b, 0);
    return { code, bySession, total };
  });

  const weeklyTrend = dailyStats.map(d => d.totalCalls);

  return {
    totalCalls,
    avgCallsPerDay,
    zeroCallBlocks,
    appointmentsSet,
    contactsMade,
    activeCallingPct,
    activeCallTime: `${hours}h ${mins}m`,
    totalAgents: AGENTS.length,
    sessions,
    dailyStats,
    dispositions,
    weeklyTrend,
  };
}

export function getAgentLeaderboard(weekIndex: number = 0): AgentLeaderboardRow[] {
  const allAgents = AGENTS.map((_, i) => generateAgentData(i, weekIndex));

  const rows: AgentLeaderboardRow[] = allAgents.map(a => {
    const totalContacts = a.contactsMade + a.appointmentsSet;
    const contactRate = a.totalCalls > 0 ? Math.round((totalContacts / a.totalCalls) * 100) : 0;
    const contactToAptRate = totalContacts > 0 ? Math.round((a.appointmentsSet / totalContacts) * 100) : 0;

    return {
      agentId: a.agent.id,
      name: a.agent.name,
      team: a.agent.team,
      totalCalls: a.totalCalls,
      contactRate,
      contactToAptRate,
      appointmentsSet: a.appointmentsSet,
      zeroCallBlocks: a.zeroCallBlocks,
      activeCallingPct: a.activeCallingPct,
    };
  });

  // Sort by totalCalls descending
  rows.sort((a, b) => b.totalCalls - a.totalCalls);
  return rows;
}

export function getDailyGoals(weekIndex: number = 0): AgentDailyGoal[] {
  const allAgents = AGENTS.map((_, i) => generateAgentData(i, weekIndex));
  const goals: AgentDailyGoal[] = [];

  for (const agent of allAgents) {
    for (const ds of agent.dailyStats) {
      const target = 40;
      const actual = ds.totalCalls;
      const pct = Math.round((actual / target) * 100);
      goals.push({
        agentId: agent.agent.id,
        name: agent.agent.name,
        day: ds.day,
        target,
        actual,
        pct,
        metGoal: actual >= target,
      });
    }
  }

  return goals;
}
