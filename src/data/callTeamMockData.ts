// ── Types ──────────────────────────────────────────────────────────

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type BlockStatus = "calls" | "no-calls" | "contact" | "appointment" | "time-off";

export interface TimeBlock {
  time: string;
  calls: number;
  status: BlockStatus;
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
  activeCallingPct: number;
  activeCallTime: string;
  totalAgents: number;
  sessions: CallSession[];
  dailyStats: DailyCallStats[];
  dispositions: DispositionRow[];
  weeklyTrend: number[];
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

// ── Deterministic pseudo-random ────────────────────────────────────

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function seededInt(seed: number, min: number, max: number): number {
  return min + Math.floor(seeded(seed) * (max - min + 1));
}

// ── Generators ─────────────────────────────────────────────────────

function generateTimeBlocks(sessionIdx: number, dayIdx: number, agentIdx: number): TimeBlock[] {
  const def = SESSION_DEFS[sessionIdx];
  const [startH, startM] = def.start.split(":").map(Number);
  const blocks: TimeBlock[] = [];

  for (let b = 0; b < def.blocks; b++) {
    const totalMin = startM + b * 5;
    const h = startH + Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const seed = agentIdx * 10000 + sessionIdx * 1000 + dayIdx * 100 + b;
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

    blocks.push({ time, calls, status });
  }

  return blocks;
}

function generateSession(sessionIdx: number, agentIdx: number): CallSession {
  const grid: SessionDayRow[] = DAYS.map((day, dayIdx) => ({
    day,
    blocks: generateTimeBlocks(sessionIdx, dayIdx, agentIdx),
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

function generateDispositions(agentIdx: number): DispositionRow[] {
  return DISPOSITION_CODES.map((code, codeIdx) => {
    const bySession: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (let s = 0; s < 5; s++) {
      const seed = agentIdx * 1000 + codeIdx * 100 + s * 10 + 7;
      // Weight certain codes higher
      const weight = codeIdx >= 7 ? 2.5 : codeIdx >= 3 ? 1.5 : 1;
      bySession[s] = Math.round(seededInt(seed, 0, 8) * weight);
    }
    const total = bySession.reduce((a, b) => a + b, 0);
    return { code, bySession, total };
  });
}

function generateDailyStats(sessions: CallSession[]): DailyCallStats[] {
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
    const avgMin = seededInt(dayIdx * 13 + 42, 1, 3);
    const avgSec = seededInt(dayIdx * 17 + 23, 10, 55);

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

function generateAgentData(agentIdx: number): AgentCallData {
  const agent = AGENTS[agentIdx];
  const sessions = Array.from({ length: 5 }, (_, i) => generateSession(i, agentIdx));
  const dailyStats = generateDailyStats(sessions);
  const dispositions = generateDispositions(agentIdx);

  let totalCalls = 0;
  let zeroCallBlocks = 0;
  let appointmentsSet = 0;

  for (const s of sessions) {
    totalCalls += s.callAttempts;
    zeroCallBlocks += s.totalZeros;
    for (const row of s.grid) {
      for (const block of row.blocks) {
        if (block.status === "appointment") appointmentsSet++;
      }
    }
  }

  const avgCallsPerDay = Math.round(totalCalls / 5);
  const totalBlocks = sessions.reduce((sum, s) => sum + s.grid.reduce((rs, r) => rs + r.blocks.length, 0), 0);
  const activeBlocks = totalBlocks - zeroCallBlocks;
  const activeCallingPct = Math.round((activeBlocks / totalBlocks) * 100);

  const totalMinutes = seededInt(agentIdx * 99 + 55, 180, 320);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const payForCalling = seededInt(agentIdx * 77 + 11, 400, 650);
  const aptPayBonus = appointmentsSet * seededInt(agentIdx * 33 + 22, 15, 35);
  const callingBonus = totalCalls > 150 ? seededInt(agentIdx * 44 + 33, 50, 150) : 0;
  const totalPay = payForCalling + aptPayBonus + callingBonus;

  const weeklyTrend = dailyStats.map(d => d.totalCalls);

  return {
    agent,
    totalCalls,
    avgCallsPerDay,
    zeroCallBlocks,
    appointmentsSet,
    activeCallingPct,
    activeCallTime: `${hours}h ${mins}m`,
    sessions,
    dailyStats,
    dispositions,
    pay: { payForCalling, aptPayBonus, callingBonus, totalPay },
    weeklyTrend,
  };
}

// ── Public API ─────────────────────────────────────────────────────

export function getCallAgents(): CallAgent[] {
  return AGENTS;
}

export function getAgentCallData(agentId: string): AgentCallData {
  const idx = AGENTS.findIndex(a => a.id === agentId);
  if (idx === -1) return generateAgentData(0);
  return generateAgentData(idx);
}

export function getCallTeamOverview(): CallTeamOverview {
  const allAgents = AGENTS.map((_, i) => generateAgentData(i));

  const totalCalls = allAgents.reduce((s, a) => s + a.totalCalls, 0);
  const avgCallsPerDay = Math.round(totalCalls / 5);
  const zeroCallBlocks = allAgents.reduce((s, a) => s + a.zeroCallBlocks, 0);
  const appointmentsSet = allAgents.reduce((s, a) => s + a.appointmentsSet, 0);
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

  // Aggregate sessions by merging grids across agents
  const sessions: CallSession[] = Array.from({ length: 5 }, (_, sIdx) => {
    const agentSessions = allAgents.map(a => a.sessions[sIdx]);
    const contactsMade = agentSessions.reduce((s, ses) => s + ses.contactsMade, 0);
    const totalZeros = agentSessions.reduce((s, ses) => s + ses.totalZeros, 0);
    const callAttempts = agentSessions.reduce((s, ses) => s + ses.callAttempts, 0);

    // Use first agent's grid as representative (team-level heatmap shows agent 0)
    const grid = agentSessions[0].grid;

    return {
      sessionNumber: sIdx + 1,
      timeRange: SESSION_DEFS[sIdx].timeRange,
      contactsMade,
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
    activeCallingPct,
    activeCallTime: `${hours}h ${mins}m`,
    totalAgents: AGENTS.length,
    sessions,
    dailyStats,
    dispositions,
    weeklyTrend,
  };
}
