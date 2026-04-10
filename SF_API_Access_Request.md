# Salesforce Analytics API Access Request — Optimus Dashboard

**Requested by:** Will Daust
**Date:** April 6, 2026
**Application:** Optimus Dashboard (bjboptimus.com)
**Purpose:** Read-only access to Salesforce Analytics API to fetch report and dashboard data for the Optimus operations dashboard.

---

## API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/services/data/v62.0/analytics/reports/{id}` | GET | Fetch report summaries and detail rows |
| `/services/data/v62.0/analytics/dashboards/{id}` | GET | Fetch dashboard component data |

---

## Reports (5)

| # | Report ID | Report Name | Usage |
|---|-----------|-------------|-------|
| 1 | `00O4V000009RreKUAS` | Open Lit Matters by Owner and PI status | Open inventory hero card, attorney breakdown, matter-level detail rows |
| 2 | `00OPp000003OOCLMA4` | LDM - Resolutions and SDS | Resolution performance, attorney settlement rankings, fee ratios |
| 3 | `00OPp000003OUcjMAG` | LDM - Discovery Tracker Data | Discovery tracker workload distribution by attorney |
| 4 | `00OPp000003OaGjMAK` | Matters Universe | Matter stage breakdown (open/closed) |
| 5 | `00OPp000003PLtxMAG` | Experts not Served (Grouped by Expert) | Experts not served workload by attorney |

## Dashboards (2)

| # | Dashboard ID | Dashboard Name | Components Used |
|---|-------------|----------------|-----------------|
| 6 | `01ZPp0000015Ug1MAE` | NJ LIT - Stats at a Glance | NJ Lit Inventory, Negotiations, Form A Past Due, Dep Report for NJ PI LIT, Complaint Filing, Form C Past Due, Missing Discovery Trackers, No Service 35+ Days, Missing Answers, ARB/MED/SET CONF/Trials, Experts not Served |
| 7 | `01ZPp0000015dGHMAY` | NJ PI - Timing | Complaint Timing NJ, Form A Timing NJ, Form C Timing NJ, Dep Timing NJ, DED Extensions, NJ Resolutions |

---

## Access Details

- **Access type:** Read-only (no data modifications)
- **Org:** wdaust@brandonjbroderick.com
- **Authentication:** Salesforce CLI (`sf`) or OAuth connected app
- **Frequency:** On-demand refresh (manual trigger, not scheduled)
- **Data sensitivity:** Aggregate counts and attorney-level summaries; matter-level detail rows for Open Lit report only
