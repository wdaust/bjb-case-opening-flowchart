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

// ── Module 1: LSM (Liability Strength Module) ────────────────────────────

const lsmSystem: ScoringSystem = {
  id: "lsm",
  label: "Liability Strength Module",
  shortLabel: "Liability",
  description:
    "Assesses liability strength through evidence quality, witness profile, and settlement leverage positioning",
  maxScore: 100,
  categories: [
    {
      id: "lsi",
      label: "LSI — Liability Strength Index",
      weight: 0.70,
      factors: [
        {
          id: "fault-clarity",
          label: "Fault Clarity",
          weight: 0.30,
          rubric: {
            1: "Liability genuinely unclear; no police report, no witnesses, conflicting accounts",
            2: "Disputed fault with some evidence but significant gaps remain",
            3: "Shared fault likely; comparative negligence 20-40% probable",
            4: "Strong liability with minor comparative exposure under 15%",
            5: "Clear, undisputed liability; citation issued, admission obtained, or independent witnesses confirm",
          },
        },
        {
          id: "evidence-quality",
          label: "Evidence Quality",
          weight: 0.25,
          rubric: {
            1: "No physical evidence; no photos, no video, no documentation",
            2: "Weak evidence; limited photos or incomplete documentation",
            3: "Moderate evidence; police report and some photographic support",
            4: "Strong evidence; dashcam/surveillance footage, detailed police report, multiple exhibits",
            5: "Overwhelming evidence; video of incident, independent expert analysis, irrefutable documentation",
          },
        },
        {
          id: "witness-strength",
          label: "Witness Strength",
          weight: 0.15,
          rubric: {
            1: "No witnesses available or all witnesses hostile",
            2: "Only party witnesses with credibility concerns",
            3: "Neutral bystander witnesses but limited recollection",
            4: "Favorable independent witnesses with clear accounts",
            5: "Multiple strong independent witnesses with consistent, detailed testimony",
          },
        },
        {
          id: "official-documentation",
          label: "Official Documentation",
          weight: 0.15,
          rubric: {
            1: "No police report; no official records of any kind",
            2: "Police report unfavorable or incomplete; no citation",
            3: "Neutral police report; no clear fault determination",
            4: "Favorable police report with citation to adverse party",
            5: "Comprehensive official documentation; citation, admission, and supporting agency records",
          },
        },
        {
          id: "comp-neg-exposure",
          label: "Comparative Negligence Exposure",
          weight: 0.15,
          rubric: {
            1: "High exposure >50%; client likely majority at fault",
            2: "Significant exposure 30-50%; substantial comparative negligence arguments",
            3: "Moderate exposure 15-30%; some comparative arguments but defensible",
            4: "Minor exposure <15%; minimal comparative negligence risk",
            5: "No comparative negligence exposure; client bears zero fault",
          },
        },
      ],
    },
    {
      id: "sli",
      label: "SLI — Settlement Leverage Index Add-On",
      weight: 0.30,
      factors: [
        {
          id: "defendant-jury-optics",
          label: "Defendant / Jury Optics",
          weight: 0.40,
          rubric: {
            1: "Sympathetic defendant; jury likely to favor defense",
            2: "Neutral defendant; no strong jury appeal either way",
            3: "Slightly favorable optics; defendant is a company or institution",
            4: "Favorable optics; corporate defendant with clear negligence narrative",
            5: "Highly favorable optics; egregious conduct, sympathetic plaintiff, strong jury appeal",
          },
        },
        {
          id: "defense-escape-routes",
          label: "Defense Escape Routes",
          weight: 0.35,
          rubric: {
            1: "Multiple viable defenses; assumption of risk, intervening cause, statute issues",
            2: "Several plausible defenses that will require significant effort to overcome",
            3: "Some defenses exist but are manageable with proper preparation",
            4: "Few defenses available; most can be neutralized with existing evidence",
            5: "No viable defenses; all common defense theories effectively foreclosed",
          },
        },
        {
          id: "documentation-readiness",
          label: "Documentation Readiness",
          weight: 0.25,
          rubric: {
            1: "Missing critical documents; case file incomplete for any evaluation",
            2: "Incomplete documentation; significant gaps in record assembly",
            3: "Adequate documentation; core documents present but some gaps",
            4: "Strong documentation; nearly complete file with organized exhibits",
            5: "Trial-ready documentation; all exhibits indexed, authenticated, and presentation-ready",
          },
        },
      ],
    },
  ],
  hygieneGate: [
    { id: "police-report", label: "Police report status confirmed" },
    { id: "citation-admission", label: "Citation/admission status documented" },
    { id: "witness-confirmed", label: "Witness status confirmed" },
    { id: "photo-video", label: "Photo/video evidence verified" },
    { id: "comp-neg-reviewed", label: "Comparative negligence review completed" },
  ],
  governance: [
    { stage: "Intake", whoScores: "Paralegal", when: "Provisional score at case creation" },
    { stage: "Early pre-lit", whoScores: "Case Manager", when: "Updated after initial investigation" },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Validated before demand preparation" },
    { stage: "New evidence", whoScores: "Case Manager", when: "Re-score required on material change" },
  ],
  actionTriggers: [
    { min: 80, max: 100, label: "Early Limits Demand", action: "Push for policy limits immediately", color: "green" },
    { min: 60, max: 79, label: "Normal Demand Cycle", action: "Standard demand preparation track", color: "blue" },
    { min: 40, max: 59, label: "Development Sprint", action: "Focus on evidence gathering and gap closure", color: "yellow" },
    { min: 0, max: 39, label: "Litigation Consult", action: "Evaluate litigation path; consider case viability", color: "red" },
  ],
};

// ── Module 2: TQM (Treatment Quality Module) ─────────────────────────────

const tqmSystem: ScoringSystem = {
  id: "tqm",
  label: "Treatment Quality Module",
  shortLabel: "Treatment",
  description:
    "Measures medical treatment quality, consistency, provider credibility, and future care exposure for demand valuation",
  maxScore: 100,
  categories: [
    {
      id: "med-severity",
      label: "Medical Severity",
      weight: 0.25,
      factors: [
        {
          id: "med-severity-factor",
          label: "Medical Severity",
          weight: 1.0,
          rubric: {
            1: "Soft tissue only; no ER visit, no imaging, full recovery expected within weeks",
            2: "Minor injury; ER visit but no admission, conservative treatment only",
            3: "Moderate injury; diagnostic imaging with positive findings, physical therapy required",
            4: "Significant injury; surgery performed or recommended, extended treatment course",
            5: "Catastrophic or permanent injury; multiple surgeries, hospitalization, lasting disability",
          },
        },
      ],
    },
    {
      id: "treatment-consistency",
      label: "Treatment Consistency",
      weight: 0.20,
      factors: [
        {
          id: "treatment-consistency-factor",
          label: "Treatment Consistency",
          weight: 1.0,
          rubric: {
            1: "Abandoned treatment; gap >60 days with no medical explanation",
            2: "Major gaps in treatment; 30-60 day gaps or poor appointment compliance (<60%)",
            3: "Some gaps; 7-30 day gaps, appointment compliance 75-85%",
            4: "Mostly consistent; minor gaps <7 days, compliance >90%",
            5: "Fully consistent; no gaps, 100% compliance, all referrals followed through",
          },
        },
      ],
    },
    {
      id: "provider-credibility",
      label: "Provider Credibility",
      weight: 0.20,
      factors: [
        {
          id: "provider-credibility-factor",
          label: "Provider Credibility",
          weight: 1.0,
          rubric: {
            1: "Known litigation mill; hired-for-litigation provider with poor reputation",
            2: "Questionable provider; attorney-referred with limited credentials",
            3: "Average provider; board-certified but mixed treating/referral relationship",
            4: "Respected provider; pre-existing relationship, strong credentials, detailed notes",
            5: "Top-tier independent treating physician; excellent reputation, no litigation referral history",
          },
        },
      ],
    },
    {
      id: "objective-proof",
      label: "Objective Proof",
      weight: 0.20,
      factors: [
        {
          id: "objective-proof-factor",
          label: "Objective Proof",
          weight: 1.0,
          rubric: {
            1: "No objective findings; all subjective complaints only, normal imaging",
            2: "Minimal objective support; minor findings that may be pre-existing",
            3: "Moderate objective findings; MRI/diagnostic confirmation of injury",
            4: "Strong objective proof; surgical findings confirm injury, clear pre/post comparison",
            5: "Overwhelming objective evidence; multiple diagnostic confirmations, dramatic pre/post change",
          },
        },
      ],
    },
    {
      id: "future-exposure",
      label: "Future Exposure",
      weight: 0.15,
      factors: [
        {
          id: "future-exposure-factor",
          label: "Future Exposure",
          weight: 1.0,
          rubric: {
            1: "No future treatment needed; full recovery expected, no restrictions",
            2: "Minimal future care; possible flare-up treatment, no permanent restrictions",
            3: "Moderate future exposure; ongoing therapy likely, some permanent restrictions",
            4: "Significant future care; future surgery likely, earning capacity reduction",
            5: "Extensive lifetime care; multiple future procedures, total disability, life care plan supported",
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
    { stage: "Initial treatment", whoScores: "Paralegal", when: "After first medical records received" },
    { stage: "90-day review", whoScores: "Case Manager", when: "Scheduled quarterly review" },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Before demand preparation" },
    { stage: "New records", whoScores: "Case Manager", when: "As new medical records received" },
  ],
  actionTriggers: [
    { min: 80, max: 100, label: "Strong Treatment Profile", action: "Support demand valuation; treatment narrative ready", color: "green" },
    { min: 60, max: 79, label: "Adequate Treatment", action: "Monitor for completion; address minor gaps", color: "blue" },
    { min: 40, max: 59, label: "Treatment Gaps", action: "Address gaps immediately; consider provider change", color: "yellow" },
    { min: 0, max: 39, label: "Weak Treatment", action: "Intervention required; treatment plan overhaul needed", color: "red" },
  ],
};

// ── Module 3: CRM (Coverage & Recovery Module) ───────────────────────────

const crmSystem: ScoringSystem = {
  id: "crm",
  label: "Coverage & Recovery Module",
  shortLabel: "Coverage",
  description:
    "Evaluates insurance coverage adequacy and recovery difficulty to guide demand strategy and identify barriers",
  maxScore: 100,
  categories: [
    {
      id: "csi",
      label: "CSI — Coverage Sufficiency Index",
      weight: 0.55,
      factors: [
        {
          id: "policy-limits-vs-damages",
          label: "Policy Limits vs Damages",
          weight: 0.30,
          rubric: {
            1: "No coverage identified; uninsured or lapsed policy",
            2: "Minimum limits far below projected damages (<25% coverage)",
            3: "Limits below full damages but meaningful recovery possible (25-75%)",
            4: "Limits match or approach projected damages (75-100%)",
            5: "Limits exceed projected damages; excess coverage or umbrella available",
          },
        },
        {
          id: "coverage-verification",
          label: "Coverage Verification",
          weight: 0.25,
          rubric: {
            1: "Unverified; no dec page, no carrier confirmation",
            2: "Partially verified; carrier identified but limits/terms unconfirmed",
            3: "Pending confirmation; dec page requested, carrier cooperating",
            4: "Verified; dec page received, limits confirmed, terms reviewed",
            5: "Fully confirmed with all supporting documentation; no coverage disputes",
          },
        },
        {
          id: "additional-policy-potential",
          label: "Additional Policy Potential",
          weight: 0.20,
          rubric: {
            1: "None identified; single minimal policy only source",
            2: "Unlikely additional coverage; search conducted, nothing found",
            3: "Possible umbrella or excess policy; investigation ongoing",
            4: "Probable additional coverage; umbrella carrier identified",
            5: "Confirmed additional policy layers; excess/umbrella verified",
          },
        },
        {
          id: "carrier-behavior-profile",
          label: "Carrier Behavior Profile",
          weight: 0.15,
          rubric: {
            1: "Denial posture; known bad-faith carrier, pattern of lowball offers",
            2: "Adversarial carrier; difficult negotiations expected",
            3: "Neutral carrier; standard claims handling practices",
            4: "Cooperative carrier; reasonable evaluation history",
            5: "Proactive carrier; tendency toward fair early offers and quick resolution",
          },
        },
        {
          id: "defendant-collectability",
          label: "Defendant Collectability",
          weight: 0.10,
          rubric: {
            1: "Judgment-proof; no assets, no insurance, uncollectable",
            2: "Limited personal assets; minimal excess recovery potential",
            3: "Moderate assets; some personal collection potential beyond policy",
            4: "Substantial assets; strong excess recovery potential if needed",
            5: "Deep pockets; corporate defendant or high-net-worth individual",
          },
        },
      ],
    },
    {
      id: "rdi",
      label: "RDI — Recovery Difficulty Index",
      weight: 0.45,
      factors: [
        {
          id: "reservation-rights",
          label: "Reservation of Rights",
          weight: 0.30,
          rubric: {
            1: "Active ROR on core coverage; denial likely",
            2: "ROR on policy limits or specific coverage terms",
            3: "Conditional ROR; technical issue resolvable with additional documentation",
            4: "Partial ROR on minor exclusion; not expected to affect claim materially",
            5: "No reservation of rights; full coverage acknowledged",
          },
        },
        {
          id: "um-uim-complexity",
          label: "UM/UIM Complexity",
          weight: 0.25,
          rubric: {
            1: "Complex multi-layer UM/UIM claim with stacking disputes and carrier conflicts",
            2: "Disputed UM/UIM applicability; offset arguments and coverage questions",
            3: "Moderate complexity; UM/UIM applicable but process requirements pending",
            4: "Straightforward UM/UIM claim; clear coverage, single carrier",
            5: "UM/UIM not applicable or simple single-policy claim",
          },
        },
        {
          id: "lien-subrogation",
          label: "Lien & Subrogation",
          weight: 0.25,
          rubric: {
            1: "Major liens exceeding 40% of expected recovery; ERISA, Medicare, or Medicaid involved",
            2: "Significant liens 20-40% of recovery; multiple subrogation interests",
            3: "Moderate liens 10-20%; manageable subrogation with negotiation potential",
            4: "Minor liens <10%; limited subrogation, easily resolved",
            5: "No liens or subrogation interests; clean recovery path",
          },
        },
        {
          id: "multi-party-allocation",
          label: "Multi-Party Allocation Risk",
          weight: 0.20,
          rubric: {
            1: "Complex multi-party with 4+ defendants; disputed fault allocation",
            2: "Three-party dispute with contested allocation percentages",
            3: "Two defendants with some allocation complexity",
            4: "Simple two-party case with clear allocation",
            5: "Single defendant; no allocation issues",
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
    { stage: "Intake", whoScores: "Paralegal", when: "Provisional coverage assessment" },
    { stage: "Account opening", whoScores: "Case Manager", when: "Verified coverage details" },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Validated before demand" },
    { stage: "Discovery", whoScores: "Case Manager", when: "Update required on new information" },
  ],
  actionTriggers: [
    { min: 80, max: 100, label: "Full Recovery Likely", action: "Standard demand path; coverage supports full damages", color: "green" },
    { min: 60, max: 79, label: "Good Recovery Potential", action: "Optimize demand strategy; explore additional sources", color: "blue" },
    { min: 40, max: 59, label: "Recovery Challenges", action: "Address coverage gaps; lien negotiation priority", color: "yellow" },
    { min: 0, max: 39, label: "Significant Barriers", action: "Attorney strategy review; consider viability assessment", color: "red" },
  ],
};

// ── Module 4: CCM (Client Cooperation Module) ────────────────────────────

const ccmSystem: ScoringSystem = {
  id: "ccm",
  label: "Client Cooperation Module",
  shortLabel: "Client",
  description:
    "Evaluates client cooperation, reliability, risk factors, and settlement readiness across behavioral dimensions",
  maxScore: 100,
  categories: [
    {
      id: "communication-reachability",
      label: "Communication & Reachability",
      weight: 0.25,
      factors: [
        {
          id: "comm-reachability-factor",
          label: "Communication & Reachability",
          weight: 1.0,
          rubric: {
            1: "Unreachable; no response to calls, texts, emails, or letters for 30+ days",
            2: "Rarely responds; inconsistent contact, frequently missed appointments",
            3: "Responds within 48 hours; occasional missed calls but generally reachable",
            4: "Responds within 24 hours; reliable contact, keeps appointments",
            5: "Immediately reachable; proactive communication, never misses contact",
          },
        },
      ],
    },
    {
      id: "treatment-compliance",
      label: "Treatment Compliance",
      weight: 0.25,
      factors: [
        {
          id: "treatment-compliance-factor",
          label: "Treatment Compliance",
          weight: 1.0,
          rubric: {
            1: "Abandoned treatment; non-compliant with care plan, refuses referrals",
            2: "Major compliance issues; frequent missed appointments, ignores medical advice",
            3: "Partial compliance; some gaps but generally follows care plan when reminded",
            4: "Mostly compliant; attends appointments, follows care plan with minor exceptions",
            5: "Fully compliant; perfect attendance, proactively follows all medical recommendations",
          },
        },
      ],
    },
    {
      id: "cooperation-transparency",
      label: "Cooperation & Transparency",
      weight: 0.20,
      factors: [
        {
          id: "cooperation-transparency-factor",
          label: "Cooperation & Transparency",
          weight: 1.0,
          rubric: {
            1: "Adversarial; withholds information, inconsistent story, refuses to cooperate",
            2: "Selective cooperation; shares some info but evasive about key facts",
            3: "Cooperative when asked; provides information but doesn't volunteer details",
            4: "Proactively cooperative; shares relevant information, consistent narrative",
            5: "Fully transparent; completely open, proactively shares all relevant details, aligned with legal strategy",
          },
        },
      ],
    },
    {
      id: "risk-factors",
      label: "Risk Factors",
      weight: 0.15,
      factors: [
        {
          id: "risk-factors-factor",
          label: "Risk Factors",
          weight: 1.0,
          rubric: {
            1: "Multiple active risk factors; damaging social media, prior claims, behavioral volatility",
            2: "Significant risk; one major factor (active social media risk or recent prior claim)",
            3: "Moderate risk; manageable factors that can be mitigated with coaching",
            4: "Low risk; stable life situation, no problematic history, minimal exposure",
            5: "No risk factors; clean background, stable, no social media concerns, no prior claims",
          },
        },
      ],
    },
    {
      id: "settlement-posture",
      label: "Settlement Posture & Expectations",
      weight: 0.15,
      factors: [
        {
          id: "settlement-posture-factor",
          label: "Settlement Posture & Expectations",
          weight: 1.0,
          rubric: {
            1: "Wildly unrealistic expectations; demands immediate resolution at inflated values",
            2: "Inflated expectations; impatient, resistant to counsel on realistic outcomes",
            3: "Somewhat realistic; needs guidance but open to education on process and value",
            4: "Realistic expectations; patient, trusts attorney guidance, decisive when needed",
            5: "Well-calibrated; fully aligned with legal strategy, flexible on timing, reasonable on value",
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
    { stage: "First 30 days", whoScores: "Case Manager", when: "After initial engagement" },
    { stage: "Quarterly", whoScores: "Case Manager", when: "Scheduled review" },
    { stage: "Pre-settlement", whoScores: "Attorney", when: "Before negotiations" },
  ],
  actionTriggers: [
    { min: 80, max: 100, label: "High-Value Client", action: "Prioritize for premium service track", color: "green" },
    { min: 60, max: 79, label: "Standard Client", action: "Normal workflow; maintain regular touchpoints", color: "blue" },
    { min: 40, max: 59, label: "At-Risk Client", action: "Implement engagement plan; increase outreach frequency", color: "yellow" },
    { min: 0, max: 39, label: "Critical Attention", action: "Immediate intervention; escalate to attorney for client meeting", color: "red" },
  ],
};

// ── Module 5: CPM (Case Performance Module) ──────────────────────────────

const cpmSystem: ScoringSystem = {
  id: "cpm",
  label: "Case Performance Module",
  shortLabel: "Performance",
  description:
    "Operational health score measuring case velocity, file integrity, negotiation readiness, efficiency, and risk exposure",
  maxScore: 100,
  categories: [
    {
      id: "case-velocity",
      label: "Case Velocity",
      weight: 0.25,
      factors: [
        {
          id: "case-velocity-factor",
          label: "Case Velocity",
          weight: 1.0,
          rubric: {
            1: "Severely behind; case stalled >90 days past SLA, multiple missed milestones",
            2: "Behind pace; 30-90 days past SLA, recent regression or bottleneck",
            3: "On pace; within SLA targets, steady forward progress",
            4: "Ahead of pace; milestones hit early, no idle periods >7 days",
            5: "Far ahead; all milestones achieved well ahead of schedule, zero bottlenecks",
          },
        },
      ],
    },
    {
      id: "file-integrity",
      label: "File Integrity & Organization",
      weight: 0.20,
      factors: [
        {
          id: "file-integrity-factor",
          label: "File Integrity & Organization",
          weight: 1.0,
          rubric: {
            1: "Missing critical documents; no chronology, disorganized file, incomplete records",
            2: "Many documents missing; partial chronology, poor organization",
            3: "Most documents present; chronology started, adequate organization",
            4: "Nearly complete file; current chronology, well-organized exhibits",
            5: "Complete file; fully indexed evidence catalog, current chronology, demand package staged",
          },
        },
      ],
    },
    {
      id: "negotiation-readiness",
      label: "Negotiation Readiness",
      weight: 0.20,
      factors: [
        {
          id: "negotiation-readiness-factor",
          label: "Negotiation Readiness",
          weight: 1.0,
          rubric: {
            1: "Not started; no demand components, no settlement thesis, no value band established",
            2: "Early stages; demand draft begun but specials incomplete, weak thesis",
            3: "In progress; demand components mostly assembled, value band narrowing",
            4: "Nearly ready; strong settlement thesis, confident value range, liens identified",
            5: "Fully ready; finalized demand, compelling thesis, precise value, all liens resolved",
          },
        },
      ],
    },
    {
      id: "economic-efficiency",
      label: "Economic Efficiency",
      weight: 0.20,
      factors: [
        {
          id: "economic-efficiency-factor",
          label: "Economic Efficiency",
          weight: 1.0,
          rubric: {
            1: "Very high cost; excessive staff hours, overbudget vendors, poor age/value ratio",
            2: "Above-average cost; some efficiency issues, aging case with moderate value",
            3: "On budget; average cost to resolution, reasonable staff hours",
            4: "Below-average cost; efficient handling, good case age/value ratio",
            5: "Excellent efficiency; minimal staff hours, optimized vendor costs, outstanding age/value ratio",
          },
        },
      ],
    },
    {
      id: "risk-exposure",
      label: "Risk Exposure",
      weight: 0.15,
      factors: [
        {
          id: "risk-exposure-factor",
          label: "Risk Exposure",
          weight: 1.0,
          rubric: {
            1: "Critical risk; SOL within 30 days, missed deadlines, active compliance issue",
            2: "High risk; SOL within 90 days, at-risk deadlines, complaint potential",
            3: "Moderate risk; SOL within 6 months, all deadlines met but some record gaps",
            4: "Low risk; SOL >1 year, all deadlines met, minor record gaps only",
            5: "Minimal risk; SOL >1 year, all deadlines met, complete records, no ethical flags",
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
    { stage: "Monthly", whoScores: "Case Manager", when: "Scheduled monthly review" },
    { stage: "90-day", whoScores: "Attorney", when: "Quarterly deep review" },
    { stage: "Pre-demand", whoScores: "Attorney", when: "Before demand submission" },
    { stage: "Settlement", whoScores: "Team", when: "Before final resolution" },
  ],
  actionTriggers: [
    { min: 80, max: 100, label: "Prime Asset", action: "Maximize recovery; fast-track to resolution", color: "green" },
    { min: 60, max: 79, label: "Strong Performer", action: "Standard optimization; maintain momentum", color: "blue" },
    { min: 40, max: 59, label: "Manage Closely", action: "Targeted improvement plan; address gaps within 30 days", color: "yellow" },
    { min: 0, max: 39, label: "Intervention Required", action: "Emergency review; attorney escalation needed", color: "red" },
  ],
};

// ── Exports ──────────────────────────────────────────────────────────────

export const scoringSystems: ScoringSystem[] = [
  lsmSystem,
  tqmSystem,
  crmSystem,
  ccmSystem,
  cpmSystem,
];

export const scoringSystemsMap: Record<string, ScoringSystem> =
  scoringSystems.reduce(
    (acc, system) => {
      acc[system.id] = system;
      return acc;
    },
    {} as Record<string, ScoringSystem>,
  );

// ── MCHS (Master Case Health Score) — Computed Rollup ────────────────────

export const MCHS_WEIGHTS: Record<string, number> = {
  lsm: 0.25,
  tqm: 0.25,
  crm: 0.20,
  ccm: 0.15,
  cpm: 0.15,
};

export function calculateMCHS(moduleScores: Record<string, number>): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [moduleId, weight] of Object.entries(MCHS_WEIGHTS)) {
    const score = moduleScores[moduleId];
    if (score !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
