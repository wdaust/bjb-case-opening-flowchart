export interface TrackerTask {
  id: string;
  label: string;
  assignedTo: string;
  sla: string;
  phase: string;
  phaseOrder: number;
}

export interface Phase {
  id: string;
  label: string;
  color: string;
  order: number;
}

export const phases: Phase[] = [
  { id: "intake", label: "Intake & Qualification", color: "blue", order: 1 },
  { id: "conflict-check", label: "Conflict Check", color: "purple", order: 2 },
  {
    id: "engagement",
    label: "Engagement & Authorization",
    color: "indigo",
    order: 3,
  },
  {
    id: "insurance",
    label: "Insurance Investigation",
    color: "cyan",
    order: 4,
  },
  {
    id: "medical-records",
    label: "Medical Records Collection",
    color: "teal",
    order: 5,
  },
  {
    id: "provider-mgmt",
    label: "Provider Management",
    color: "green",
    order: 6,
  },
  {
    id: "client-profile",
    label: "Client Profile Building",
    color: "lime",
    order: 7,
  },
  {
    id: "liability",
    label: "Liability Assessment",
    color: "amber",
    order: 8,
  },
  { id: "coverage", label: "Coverage Analysis", color: "orange", order: 9 },
  {
    id: "treatment",
    label: "Treatment Monitoring",
    color: "rose",
    order: 10,
  },
  { id: "liens", label: "Lien Management", color: "pink", order: 11 },
  {
    id: "demand-prep",
    label: "Demand Preparation",
    color: "violet",
    order: 12,
  },
  {
    id: "quality-review",
    label: "Quality Review & Handoff",
    color: "slate",
    order: 13,
  },
];

export const tasks: TrackerTask[] = [
  // Phase 1: Intake & Qualification (5)
  {
    id: "INT-001",
    label: "Initial client call and incident screening",
    assignedTo: "Intake Specialist",
    sla: "2 hours",
    phase: "intake",
    phaseOrder: 1,
  },
  {
    id: "INT-002",
    label: "Collect accident details and injury summary",
    assignedTo: "Intake Specialist",
    sla: "4 hours",
    phase: "intake",
    phaseOrder: 2,
  },
  {
    id: "INT-003",
    label: "Run case qualification checklist",
    assignedTo: "Intake Specialist",
    sla: "4 hours",
    phase: "intake",
    phaseOrder: 3,
  },
  {
    id: "INT-004",
    label: "Verify statute of limitations window",
    assignedTo: "Paralegal",
    sla: "24 hours",
    phase: "intake",
    phaseOrder: 4,
  },
  {
    id: "INT-005",
    label: "Attorney review of intake for case acceptance",
    assignedTo: "Attorney",
    sla: "24 hours",
    phase: "intake",
    phaseOrder: 5,
  },

  // Phase 2: Conflict Check (3)
  {
    id: "CON-001",
    label: "Run adverse party conflict search",
    assignedTo: "Legal Assistant",
    sla: "4 hours",
    phase: "conflict-check",
    phaseOrder: 1,
  },
  {
    id: "CON-002",
    label: "Cross-reference related parties in CMS",
    assignedTo: "Legal Assistant",
    sla: "24 hours",
    phase: "conflict-check",
    phaseOrder: 2,
  },
  {
    id: "CON-003",
    label: "Document conflict clearance and attorney sign-off",
    assignedTo: "Attorney",
    sla: "24 hours",
    phase: "conflict-check",
    phaseOrder: 3,
  },

  // Phase 3: Engagement & Authorization (5)
  {
    id: "ENG-001",
    label: "Prepare retainer agreement and fee disclosure",
    assignedTo: "Paralegal",
    sla: "24 hours",
    phase: "engagement",
    phaseOrder: 1,
  },
  {
    id: "ENG-002",
    label: "Obtain signed retainer and engagement letter",
    assignedTo: "Case Manager",
    sla: "48 hours",
    phase: "engagement",
    phaseOrder: 2,
  },
  {
    id: "ENG-003",
    label: "Send medical authorization forms for signature",
    assignedTo: "Legal Assistant",
    sla: "24 hours",
    phase: "engagement",
    phaseOrder: 3,
  },
  {
    id: "ENG-004",
    label: "File letter of representation with carrier",
    assignedTo: "Paralegal",
    sla: "48 hours",
    phase: "engagement",
    phaseOrder: 4,
  },
  {
    id: "ENG-005",
    label: "Set up case file in case management system",
    assignedTo: "Legal Assistant",
    sla: "24 hours",
    phase: "engagement",
    phaseOrder: 5,
  },

  // Phase 4: Insurance Investigation (5)
  {
    id: "INS-001",
    label: "Identify all adverse insurance carriers",
    assignedTo: "Paralegal",
    sla: "48 hours",
    phase: "insurance",
    phaseOrder: 1,
  },
  {
    id: "INS-002",
    label: "Request policy declarations and limits",
    assignedTo: "Paralegal",
    sla: "3 days",
    phase: "insurance",
    phaseOrder: 2,
  },
  {
    id: "INS-003",
    label: "Verify UM/UIM coverage on client policy",
    assignedTo: "Paralegal",
    sla: "5 days",
    phase: "insurance",
    phaseOrder: 3,
  },
  {
    id: "INS-004",
    label: "Document claim numbers and adjuster contacts",
    assignedTo: "Legal Assistant",
    sla: "48 hours",
    phase: "insurance",
    phaseOrder: 4,
  },
  {
    id: "INS-005",
    label: "Evaluate additional coverage sources",
    assignedTo: "Case Manager",
    sla: "7 days",
    phase: "insurance",
    phaseOrder: 5,
  },

  // Phase 5: Medical Records Collection (5)
  {
    id: "MED-001",
    label: "Send records requests to all treating providers",
    assignedTo: "Legal Assistant",
    sla: "3 days",
    phase: "medical-records",
    phaseOrder: 1,
  },
  {
    id: "MED-002",
    label: "Follow up on outstanding medical records",
    assignedTo: "Legal Assistant",
    sla: "7 days",
    phase: "medical-records",
    phaseOrder: 2,
  },
  {
    id: "MED-003",
    label: "Obtain pre-accident medical history records",
    assignedTo: "Paralegal",
    sla: "14 days",
    phase: "medical-records",
    phaseOrder: 3,
  },
  {
    id: "MED-004",
    label: "Collect billing statements from all providers",
    assignedTo: "Legal Assistant",
    sla: "14 days",
    phase: "medical-records",
    phaseOrder: 4,
  },
  {
    id: "MED-005",
    label: "Index and organize received medical records",
    assignedTo: "Paralegal",
    sla: "5 days",
    phase: "medical-records",
    phaseOrder: 5,
  },

  // Phase 6: Provider Management (3)
  {
    id: "PRV-001",
    label: "Coordinate referral to specialist providers",
    assignedTo: "Case Manager",
    sla: "5 days",
    phase: "provider-mgmt",
    phaseOrder: 1,
  },
  {
    id: "PRV-002",
    label: "Verify provider credentials and facility standing",
    assignedTo: "Paralegal",
    sla: "7 days",
    phase: "provider-mgmt",
    phaseOrder: 2,
  },
  {
    id: "PRV-003",
    label: "Establish LOP agreements with treating providers",
    assignedTo: "Case Manager",
    sla: "7 days",
    phase: "provider-mgmt",
    phaseOrder: 3,
  },

  // Phase 7: Client Profile Building (4)
  {
    id: "CPB-001",
    label: "Complete initial client profile scoring assessment",
    assignedTo: "Intake Specialist",
    sla: "48 hours",
    phase: "client-profile",
    phaseOrder: 1,
  },
  {
    id: "CPB-002",
    label: "Gather employment and wage loss documentation",
    assignedTo: "Paralegal",
    sla: "7 days",
    phase: "client-profile",
    phaseOrder: 2,
  },
  {
    id: "CPB-003",
    label: "Document communication preferences and contact schedule",
    assignedTo: "Case Manager",
    sla: "24 hours",
    phase: "client-profile",
    phaseOrder: 3,
  },
  {
    id: "CPB-004",
    label: "Conduct social media and prior claims review",
    assignedTo: "Paralegal",
    sla: "5 days",
    phase: "client-profile",
    phaseOrder: 4,
  },

  // Phase 8: Liability Assessment (4)
  {
    id: "LIA-001",
    label: "Obtain and review police/incident report",
    assignedTo: "Paralegal",
    sla: "5 days",
    phase: "liability",
    phaseOrder: 1,
  },
  {
    id: "LIA-002",
    label: "Collect witness statements and contact info",
    assignedTo: "Paralegal",
    sla: "7 days",
    phase: "liability",
    phaseOrder: 2,
  },
  {
    id: "LIA-003",
    label: "Secure photo and video evidence of scene",
    assignedTo: "Legal Assistant",
    sla: "3 days",
    phase: "liability",
    phaseOrder: 3,
  },
  {
    id: "LIA-004",
    label: "Complete liability scoring and comparative negligence review",
    assignedTo: "Attorney",
    sla: "7 days",
    phase: "liability",
    phaseOrder: 4,
  },

  // Phase 9: Coverage Analysis (4)
  {
    id: "COV-001",
    label: "Confirm policy limits and coverage types",
    assignedTo: "Paralegal",
    sla: "5 days",
    phase: "coverage",
    phaseOrder: 1,
  },
  {
    id: "COV-002",
    label: "Evaluate reservation of rights status",
    assignedTo: "Attorney",
    sla: "7 days",
    phase: "coverage",
    phaseOrder: 2,
  },
  {
    id: "COV-003",
    label: "Assess defendant personal asset collectability",
    assignedTo: "Paralegal",
    sla: "14 days",
    phase: "coverage",
    phaseOrder: 3,
  },
  {
    id: "COV-004",
    label: "Complete coverage scoring and recovery strategy memo",
    assignedTo: "Case Manager",
    sla: "7 days",
    phase: "coverage",
    phaseOrder: 4,
  },

  // Phase 10: Treatment Monitoring (4)
  {
    id: "TRT-001",
    label: "Track treatment compliance and gap analysis",
    assignedTo: "Case Manager",
    sla: "7 days",
    phase: "treatment",
    phaseOrder: 1,
  },
  {
    id: "TRT-002",
    label: "Review incoming medical records and update chronology",
    assignedTo: "Paralegal",
    sla: "5 days",
    phase: "treatment",
    phaseOrder: 2,
  },
  {
    id: "TRT-003",
    label: "Score treatment strength and document objective findings",
    assignedTo: "Case Manager",
    sla: "7 days",
    phase: "treatment",
    phaseOrder: 3,
  },
  {
    id: "TRT-004",
    label: "Evaluate future care needs and permanent restrictions",
    assignedTo: "Attorney",
    sla: "14 days",
    phase: "treatment",
    phaseOrder: 4,
  },

  // Phase 11: Lien Management (3)
  {
    id: "LEN-001",
    label: "Identify and log all outstanding medical liens",
    assignedTo: "Paralegal",
    sla: "7 days",
    phase: "liens",
    phaseOrder: 1,
  },
  {
    id: "LEN-002",
    label: "Negotiate lien reductions with providers and insurers",
    assignedTo: "Case Manager",
    sla: "14 days",
    phase: "liens",
    phaseOrder: 2,
  },
  {
    id: "LEN-003",
    label: "Obtain final lien payoff amounts and release letters",
    assignedTo: "Paralegal",
    sla: "14 days",
    phase: "liens",
    phaseOrder: 3,
  },

  // Phase 12: Demand Preparation (4)
  {
    id: "DEM-001",
    label: "Compile special damages summary and calculations",
    assignedTo: "Paralegal",
    sla: "7 days",
    phase: "demand-prep",
    phaseOrder: 1,
  },
  {
    id: "DEM-002",
    label: "Draft demand letter narrative and legal arguments",
    assignedTo: "Attorney",
    sla: "14 days",
    phase: "demand-prep",
    phaseOrder: 2,
  },
  {
    id: "DEM-003",
    label: "Assemble demand package exhibits and attachments",
    assignedTo: "Legal Assistant",
    sla: "5 days",
    phase: "demand-prep",
    phaseOrder: 3,
  },
  {
    id: "DEM-004",
    label: "Final attorney review and demand authorization",
    assignedTo: "Attorney",
    sla: "3 days",
    phase: "demand-prep",
    phaseOrder: 4,
  },

  // Phase 13: Quality Review & Handoff (4)
  {
    id: "QRH-001",
    label: "Run file completeness and compliance audit",
    assignedTo: "Case Manager",
    sla: "3 days",
    phase: "quality-review",
    phaseOrder: 1,
  },
  {
    id: "QRH-002",
    label: "Verify all scoring systems are current and documented",
    assignedTo: "Case Manager",
    sla: "48 hours",
    phase: "quality-review",
    phaseOrder: 2,
  },
  {
    id: "QRH-003",
    label: "Complete case performance index final scoring",
    assignedTo: "Attorney",
    sla: "3 days",
    phase: "quality-review",
    phaseOrder: 3,
  },
  {
    id: "QRH-004",
    label: "Attorney sign-off and negotiation team handoff",
    assignedTo: "Attorney",
    sla: "24 hours",
    phase: "quality-review",
    phaseOrder: 4,
  },
];
