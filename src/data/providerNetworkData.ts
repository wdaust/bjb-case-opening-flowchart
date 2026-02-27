// ── Types ────────────────────────────────────────────────────────────

export type ProviderType =
  | 'Chiropractor'
  | 'Orthopedic Surgeon'
  | 'Pain Management'
  | 'Physical Therapy'
  | 'Neurologist'
  | 'Radiologist'
  | 'General Practitioner'
  | 'Psychologist'
  | 'Oral Surgeon'
  | 'Podiatrist';

export type CaseStage =
  | 'Case Opened'
  | 'In Treatment'
  | 'In Discovery'
  | 'Negotiation'
  | 'Resolution';

export const CASE_STAGES: CaseStage[] = [
  'Case Opened',
  'In Treatment',
  'In Discovery',
  'Negotiation',
  'Resolution',
];

export type InjuryType =
  | 'Auto Accident'
  | 'Slip & Fall'
  | 'Work Injury'
  | 'Medical Malpractice'
  | 'Premises Liability'
  | 'Product Liability';

export const INJURY_TYPES: InjuryType[] = [
  'Auto Accident',
  'Slip & Fall',
  'Work Injury',
  'Medical Malpractice',
  'Premises Liability',
  'Product Liability',
];

export type VideoCategory =
  | 'Injury Claims Lifecycle'
  | 'Lien Resolution'
  | 'Documentation Best Practices'
  | 'Deposition Prep'
  | 'Settlement Process';

export const VIDEO_CATEGORIES: VideoCategory[] = [
  'Injury Claims Lifecycle',
  'Lien Resolution',
  'Documentation Best Practices',
  'Deposition Prep',
  'Settlement Process',
];

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  qualityScores: {
    documentation: number;
    treatmentOutcomes: number;
    responsiveness: number;
  };
}

export interface BillingRecord {
  id: string;
  clientId: string;
  date: string;
  treatmentType: string;
  description: string;
  amount: number;
  fileName?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  injuryType: InjuryType;
  treatmentNeeded: string;
  stage: CaseStage;
  referralDate: string;
  providerId: string;
  notes?: string;
}

export interface EducationVideo {
  id: string;
  title: string;
  duration: string;
  category: VideoCategory;
  description: string;
  thumbnailColor: string;
}

// ── Provider type colors ─────────────────────────────────────────────

export const PROVIDER_TYPE_COLORS: Record<ProviderType, string> = {
  'Chiropractor': '#22c55e',       // green
  'Orthopedic Surgeon': '#3b82f6', // blue
  'Pain Management': '#f59e0b',    // amber
  'Physical Therapy': '#8b5cf6',   // violet
  'Neurologist': '#ec4899',        // pink
  'Radiologist': '#06b6d4',        // cyan
  'General Practitioner': '#64748b', // slate
  'Psychologist': '#f97316',       // orange
  'Oral Surgeon': '#ef4444',       // red
  'Podiatrist': '#14b8a6',         // teal
};

export const STAGE_COLORS: Record<CaseStage, string> = {
  'Case Opened': 'bg-blue-500/20 text-blue-400',
  'In Treatment': 'bg-amber-500/20 text-amber-400',
  'In Discovery': 'bg-purple-500/20 text-purple-400',
  'Negotiation': 'bg-emerald-500/20 text-emerald-400',
  'Resolution': 'bg-teal-500/20 text-teal-400',
};

// ── Mock Providers (20) — Bergen County NJ ───────────────────────────

export const PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Dr. James Marino', type: 'Chiropractor', lat: 40.8859, lng: -74.0435, address: '123 Main St, Hackensack, NJ 07601', phone: '(201) 555-0101', qualityScores: { documentation: 92, treatmentOutcomes: 88, responsiveness: 95 } },
  { id: 'p2', name: 'Dr. Lisa Park', type: 'Orthopedic Surgeon', lat: 40.8920, lng: -74.0612, address: '456 River Rd, Hackensack, NJ 07601', phone: '(201) 555-0102', qualityScores: { documentation: 85, treatmentOutcomes: 94, responsiveness: 78 } },
  { id: 'p3', name: 'Dr. Robert Kim', type: 'Pain Management', lat: 40.8785, lng: -74.0320, address: '789 State St, Hackensack, NJ 07601', phone: '(201) 555-0103', qualityScores: { documentation: 78, treatmentOutcomes: 82, responsiveness: 90 } },
  { id: 'p4', name: 'Dr. Angela Torres', type: 'Physical Therapy', lat: 40.9010, lng: -74.0550, address: '321 Park Ave, Teaneck, NJ 07666', phone: '(201) 555-0104', qualityScores: { documentation: 96, treatmentOutcomes: 91, responsiveness: 88 } },
  { id: 'p5', name: 'Dr. Michael Chen', type: 'Neurologist', lat: 40.8670, lng: -74.0780, address: '654 Cedar Ln, Teaneck, NJ 07666', phone: '(201) 555-0105', qualityScores: { documentation: 88, treatmentOutcomes: 85, responsiveness: 72 } },
  { id: 'p6', name: 'Dr. Sarah Williams', type: 'Radiologist', lat: 40.9135, lng: -74.0290, address: '987 Prospect Ave, Hackensack, NJ 07601', phone: '(201) 555-0106', qualityScores: { documentation: 91, treatmentOutcomes: 89, responsiveness: 94 } },
  { id: 'p7', name: 'Dr. David Patel', type: 'General Practitioner', lat: 40.8540, lng: -74.0660, address: '147 Broad St, Englewood, NJ 07631', phone: '(201) 555-0107', qualityScores: { documentation: 74, treatmentOutcomes: 80, responsiveness: 86 } },
  { id: 'p8', name: 'Dr. Jennifer Adams', type: 'Psychologist', lat: 40.9250, lng: -74.0410, address: '258 Summit Ave, Hackensack, NJ 07601', phone: '(201) 555-0108', qualityScores: { documentation: 82, treatmentOutcomes: 90, responsiveness: 68 } },
  { id: 'p9', name: 'Dr. Thomas Lee', type: 'Oral Surgeon', lat: 40.8820, lng: -74.0890, address: '369 Valley Rd, Ridgewood, NJ 07450', phone: '(201) 555-0109', qualityScores: { documentation: 87, treatmentOutcomes: 93, responsiveness: 81 } },
  { id: 'p10', name: 'Dr. Maria Rodriguez', type: 'Podiatrist', lat: 40.8960, lng: -74.0150, address: '471 Anderson St, Hackensack, NJ 07601', phone: '(201) 555-0110', qualityScores: { documentation: 93, treatmentOutcomes: 86, responsiveness: 92 } },
  { id: 'p11', name: 'Dr. William Brown', type: 'Chiropractor', lat: 40.8710, lng: -74.0520, address: '582 Palisade Ave, Englewood Cliffs, NJ 07632', phone: '(201) 555-0111', qualityScores: { documentation: 79, treatmentOutcomes: 75, responsiveness: 83 } },
  { id: 'p12', name: 'Dr. Karen Singh', type: 'Orthopedic Surgeon', lat: 40.9080, lng: -74.0700, address: '693 Teaneck Rd, Teaneck, NJ 07666', phone: '(201) 555-0112', qualityScores: { documentation: 90, treatmentOutcomes: 92, responsiveness: 85 } },
  { id: 'p13', name: 'Dr. Richard Nguyen', type: 'Pain Management', lat: 40.8590, lng: -74.0380, address: '804 Essex St, Hackensack, NJ 07601', phone: '(201) 555-0113', qualityScores: { documentation: 65, treatmentOutcomes: 70, responsiveness: 55 } },
  { id: 'p14', name: 'Dr. Amy Johnson', type: 'Physical Therapy', lat: 40.9340, lng: -74.0580, address: '915 Washington Ave, Bergenfield, NJ 07621', phone: '(201) 555-0114', qualityScores: { documentation: 88, treatmentOutcomes: 84, responsiveness: 91 } },
  { id: 'p15', name: 'Dr. Steven Garcia', type: 'Neurologist', lat: 40.8450, lng: -74.0240, address: '126 Polifly Rd, Hackensack, NJ 07601', phone: '(201) 555-0115', qualityScores: { documentation: 94, treatmentOutcomes: 96, responsiveness: 87 } },
  { id: 'p16', name: 'Dr. Rachel Cooper', type: 'Radiologist', lat: 40.9180, lng: -74.0830, address: '237 Kinderkamack Rd, Oradell, NJ 07649', phone: '(201) 555-0116', qualityScores: { documentation: 81, treatmentOutcomes: 77, responsiveness: 90 } },
  { id: 'p17', name: 'Dr. Christopher White', type: 'General Practitioner', lat: 40.8760, lng: -74.0970, address: '348 Franklin Tpk, Mahwah, NJ 07430', phone: '(201) 555-0117', qualityScores: { documentation: 72, treatmentOutcomes: 68, responsiveness: 74 } },
  { id: 'p18', name: 'Dr. Emily Martinez', type: 'Psychologist', lat: 40.9050, lng: -74.0130, address: '459 Main St, Fort Lee, NJ 07024', phone: '(201) 555-0118', qualityScores: { documentation: 86, treatmentOutcomes: 88, responsiveness: 93 } },
  { id: 'p19', name: 'Dr. Daniel Thompson', type: 'Oral Surgeon', lat: 40.8630, lng: -74.0560, address: '561 Grand Ave, Englewood, NJ 07631', phone: '(201) 555-0119', qualityScores: { documentation: 90, treatmentOutcomes: 87, responsiveness: 76 } },
  { id: 'p20', name: 'Dr. Michelle Lewis', type: 'Podiatrist', lat: 40.9400, lng: -74.0350, address: '672 New Bridge Rd, New Milford, NJ 07646', phone: '(201) 555-0120', qualityScores: { documentation: 84, treatmentOutcomes: 81, responsiveness: 89 } },
];

// ── Mock Clients (12) ────────────────────────────────────────────────

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'John Martinez', phone: '(201) 555-1001', address: '12 Oak St, Hackensack, NJ', injuryType: 'Auto Accident', treatmentNeeded: 'Spinal adjustment', stage: 'Case Opened', referralDate: '2025-12-15', providerId: 'p1' },
  { id: 'c2', name: 'Sandra Lee', phone: '(201) 555-1002', address: '34 Maple Ave, Teaneck, NJ', injuryType: 'Slip & Fall', treatmentNeeded: 'Knee surgery', stage: 'In Treatment', referralDate: '2025-11-20', providerId: 'p2' },
  { id: 'c3', name: 'Robert Davis', phone: '(201) 555-1003', address: '56 Pine Rd, Englewood, NJ', injuryType: 'Work Injury', treatmentNeeded: 'Pain management', stage: 'In Treatment', referralDate: '2025-10-05', providerId: 'p3' },
  { id: 'c4', name: 'Emily Chen', phone: '(201) 555-1004', address: '78 Elm Dr, Ridgewood, NJ', injuryType: 'Auto Accident', treatmentNeeded: 'Physical therapy', stage: 'In Discovery', referralDate: '2025-09-12', providerId: 'p4' },
  { id: 'c5', name: 'Michael Johnson', phone: '(201) 555-1005', address: '90 Birch Ln, Hackensack, NJ', injuryType: 'Auto Accident', treatmentNeeded: 'Neurological eval', stage: 'In Discovery', referralDate: '2025-08-28', providerId: 'p5' },
  { id: 'c6', name: 'Jessica Williams', phone: '(201) 555-1006', address: '102 Cedar Ct, Bergenfield, NJ', injuryType: 'Slip & Fall', treatmentNeeded: 'MRI imaging', stage: 'Negotiation', referralDate: '2025-07-15', providerId: 'p6' },
  { id: 'c7', name: 'David Kim', phone: '(201) 555-1007', address: '114 Walnut St, Teaneck, NJ', injuryType: 'Work Injury', treatmentNeeded: 'General assessment', stage: 'Negotiation', referralDate: '2025-06-22', providerId: 'p7' },
  { id: 'c8', name: 'Amanda Garcia', phone: '(201) 555-1008', address: '126 Spruce Ave, Oradell, NJ', injuryType: 'Auto Accident', treatmentNeeded: 'Psychological eval', stage: 'Resolution', referralDate: '2025-05-10', providerId: 'p8' },
  { id: 'c9', name: 'Christopher Brown', phone: '(201) 555-1009', address: '138 Ash Dr, Hackensack, NJ', injuryType: 'Medical Malpractice', treatmentNeeded: 'Dental surgery', stage: 'Case Opened', referralDate: '2026-01-05', providerId: 'p9' },
  { id: 'c10', name: 'Rachel Patel', phone: '(201) 555-1010', address: '150 Hickory Ln, Fort Lee, NJ', injuryType: 'Premises Liability', treatmentNeeded: 'Foot evaluation', stage: 'In Treatment', referralDate: '2025-11-30', providerId: 'p10' },
  { id: 'c11', name: 'Thomas Wilson', phone: '(201) 555-1011', address: '162 Chestnut Rd, Englewood, NJ', injuryType: 'Auto Accident', treatmentNeeded: 'Chiropractic care', stage: 'Resolution', referralDate: '2025-04-18', providerId: 'p11' },
  { id: 'c12', name: 'Laura Nguyen', phone: '(201) 555-1012', address: '174 Poplar St, New Milford, NJ', injuryType: 'Work Injury', treatmentNeeded: 'Orthopedic surgery', stage: 'In Discovery', referralDate: '2025-09-25', providerId: 'p12' },
];

// ── Mock Billing Records (30) ────────────────────────────────────────

export const INITIAL_BILLING: BillingRecord[] = [
  { id: 'b1', clientId: 'c1', date: '2025-12-20', treatmentType: 'Initial Exam', description: 'Full spinal evaluation and X-rays', amount: 450 },
  { id: 'b2', clientId: 'c1', date: '2026-01-05', treatmentType: 'Adjustment', description: 'Cervical spine adjustment session 1', amount: 150 },
  { id: 'b3', clientId: 'c1', date: '2026-01-19', treatmentType: 'Adjustment', description: 'Cervical spine adjustment session 2', amount: 150 },
  { id: 'b4', clientId: 'c2', date: '2025-11-25', treatmentType: 'Consultation', description: 'Orthopedic knee evaluation', amount: 600 },
  { id: 'b5', clientId: 'c2', date: '2025-12-10', treatmentType: 'MRI', description: 'Knee MRI imaging', amount: 1200 },
  { id: 'b6', clientId: 'c2', date: '2026-01-08', treatmentType: 'Surgery', description: 'Arthroscopic knee repair', amount: 8500 },
  { id: 'b7', clientId: 'c3', date: '2025-10-10', treatmentType: 'Initial Exam', description: 'Pain assessment and evaluation', amount: 350 },
  { id: 'b8', clientId: 'c3', date: '2025-10-25', treatmentType: 'Injection', description: 'Epidural steroid injection L4-L5', amount: 1800 },
  { id: 'b9', clientId: 'c4', date: '2025-09-18', treatmentType: 'Initial Exam', description: 'PT evaluation - shoulder injury', amount: 250 },
  { id: 'b10', clientId: 'c4', date: '2025-10-02', treatmentType: 'Therapy Session', description: 'Range of motion exercises - week 1', amount: 175 },
  { id: 'b11', clientId: 'c4', date: '2025-10-16', treatmentType: 'Therapy Session', description: 'Strengthening exercises - week 2', amount: 175 },
  { id: 'b12', clientId: 'c4', date: '2025-10-30', treatmentType: 'Therapy Session', description: 'Functional training - week 3', amount: 175 },
  { id: 'b13', clientId: 'c5', date: '2025-09-02', treatmentType: 'Consultation', description: 'Neurological evaluation', amount: 500 },
  { id: 'b14', clientId: 'c5', date: '2025-09-20', treatmentType: 'EMG/NCS', description: 'Electromyography and nerve conduction', amount: 950 },
  { id: 'b15', clientId: 'c6', date: '2025-07-20', treatmentType: 'MRI', description: 'Lumbar spine MRI', amount: 1400 },
  { id: 'b16', clientId: 'c6', date: '2025-08-05', treatmentType: 'CT Scan', description: 'Follow-up CT scan', amount: 900 },
  { id: 'b17', clientId: 'c7', date: '2025-06-28', treatmentType: 'Initial Exam', description: 'General physical exam and assessment', amount: 300 },
  { id: 'b18', clientId: 'c7', date: '2025-07-15', treatmentType: 'Lab Work', description: 'Blood panel and urinalysis', amount: 275 },
  { id: 'b19', clientId: 'c7', date: '2025-08-01', treatmentType: 'Follow-up', description: 'Results review and treatment plan', amount: 200 },
  { id: 'b20', clientId: 'c8', date: '2025-05-15', treatmentType: 'Evaluation', description: 'Psychological assessment - PTSD', amount: 400 },
  { id: 'b21', clientId: 'c8', date: '2025-06-01', treatmentType: 'Therapy', description: 'CBT session 1', amount: 250 },
  { id: 'b22', clientId: 'c8', date: '2025-06-15', treatmentType: 'Therapy', description: 'CBT session 2', amount: 250 },
  { id: 'b23', clientId: 'c8', date: '2025-07-01', treatmentType: 'Therapy', description: 'CBT session 3', amount: 250 },
  { id: 'b24', clientId: 'c9', date: '2026-01-10', treatmentType: 'Consultation', description: 'Oral surgery evaluation', amount: 550 },
  { id: 'b25', clientId: 'c9', date: '2026-01-25', treatmentType: 'X-Ray', description: 'Panoramic dental X-ray', amount: 200 },
  { id: 'b26', clientId: 'c10', date: '2025-12-05', treatmentType: 'Initial Exam', description: 'Podiatric evaluation - ankle injury', amount: 325 },
  { id: 'b27', clientId: 'c10', date: '2025-12-20', treatmentType: 'Custom Orthotics', description: 'Orthotic fitting and mold', amount: 475 },
  { id: 'b28', clientId: 'c11', date: '2025-04-25', treatmentType: 'Initial Exam', description: 'Chiropractic evaluation', amount: 400 },
  { id: 'b29', clientId: 'c11', date: '2025-05-10', treatmentType: 'Adjustment', description: 'Full spine adjustment x 8 visits', amount: 1200 },
  { id: 'b30', clientId: 'c12', date: '2025-10-01', treatmentType: 'Consultation', description: 'Orthopedic shoulder evaluation', amount: 575 },
];

// ── Education Videos (15) ────────────────────────────────────────────

export const EDUCATION_VIDEOS: EducationVideo[] = [
  { id: 'v1', title: 'Understanding PI Claims Start to Finish', duration: '12:30', category: 'Injury Claims Lifecycle', description: 'Complete overview of the personal injury claims process.', thumbnailColor: 'bg-blue-600' },
  { id: 'v2', title: 'What Happens After the Accident', duration: '8:45', category: 'Injury Claims Lifecycle', description: 'Steps immediately following an injury incident.', thumbnailColor: 'bg-blue-500' },
  { id: 'v3', title: 'Medical Documentation Timeline', duration: '15:20', category: 'Injury Claims Lifecycle', description: 'Key documentation milestones throughout the case.', thumbnailColor: 'bg-blue-400' },
  { id: 'v4', title: 'How Liens Work in PI Cases', duration: '10:15', category: 'Lien Resolution', description: 'Overview of medical liens and how they are resolved.', thumbnailColor: 'bg-emerald-600' },
  { id: 'v5', title: 'Negotiating Lien Reductions', duration: '14:00', category: 'Lien Resolution', description: 'Strategies for reducing medical liens at settlement.', thumbnailColor: 'bg-emerald-500' },
  { id: 'v6', title: 'Common Lien Pitfalls', duration: '7:30', category: 'Lien Resolution', description: 'Avoid these common mistakes when handling liens.', thumbnailColor: 'bg-emerald-400' },
  { id: 'v7', title: 'Progress Notes That Win Cases', duration: '11:45', category: 'Documentation Best Practices', description: 'How to write treatment notes that strengthen a claim.', thumbnailColor: 'bg-amber-600' },
  { id: 'v8', title: 'Diagnostic Coding for Attorneys', duration: '9:20', category: 'Documentation Best Practices', description: 'Understanding ICD-10 and CPT codes in legal context.', thumbnailColor: 'bg-amber-500' },
  { id: 'v9', title: 'Narrative Reports That Matter', duration: '13:10', category: 'Documentation Best Practices', description: 'Writing effective medical narrative reports.', thumbnailColor: 'bg-amber-400' },
  { id: 'v10', title: 'Preparing for Your Deposition', duration: '18:00', category: 'Deposition Prep', description: 'Step-by-step guide to deposition preparation for providers.', thumbnailColor: 'bg-purple-600' },
  { id: 'v11', title: 'Common Deposition Questions', duration: '16:30', category: 'Deposition Prep', description: 'Frequently asked questions and how to answer them.', thumbnailColor: 'bg-purple-500' },
  { id: 'v12', title: 'Expert Witness Fundamentals', duration: '20:00', category: 'Deposition Prep', description: 'What you need to know as an expert witness.', thumbnailColor: 'bg-purple-400' },
  { id: 'v13', title: 'Settlement Valuation Basics', duration: '11:00', category: 'Settlement Process', description: 'How personal injury cases are valued at settlement.', thumbnailColor: 'bg-rose-600' },
  { id: 'v14', title: 'The Demand Letter Process', duration: '9:45', category: 'Settlement Process', description: 'Understanding the demand letter and negotiation flow.', thumbnailColor: 'bg-rose-500' },
  { id: 'v15', title: 'Post-Settlement Billing Steps', duration: '6:30', category: 'Settlement Process', description: 'What happens to medical bills after a case settles.', thumbnailColor: 'bg-rose-400' },
];

// ── Helper functions ─────────────────────────────────────────────────

export function getClientBilling(clientId: string, billing: BillingRecord[]): BillingRecord[] {
  return billing.filter(b => b.clientId === clientId);
}

export function getBillingTotal(records: BillingRecord[]): number {
  return records.reduce((sum, r) => sum + r.amount, 0);
}

export function getStageCounts(clients: Client[]): Record<CaseStage, number> {
  const counts: Record<CaseStage, number> = {
    'Case Opened': 0,
    'In Treatment': 0,
    'In Discovery': 0,
    'Negotiation': 0,
    'Resolution': 0,
  };
  for (const c of clients) {
    counts[c.stage]++;
  }
  return counts;
}

// ── Mock Address Book for autocomplete ───────────────────────────────

export interface MockAddress {
  address: string;
  lat: number;
  lng: number;
}

export const MOCK_ADDRESSES: MockAddress[] = [
  { address: '12 Oak St, Hackensack, NJ 07601', lat: 40.8863, lng: -74.0435 },
  { address: '34 Maple Ave, Teaneck, NJ 07666', lat: 40.8976, lng: -74.0160 },
  { address: '56 Pine Rd, Englewood, NJ 07631', lat: 40.8929, lng: -73.9726 },
  { address: '78 Elm Dr, Ridgewood, NJ 07450', lat: 40.9793, lng: -74.1166 },
  { address: '90 Birch Ln, Hackensack, NJ 07601', lat: 40.8859, lng: -74.0485 },
  { address: '102 Cedar Ct, Bergenfield, NJ 07621', lat: 40.9276, lng: -73.9968 },
  { address: '114 Walnut St, Teaneck, NJ 07666', lat: 40.8910, lng: -74.0080 },
  { address: '126 Spruce Ave, Oradell, NJ 07649', lat: 40.9559, lng: -74.0368 },
  { address: '138 Ash Dr, Hackensack, NJ 07601', lat: 40.8820, lng: -74.0510 },
  { address: '150 Hickory Ln, Fort Lee, NJ 07024', lat: 40.8509, lng: -73.9712 },
  { address: '162 Chestnut Rd, Englewood, NJ 07631', lat: 40.8890, lng: -73.9780 },
  { address: '174 Poplar St, New Milford, NJ 07646', lat: 40.9356, lng: -74.0188 },
  { address: '200 Main St, Hackensack, NJ 07601', lat: 40.8845, lng: -74.0430 },
  { address: '315 River Rd, Edgewater, NJ 07020', lat: 40.8270, lng: -73.9750 },
  { address: '425 Broad Ave, Leonia, NJ 07605', lat: 40.8621, lng: -73.9888 },
  { address: '88 Summit Ave, Hackensack, NJ 07601', lat: 40.8900, lng: -74.0400 },
  { address: '55 Palisade Ave, Cliffside Park, NJ 07010', lat: 40.8215, lng: -73.9875 },
  { address: '230 Grand Ave, Englewood, NJ 07631', lat: 40.8950, lng: -73.9710 },
  { address: '77 Bergen Blvd, Fairview, NJ 07022', lat: 40.8140, lng: -74.0005 },
  { address: '410 Kinderkamack Rd, Oradell, NJ 07649', lat: 40.9580, lng: -74.0310 },
];

export function searchAddresses(query: string): MockAddress[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return MOCK_ADDRESSES.filter(a => a.address.toLowerCase().includes(q)).slice(0, 6);
}

export function getProviderScore(provider: Provider): number {
  const { documentation, treatmentOutcomes, responsiveness } = provider.qualityScores;
  return Math.round((documentation + treatmentOutcomes + responsiveness) / 3);
}

export function mockGeocode(): { lat: number; lng: number } {
  const baseLat = 40.886;
  const baseLng = -74.044;
  return {
    lat: baseLat + (Math.random() - 0.5) * 0.06,
    lng: baseLng + (Math.random() - 0.5) * 0.06,
  };
}

export function getProvidersByType(providers: Provider[], types: ProviderType[]): Provider[] {
  if (types.length === 0) return providers;
  return providers.filter(p => types.includes(p.type));
}

export function getUniqueProviderTypes(): ProviderType[] {
  return Array.from(new Set(PROVIDERS.map(p => p.type))).sort();
}
