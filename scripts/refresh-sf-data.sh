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
  "00O4V000009RreKUAS"   # Open Lit Matters by Owner and PI status
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
RAW=$(sf api request rest "/services/data/$API_VER/analytics/reports/${RESOLUTIONS_ID}?includeDetails=false" \
  -o "$ORG" --method POST --body "$RESOLUTIONS_BODY" 2>/dev/null)
echo "$RAW" | node "$SCRIPT_DIR/shape-report.mjs" > "$OUT_DIR/$RESOLUTIONS_ID.json"
NAME=$(jq -r '.reportName' "$OUT_DIR/$RESOLUTIONS_ID.json")
GROUPS=$(jq '.groupings | length' "$OUT_DIR/$RESOLUTIONS_ID.json")
echo "✅  $NAME ($GROUPS attorneys)"

# ── Fetch Standard Reports ────────────────────────────────────────────
for id in "${REPORTS[@]}"; do
  echo -n "  📊 Report $id ... "
  RAW=$(sf api request rest "/services/data/$API_VER/analytics/reports/${id}?includeDetails=false" -o "$ORG" 2>/dev/null)
  echo "$RAW" | node "$SCRIPT_DIR/shape-report.mjs" > "$OUT_DIR/$id.json"
  NAME=$(jq -r '.reportName' "$OUT_DIR/$id.json")
  echo "✅  $NAME"
done

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
