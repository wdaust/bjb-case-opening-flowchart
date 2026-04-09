# Optimus Dashboard — Development Rules

## CRITICAL: No Duplicate Defendant Rows

SF source reports (Form A, Form C, Depositions, DED, Answers, Service) contain **per-defendant rows**. All cards, gauges, and issues arrays must show **per-matter counts only** — zero duplicates.

### Rules for compute functions in `src/data/metrics/`

1. **Card values**: Always use `uniqueMatterCount(rows)` from `./shared` — never `.length` on raw/filtered row arrays.
2. **Issues arrays**: Always dedupe by matter name using a `Set<string>` before pushing to the issues array. Use `.reduce()` with a seen-set, not `.map()`.
3. **Gauge `count` parameter**: When passing `totalCount` to `buildGauge()`, use `uniqueMatterCount(rows)` — never `rows.length`.
4. **Dedup key priority**: `Matter Name` > `Display Name` > `'Unknown'` fallback.
5. **Drill-down tables**: Always apply `dedupeByMatter()` before rendering detail rows.

### Why this matters
A single matter with 3 defendants produces 3 SF rows. Without dedup, cards show inflated counts, issues lists show duplicates, and drill-down tables repeat the same matter. The user expects one entry per matter everywhere.

## Version Bumping
Always bump `package.json` version before pushing to main. Patch bump (x.y.Z) for fixes/tweaks, minor bump (x.Y.0) for new features/card layout changes.
