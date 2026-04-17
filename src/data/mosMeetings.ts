/**
 * Hardcoded MOS meeting definitions — used as seed data for DB migration.
 * After migration, the DB copy is authoritative; this is the fallback.
 * Source: KPI Scorecard (3).xlsx — exported 2026-04-17
 */

export interface StaticMetricDef {
  responsible: string;
  metric: string;
  kpi: string;
  isRock?: boolean;
  isSection?: boolean;
}

export interface StaticMeetingTab {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  metrics: StaticMetricDef[];
}

export const MEETINGS: StaticMeetingTab[] = [
  // ════════════════════════════════════════════════════════════════
  //  EXEC MEETING  (Executive Weekly Mtg Scorecard)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'exec-mtg',
    label: 'Exec Meeting',
    title: 'Executive Weekly Mtg Scorecard',
    subtitle: 'Medical Marketing / Law Firm Marketing / Workers Comp / PI: Pre-LIT / PI: LIT / PI: Intake / Finance',
    metrics: [
      // ── Medical Marketing ──
      { responsible: '', metric: 'Medical Marketing', kpi: '', isSection: true },
      { responsible: 'Ryan Broderick', metric: 'New providers from open to active', kpi: '2' },
      { responsible: 'Ryan Broderick', metric: 'Cost Per Signed Case', kpi: '' },
      { responsible: 'Ryan Broderick', metric: 'Lead-to-Signed Conversion Rate', kpi: '' },
      { responsible: 'Ryan Broderick', metric: 'Conversion of leads to matters', kpi: '> 50%' },

      // ── Law Firm Marketing ──
      { responsible: '', metric: 'Law Firm Marketing', kpi: '', isSection: true },
      { responsible: 'Ryan Broderick', metric: 'Cases per Referring Firm', kpi: '' },
      { responsible: 'Ryan Broderick', metric: 'Inbound Team — Total Leads Received (of Annual Goal)', kpi: '135' },
      { responsible: 'Ryan Broderick', metric: 'New cases from law firm relationships newer than 30 days', kpi: '5' },
      { responsible: 'Ryan Broderick', metric: 'New cases from law firm relationships older than 30 days', kpi: '130' },
      { responsible: 'Ryan Broderick', metric: 'ROCK 1:', kpi: '', isRock: true },
      { responsible: 'Ryan Broderick', metric: 'ROCK 2:', kpi: '', isRock: true },
      { responsible: 'Ryan Broderick', metric: 'ROCK 3:', kpi: '', isRock: true },

      // ── Workers Comp ──
      { responsible: '', metric: 'Workers Comp', kpi: '', isSection: true },
      { responsible: 'Ryan Broderick', metric: 'Intakes — Weekly', kpi: '13' },
      { responsible: 'Ryan Broderick', metric: 'Settlement Fees $ Weekly', kpi: '55477' },
      { responsible: 'Ryan Broderick', metric: 'Demands — Weekly', kpi: '8' },
      { responsible: 'Ryan Broderick', metric: 'Client Contact Every 30 Days', kpi: '1' },
      { responsible: 'Ryan Broderick', metric: 'ROCK 1:', kpi: '', isRock: true },
      { responsible: 'Ryan Broderick', metric: 'ROCK 2:', kpi: '', isRock: true },
      { responsible: 'Ryan Broderick', metric: 'ROCK 3:', kpi: '', isRock: true },

      // ── PI: Pre-LIT ──
      { responsible: '', metric: 'PI: Pre-LIT', kpi: '', isSection: true },
      { responsible: 'John Moran', metric: 'Cases Becoming Demand-Ready (Weekly)', kpi: '63' },
      { responsible: 'John Moran', metric: 'Reduction of Qualified Cases Not Yet in Treatment', kpi: '15' },
      { responsible: 'John Moran', metric: 'Avg Time in Call (min)', kpi: '8.5' },
      { responsible: 'John Moran', metric: 'Active Treatment Rate (Active Treatment \u00f7 Total Pre-Lit)', kpi: '0.76' },
      { responsible: 'John Moran', metric: 'ROCK 1:', kpi: '', isRock: true },
      { responsible: 'John Moran', metric: 'ROCK 2:', kpi: '', isRock: true },
      { responsible: 'John Moran', metric: 'ROCK 3:', kpi: '', isRock: true },

      // ── PI: LIT ──
      { responsible: '', metric: 'PI: LIT', kpi: '', isSection: true },
      { responsible: 'John Moran', metric: 'Days Qualified Cases Are Awaiting Complaint Filing', kpi: '62' },
      { responsible: 'John Moran', metric: 'Cases Moved to RFD', kpi: '40' },
      { responsible: 'John Moran', metric: 'Reduction of Cases with No Negotiation Activity', kpi: '20' },
      { responsible: 'John Moran', metric: 'Number Reduction of Days to Discovery End Date (Goal: 263)', kpi: '4.6' },
      { responsible: 'John Moran', metric: 'ROCK 1:', kpi: '', isRock: true },
      { responsible: 'John Moran', metric: 'ROCK 2:', kpi: '', isRock: true },
      { responsible: 'John Moran', metric: 'ROCK 3:', kpi: '', isRock: true },

      // ── PI: Intake ──
      { responsible: '', metric: 'PI: Intake', kpi: '', isSection: true },
      { responsible: 'John Moran', metric: 'Percentage of Calls Transferred to Answering Service', kpi: '< 10%' },
      { responsible: 'John Moran', metric: 'Signed Cases (Weekly)', kpi: '150' },
      { responsible: 'John Moran', metric: 'Qualified Lead-to-Signed Conversion Rate', kpi: '0.2' },
      { responsible: 'John Moran', metric: 'Leads Contacted Within SLA (%)', kpi: '0.95' },
      { responsible: 'John Moran', metric: 'ROCK 1:', kpi: '', isRock: true },
      { responsible: 'John Moran', metric: 'ROCK 2:', kpi: '', isRock: true },
      { responsible: 'John Moran', metric: 'ROCK 3:', kpi: '', isRock: true },

      // ── Finance ──
      { responsible: '', metric: 'Finance', kpi: '', isSection: true },
      { responsible: 'Frank Scott', metric: 'AR Recovery — Pre LIT Pending Release', kpi: '700000' },
      { responsible: 'Frank Scott', metric: 'AR Recovery — LIT Pending Release', kpi: '676000' },
      { responsible: 'Frank Scott', metric: 'Aged Release Out ($15k of $650k moved every 30 days)', kpi: '3750' },
      { responsible: 'Frank Scott', metric: 'Financials — Add Revenue & Time Reduction Discussion ($3.9m annual)', kpi: '75000' },
      { responsible: 'Frank Scott', metric: 'Aged AR Review — Pending Releases LIT & Pre-LIT (37.5% moved monthly)', kpi: '0.093' },
      { responsible: 'Frank / Mike', metric: 'SDS Cash Received Forecast (Next 30\u201360 Days)', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'Accounts Payable Aging (30, 60, 90+ Days)', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'Client Payment Cycle Time', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'Average Billing Cycle Time', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'Accounts Receivable Balance', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'AR Aging 0\u201330 Days', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'AR Aging 31\u201360 Days', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'AR Aging 61\u201390 Days', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'AR Aging 90+ Days', kpi: '' },
      { responsible: 'Frank / Mike', metric: 'Days Sales Outstanding (DSO)', kpi: '' },
      { responsible: 'Frank / Mike', metric: '% of Funds Uncollected > 30 Days', kpi: '' },
      { responsible: 'Frank / Mike', metric: '% of Funds Uncollected > 60 Days', kpi: '' },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  RYAN'S MEETING
  // ════════════════════════════════════════════════════════════════
  {
    id: 'ryans-mtg',
    label: "Ryan's Meeting",
    title: 'Executive Weekly Scorecard',
    subtitle: 'Medical Marketing / Law Firm Marketing / Workers Comp',
    metrics: [
      // ── Medical Marketing (Amy Estrada) ──
      { responsible: '', metric: 'Medical Marketing', kpi: '', isSection: true },
      { responsible: 'Amy Estrada', metric: 'New cases from provider relationships new to the firm', kpi: '' },
      { responsible: 'Amy Estrada', metric: 'New cases from existing provider relationships', kpi: '' },
      { responsible: 'Amy Estrada', metric: 'New cases from providers in non-core states (Not NJ, NY, PA, CT)', kpi: '' },
      { responsible: 'Amy Estrada', metric: 'Number of inbound leads', kpi: '30' },
      { responsible: 'Amy Estrada', metric: 'Conversion of leads to matters', kpi: '> 50%' },
      { responsible: 'Amy Estrada', metric: 'Appointments set', kpi: '25' },
      { responsible: 'Amy Estrada', metric: 'Appointments completed', kpi: '20' },
      { responsible: 'Amy Estrada', metric: 'New providers from open to active', kpi: '2' },
      { responsible: 'Amy Estrada', metric: 'ROCK 1: Total appointments set: 300', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 2: Total new clients: 180', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 3: Total amount of active providers: 150', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 4: No less than 20% of new appointments from expansion states', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 5: Volume of email campaigns and text message campaigns', kpi: '', isRock: true },

      // ── Law Firm Marketing (Kevin Maleike) ──
      { responsible: '', metric: 'Law Firm Marketing', kpi: '', isSection: true },
      { responsible: 'Kevin Maleike', metric: 'Inbound Team — Total Leads Received (of Annual Goal)', kpi: '135' },
      { responsible: 'Kevin Maleike', metric: 'Inbound Team — Total Leads Signed by Intake (of Annual Goal)', kpi: '18' },
      { responsible: 'Kevin Maleike', metric: 'New cases from law firm relationships new to the firm', kpi: '5' },
      { responsible: 'Kevin Maleike', metric: 'New cases from existing law firm relationships', kpi: '130' },
      { responsible: 'Kevin Maleike', metric: 'Number of new cases from bottom of the pyramid — PI', kpi: '' },
      { responsible: 'Kevin Maleike', metric: 'Number of new cases from bottom of the pyramid — Non-PI', kpi: '' },
      { responsible: 'Kevin Maleike', metric: 'Inbound Team — Small Firm Relationships | Touch Points/Calls', kpi: '> 200' },
      { responsible: 'Kevin Maleike', metric: 'Inbound Team — Large Firm Relationships | Touch Points/Calls', kpi: '> 50' },
      { responsible: 'Kevin Maleike', metric: 'Inbound Team — Large Firm Relationships | New Agreements', kpi: '> 3' },
      { responsible: 'Kevin Maleike', metric: 'Inbound Team — Small Firm Relationships | New Agreements', kpi: '> 10' },
      { responsible: 'Kevin Maleike', metric: 'Outbound Team — Total Leads Sent (of Annual Goal)', kpi: '150' },
      { responsible: 'Kevin Maleike', metric: 'Outbound Team — Total Leads Signed (of Annual Goal)', kpi: '18' },
      { responsible: 'Kevin Maleike', metric: 'Outbound Team — Partner Under Review Non-Compliant: % of Monthly Volume', kpi: '0.1' },
      { responsible: 'Kevin Maleike', metric: 'Outbound Team — Declined/Rejected/Expired Referrals Not Reviewed and Closed Out', kpi: '0' },
      { responsible: 'Kevin Maleike', metric: 'ROCK 1: Outbound Team — Referral Revenue = $725,000', kpi: '', isRock: true },
      { responsible: 'Kevin Maleike', metric: 'ROCK 2: Outbound Team — RFR Sign Ups = 250', kpi: '', isRock: true },
      { responsible: 'Kevin Maleike', metric: 'ROCK 3: Inbound Team — Sign Ups = 262', kpi: '', isRock: true },
      { responsible: 'Kevin Maleike', metric: 'ROCK 4: AR collected', kpi: '', isRock: true },

      // ── Workers Comp (Ken Thayer) ──
      { responsible: '', metric: 'Workers Comp', kpi: '', isSection: true },
      { responsible: 'Ken Thayer', metric: 'Intakes — Weekly', kpi: '13' },
      { responsible: 'Ken Thayer', metric: 'Settlement Fees $ Weekly', kpi: '55477' },
      { responsible: 'Ken Thayer', metric: 'Resolution to Judge Signed Order', kpi: '< 45 Days' },
      { responsible: 'Ken Thayer', metric: 'AR — Signed Order to Check', kpi: '< 60 Days' },
      { responsible: 'Ken Thayer', metric: 'Demands — Weekly', kpi: '8' },
      { responsible: 'Ken Thayer', metric: 'Client Contact Every 30 Days', kpi: '1' },
      { responsible: 'Ken Thayer', metric: 'ROCK 1: $887,637 Net Fees', kpi: '', isRock: true },
      { responsible: 'Ken Thayer', metric: 'ROCK 2: 96 Demands Sent', kpi: '', isRock: true },
      { responsible: 'Ken Thayer', metric: 'ROCK 3: Qualified Client Contact Every 30 Days', kpi: '', isRock: true },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  JOHN'S MEETING
  // ════════════════════════════════════════════════════════════════
  {
    id: 'johns-mtg',
    label: "John's Meeting",
    title: 'Executive Weekly Scorecard',
    subtitle: 'PI: Pre-LIT / LIT / Claims / Intake',
    metrics: [
      // ── Personal Injury: Pre-LIT / LIT (Marc Borden) ──
      { responsible: '', metric: 'Personal Injury: Pre-LIT / LIT', kpi: '', isSection: true },
      { responsible: 'Marc Borden', metric: 'Attorney Unit Settlements ($)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Settlements % to Goal', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Settlement Value ($)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg TOD', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Days: Assignment \u2192 Complaint Filed', kpi: '' },
      { responsible: 'Marc Borden', metric: '% Filed \u2264 30 Days of Assignment', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Days: Filed \u2192 Service Completed', kpi: '' },
      { responsible: 'Marc Borden', metric: '% Service Completed \u2264 30 Days of Filed', kpi: '' },
      { responsible: 'Marc Borden', metric: 'All Answers Filed % (with all responsive defendants)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Defaults Entered Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Plaintiff Discovery Served Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Defense Discovery Received Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: '10-Day Letter Sent When Past Due %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Motions to Compel Filed When Required %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Days: Past-Due \u2192 Motion Filed', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Motions Granted %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'DED Extensions (#)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Client Depos Completed \u2264 1 Year of Answer %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Client Deps Outstanding 180+ Days (#)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Expert Reports Served Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Mediation Scheduled When Eligible %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Trial-Ready Checklist Completion %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Data Completeness Score %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Client Service Score', kpi: '' },
      { responsible: 'Marc Borden', metric: 'SDS Completion %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases with Active Settlement Offers', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases with No Activity (30+ Days)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Outstanding Discovery Deficiencies', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Active Litigation Cases', kpi: '' },
      { responsible: 'Marc Borden', metric: 'New Cases Entering Litigation (Weekly)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Total Cases in LIT', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Settled Weekly', kpi: '5098723' },
      { responsible: 'Marc Borden', metric: 'Cases Resolved in Litigation (Weekly)', kpi: '25' },
      { responsible: 'Marc Borden', metric: 'Litigation Settlement Dollars Generated', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Average Litigation Case Age (Days)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Days Qualified Cases Are Awaiting Complaint Filing', kpi: '62' },
      { responsible: 'Marc Borden', metric: 'Cases Moved to RFD', kpi: '40' },
      { responsible: 'Marc Borden', metric: 'Reduction of Cases with No Negotiation Activity', kpi: '20' },
      { responsible: 'Marc Borden', metric: 'Number Reduction of Days to Discovery End Date (Goal: 263)', kpi: '4.6' },
      { responsible: 'Marc Borden', metric: 'Decrease of Backlog — Form A Past Due', kpi: '0.1' },
      { responsible: 'Marc / Kennia', metric: 'Qualified Complaints Filed (Weekly)', kpi: '0.7' },
      { responsible: 'Marc Borden', metric: 'Depositions Scheduled', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Depositions Completed (Weekly)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Mediations / Arbitrations Scheduled', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases with Grade A Treatment', kpi: 'Brittany' },
      { responsible: 'Marc / Kennia', metric: 'Outstanding Treatment Touches — All Units', kpi: '< 5' },
      { responsible: 'Marc / Kennia', metric: 'Overdue Qualified Complaint Filings', kpi: '< 55 days' },
      { responsible: 'Marc / Kennia', metric: 'Service Pending Greater Than 35 Days', kpi: '< 40 cases' },
      { responsible: 'Marc / Kennia', metric: 'Total Pending Service', kpi: '< 160 cases' },
      { responsible: 'Marc / Kennia', metric: 'Outstanding Plaintiff Discovery', kpi: '< 40 cases' },
      { responsible: 'Marc / Kennia', metric: 'Outstanding Defendant Discovery', kpi: '< 60 cases' },
      { responsible: 'Marc / Kennia', metric: 'Outstanding Answers Filed', kpi: '< 30 cases' },
      { responsible: 'Marc / Kennia', metric: 'Outstanding Policy Limits', kpi: '< 25 cases' },
      { responsible: 'Marc / Kennia', metric: '10 Day Letters Timely', kpi: '> 80%' },
      { responsible: 'Marc / Brittany', metric: 'Total Cases in Pre-LIT', kpi: '3803' },
      { responsible: 'Marc / Brittany', metric: 'Cases Becoming Demand-Ready (Weekly)', kpi: '63' },
      { responsible: 'Marc / Brittany', metric: 'Reduction of Qualified Cases Not Yet in Treatment', kpi: '15' },
      { responsible: 'Marc / Brittany', metric: 'Active Treatment Rate (Active Treatment \u00f7 Total Pre-Lit)', kpi: '0.76' },
      { responsible: 'Marc / Brittany', metric: 'Avg Time in Call (min)', kpi: '8.5' },
      { responsible: 'Marc / Brittany', metric: 'Net Promoter Score', kpi: '7' },

      // ── Claims (Adam Greenspan) ──
      { responsible: '', metric: 'Claims', kpi: '', isSection: true },
      { responsible: 'Adam Greenspan', metric: 'Settlements Closed (Weekly)', kpi: '20' },
      { responsible: 'Adam Greenspan', metric: 'Settlement Dollars Generated', kpi: '900000' },
      { responsible: 'Adam Greenspan', metric: 'Settlements % to Weekly Goal', kpi: '1' },
      { responsible: 'Adam Greenspan', metric: 'Average Settlement Value', kpi: '44000' },
      { responsible: 'Adam Greenspan', metric: 'Total Demands Sent', kpi: '50' },
      { responsible: 'Adam Greenspan', metric: 'Demand-to-Settlement Conversion Rate', kpi: '0.4' },
      { responsible: 'Adam Greenspan', metric: 'Average Days From Demand to Settlement', kpi: '' },
      { responsible: 'Adam Greenspan', metric: 'Settlement Yield Rate (Total Settlement $ \u00f7 Total Demand $)', kpi: '0.5' },
      { responsible: 'Adam Greenspan', metric: 'Cases Awaiting Demand', kpi: '40' },
      { responsible: 'Adam Greenspan', metric: 'Settled Files Pending Funding', kpi: '' },
      { responsible: 'Adam Greenspan', metric: 'Cases Escalated to Litigation', kpi: '' },
      { responsible: 'Adam Greenspan', metric: 'Total Outbound Dials by Demand Follow Up Team', kpi: '30' },
      { responsible: 'Adam Greenspan', metric: 'Avg Time in Call for Demand Follow Up Team', kpi: '10min' },

      // ── Intake (Marques Burgess) ──
      { responsible: '', metric: 'Intake', kpi: '', isSection: true },
      { responsible: 'Marques Burgess', metric: 'Average Time to First Contact', kpi: '< 24 Hours' },
      { responsible: 'Marques Burgess', metric: 'Percentage of Calls Transferred to Answering Service', kpi: '< 10%' },
      { responsible: 'Marques Burgess', metric: 'Signed Cases (Weekly)', kpi: '150' },
      { responsible: 'Marques Burgess', metric: 'Qualified Lead-to-Signed Conversion Rate', kpi: '0.2' },
      { responsible: 'Marques Burgess', metric: 'Leads Contacted Within SLA (%)', kpi: '0.95' },
      { responsible: 'Marques Burgess', metric: 'Average Contact Attempts per Lead', kpi: 'TBD' },

      // ── 2nd Quarter Rocks ──
      { responsible: '', metric: '2nd Quarter Rocks', kpi: '', isSection: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Reduce Records Aged > 30 Days to < 10% for 4 Consecutive Weeks', kpi: '', isRock: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Reduce Time to Demand by 25%', kpi: '', isRock: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Achieve \u2265 95% Active Follow-Up Coverage Across All Cases', kpi: '', isRock: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Reduce Medical Records Aging > 30 Days to < 10%', kpi: '', isRock: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Increase Weekly Demands Sent by 20%', kpi: '', isRock: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Implement Full KPI Scorecard + Weekly MOS Accountability', kpi: '', isRock: true },
      { responsible: 'Marc Borden', metric: 'ROCK: Sustain \u2265 95% Active Follow-Up Coverage for 6 Consecutive Weeks', kpi: '', isRock: true },

      // ── PI: Intake (Marques Burgess) ──
      { responsible: '', metric: 'PI: Intake', kpi: '', isSection: true },
      { responsible: 'Marques Burgess', metric: 'Average Time to First Contact', kpi: '24 hours' },
      { responsible: 'Marques Burgess', metric: 'Percentage of Calls Transferred to Answering Service', kpi: '0.1' },
      { responsible: 'Marques Burgess', metric: 'Signed Cases (Weekly)', kpi: '150' },
      { responsible: 'Marques Burgess', metric: 'Qualified Lead-to-Signed Conversion Rate', kpi: '0.2' },
      { responsible: 'Marques Burgess', metric: 'Leads Contacted Within SLA (%)', kpi: '0.95' },
      { responsible: 'Marques Burgess', metric: 'Average Contact Attempts per Lead', kpi: 'TBD' },
      { responsible: 'Marques Burgess', metric: 'ROCK: Establish Outbound Campaign for All Non-Inbound Volume Inventory', kpi: '', isRock: true },
      { responsible: 'Marques Burgess', metric: 'ROCK: Answer 90% of All Inbound Volume', kpi: '', isRock: true },
      { responsible: 'Marques Burgess', metric: 'ROCK: Create Quality Assurance Scorecard', kpi: '', isRock: true },
      { responsible: 'Marques Burgess', metric: 'ROCK: Signed Cases = 1,800', kpi: '', isRock: true },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  MARC'S MEETING
  // ════════════════════════════════════════════════════════════════
  {
    id: 'marcs-mtg',
    label: "Marc's Meeting",
    title: 'Pre-LIT & Paralegal Weekly Scorecard',
    subtitle: 'Pre-LIT / LIT Paralegal',
    metrics: [
      // ── Brittany Hale — Pre-LIT ──
      { responsible: '', metric: 'Brittany Hale \u2014 Pre-LIT', kpi: '', isSection: true },
      { responsible: 'Brittany Hale', metric: 'Total Cases in Pre-LIT', kpi: '3803' },
      { responsible: 'Brittany Hale', metric: 'Reduction of Qualified Cases Not Yet in Treatment', kpi: '15' },
      { responsible: 'Brittany Hale', metric: 'Active Treatment Rate (Active Treatment \u00f7 Total Pre-Lit)', kpi: '0.76' },
      { responsible: 'Brittany Hale', metric: 'Cases Becoming RFD (Weekly)', kpi: '63' },
      { responsible: 'Brittany Hale', metric: 'Net Promoter Score', kpi: '7' },
      { responsible: 'Brittany Hale', metric: 'Avg Time in Call (min)', kpi: '8.5' },
      { responsible: 'Brittany Hale', metric: 'Weekly BOC Compliance', kpi: '0.85' },
      { responsible: 'Brittany Hale', metric: 'Cases to LIT', kpi: '57' },
      { responsible: 'Brittany Hale', metric: 'No injection rate > 120 (600 cases \u2014 10 weeks)', kpi: '60' },
      { responsible: 'Brittany Hale', metric: 'MRI/diagnosis within 60 days (700 cases \u2014 10 weeks)', kpi: '70' },
      { responsible: 'Brittany Hale', metric: 'Pain Management Eval within 90 days (500 cases \u2014 10 weeks)', kpi: '50' },
      { responsible: 'Brittany Hale', metric: 'ROCK 1: 750 Cases to RFD', kpi: '', isRock: true },
      { responsible: 'Brittany Hale', metric: 'ROCK 2: Case Quality Score (5% Plat / 10% Gold / 20% Silver / 40% Bronze / 25% Flag)', kpi: '', isRock: true },
      { responsible: 'Brittany Hale', metric: 'ROCK 3: Estimated Settlement Value for Last Month of Q2', kpi: '', isRock: true },

      // ── Kennia Delgado — LIT Paralegal ──
      { responsible: '', metric: 'Kennia Delgado \u2014 LIT Paralegal', kpi: '', isSection: true },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Treatment Touches — All Units', kpi: '< 5' },
      { responsible: 'Kennia Delgado', metric: 'Overdue Qualified Complaint Filings', kpi: '< 55 days' },
      { responsible: 'Kennia Delgado', metric: 'Service Pending Greater Than 35 Days', kpi: '< 40 cases' },
      { responsible: 'Kennia Delgado', metric: 'Total Pending Service', kpi: '< 160 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Plaintiff Discovery', kpi: '< 40 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Defendant Discovery', kpi: '< 60 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Answers Filed', kpi: '< 30 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Policy Limits', kpi: '< 25 cases' },
      { responsible: 'Kennia Delgado', metric: '10 Day Letters Timely', kpi: '> 80%' },
      { responsible: 'Kennia Delgado', metric: 'ROCK 1: Qualified Complaints Filed Timely (30 days)', kpi: '> 65%', isRock: true },
      { responsible: 'Kennia Delgado', metric: 'ROCK 2: Service Filed Timely (30 days)', kpi: '> 70%', isRock: true },
      { responsible: 'Kennia Delgado', metric: 'ROCK 3: Plaintiff Discovery Completed Timely (30 days)', kpi: '> 60%', isRock: true },
    ],
  },
];
