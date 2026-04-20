# Unified Findings & Proposed Changes

**Date:** 2026-04-16
**Demo:** Monday April 21 to mentor (boss's boss)
**Dashboard:** Municipal Market Research — 462 contracts, $373M, 11 cities

---

## Executive Summary

The dashboard is **already strong.** It answers 18+ analytical questions, has a working Leaflet map with city boundaries, 12 interactive charts, rich filtering with URL state persistence, CSV/PDF export, skeleton loading, toast notifications, and responsive design. The code is clean and well-organized at 3846 lines.

**There are no P0 (broken/embarrassing) issues.** The dashboard functions correctly.

The highest-impact improvement for Monday is **Halff highlighting** — making Halff's 20 contracts visually distinct so the audience immediately sees "where we are" in the competitive landscape.

---

## Priority Classification

### P0 — Must Fix Before Monday (demo-breaking)
**None.** The dashboard is functional and polished.

### P1 — Should Fix Before Monday (meaningfully improves impression)

| # | Change | BA | UX | Tech | Impact |
|---|--------|:--:|:--:|:----:|--------|
| 1 | **Halff highlighting** — visually distinguish Halff contracts in charts, table, and consultant bar | X | X | | The audience's #1 question will be "where is Halff?" Currently invisible among 462 contracts. |
| 2 | **Rename PM Tracker tab** — change to "Consultant Intel" or add explanatory subtitle | X | X | | Tab name promises individual PM data but shows firm-level grouping. Will confuse if not reframed. |
| 3 | **Rebuild contract_data.json** before demo | X | | X | Data is from April 14. Re-running `build_dashboard_data.py` morning of April 21 ensures freshness. |
| 4 | **Nav logo onerror fallback** — add `onerror="this.style.display='none'"` to nav logo img | | X | | If the image fails to load (wrong path, projector machine), broken image icon appears in nav. |
| 5 | **Fix consultant alias duplicates** — normalize "Dunaway Associates" / "Dunaway Associates, LLC" | | | X | Splits what should be one bar in charts into two, inflates firm count. |

### P2 — Fix Later (good ideas, not worth the risk before Monday)

| # | Change | Notes |
|---|--------|-------|
| 6 | Add a "Halff Market Share" stat card or KPI (e.g., "Halff: #3 of 100+ firms, X% market share") | Requires new UI element — scope risk |
| 7 | CDN fallback for offline demo (bundle Chart.js, Leaflet, fonts locally) | Only matters if demo room has no internet |
| 8 | Rename "Unknown" project type to "Uncategorized" in filter chips | Minor confusion risk |
| 9 | Add staleness warning if data >14 days old | Not needed if data is rebuilt before demo |
| 10 | Pagination or virtual scrolling for Top Contracts table | Only matters at 1000+ rows; 462 is fine |
| 11 | "All" chip safety — prevent accidental deselect-all from clearing the view | Edge case during live demo |

### P3 — Next Phase (document but don't touch)

| # | Enhancement | Notes |
|---|-------------|-------|
| 12 | PM name extraction — add `pm_name` field to Claude API prompt | Requires `claude_client.py` change + Excel schema + dashboard UI |
| 13 | CIP data loading — wire up the CIP scraper output to dashboard | CIP tab structure exists; needs data pipeline |
| 14 | Exhibit A targeted retrieval — use existing contract metadata to fetch scope/fee PDFs | Valuable for deep competitive analysis |
| 15 | Additional cities (Prosper, others) | Prosper is shelved; others can be added via `cities_config.json` |
| 16 | Automated pipeline (GitHub Actions or scheduled task) | Daily/weekly scrape + rebuild + deploy |
| 17 | Win/loss tracking — compare Halff proposals to actual awards | Requires new data source |

---

## Proposed P1 Changes (Numbered List)

**HARD STOP: No code changes without your "go."**

### Change 1: Halff Highlighting

**What:** Add visual distinction for any contract where `company` contains "Halff" (case-insensitive).

**Where it appears:**
- **Consultant bar chart:** Halff's bar gets a distinct color (salmon `#FC6758` or gold) instead of blending into the palette
- **Top Contracts table:** Halff rows get a subtle left border or background tint
- **PM Tracker cards:** Halff's card gets a different border color (salmon instead of teal)
- **KPI area or nav stats:** Add a small "Halff: #3 · 20 awards · $XM" line

**Why:** The audience is Halff leadership. They'll scan for themselves first. Making Halff visually distinct turns a generic competitive dashboard into a Halff-specific intelligence tool.

### Change 2: PM Tracker Tab Rename

**What:** Change the nav tab text from "PM Tracker" to "Consultant Intel" (or "Consultant Tracker"). Optionally add a subtitle below the tab title explaining: "Consultants grouped by award count, total value, and city/category spread."

**Why:** The tab shows firm-level grouping, not individual PMs. The current name sets the wrong expectation. "Consultant Intel" accurately describes the content and sounds more executive-friendly.

### Change 3: Rebuild JSON Before Demo

**What:** Run `py docs/build_dashboard_data.py` from the repo root the morning of April 21. This rebuilds `contract_data.json` from all current Excel files.

**Why:** Ensures the "Data freshness" footer shows a current date. Any contracts extracted since April 14 will be included.

**Not a code change — just a pipeline step.**

### Change 4: Nav Logo Fallback

**What:** Add `onerror="this.style.display='none'"` to the `<img class="nav-logo-img">` tag in the nav bar (line ~1241).

**Why:** If the image path breaks on the demo machine, a broken image icon appears in the nav bar. This one-line change hides it gracefully, matching the pattern already used in `auth.js`.

### Change 5: Fix Consultant Alias Duplicates

**What:** Add entries to `Contract Logs/logs/consultant_aliases.json` to normalize:
- "Dunaway Associates, LLC" → "Dunaway Associates"
- Any other split firms identified in the data

Then re-run the processing pipeline for affected cities, or manually normalize in the Excel Config sheets.

**Why:** Currently "Dunaway Associates" (7 awards) and "Dunaway Associates, LLC" (7 awards) appear as separate firms in charts. Merging them shows 14 awards under one name — more accurate and cleaner charts.

---

## Questions for You (tabled decisions)

1. **Halff highlighting color:** Should Halff bars/rows use salmon (`#FC6758`), gold/yellow, or the Halff blue with a star icon? Salmon would make them pop against the blue/teal palette.

2. **PM Tracker rename:** Do you prefer "Consultant Intel", "Consultant Tracker", or keeping "PM Tracker" with an explanatory subtitle?

3. **Scope of Halff highlighting:** Just the consultant bar chart + table? Or also the map (e.g., cities where Halff has contracts get a special marker) and KPI area?

4. **Any other firm-name duplicates** you know about that should be aliased? I found Dunaway, but there may be others (e.g., "Kimley-Horn" vs "Kimley Horn" vs "Kimley-Horn and Associates, Inc.").

5. **Data rebuild:** Do you want me to run `build_dashboard_data.py` now to verify it works, or save that for demo morning?

---

## Cleanup Note

The earlier `agent1_ba_findings.md` in the old repo at `Data Scrapper AI/- Municipal-Markets-main/docs/` was written against the wrong codebase. All reports are now in the correct repo: `Municipal Market Research/docs/`.
