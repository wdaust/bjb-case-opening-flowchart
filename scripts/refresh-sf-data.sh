#!/usr/bin/env bash
# refresh-sf-data.sh — Fetches fresh Salesforce report/dashboard data
# and saves shaped JSON to public/reports/ for static fallback.
#
# Usage:  ./scripts/refresh-sf-data.sh
# Requires: sf CLI authenticated to bjblaw org

set -euo pipefail
cd "$(dirname "$0")/.."

ORG="wdaust@brandonjbroderick.com"
API_VER="v62.0"
OUT_DIR="public/reports"
SCRIPT_DIR="$(pwd)/scripts"

# Standard reports (already SUMMARY format with groupings)
REPORTS=(
  "00OPp000003OUcjMAG"   # Discovery Trackers
  "00OPp000003PLtxMAG"   # Experts Not Served
  # Open Lit fetched separately below with includeDetails=true
  # Source reports backing dashboard drill-down components:
  "00OPp000003Lt2zMAC"   # Complaint Filing Dashboard (NJ LIT)
  "00OPp000003LtJ7MAK"   # Form A Past Due (NJ)
  "00OPp000003LtarMAC"   # Dep Report for NJ PI LIT
  "00OPp000003Lte5MAC"   # Form C Past Due (NJ)
  "00OPp000003LtCfMAK"   # Missing All Ans, No Default NJ
  # LIT Scorecard reports:
  "00O4V000009xCScUAM"   # Unit Goals (Leaders)
  "00OPp000002Gbs6MAC"   # Complaints Filed Monthly (YTD)
  "00OPp000003LtB3MAK"   # No Service 35+ Days (NJ)
  "00OPp000002kk0HMAQ"   # Missing All Ans, no Default (Served Dt)
  "00OPp000001jfxhMAA"   # Form C 10 Day Letters Needed
  "00OPp000001n6q5MAA"   # Need Form C Rcv'd Dt or Motion to Compel
  "00O4V000009d6Z0UAI"   # Arb and Mediation Matters next 60 Days
  "00OPp000003alDBMAY"   # Service Completed ≤ 30 Days of Filed
)
# NOTE: Matters Universe (00OPp000003OaGjMAK) is skipped — the SF report was
# reconfigured and no longer provides the stage-grouped Open/Closed aggregates
# the dashboard needs. Using the last known good static export instead.
# To refresh it, restore the SF report to SUMMARY format grouped by stage
# with Open/Closed formula aggregates.

# Dashboard IDs
DASHBOARDS=(
  "01ZPp0000015Ug1MAE"   # States at a Glance
  "01ZPp0000015dGHMAY"   # NJ PI Timing
  "01ZPp000000l3NRMAY"   # (new) from SF Lightning
  "01ZPp0000013fsTMAQ"   # (new) TBD — from SF Lightning
)

# Resolutions report needs special handling — it's TABULAR in SF
# so we POST with groupingsDown to get attorney-level aggregates
RESOLUTIONS_ID="00OPp000003OOCLMA4"
RESOLUTIONS_BODY='{
  "reportMetadata": {
    "reportFormat": "SUMMARY",
    "detailColumns": [
      "CUST_NAME","FK_NAME",
      "FK_litify_pm__Matter__c.Date_Assigned_To_Litigation_Unit__c",
      "FK_litify_pm__Matter__c.Complaint_Filed_Date__c",
      "litify_pm__Resolution__c.litify_pm__Resolution_Date__c",
      "litify_pm__Resolution__c.litify_pm__Settlement_Verdict_Amount__c",
      "litify_pm__Resolution__c.litify_pm__Net_Attorney_Fee__c",
      "litify_pm__Resolution__c.Date_Docusign_SDS_Completed__c",
      "FK_litify_pm__Matter__c.litify_pm__Matter_State__c"
    ],
    "groupingsDown": [{"name":"litify_pm__Resolution__c.Created_By_User__c","sortOrder":"Asc","dateGranularity":"NONE"}]
  }
}'

mkdir -p "$OUT_DIR"

echo "🔄 Refreshing Salesforce data..."
echo ""

# ── Resolutions (POST with grouping) ──────────────────────────────────
# Note: shape-report.mjs filters out Adam Greenspan from Resolutions output
echo -n "  📊 Resolutions (grouped by attorney) ... "
RAW=$(sf api request rest "/services/data/$API_VER/analytics/reports/${RESOLUTIONS_ID}?includeDetails=true" \
  -o "$ORG" --method POST --body "$RESOLUTIONS_BODY" 2>/dev/null)
echo "$RAW" | node "$SCRIPT_DIR/shape-report.mjs" > "$OUT_DIR/$RESOLUTIONS_ID.json"
NAME=$(jq -r '.reportName' "$OUT_DIR/$RESOLUTIONS_ID.json")
GROUPS=$(jq '.groupings | length' "$OUT_DIR/$RESOLUTIONS_ID.json")
echo "✅  $NAME ($GROUPS attorneys)"

# ── Fetch Standard Reports ────────────────────────────────────────────
for id in "${REPORTS[@]}"; do
  echo -n "  📊 Report $id ... "
  RAW=$(sf api request rest "/services/data/$API_VER/analytics/reports/${id}?includeDetails=true" -o "$ORG" 2>/dev/null)
  echo "$RAW" | node "$SCRIPT_DIR/shape-report.mjs" > "$OUT_DIR/$id.json"
  NAME=$(jq -r '.reportName' "$OUT_DIR/$id.json")
  ROWS=$(jq '.detailRows | length // 0' "$OUT_DIR/$id.json")
  echo "✅  $NAME ($ROWS detail rows)"
done

# ── Open Lit (with detail rows) ──────────────────────────────────────
OPEN_LIT_ID="00O4V000009RreKUAS"
echo -n "  📊 Open Lit (with details) ... "
RAW=$(sf api request rest "/services/data/$API_VER/analytics/reports/${OPEN_LIT_ID}?includeDetails=true" -o "$ORG" 2>/dev/null)
echo "$RAW" | node "$SCRIPT_DIR/shape-report.mjs" > "$OUT_DIR/$OPEN_LIT_ID.json"
NAME=$(jq -r '.reportName' "$OUT_DIR/$OPEN_LIT_ID.json")
ROWS=$(jq '.detailRows | length' "$OUT_DIR/$OPEN_LIT_ID.json")
echo "✅  $NAME ($ROWS detail rows)"

# ── Fetch Dashboards ─────────────────────────────────────────────────
for id in "${DASHBOARDS[@]}"; do
  echo -n "  📈 Dashboard $id ... "
  RAW=$(sf api request rest "/services/data/$API_VER/analytics/dashboards/${id}" -o "$ORG" 2>/dev/null)
  echo "$RAW" | node "$SCRIPT_DIR/shape-dashboard.mjs" > "$OUT_DIR/$id.json"
  NAME=$(jq -r '.dashboardName' "$OUT_DIR/$id.json")
  echo "✅  $NAME"
done

echo ""
echo "✅ All reports refreshed → $OUT_DIR/"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
