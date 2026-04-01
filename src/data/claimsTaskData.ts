import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const claimsPhases: Phase[] = [
  {
    id: "demand-review-liability",
    label: "Demand Review — Liability",
    color: "blue-700",
    order: 1,
  },
  {
    id: "demand-review-treatment",
    label: "Demand Review — Treatment",
    color: "teal-700",
    order: 2,
  },
  {
    id: "demand-review-records",
    label: "Demand Review — Records & Bills",
    color: "green-700",
    order: 3,
  },
  {
    id: "demand-review-damages",
    label: "Demand Review — Damages",
    color: "amber-700",
    order: 4,
  },
  {
    id: "demand-review-insurance",
    label: "Demand Review — Insurance",
    color: "indigo-700",
    order: 5,
  },
  {
    id: "demand-drafting",
    label: "Demand Drafting",
    color: "purple-700",
    order: 6,
  },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "rose-700",
    order: 7,
  },
];

export const claimsTasks: TrackerTask[] = [
  // Phase 1: Demand Review — Liability
  {
    id: "CLM-A",
    label: "Review police report and confirm liability position",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from demand assignment",
    phase: "demand-review-liability",
    phaseOrder: 1,
  },
  {
    id: "CLM-B",
    label: "Confirm fault allocation and comparative negligence issues",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from demand assignment",
    phase: "demand-review-liability",
    phaseOrder: 2,
  },
  {
    id: "CLM-C",
    label: "Identify any liability disputes or coverage issues",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from demand assignment",
    phase: "demand-review-liability",
    phaseOrder: 3,
  },
  {
    id: "CLM-D",
    label: "Flag case for attorney review if liability contested",
    assignedTo: "Demand Coordinator",
    sla: "Same day as issue identified",
    phase: "demand-review-liability",
    phaseOrder: 4,
  },

  // Phase 2: Demand Review — Treatment
  {
    id: "CLM-E",
    label: "Review treatment timeline and verify gap-free narrative",
    assignedTo: "Demand Coordinator",
    sla: "3 business days from liability review",
    phase: "demand-review-treatment",
    phaseOrder: 1,
  },
  {
    id: "CLM-F",
    label: "Confirm treatment is complete or ongoing status documented",
    assignedTo: "Demand Coordinator",
    sla: "3 business days from liability review",
    phase: "demand-review-treatment",
    phaseOrder: 2,
  },
  {
    id: "CLM-G",
    label: "Verify all treating providers are documented with specialties",
    assignedTo: "Demand Coordinator",
    sla: "3 business days from liability review",
    phase: "demand-review-treatment",
    phaseOrder: 3,
  },
  {
    id: "CLM-H",
    label: "Confirm future treatment recommendations from physicians",
    assignedTo: "Demand Coordinator",
    sla: "3 business days from liability review",
    phase: "demand-review-treatment",
    phaseOrder: 4,
  },

  // Phase 3: Demand Review — Records & Bills
  {
    id: "CLM-I",
    label: "Verify all medical records are on file and complete",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from treatment review",
    phase: "demand-review-records",
    phaseOrder: 1,
  },
  {
    id: "CLM-J",
    label: "Verify all billing records match treatment providers",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from treatment review",
    phase: "demand-review-records",
    phaseOrder: 2,
  },
  {
    id: "CLM-K",
    label: "Confirm lien balances and reduction potential",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from treatment review",
    phase: "demand-review-records",
    phaseOrder: 3,
  },
  {
    id: "CLM-L",
    label: "Flag any missing records and coordinate with Med Records team",
    assignedTo: "Demand Coordinator",
    sla: "Same day as gap identified",
    phase: "demand-review-records",
    phaseOrder: 4,
  },

  // Phase 4: Demand Review — Damages
  {
    id: "CLM-M",
    label: "Calculate total medical specials (past and future)",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from records review",
    phase: "demand-review-damages",
    phaseOrder: 1,
  },
  {
    id: "CLM-N",
    label: "Document lost wages with employer verification",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from records review",
    phase: "demand-review-damages",
    phaseOrder: 2,
  },
  {
    id: "CLM-O",
    label: "Compile pain and suffering narrative with supporting evidence",
    assignedTo: "Demand Coordinator",
    sla: "3 business days from records review",
    phase: "demand-review-damages",
    phaseOrder: 3,
  },
  {
    id: "CLM-P",
    label: "Identify any future damages (loss of earning capacity, future medical)",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from records review",
    phase: "demand-review-damages",
    phaseOrder: 4,
  },

  // Phase 5: Demand Review — Insurance
  {
    id: "CLM-Q",
    label: "Confirm policy limits for all applicable policies",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from damages review",
    phase: "demand-review-insurance",
    phaseOrder: 1,
  },
  {
    id: "CLM-R",
    label: "Identify UM/UIM coverage and stacking potential",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from damages review",
    phase: "demand-review-insurance",
    phaseOrder: 2,
  },
  {
    id: "CLM-S",
    label: "Verify adjuster assignment and contact information",
    assignedTo: "Demand Coordinator",
    sla: "1 business day from insurance review start",
    phase: "demand-review-insurance",
    phaseOrder: 3,
  },
  {
    id: "CLM-T",
    label: "Confirm PIP/MedPay exhaustion or remaining benefits",
    assignedTo: "Demand Coordinator",
    sla: "2 business days from damages review",
    phase: "demand-review-insurance",
    phaseOrder: 4,
  },

  // Phase 6: Demand Drafting
  {
    id: "CLM-U",
    label: "Draft demand letter with liability, treatment, and damages sections",
    assignedTo: "Demand Coordinator",
    sla: "5 business days from review completion",
    phase: "demand-drafting",
    phaseOrder: 1,
  },
  {
    id: "CLM-V",
    label: "Compile demand exhibits package (records, bills, photos, reports)",
    assignedTo: "Demand Coordinator",
    sla: "3 business days from draft start",
    phase: "demand-drafting",
    phaseOrder: 2,
  },
  {
    id: "CLM-W",
    label: "Attorney review and approve demand letter",
    assignedTo: "Attorney",
    sla: "3 business days from draft submission",
    phase: "demand-drafting",
    phaseOrder: 3,
  },
  {
    id: "CLM-X",
    label: "Send demand package to insurance carrier",
    assignedTo: "Demand Coordinator",
    sla: "1 business day from attorney approval",
    phase: "demand-drafting",
    phaseOrder: 4,
  },

  // Phase 7: Negotiation
  {
    id: "CLM-Y",
    label: "Log demand sent date and set 30-day follow-up",
    assignedTo: "Demand Coordinator",
    sla: "Same day as demand sent",
    phase: "negotiation",
    phaseOrder: 1,
  },
  {
    id: "CLM-Z",
    label: "30-day follow-up with adjuster for response",
    assignedTo: "Demand Coordinator",
    sla: "30 days from demand sent",
    phase: "negotiation",
    phaseOrder: 2,
  },
  {
    id: "CLM-AA",
    label: "Present counter-offer to attorney for evaluation",
    assignedTo: "Demand Coordinator",
    sla: "1 business day from counter receipt",
    phase: "negotiation",
    phaseOrder: 3,
  },
  {
    id: "CLM-AB",
    label: "Attorney provides settlement authority or counter direction",
    assignedTo: "Attorney",
    sla: "2 business days from presentation",
    phase: "negotiation",
    phaseOrder: 4,
  },
  {
    id: "CLM-AC",
    label: "Communicate counter-offer to adjuster",
    assignedTo: "Demand Coordinator",
    sla: "1 business day from attorney direction",
    phase: "negotiation",
    phaseOrder: 5,
  },
  {
    id: "CLM-AD",
    label: "Document final settlement or recommend litigation referral",
    assignedTo: "Demand Coordinator",
    sla: "1 business day from resolution",
    phase: "negotiation",
    phaseOrder: 6,
  },
];

// ── Path stages ──────────────────────────────────────────────────────

export const CLAIMS_PATH_STAGES: PathStage[] = [
  { label: "Demand Review", firstTaskId: "CLM-A", lastTaskId: "CLM-T" },
  { label: "Demand Drafting", firstTaskId: "CLM-U", lastTaskId: "CLM-X" },
  { label: "Negotiation", firstTaskId: "CLM-Y", lastTaskId: "CLM-AD" },
];

export function getClaimsTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = claimsTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = claimsTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return claimsTasks.slice(startIdx, endIdx + 1);
}
