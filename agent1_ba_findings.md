# Agent 1: Business Analyst Findings

**Reviewer:** Business Analyst perspective
**Date:** 2026-04-16
**Audience:** Civil engineering executive (VP / CEO level)
**Dashboard:** Municipal Market Research — Halff Associates
**Repo:** `Municipal Market Research/docs/index.html` (3846 lines, 122KB)

---

## 1. Questions the Dashboard Currently Answers

| # | Question | Where Answered | Quality |
|---|----------|---------------|---------|
| 1 | How many contracts across all tracked cities? | KPI card "Total Contracts" (462) | Excellent — with YoY % change |
| 2 | What's the total dollar value? | KPI card "Total Value" ($373M) | Excellent — with YoY % change |
| 3 | How many cities are we tracking? | KPI card "Cities" (11) | Excellent |
| 4 | How many consulting firms compete? | KPI card "Consultants" + stat card | Excellent |
| 5 | Who are the top firms by dollar volume? | "Top Consultants by Contract Value" hero bar chart (Top 15) | Excellent |
| 6 | What's the category mix of spending? | "Contract Distribution by Type" doughnut | Good |
| 7 | How does spending trend over time? | "Contract Value Over Time" stacked bar + "Cumulative Spend Curve" | Excellent |
| 8 | How do firms compare on count vs value? | "Consultant Profile" scatter/bubble chart | Excellent — unique insight |
| 9 | Which city spends on what? | "Category Heatmap by City" | Excellent — high information density |
| 10 | What's the average deal size trend? | "Average Contract Size Over Time" with trend badge | Good |
| 11 | Is the market growing or shrinking? | "Year-over-Year Growth Rate" chart | Excellent |
| 12 | Are incumbents entrenching? | "New vs Repeat Consultants" chart | Excellent — differentiated |
| 13 | What's the deal-size distribution? | "Contract Size Distribution" histogram | Good |
| 14 | How are top firms' shares evolving? | "Consultant Market Share Evolution" | Excellent |
| 15 | What are the biggest individual deals? | "Top Contracts" sortable table | Excellent — sortable, exportable |
| 16 | Where geographically is the activity? | Leaflet choropleth map with click-to-filter | Excellent |
| 17 | What's each firm's city/category spread? | PM Tracker tab (actually Consultant Tracker) | Good |
| 18 | What does spending look like filtered to one city? | View mode toggle + city chip filters | Excellent |

**Verdict:** This dashboard answers 18 distinct analytical questions. That's exceptional for a proof-of-concept. The information density is high without being overwhelming.

---

## 2. Questions It SHOULD Answer But Doesn't

### High Impact (would make a VP say "I need this")

| # | Question | Impact | Difficulty |
|---|----------|--------|-----------|
| 1 | **Where is Halff in this picture?** Halff has 20 contracts (#3 firm). No visual distinction. An executive's first question will be "where are WE?" | Critical | Low — highlight rows/bars where company contains "Halff" |
| 2 | **What's Halff's market share by city?** "We have X% of Plano's engineering spend but only Y% of Dallas" | High | Medium — add a Halff-specific stat card or overlay |
| 3 | **Who are the key PMs at competing firms?** The "PM Tracker" tab groups by firm, not individual PMs. Real PM intelligence is the killer BD feature. | High | High — requires scraper enhancement |
| 4 | **Which contracts are coming next?** CIP/bonds pipeline = forward-looking intelligence. Currently "Coming Soon." | Medium | Medium — CIP scraper exists but no data loaded |

### Medium Impact (Phase 2)

| # | Question | Notes |
|---|----------|-------|
| 5 | What's Halff's win rate vs. specific competitors per category? | Requires tracking losses, not just wins |
| 6 | Which Halff competitors are teaming together? | Subconsultant data not extracted |
| 7 | What's the typical project timeline from award to completion? | Timeline data not in scope |
| 8 | Are there seasonal patterns in awards? | Data supports this, just no chart for it yet |

---

## 3. Data Hierarchy & 10-Second Test

### PASS

The visual hierarchy is strong:
1. **First 2 seconds:** 4 KPI cards tell the headline story (462 contracts, $373M, 11 cities, 100+ firms) with YoY trend arrows
2. **Next 3 seconds:** Hero chart shows who's winning — Freese & Nichols and Kimley-Horn dominate
3. **Next 5 seconds:** Map gives geographic context, doughnut shows category mix, heatmap shows city x category spend

A non-technical executive can grasp the competitive landscape in under 10 seconds. The 2-column layout (charts left, map + stats right) is effective.

---

## 4. Metrics & KPIs Assessment

### Already present (strong):
- Total contracts + YoY change
- Total value + YoY change
- City count + YoY change
- Consultant count + YoY change
- Average contract size (stat card + trend chart)
- Top firm by count (stat card)
- Top category (stat card)

### Should add for demo:
- **Halff-specific callout:** "Halff ranks #3 of X firms — 20 awards worth $Y"
- **Data freshness in nav bar** or footer (currently in footer but easy to miss)

### Nice-to-have (Phase 2):
- Market share % for Halff vs top 3 competitors
- "Opportunity Score" per city (high CIP spend + low Halff penetration = opportunity)

---

## 5. Data Quality & Gaps

| Item | Status | Impact on Demo |
|------|--------|---------------|
| 462 contracts loaded across 11 cities | Good | Strong dataset |
| $373M total value | Good | Impressive number |
| 63 contracts (14%) missing dollar amounts | Minor | Amounts show $0; slightly underreports totals |
| Richardson: 1 contract, $0 value | Minor | Looks thin but real — they just started |
| Duplicate firm names (e.g., "Dunaway Associates" vs "Dunaway Associates, LLC") | Minor | Slightly inflates firm count, splits chart bars |
| No PM names extracted | Expected | PM tab shows firms instead; clear path to Phase 2 |
| CIP data not loaded | Expected | Tab shows "Coming Soon" gracefully |
| Data generated 2026-04-14 | Minor | 7 days old by demo; recommend re-running `build_dashboard_data.py` morning of demo |

---

## 6. The Demo Narrative (recommended)

### 5-minute script:

1. **Open dashboard** (password: 1950) — KPI cards load with animation
2. **"We're tracking 462 engineering contracts worth $373M across 11 North Texas cities."**
3. Point to consultant bar chart: **"Here are the top 15 firms winning this work. Freese & Nichols leads, Kimley-Horn is #2, and Halff is #3."**
4. Point to map: **"Click a city to drill down."** Click Dallas — everything re-filters.
5. Show heatmap: **"This shows where money is flowing by category. Dallas is heavy on water/wastewater; Plano is broad."**
6. Click "Market Share Evolution": **"We can see how firms' share of the market is changing over time."**
7. Tab to PM Tracker: **"This groups consultants by their award footprint. In Phase 2, we'll extract individual project managers for BD targeting."**
8. Tab to CIP: **"Phase 2 also includes capital improvement pipelines — forward-looking intelligence."**
9. **Close:** "This entire pipeline runs automatically. Scrapers pull city council agendas, AI extracts contract data from the PDFs, and the dashboard updates. No manual entry."

---

## 7. PM Tab Assessment

**Current state:** The "PM Tracker" tab actually shows consultant firms grouped by award count, total value, active cities, and categories. This is a **Consultant Intelligence** view, not a PM tracker.

**Recommendation for demo:**
- The tab works well as-is and provides real value — showing which firms operate in which cities and categories is useful competitive intelligence.
- For the demo, lean into what it IS rather than what it's not. Call it "Consultant Tracker" or rename it to accurately reflect the content.
- Alternatively, keep the "PM Tracker" name and explain: "The structure is built — we extract firm-level data now, and we're adding individual PM extraction in Phase 2."

**Where PM data lives:** PM names appear in executed Professional Services Agreements (PSAs) — typically on the signature page or "Key Personnel" section. The Claude API prompt in `claude_client.py` would need a new extraction field.

---

## 8. What Would Make a Halff VP Say "I Need This for My Clients"

1. **Halff callout:** Executives want to see themselves in the data. Halff's 20 contracts should glow.
2. **The automation story:** "This refreshes automatically from city council meeting agendas. No one manually enters this data." This is the hook for the Applied Innovation practice proposal.
3. **Competitive positioning:** "We can see that Freese & Nichols has 48 awards to our 20. Here's where they're winning that we're not."
4. **Scale:** "11 cities, $373M, growing. And we can add more cities."
5. **Forward-looking:** CIP pipeline shows upcoming capital spend = where to focus BD efforts.

---

## Summary

The dashboard is already highly functional and analytically rich. The data tells a compelling story. The three items that would most improve the Monday demo are:

1. **Halff highlighting** — make Halff contracts visually distinct everywhere
2. **Re-run `build_dashboard_data.py`** the morning of the demo for fresh data
3. **Rename or reframe the PM Tracker tab** to match what it actually shows

Everything else is polish on an already strong product.
