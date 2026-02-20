export interface ScoringFactor {
  id: string;
  label: string;
  weight: number;
  rubric: Record<number, string>;
}

export interface ScoringCategory {
  id: string;
  label: string;
  weight: number;
  factors: ScoringFactor[];
}

export interface ActionTrigger {
  min: number;
  max: number;
  label: string;
  action: string;
  color: string;
}

export interface HygieneItem {
  id: string;
  label: string;
}

export interface GovernanceRow {
  stage: string;
  whoScores: string;
  when: string;
}

export interface ScoringSystem {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  categories: ScoringCategory[];
  actionTriggers: ActionTrigger[];
  hygieneGate: HygieneItem[];
  governance: GovernanceRow[];
  maxScore: number;
}

const clientProfileSystem: ScoringSystem = {
  id: "client-profile",
  label: "Client Profile Scoring",
  shortLabel: "Client Profile",
  description:
    "Evaluates client cooperation, reliability, and case-readiness across 7 behavioral dimensions",
  maxScore: 140,
  categories: [
    {
      id: "reachability",
      label: "Reachability & Responsiveness",
      weight: 0.15,
      factors: [
        {
          id: "contactability",
          label: "Contactability",
          weight: 0.25,
          rubric: {
            1: "Cannot reach",
            2: "Rarely responds",
            3: "Responds within 48h",
            4: "Responds within 24h",
            5: "Immediately reachable",
          },
        },
        {
          id: "response-time",
          label: "Response Time",
          weight: 0.25,
          rubric: {
            1: "Over a week",
            2: "3-5 days",
            3: "1-2 days",
            4: "Same day",
            5: "Within hours",
          },
        },
        {
          id: "follow-through",
          label: "Follow-Through",
          weight: 0.25,
          rubric: {
            1: "Never follows through",
            2: "Rarely",
            3: "Sometimes",
            4: "Usually",
            5: "Always completes",
          },
        },
        {
          id: "appointment-reliability",
          label: "Appointment Reliability",
          weight: 0.25,
          rubric: {
            1: "No-shows frequently",
            2: "Often reschedules",
            3: "Occasional issues",
            4: "Reliable",
            5: "Never misses",
          },
        },
      ],
    },
    {
      id: "engagement",
      label: "Engagement & Cooperation",
      weight: 0.15,
      factors: [
        {
          id: "engagement-level",
          label: "Engagement Level",
          weight: 0.25,
          rubric: {
            1: "Disengaged",
            2: "Minimally engaged",
            3: "Moderately engaged",
            4: "Actively engaged",
            5: "Highly proactive",
          },
        },
        {
          id: "trust-alignment",
          label: "Trust Alignment",
          weight: 0.25,
          rubric: {
            1: "Adversarial",
            2: "Skeptical",
            3: "Neutral",
            4: "Trusting",
            5: "Fully aligned",
          },
        },
        {
          id: "story-consistency",
          label: "Story Consistency",
          weight: 0.25,
          rubric: {
            1: "Major contradictions",
            2: "Frequent changes",
            3: "Minor inconsistencies",
            4: "Mostly consistent",
            5: "Perfectly consistent",
          },
        },
        {
          id: "transparency",
          label: "Transparency",
          weight: 0.25,
          rubric: {
            1: "Withholds information",
            2: "Selective sharing",
            3: "Shares when asked",
            4: "Proactively shares",
            5: "Fully transparent",
          },
        },
      ],
    },
    {
      id: "treatment-behavior",
      label: "Treatment Behavior",
      weight: 0.15,
      factors: [
        {
          id: "treatment-consistency",
          label: "Treatment Consistency",
          weight: 0.25,
          rubric: {
            1: "Abandoned treatment",
            2: "Major gaps",
            3: "Some gaps",
            4: "Mostly consistent",
            5: "Fully compliant",
          },
        },
        {
          id: "care-plan-compliance",
          label: "Care Plan Compliance",
          weight: 0.25,
          rubric: {
            1: "Non-compliant",
            2: "Rarely follows",
            3: "Partially follows",
            4: "Mostly follows",
            5: "Fully follows",
          },
        },
        {
          id: "escalation-readiness",
          label: "Escalation Readiness",
          weight: 0.25,
          rubric: {
            1: "Refuses escalation",
            2: "Resistant",
            3: "Neutral",
            4: "Open",
            5: "Proactively seeks",
          },
        },
        {
          id: "treatment-doc-strength",
          label: "Treatment Documentation Strength",
          weight: 0.25,
          rubric: {
            1: "No records",
            2: "Minimal",
            3: "Partial",
            4: "Good",
            5: "Comprehensive",
          },
        },
      ],
    },
    {
      id: "risk-stability",
      label: "Risk & Stability",
      weight: 0.15,
      factors: [
        {
          id: "life-stability",
          label: "Life Stability",
          weight: 0.25,
          rubric: {
            1: "Crisis situation",
            2: "Unstable",
            3: "Some instability",
            4: "Mostly stable",
            5: "Very stable",
          },
        },
        {
          id: "behavioral-volatility",
          label: "Behavioral Volatility",
          weight: 0.25,
          rubric: {
            1: "Highly volatile",
            2: "Frequently erratic",
            3: "Occasional issues",
            4: "Generally calm",
            5: "Very stable",
          },
        },
        {
          id: "social-media-risk",
          label: "Social Media Risk",
          weight: 0.25,
          rubric: {
            1: "Actively damaging posts",
            2: "Risky content",
            3: "Neutral presence",
            4: "Minimal exposure",
            5: "No risk",
          },
        },
        {
          id: "prior-claims-risk",
          label: "Prior Claims Risk",
          weight: 0.25,
          rubric: {
            1: "Multiple prior claims",
            2: "One recent claim",
            3: "Old claim",
            4: "Related but resolved",
            5: "No prior claims",
          },
        },
      ],
    },
    {
      id: "settlement-posture",
      label: "Settlement Posture",
      weight: 0.15,
      factors: [
        {
          id: "expectation-realism",
          label: "Expectation Realism",
          weight: 0.25,
          rubric: {
            1: "Wildly unrealistic",
            2: "Inflated",
            3: "Somewhat realistic",
            4: "Realistic",
            5: "Well-calibrated",
          },
        },
        {
          id: "patience-tolerance",
          label: "Patience & Tolerance",
          weight: 0.25,
          rubric: {
            1: "Demands immediate",
            2: "Very impatient",
            3: "Moderate patience",
            4: "Patient",
            5: "Very patient",
          },
        },
        {
          id: "decision-readiness",
          label: "Decision Readiness",
          weight: 0.25,
          rubric: {
            1: "Cannot decide",
            2: "Very indecisive",
            3: "Needs guidance",
            4: "Mostly decisive",
            5: "Decisive",
          },
        },
        {
          id: "negotiation-temperament",
          label: "Negotiation Temperament",
          weight: 0.25,
          rubric: {
            1: "Combative",
            2: "Difficult",
            3: "Neutral",
            4: "Cooperative",
            5: "Flexible",
          },
        },
      ],
    },
    {
      id: "admin-readiness",
      label: "Administrative Readiness",
      weight: 0.15,
      factors: [
        {
          id: "doc-readiness",
          label: "Document Readiness",
          weight: 0.25,
          rubric: {
            1: "Cannot produce",
            2: "Struggles",
            3: "Some ready",
            4: "Mostly ready",
            5: "All ready",
          },
        },
        {
          id: "signature-reliability",
          label: "Signature Reliability",
          weight: 0.25,
          rubric: {
            1: "Refuses to sign",
            2: "Long delays",
            3: "Moderate delays",
            4: "Signs promptly",
            5: "Immediate",
          },
        },
        {
          id: "comm-preference-clarity",
          label: "Communication Preference Clarity",
          weight: 0.25,
          rubric: {
            1: "Unclear/changes",
            2: "Vague",
            3: "Somewhat clear",
            4: "Clear",
            5: "Crystal clear",
          },
        },
        {
          id: "rules-adherence",
          label: "Rules Adherence",
          weight: 0.25,
          rubric: {
            1: "Ignores rules",
            2: "Selective",
            3: "Mostly follows",
            4: "Follows well",
            5: "Exemplary",
          },
        },
      ],
    },
    {
      id: "case-strength",
      label: "Case-Strength Adjacent",
      weight: 0.1,
      factors: [
        {
          id: "witness-cooperation",
          label: "Witness Cooperation",
          weight: 0.25,
          rubric: {
            1: "Refuses",
            2: "Reluctant",
            3: "Willing when asked",
            4: "Proactive",
            5: "Fully cooperative",
          },
        },
        {
          id: "damage-narrative",
          label: "Damage Narrative",
          weight: 0.25,
          rubric: {
            1: "Cannot articulate",
            2: "Vague",
            3: "Somewhat clear",
            4: "Clear",
            5: "Compelling",
          },
        },
        {
          id: "wage-loss-cooperation",
          label: "Wage Loss Cooperation",
          weight: 0.25,
          rubric: {
            1: "No documentation",
            2: "Partial",
            3: "Adequate",
            4: "Good",
            5: "Complete",
          },
        },
        {
          id: "prior-medical-disclosure",
          label: "Prior Medical Disclosure",
          weight: 0.25,
          rubric: {
            1: "Hides history",
            2: "Incomplete",
            3: "Mostly disclosed",
            4: "Fully disclosed",
            5: "Proactively shared",
          },
        },
      ],
    },
  ],
  hygieneGate: [
    { id: "contact-verified", label: "Contact info verified" },
    { id: "comm-pref-set", label: "Communication preference set" },
    { id: "id-docs", label: "ID documents received" },
    { id: "medical-auth", label: "Medical authorization signed" },
    { id: "employment-info", label: "Employment info obtained" },
  ],
  governance: [
    { stage: "Intake", whoScores: "Intake Specialist", when: "At case creation" },
    {
      stage: "First 30 days",
      whoScores: "Case Manager",
      when: "After initial engagement",
    },
    { stage: "Quarterly", whoScores: "Case Manager", when: "Scheduled review" },
    {
      stage: "Pre-settlement",
      whoScores: "Attorney",
      when: "Before negotiations",
    },
  ],
  actionTriggers: [
    {
      min: 120,
      max: 140,
      label: "High-Value Client",
      action: "Prioritize for premium service",
      color: "green",
    },
    {
      min: 90,
      max: 119,
      label: "Standard Client",
      action: "Normal workflow",
      color: "blue",
    },
    {
      min: 60,
      max: 89,
      label: "At-Risk Client",
      action: "Implement engagement plan",
      color: "yellow",
    },
    {
      min: 0,
      max: 59,
      label: "Critical Attention",
      action: "Immediate intervention required",
      color: "red",
    },
  ],
};

const liabilitySystem: ScoringSystem = {
  id: "liability",
  label: "Liability Profile Scoring",
  shortLabel: "Liability",
  description:
    "Assesses liability strength and settlement leverage through evidence quality and legal positioning",
  maxScore: 100,
  categories: [
    {
      id: "lsi",
      label: "LSI Components",
      weight: 0.75,
      factors: [
        {
          id: "fault-clarity",
          label: "Fault Clarity",
          weight: 0.333,
          rubric: {
            1: "Liability unclear",
            2: "Disputed",
            3: "Shared fault likely",
            4: "Strong liability",
            5: "Clear liability",
          },
        },
        {
          id: "evidence-strength",
          label: "Evidence Strength",
          weight: 0.267,
          rubric: {
            1: "No evidence",
            2: "Weak evidence",
            3: "Moderate",
            4: "Strong",
            5: "Overwhelming",
          },
        },
        {
          id: "witness-profile",
          label: "Witness Profile",
          weight: 0.133,
          rubric: {
            1: "No witnesses",
            2: "Hostile witnesses",
            3: "Neutral",
            4: "Favorable",
            5: "Strong independent",
          },
        },
        {
          id: "police-documentation",
          label: "Police Documentation",
          weight: 0.133,
          rubric: {
            1: "No report",
            2: "Unfavorable",
            3: "Neutral",
            4: "Favorable",
            5: "Strongly supports",
          },
        },
        {
          id: "comp-neg-exposure",
          label: "Comparative Negligence Exposure",
          weight: 0.133,
          rubric: {
            1: "High exposure >50%",
            2: "Significant 30-50%",
            3: "Moderate 15-30%",
            4: "Minor <15%",
            5: "None",
          },
        },
      ],
    },
    {
      id: "sli",
      label: "SLI Additional",
      weight: 0.25,
      factors: [
        {
          id: "coverage-collectability",
          label: "Coverage Collectability",
          weight: 0.4,
          rubric: {
            1: "No coverage",
            2: "Minimal limits",
            3: "Adequate limits",
            4: "Good limits",
            5: "Excess coverage",
          },
        },
        {
          id: "defendant-optics",
          label: "Defendant Optics",
          weight: 0.2,
          rubric: {
            1: "Sympathetic defendant",
            2: "Neutral",
            3: "Slightly favorable",
            4: "Favorable",
            5: "Very favorable",
          },
        },
        {
          id: "defense-escape-routes",
          label: "Defense Escape Routes",
          weight: 0.2,
          rubric: {
            1: "Multiple defenses",
            2: "Several defenses",
            3: "Some defenses",
            4: "Few defenses",
            5: "No viable defenses",
          },
        },
        {
          id: "sli-doc-readiness",
          label: "SLI Document Readiness",
          weight: 0.2,
          rubric: {
            1: "Missing critical docs",
            2: "Incomplete",
            3: "Adequate",
            4: "Strong",
            5: "Trial-ready",
          },
        },
      ],
    },
  ],
  hygieneGate: [
    { id: "police-report", label: "Police report obtained" },
    { id: "citation", label: "Citation/admission documented" },
    { id: "witness-statements", label: "Witness statements collected" },
    { id: "photo-video", label: "Photo/video evidence secured" },
    { id: "coverage-verified", label: "Coverage verification complete" },
    { id: "comp-neg-reviewed", label: "Comparative negligence reviewed" },
  ],
  governance: [
    { stage: "Intake", whoScores: "Paralegal", when: "Provisional score" },
    {
      stage: "Early pre-lit",
      whoScores: "Case Manager",
      when: "Updated score",
    },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Validated score" },
    {
      stage: "New evidence",
      whoScores: "Case Manager",
      when: "Re-score required",
    },
  ],
  actionTriggers: [
    {
      min: 80,
      max: 100,
      label: "Early Limits Demand",
      action: "Push for policy limits",
      color: "green",
    },
    {
      min: 60,
      max: 79,
      label: "Normal Demand Track",
      action: "Standard demand preparation",
      color: "blue",
    },
    {
      min: 40,
      max: 59,
      label: "Development Sprint",
      action: "Focus on evidence gathering",
      color: "yellow",
    },
    {
      min: 0,
      max: 39,
      label: "Litigation Consult",
      action: "Evaluate litigation path",
      color: "red",
    },
  ],
};

const policySystem: ScoringSystem = {
  id: "policy",
  label: "Policy & Collectability",
  shortLabel: "Policy",
  description:
    "Evaluates insurance coverage adequacy and recovery difficulty to guide demand strategy",
  maxScore: 100,
  categories: [
    {
      id: "csi",
      label: "CSI Components",
      weight: 0.65,
      factors: [
        {
          id: "policy-limits",
          label: "Policy Limits",
          weight: 0.385,
          rubric: {
            1: "No coverage",
            2: "Far below damages",
            3: "Below damages",
            4: "Matches damages",
            5: "Exceeds damages",
          },
        },
        {
          id: "coverage-verification",
          label: "Coverage Verification",
          weight: 0.231,
          rubric: {
            1: "Unverified",
            2: "Partially verified",
            3: "Pending confirmation",
            4: "Verified",
            5: "Fully confirmed with docs",
          },
        },
        {
          id: "additional-policy",
          label: "Additional Policy",
          weight: 0.154,
          rubric: {
            1: "None identified",
            2: "Unlikely",
            3: "Possible",
            4: "Probable",
            5: "Confirmed additional",
          },
        },
        {
          id: "carrier-tender",
          label: "Carrier Tender",
          weight: 0.154,
          rubric: {
            1: "Denial posture",
            2: "Adversarial",
            3: "Neutral",
            4: "Cooperative",
            5: "Proactive tender",
          },
        },
        {
          id: "defendant-collectability",
          label: "Defendant Collectability",
          weight: 0.077,
          rubric: {
            1: "Judgment-proof",
            2: "Limited assets",
            3: "Moderate assets",
            4: "Substantial assets",
            5: "Deep pockets",
          },
        },
      ],
    },
    {
      id: "rdi",
      label: "RDI Components",
      weight: 0.35,
      factors: [
        {
          id: "reservation-rights",
          label: "Reservation of Rights",
          weight: 0.286,
          rubric: {
            1: "Active ROR on coverage",
            2: "ROR on limits",
            3: "Conditional",
            4: "Partial",
            5: "No reservation",
          },
        },
        {
          id: "um-uim-complexity",
          label: "UM/UIM Complexity",
          weight: 0.286,
          rubric: {
            1: "Complex multi-layer",
            2: "Disputed",
            3: "Moderate complexity",
            4: "Straightforward",
            5: "Not applicable/simple",
          },
        },
        {
          id: "lien-subrogation",
          label: "Lien & Subrogation",
          weight: 0.143,
          rubric: {
            1: "Major liens",
            2: "Significant",
            3: "Moderate",
            4: "Minor",
            5: "None",
          },
        },
        {
          id: "multi-party-risk",
          label: "Multi-Party Risk",
          weight: 0.143,
          rubric: {
            1: "Complex multi-party",
            2: "Disputed allocation",
            3: "Moderate",
            4: "Simple two-party",
            5: "Single defendant",
          },
        },
        {
          id: "rdi-doc-readiness",
          label: "RDI Document Readiness",
          weight: 0.143,
          rubric: {
            1: "Missing critical",
            2: "Incomplete",
            3: "Adequate",
            4: "Strong",
            5: "Complete",
          },
        },
      ],
    },
  ],
  hygieneGate: [
    { id: "carrier-id", label: "Carrier identified" },
    { id: "policy-type", label: "Policy type known" },
    { id: "limits-confirmed", label: "Limits confirmed" },
    { id: "um-uim-status", label: "UM/UIM status checked" },
    { id: "other-insureds", label: "Other insureds evaluated" },
  ],
  governance: [
    { stage: "Intake", whoScores: "Paralegal", when: "Provisional" },
    {
      stage: "Account opening",
      whoScores: "Case Manager",
      when: "Verified",
    },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Validated" },
    { stage: "Discovery", whoScores: "Case Manager", when: "Update required" },
  ],
  actionTriggers: [
    {
      min: 80,
      max: 100,
      label: "Full Recovery Likely",
      action: "Standard demand path",
      color: "green",
    },
    {
      min: 60,
      max: 79,
      label: "Good Recovery Potential",
      action: "Optimize demand strategy",
      color: "blue",
    },
    {
      min: 40,
      max: 59,
      label: "Recovery Challenges",
      action: "Explore additional sources",
      color: "yellow",
    },
    {
      min: 0,
      max: 39,
      label: "Significant Barriers",
      action: "Attorney strategy review",
      color: "red",
    },
  ],
};

const treatmentSystem: ScoringSystem = {
  id: "treatment",
  label: "Treatment Strength",
  shortLabel: "Treatment",
  description:
    "Measures medical treatment quality, consistency, and future care exposure for demand valuation",
  maxScore: 100,
  categories: [
    {
      id: "med-severity",
      label: "Medical Severity",
      weight: 0.2,
      factors: [
        {
          id: "er-ambulance",
          label: "ER / Ambulance",
          weight: 0.25,
          rubric: {
            1: "No ER",
            2: "Urgent care only",
            3: "ER visit",
            4: "ER + admission",
            5: "Ambulance + admission",
          },
        },
        {
          id: "hospital-admission",
          label: "Hospital Admission",
          weight: 0.25,
          rubric: {
            1: "None",
            2: "Observation only",
            3: "Short stay 1-2d",
            4: "Extended stay 3-7d",
            5: "Prolonged stay >7d",
          },
        },
        {
          id: "surgery-procedures",
          label: "Surgery / Procedures",
          weight: 0.25,
          rubric: {
            1: "None",
            2: "Minor procedure",
            3: "Outpatient surgery",
            4: "Inpatient surgery",
            5: "Multiple surgeries",
          },
        },
        {
          id: "permanent-injury",
          label: "Permanent Injury",
          weight: 0.25,
          rubric: {
            1: "Full recovery expected",
            2: "Minor lasting effects",
            3: "Moderate permanent",
            4: "Significant permanent",
            5: "Catastrophic",
          },
        },
      ],
    },
    {
      id: "treatment-consistency",
      label: "Treatment Consistency",
      weight: 0.2,
      factors: [
        {
          id: "gap-analysis",
          label: "Gap Analysis",
          weight: 0.25,
          rubric: {
            1: "Major gap >60d",
            2: "Significant gap 30-60d",
            3: "Moderate gap 7-30d",
            4: "Minor gap <7d",
            5: "No gaps",
          },
        },
        {
          id: "appointment-compliance",
          label: "Appointment Compliance",
          weight: 0.25,
          rubric: {
            1: "<50%",
            2: "50-75%",
            3: "75-90%",
            4: ">90%",
            5: "100% attendance",
          },
        },
        {
          id: "referral-followthrough",
          label: "Referral Follow-Through",
          weight: 0.25,
          rubric: {
            1: "None followed",
            2: "Few followed",
            3: "Some followed",
            4: "Most followed",
            5: "All followed",
          },
        },
        {
          id: "treatment-completion",
          label: "Treatment Completion",
          weight: 0.25,
          rubric: {
            1: "Abandoned early",
            2: "Abandoned partially",
            3: "In progress",
            4: "Nearly complete",
            5: "Completed all plans",
          },
        },
      ],
    },
    {
      id: "provider-cred",
      label: "Provider Credibility",
      weight: 0.2,
      factors: [
        {
          id: "board-certification",
          label: "Board Certification",
          weight: 0.25,
          rubric: {
            1: "Not certified",
            2: "Certification unclear",
            3: "Certified",
            4: "Well-credentialed",
            5: "Top credentials",
          },
        },
        {
          id: "venue-reputation",
          label: "Venue Reputation",
          weight: 0.25,
          rubric: {
            1: "Known litigation mill",
            2: "Questionable",
            3: "Average",
            4: "Respected",
            5: "Top-tier facility",
          },
        },
        {
          id: "treating-vs-hired",
          label: "Treating vs Hired",
          weight: 0.25,
          rubric: {
            1: "Hired for litigation",
            2: "Referred by attorney",
            3: "Mixed",
            4: "Pre-existing provider",
            5: "Independent treating",
          },
        },
        {
          id: "note-quality",
          label: "Note Quality",
          weight: 0.25,
          rubric: {
            1: "Poor/illegible",
            2: "Minimal",
            3: "Adequate",
            4: "Detailed",
            5: "Exceptional",
          },
        },
      ],
    },
    {
      id: "objective-proof",
      label: "Objective Proof",
      weight: 0.2,
      factors: [
        {
          id: "imaging-results",
          label: "Imaging Results",
          weight: 0.25,
          rubric: {
            1: "No imaging",
            2: "Normal findings",
            3: "Minor findings",
            4: "Significant findings",
            5: "Major pathology",
          },
        },
        {
          id: "diagnostic-testing",
          label: "Diagnostic Testing",
          weight: 0.25,
          rubric: {
            1: "No testing",
            2: "Inconclusive",
            3: "Mild findings",
            4: "Moderate findings",
            5: "Strong positive",
          },
        },
        {
          id: "surgical-findings",
          label: "Surgical Findings",
          weight: 0.25,
          rubric: {
            1: "N/A no surgery",
            2: "Minor findings",
            3: "Moderate",
            4: "Significant",
            5: "Major confirmed",
          },
        },
        {
          id: "prior-post-comparison",
          label: "Prior/Post Comparison",
          weight: 0.25,
          rubric: {
            1: "Pre-existing identical",
            2: "Difficult to distinguish",
            3: "Some change",
            4: "Clear change",
            5: "Dramatic change",
          },
        },
      ],
    },
    {
      id: "future-exposure",
      label: "Future Exposure",
      weight: 0.2,
      factors: [
        {
          id: "future-surgery",
          label: "Future Surgery",
          weight: 0.25,
          rubric: {
            1: "Not recommended",
            2: "Possible",
            3: "Likely",
            4: "Scheduled",
            5: "Multiple planned",
          },
        },
        {
          id: "lifetime-care",
          label: "Lifetime Care",
          weight: 0.25,
          rubric: {
            1: "None",
            2: "Minimal",
            3: "Moderate",
            4: "Significant",
            5: "Extensive lifetime",
          },
        },
        {
          id: "permanent-restrictions",
          label: "Permanent Restrictions",
          weight: 0.25,
          rubric: {
            1: "None",
            2: "Minor",
            3: "Moderate",
            4: "Significant",
            5: "Total disability",
          },
        },
        {
          id: "earning-capacity",
          label: "Earning Capacity",
          weight: 0.25,
          rubric: {
            1: "None",
            2: "Minor",
            3: "Moderate reduction",
            4: "Major reduction",
            5: "Total loss",
          },
        },
      ],
    },
  ],
  hygieneGate: [
    { id: "surgery-yn", label: "Surgery Y/N documented" },
    { id: "injection-yn", label: "Injection Y/N documented" },
    { id: "gap-30d", label: "Gap >30 days Y/N checked" },
    { id: "mri-yn", label: "MRI Y/N documented" },
    { id: "specialist-yn", label: "Specialist Y/N documented" },
    { id: "future-care-yn", label: "Future care Y/N documented" },
  ],
  governance: [
    {
      stage: "Initial treatment",
      whoScores: "Paralegal",
      when: "After first records",
    },
    {
      stage: "90-day review",
      whoScores: "Case Manager",
      when: "Scheduled",
    },
    {
      stage: "Pre-demand",
      whoScores: "Attorney",
      when: "Before demand prep",
    },
    {
      stage: "New records",
      whoScores: "Case Manager",
      when: "As received",
    },
  ],
  actionTriggers: [
    {
      min: 80,
      max: 100,
      label: "Strong Treatment Profile",
      action: "Support demand valuation",
      color: "green",
    },
    {
      min: 60,
      max: 79,
      label: "Adequate Treatment",
      action: "Monitor for completion",
      color: "blue",
    },
    {
      min: 40,
      max: 59,
      label: "Treatment Gaps",
      action: "Address gaps immediately",
      color: "yellow",
    },
    {
      min: 0,
      max: 39,
      label: "Weak Treatment",
      action: "Intervention required",
      color: "red",
    },
  ],
};

const casePerformanceSystem: ScoringSystem = {
  id: "case-performance",
  label: "Case Performance Index",
  shortLabel: "Performance",
  description:
    "Holistic operational health score across 7 pillars measuring efficiency, momentum, risk, and readiness",
  maxScore: 140,
  categories: [
    {
      id: "economic-efficiency",
      label: "Economic Efficiency",
      weight: 0.143,
      factors: [
        {
          id: "staff-hours",
          label: "Staff Hours",
          weight: 0.167,
          rubric: {
            1: "Excessive",
            2: "Above average",
            3: "Average",
            4: "Below average",
            5: "Minimal",
          },
        },
        {
          id: "future-labor",
          label: "Future Labor",
          weight: 0.167,
          rubric: {
            1: "Extensive remaining",
            2: "Significant",
            3: "Moderate",
            4: "Manageable",
            5: "Near complete",
          },
        },
        {
          id: "vendor-costs",
          label: "Vendor Costs",
          weight: 0.167,
          rubric: {
            1: "Overbudget",
            2: "High costs",
            3: "On budget",
            4: "Under budget",
            5: "Well optimized",
          },
        },
        {
          id: "lien-complexity",
          label: "Lien Complexity",
          weight: 0.167,
          rubric: {
            1: "Complex multiple liens",
            2: "Significant liens",
            3: "Moderate",
            4: "Minor",
            5: "Clean",
          },
        },
        {
          id: "case-age-value",
          label: "Case Age / Value Ratio",
          weight: 0.167,
          rubric: {
            1: "Very old/low value",
            2: "Aging",
            3: "On track",
            4: "Young/good value",
            5: "Excellent ratio",
          },
        },
        {
          id: "cost-resolution",
          label: "Cost to Resolution",
          weight: 0.167,
          rubric: {
            1: "Very high cost",
            2: "High",
            3: "Average",
            4: "Low",
            5: "Excellent",
          },
        },
      ],
    },
    {
      id: "momentum",
      label: "Momentum & Velocity",
      weight: 0.143,
      factors: [
        {
          id: "stage-time-benchmark",
          label: "Stage Time vs Benchmark",
          weight: 0.167,
          rubric: {
            1: "Far behind",
            2: "Behind",
            3: "On pace",
            4: "Ahead",
            5: "Far ahead",
          },
        },
        {
          id: "time-since-milestone",
          label: "Time Since Last Milestone",
          weight: 0.167,
          rubric: {
            1: ">90 days",
            2: "60-90 days",
            3: "30-60 days",
            4: "14-30 days",
            5: "<14 days",
          },
        },
        {
          id: "regressions",
          label: "Regressions",
          weight: 0.167,
          rubric: {
            1: "Multiple regressions",
            2: "Recent regression",
            3: "Past regression resolved",
            4: "Minor setback",
            5: "No regressions",
          },
        },
        {
          id: "reopenings",
          label: "Reopenings",
          weight: 0.167,
          rubric: {
            1: "Multiple reopenings",
            2: "Recent reopening",
            3: "Past reopening",
            4: "Risk of reopening",
            5: "No reopenings",
          },
        },
        {
          id: "idle-days",
          label: "Idle Days",
          weight: 0.167,
          rubric: {
            1: ">30 idle days",
            2: "15-30",
            3: "7-15",
            4: "3-7",
            5: "<3",
          },
        },
        {
          id: "bottleneck-frequency",
          label: "Bottleneck Frequency",
          weight: 0.167,
          rubric: {
            1: "Constant bottlenecks",
            2: "Frequent",
            3: "Occasional",
            4: "Rare",
            5: "None",
          },
        },
      ],
    },
    {
      id: "file-integrity",
      label: "File Integrity",
      weight: 0.143,
      factors: [
        {
          id: "required-docs",
          label: "Required Documents",
          weight: 0.167,
          rubric: {
            1: "Missing critical",
            2: "Many missing",
            3: "Most present",
            4: "Nearly complete",
            5: "All present",
          },
        },
        {
          id: "summaries-current",
          label: "Summaries Current",
          weight: 0.167,
          rubric: {
            1: "No summaries",
            2: "Outdated",
            3: "Partially current",
            4: "Mostly current",
            5: "Fully current",
          },
        },
        {
          id: "chronology",
          label: "Chronology",
          weight: 0.167,
          rubric: {
            1: "No chronology",
            2: "Incomplete",
            3: "Partial",
            4: "Good",
            5: "Complete",
          },
        },
        {
          id: "evidence-catalog",
          label: "Evidence Catalog",
          weight: 0.167,
          rubric: {
            1: "No catalog",
            2: "Incomplete",
            3: "Partial",
            4: "Good",
            5: "Complete indexed",
          },
        },
        {
          id: "attachment-index",
          label: "Attachment Index",
          weight: 0.167,
          rubric: {
            1: "Disorganized",
            2: "Partial",
            3: "Adequate",
            4: "Well organized",
            5: "Perfectly organized",
          },
        },
        {
          id: "demand-staging",
          label: "Demand Staging",
          weight: 0.167,
          rubric: {
            1: "Not started",
            2: "Early stage",
            3: "In progress",
            4: "Nearly ready",
            5: "Complete",
          },
        },
      ],
    },
    {
      id: "defense-friction",
      label: "Defense Friction",
      weight: 0.143,
      factors: [
        {
          id: "carrier-reputation",
          label: "Carrier Reputation",
          weight: 0.167,
          rubric: {
            1: "Very aggressive",
            2: "Difficult",
            3: "Average",
            4: "Reasonable",
            5: "Cooperative",
          },
        },
        {
          id: "defense-posture",
          label: "Defense Posture",
          weight: 0.167,
          rubric: {
            1: "Full contest",
            2: "Aggressive defense",
            3: "Standard defense",
            4: "Mild pushback",
            5: "Minimal defense",
          },
        },
        {
          id: "adjuster-history",
          label: "Adjuster History",
          weight: 0.167,
          rubric: {
            1: "Known bad faith",
            2: "Difficult",
            3: "Average",
            4: "Fair",
            5: "Cooperative",
          },
        },
        {
          id: "siu-signals",
          label: "SIU Signals",
          weight: 0.167,
          rubric: {
            1: "Active SIU involvement",
            2: "SIU flagged",
            3: "Minor concerns",
            4: "No signals",
            5: "Clean",
          },
        },
        {
          id: "recorded-statements",
          label: "Recorded Statements",
          weight: 0.167,
          rubric: {
            1: "Damaging statement",
            2: "Problematic",
            3: "Neutral",
            4: "Helpful",
            5: "Strong",
          },
        },
        {
          id: "defense-counsel",
          label: "Defense Counsel",
          weight: 0.167,
          rubric: {
            1: "Top defense firm",
            2: "Aggressive counsel",
            3: "Average",
            4: "Moderate",
            5: "Minimal involvement",
          },
        },
      ],
    },
    {
      id: "strategic-priority",
      label: "Strategic Priority",
      weight: 0.143,
      factors: [
        {
          id: "case-type-value",
          label: "Case Type Value",
          weight: 0.167,
          rubric: {
            1: "Low value type",
            2: "Below average",
            3: "Average",
            4: "Above average",
            5: "High value type",
          },
        },
        {
          id: "venue-importance",
          label: "Venue Importance",
          weight: 0.167,
          rubric: {
            1: "Unfavorable venue",
            2: "Neutral",
            3: "Average",
            4: "Favorable",
            5: "Premium venue",
          },
        },
        {
          id: "carrier-pattern",
          label: "Carrier Pattern",
          weight: 0.167,
          rubric: {
            1: "No value",
            2: "Minor",
            3: "Moderate",
            4: "Significant",
            5: "Key test case",
          },
        },
        {
          id: "precedent-value",
          label: "Precedent Value",
          weight: 0.167,
          rubric: {
            1: "None",
            2: "Minor",
            3: "Moderate",
            4: "Significant",
            5: "Landmark potential",
          },
        },
        {
          id: "marketing-synergy",
          label: "Marketing Synergy",
          weight: 0.167,
          rubric: {
            1: "None",
            2: "Minor",
            3: "Moderate",
            4: "Good",
            5: "Excellent",
          },
        },
        {
          id: "referral-source",
          label: "Referral Source",
          weight: 0.167,
          rubric: {
            1: "One-time",
            2: "Occasional",
            3: "Regular",
            4: "Key source",
            5: "Premium partnership",
          },
        },
      ],
    },
    {
      id: "risk-exposure",
      label: "Risk Exposure",
      weight: 0.143,
      factors: [
        {
          id: "statute-proximity",
          label: "Statute Proximity",
          weight: 0.167,
          rubric: {
            1: "Within 30 days",
            2: "Within 90 days",
            3: "Within 6 months",
            4: "Within 1 year",
            5: ">1 year",
          },
        },
        {
          id: "missed-deadlines",
          label: "Missed Deadlines",
          weight: 0.167,
          rubric: {
            1: "Critical missed",
            2: "Several missed",
            3: "One missed",
            4: "At risk",
            5: "All met",
          },
        },
        {
          id: "compliance-exposure",
          label: "Compliance Exposure",
          weight: 0.167,
          rubric: {
            1: "Major exposure",
            2: "Significant",
            3: "Moderate",
            4: "Minor",
            5: "None",
          },
        },
        {
          id: "complaint-risk",
          label: "Complaint Risk",
          weight: 0.167,
          rubric: {
            1: "Active complaint",
            2: "High risk",
            3: "Moderate",
            4: "Low",
            5: "None",
          },
        },
        {
          id: "ethical-flags",
          label: "Ethical Flags",
          weight: 0.167,
          rubric: {
            1: "Active issue",
            2: "Concerns raised",
            3: "Minor flags",
            4: "Watchlist",
            5: "Clean",
          },
        },
        {
          id: "record-gaps",
          label: "Record Gaps",
          weight: 0.167,
          rubric: {
            1: "Major gaps",
            2: "Significant",
            3: "Some gaps",
            4: "Minor",
            5: "Complete",
          },
        },
      ],
    },
    {
      id: "negotiation-readiness",
      label: "Negotiation Readiness",
      weight: 0.143,
      factors: [
        {
          id: "demand-components",
          label: "Demand Components",
          weight: 0.167,
          rubric: {
            1: "Not started",
            2: "Early drafts",
            3: "In progress",
            4: "Nearly complete",
            5: "Finalized",
          },
        },
        {
          id: "settlement-thesis",
          label: "Settlement Thesis",
          weight: 0.167,
          rubric: {
            1: "No thesis",
            2: "Weak",
            3: "Developing",
            4: "Strong",
            5: "Compelling",
          },
        },
        {
          id: "value-band",
          label: "Value Band",
          weight: 0.167,
          rubric: {
            1: "No range",
            2: "Wide range",
            3: "Narrowing",
            4: "Confident range",
            5: "Precise",
          },
        },
        {
          id: "lien-clarity",
          label: "Lien Clarity",
          weight: 0.167,
          rubric: {
            1: "Unknown liens",
            2: "Disputed",
            3: "Identified",
            4: "Negotiated",
            5: "Resolved",
          },
        },
        {
          id: "specials-complete",
          label: "Specials Complete",
          weight: 0.167,
          rubric: {
            1: "Incomplete",
            2: "Major gaps",
            3: "Mostly complete",
            4: "Nearly complete",
            5: "Fully documented",
          },
        },
        {
          id: "defense-counterargs",
          label: "Defense Counter-Arguments",
          weight: 0.167,
          rubric: {
            1: "Not addressed",
            2: "Partially",
            3: "Mostly addressed",
            4: "Well addressed",
            5: "Fully rebutted",
          },
        },
      ],
    },
  ],
  hygieneGate: [
    { id: "all-docs", label: "All required documents filed" },
    { id: "chronology-current", label: "Chronology up to date" },
    { id: "liens-confirmed", label: "Lien amounts confirmed" },
    { id: "demand-draft", label: "Demand draft started" },
    { id: "settlement-auth", label: "Settlement authority obtained" },
    { id: "defense-eval", label: "Defense evaluation complete" },
  ],
  governance: [
    { stage: "Monthly", whoScores: "Case Manager", when: "Scheduled review" },
    { stage: "90-day", whoScores: "Attorney", when: "Quarter review" },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Before demand" },
    { stage: "Settlement", whoScores: "Team", when: "Before final" },
  ],
  actionTriggers: [
    {
      min: 120,
      max: 140,
      label: "Prime Asset",
      action: "Maximize recovery",
      color: "green",
    },
    {
      min: 95,
      max: 119,
      label: "Strong Performer",
      action: "Standard optimization",
      color: "blue",
    },
    {
      min: 70,
      max: 94,
      label: "Manage Closely",
      action: "Targeted improvement plan",
      color: "yellow",
    },
    {
      min: 45,
      max: 69,
      label: "At Risk",
      action: "Immediate attention",
      color: "orange",
    },
    {
      min: 0,
      max: 44,
      label: "Intervention Required",
      action: "Emergency review",
      color: "red",
    },
  ],
};

export const scoringSystems: ScoringSystem[] = [
  clientProfileSystem,
  liabilitySystem,
  policySystem,
  treatmentSystem,
  casePerformanceSystem,
];

export const scoringSystemsMap: Record<string, ScoringSystem> =
  scoringSystems.reduce(
    (acc, system) => {
      acc[system.id] = system;
      return acc;
    },
    {} as Record<string, ScoringSystem>,
  );
