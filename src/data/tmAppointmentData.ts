export interface AgendaCheckItem {
  id: string;
  label: string;
}

export interface AgendaSection {
  id: string;
  order: number;
  title: string;
  purpose: string;
  checkItems: AgendaCheckItem[];
  sampleQuestions: string[];
  litifyFields: string[];
}

export const appointmentAgenda: AgendaSection[] = [
  {
    id: 'opening-expectation-setting',
    order: 1,
    title: 'Opening & Expectation Setting',
    purpose: 'Set tone and confirm call parameters',
    checkItems: [
      { id: 'oes-1', label: 'Introduce yourself + role' },
      { id: 'oes-2', label: 'Confirm call length (10-15 min)' },
      { id: 'oes-3', label: 'State objective' },
      { id: 'oes-4', label: 'Confirm preferred contact method' },
    ],
    sampleQuestions: [
      'Hi [name], this is [your name] from [firm]. I\'m part of the litigation team supporting your attorney.',
      'This call should take about 10-15 minutes. I want to make sure we keep your case moving forward.',
    ],
    litifyFields: ['Contact Method', 'Last Contact Date'],
  },
  {
    id: 'case-status-summary',
    order: 2,
    title: 'Case Status Summary',
    purpose: 'Provide brief update on where the case stands',
    checkItems: [
      { id: 'css-1', label: 'Share current case stage' },
      { id: 'css-2', label: 'Mention any recent developments' },
      { id: 'css-3', label: 'Confirm attorney assigned' },
    ],
    sampleQuestions: [
      'Your case is currently in the [stage] phase.',
      'Since we last spoke, [development].',
    ],
    litifyFields: ['Case Stage', 'Attorney Assigned', 'Last Activity Date'],
  },
  {
    id: 'treatment-status-check',
    order: 3,
    title: 'Treatment Status Check',
    purpose: 'Verify ongoing treatment and identify gaps',
    checkItems: [
      { id: 'tsc-1', label: 'Confirm current treatment providers' },
      { id: 'tsc-2', label: 'Check appointment compliance' },
      { id: 'tsc-3', label: 'Identify treatment gaps >7 days' },
      { id: 'tsc-4', label: 'Verify referral follow-through' },
    ],
    sampleQuestions: [
      'Are you still seeing [provider]?',
      'When was your last appointment?',
      'Have you missed any scheduled visits?',
    ],
    litifyFields: ['Treatment Status', 'Last Treatment Date', 'Treatment Gap Flag'],
  },
  {
    id: 'new-symptoms-injuries',
    order: 4,
    title: 'New Symptoms / Injuries',
    purpose: 'Document any changes in condition',
    checkItems: [
      { id: 'nsi-1', label: 'Ask about new symptoms' },
      { id: 'nsi-2', label: 'Document pain level changes' },
      { id: 'nsi-3', label: 'Note any new body parts affected' },
      { id: 'nsi-4', label: 'Record if condition worsening or improving' },
    ],
    sampleQuestions: [
      'Have you noticed any new pain or symptoms since we last spoke?',
      'How would you rate your pain on a scale of 1-10?',
    ],
    litifyFields: ['Symptoms Log', 'Pain Level', 'Body Parts Affected'],
  },
  {
    id: 'provider-referral-coordination',
    order: 5,
    title: 'Provider & Referral Coordination',
    purpose: 'Ensure client is getting appropriate care',
    checkItems: [
      { id: 'prc-1', label: 'Confirm specialist referrals followed' },
      { id: 'prc-2', label: 'Coordinate new provider referrals if needed' },
      { id: 'prc-3', label: 'Verify LOP agreements in place' },
      { id: 'prc-4', label: 'Check transportation needs' },
    ],
    sampleQuestions: [
      'Did you follow up with the specialist we discussed?',
      'Do you need help getting to your appointments?',
    ],
    litifyFields: ['Referral Status', 'Provider List', 'LOP Status'],
  },
  {
    id: 'medical-records-documentation',
    order: 6,
    title: 'Medical Records & Documentation',
    purpose: 'Track record collection status',
    checkItems: [
      { id: 'mrd-1', label: 'Confirm records requests sent' },
      { id: 'mrd-2', label: 'Follow up on outstanding records' },
      { id: 'mrd-3', label: 'Verify billing statements received' },
      { id: 'mrd-4', label: 'Update medical chronology' },
    ],
    sampleQuestions: [
      'We\'re still waiting on records from [provider]. Have you been seen there recently?',
      'Do you have any receipts or bills we haven\'t received yet?',
    ],
    litifyFields: ['Records Status', 'Outstanding Requests', 'Bills Received'],
  },
  {
    id: 'deposition-ime-prep',
    order: 7,
    title: 'Deposition / IME Prep (if applicable)',
    purpose: 'Prepare client for upcoming legal events',
    checkItems: [
      { id: 'dip-1', label: 'Discuss upcoming deposition date if scheduled' },
      { id: 'dip-2', label: 'Review IME preparation if applicable' },
      { id: 'dip-3', label: 'Remind client about do\'s and don\'ts' },
      { id: 'dip-4', label: 'Schedule prep session if needed' },
    ],
    sampleQuestions: [
      'Do you have any upcoming medical exams scheduled by the other side?',
      'Has your attorney discussed deposition preparation with you?',
    ],
    litifyFields: ['Deposition Date', 'IME Date', 'Prep Session Scheduled'],
  },
  {
    id: 'discovery-written-responses',
    order: 8,
    title: 'Discovery & Written Responses',
    purpose: 'Track discovery compliance',
    checkItems: [
      { id: 'dwr-1', label: 'Check for pending interrogatory responses' },
      { id: 'dwr-2', label: 'Verify document production status' },
      { id: 'dwr-3', label: 'Note any amended responses needed' },
      { id: 'dwr-4', label: 'Confirm client reviewed responses' },
    ],
    sampleQuestions: [
      'Have you had a chance to review the questions we sent you?',
      'Is there any additional information you need to provide?',
    ],
    litifyFields: ['Discovery Status', 'Pending Responses', 'Amendment Needed'],
  },
  {
    id: 'work-wage-loss-update',
    order: 9,
    title: 'Work / Wage Loss Update',
    purpose: 'Document ongoing economic damages',
    checkItems: [
      { id: 'wwl-1', label: 'Confirm current employment status' },
      { id: 'wwl-2', label: 'Update wage loss documentation' },
      { id: 'wwl-3', label: 'Note any work restrictions' },
      { id: 'wwl-4', label: 'Document missed days' },
    ],
    sampleQuestions: [
      'Are you currently working?',
      'Have you missed any work days due to your injuries since we last spoke?',
    ],
    litifyFields: ['Employment Status', 'Wage Loss Amount', 'Work Restrictions'],
  },
  {
    id: 'property-damage-status',
    order: 10,
    title: 'Property Damage Status',
    purpose: 'Track property damage resolution',
    checkItems: [
      { id: 'pds-1', label: 'Confirm vehicle repair or total loss status' },
      { id: 'pds-2', label: 'Check rental car situation' },
      { id: 'pds-3', label: 'Verify property damage settlement' },
      { id: 'pds-4', label: 'Document any remaining property issues' },
    ],
    sampleQuestions: [
      'Has your vehicle been repaired or replaced?',
      'Are there any outstanding property damage issues?',
    ],
    litifyFields: ['Property Damage Status', 'Vehicle Status', 'PD Settlement'],
  },
  {
    id: 'client-concerns-expectations',
    order: 11,
    title: 'Client Concerns & Expectations',
    purpose: 'Address client concerns and manage expectations',
    checkItems: [
      { id: 'cce-1', label: 'Ask about any concerns or questions' },
      { id: 'cce-2', label: 'Address timeline expectations' },
      { id: 'cce-3', label: 'Discuss settlement process overview' },
      { id: 'cce-4', label: 'Note any frustrations or anxieties' },
    ],
    sampleQuestions: [
      'Do you have any questions or concerns about your case?',
      'Is there anything worrying you about the process?',
    ],
    litifyFields: ['Client Satisfaction', 'Concerns Log', 'Expectations Discussed'],
  },
  {
    id: 'next-steps-action-items',
    order: 12,
    title: 'Next Steps & Action Items',
    purpose: 'Define clear next steps for both sides',
    checkItems: [
      { id: 'nsai-1', label: 'Summarize action items for the firm' },
      { id: 'nsai-2', label: 'List what client needs to do' },
      { id: 'nsai-3', label: 'Set follow-up date' },
      { id: 'nsai-4', label: 'Confirm best time to call' },
    ],
    sampleQuestions: [
      'Here\'s what we\'ll be working on before our next call...',
      'On your end, please [action items].',
    ],
    litifyFields: ['Action Items', 'Follow-up Date', 'Next Contact Date'],
  },
  {
    id: 'timeline-milestone-setting',
    order: 13,
    title: 'Timeline & Milestone Setting',
    purpose: 'Set expectations for upcoming milestones',
    checkItems: [
      { id: 'tms-1', label: 'Review upcoming case milestones' },
      { id: 'tms-2', label: 'Discuss estimated timeline' },
      { id: 'tms-3', label: 'Note any deadline concerns' },
      { id: 'tms-4', label: 'Confirm statute of limitations awareness' },
    ],
    sampleQuestions: [
      'Looking ahead, the next major milestone will be...',
      'We\'re targeting [date] for [milestone].',
    ],
    litifyFields: ['Next Milestone', 'Target Date', 'SOL Date'],
  },
  {
    id: 'wrap-up-encouragement',
    order: 14,
    title: 'Wrap-Up & Encouragement',
    purpose: 'End on a positive note',
    checkItems: [
      { id: 'wue-1', label: 'Thank client for their time' },
      { id: 'wue-2', label: 'Provide encouragement about progress' },
      { id: 'wue-3', label: 'Confirm contact information' },
      { id: 'wue-4', label: 'Remind about emergency contact procedures' },
    ],
    sampleQuestions: [
      'Thank you for taking the time today. You\'re doing a great job staying on top of your treatment.',
      'Remember, if anything urgent comes up, you can reach us at [number].',
    ],
    litifyFields: ['Call Duration', 'Call Outcome', 'Next Scheduled Call'],
  },
];
