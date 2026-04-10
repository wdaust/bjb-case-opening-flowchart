import { readFileSync } from 'fs';

// SF Report IDs from sfReportIds.ts
const REPORTS = {
  complaints: '00OPp000003Lt2zMAC',
  service: '00OPp000003LtB3MAK',
  answers: '00OPp000003LtCfMAK',
  formA: '00OPp000003LtJ7MAK',
  formC: '00OPp000003Lte5MAC',
  depositions: '00OPp000003LtarMAC',
  ded: '00O4V000009RreKUAS',  // openLit
};

// STAGE_DRILL_COLUMNS from cardDefs.ts
const DRILL_COLUMNS = {
  complaints: [
    { key: 'Display Name' },
    { key: 'Matter: Matter Name' },
    { key: 'Date Assigned to Team to Today' },
    { key: 'Date Assigned To Litigation Unit' },
    { key: 'Complaint Filed Date' },
    { key: 'Blocker to Filing Complaint' },
    { key: 'PI Status' },
  ],
  service: [
    { key: 'Matter: Matter Name' },
    { key: 'Display Name' },
    { key: 'Complaint Filed Date' },
    { key: 'Service complete date' },
    { key: 'Age in Litigation' },
    { key: 'Total Liability Limits' },
  ],
  answers: [
    { key: 'Matter Name' },
    { key: 'Client Name' },
    { key: 'Defendant (Party Name)' },
    { key: 'Answer Filed' },
    { key: 'Default Entered Date' },
    { key: 'Active Defendant?' },
    { key: 'Defendant Deposition' },
  ],
  formA: [
    { key: 'Display Name' },
    { key: 'Defendant (Party Name)' },
    { key: 'Answer Filed' },
    { key: 'Answer Date to Today' },
    { key: 'Date Form A Sent to Attorney for Review' },
    { key: 'Form A Served' },
    { key: 'Active Stage' },
  ],
  formC: [
    { key: 'Display Name' },
    { key: 'Defendant (Party Name)' },
    { key: 'Answer Date to Today' },
    { key: 'Form A Served' },
    { key: 'Form C Received' },
    { key: '10 Day Letter Sent' },
    { key: 'Date Motion Filed' },
  ],
  depositions: [
    { key: 'Display Name' },
    { key: 'Defendant (Party Name)' },
    { key: 'Answer Filed' },
    { key: 'Answer Date to Today' },
    { key: 'Client Deposition' },
    { key: 'Active Stage' },
  ],
  ded: [
    { key: 'Display Name' },
    { key: 'Matter: Matter Name' },
    { key: 'Case Type' },
    { key: 'Active Stage' },
    { key: 'Discovery End Date' },
    { key: 'Age in Litigation' },
  ],
};

console.log('=== Drill-Down Column Verification ===\n');

let totalIssues = 0;

for (const [stage, reportId] of Object.entries(REPORTS)) {
  const filePath = `./public/reports/${reportId}.json`;
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    console.log(`❌ ${stage}: MISSING report file ${filePath}`);
    totalIssues++;
    continue;
  }

  const rows = data.detailRows || [];
  if (rows.length === 0) {
    console.log(`⚠️  ${stage}: 0 detail rows`);
    continue;
  }

  const sampleRow = rows[0];
  const availableKeys = Object.keys(sampleRow);
  const columns = DRILL_COLUMNS[stage];

  const missing = [];
  const populated = [];
  const dashes = [];

  for (const col of columns) {
    if (!(col.key in sampleRow)) {
      missing.push(col.key);
    } else {
      // Check how many rows have real data (not '-' or null) for this column
      const withData = rows.filter(r => {
        const v = r[col.key];
        return v != null && v !== '' && v !== '-';
      }).length;
      const pct = Math.round((withData / rows.length) * 100);
      if (pct === 0) {
        dashes.push(`${col.key} (0% populated)`);
      } else {
        populated.push({ key: col.key, pct });
      }
    }
  }

  if (missing.length === 0 && dashes.length === 0) {
    const colSummary = populated.map(p => `${p.key}:${p.pct}%`).join(', ');
    console.log(`✅ ${stage} (${rows.length} rows) — all ${columns.length} columns match`);
  } else {
    if (missing.length > 0) {
      console.log(`❌ ${stage} (${rows.length} rows) — MISSING keys: ${missing.join(', ')}`);
      console.log(`   Available: ${availableKeys.join(', ')}`);
      totalIssues += missing.length;
    }
    if (dashes.length > 0) {
      console.log(`⚠️  ${stage} — all-dash columns: ${dashes.join(', ')}`);
    }
    if (missing.length === 0) {
      console.log(`✅ ${stage} (${rows.length} rows) — all keys present (${dashes.length} all-dash)`);
    }
  }
}

console.log(`\n=== Summary: ${totalIssues} missing column key(s) ===`);
