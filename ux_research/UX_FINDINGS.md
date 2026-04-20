# UX Research Findings: Municipal Market Research Dashboard
## Competitive Analysis — April 2026

### Sources Analyzed (15 sites, 27 screenshots)
| # | Site | Type | Key Takeaway |
|---|------|------|-------------|
| 1 | USAspending.gov/explorer | Gov spending | Treemap + breadcrumb drill-down, fiscal year selector |
| 2 | USAspending.gov/explorer/agency | Gov spending | Left sidebar filters + right content split, big KPI ($4.4T) |
| 3 | Redfin US Housing Market | Market data | Tab navigation (Overview/Supply/Demand), inline metric dropdowns |
| 4 | Zillow Research | Market data | Secondary nav tabs (Data/Market Explorer/Renters/Affordability) |
| 5 | Geckoboard Dashboard Examples | SaaS dashboards | Dark bg, massive KPI numbers, comparison deltas (^16% vs last month) |
| 6 | Databox Dashboard Templates | SaaS dashboards | 300+ templates organized by category, clean card layout |
| 7 | Dribbble Analytics Dashboards | Design gallery | Left sidebar nav, KPI cards with sparklines, white/clean layouts |
| 8 | Dribbble KPI Dashboards | Design gallery | Colored KPI pills, icon-label format, trend arrows |
| 9 | Behance Business Analytics | Design gallery | "Welcome, CEO" pattern, sidebar nav, 5-metric KPI strip |
| 10 | Treasury Fiscal Data | Gov data | Narrative + data pattern ("has *spent* $3.65 trillion"), YoY comparison lines |
| 11 | Power BI Embedded | BI tool | Cross-filtering between visuals, slicer panels |
| 12 | SaaSFrame Dashboard Examples | Real SaaS UIs | Wise, Stripe, Mintlify — sidebar + KPI cards + sparklines |
| 13 | Muzli 2026 Dashboard Trends | Design trends | Dark mode dominance, glassmorphism, 2-3 accent colors max |
| 14 | Improvado Dashboard Design Guide | Best practices | 40-30-20-10 space rule, F-pattern layout, filter guidance |
| 15 | ENR Top 500 Design Firms | AEC industry | Ranked table format for engineering firm comparisons |

---

## CRITICAL GAPS: What We're Missing

### 1. TREND INDICATORS ON KPI CARDS (Priority: HIGH)
**Every top dashboard** shows directional indicators on KPIs:
- Geckoboard: "^16% vs last month"
- Dribbble designs: Green up-arrow with "+12.5%"
- Stripe dashboard: Sparkline micro-charts inside KPI cards
- Treasury Fiscal Data: Current year vs prior year line overlay

**Our gap:** Our KPI cards (494 contracts, $213.1M, 6 cities, 20 consultants) are static numbers with no context. A CEO asks: "Is this good? Better or worse than last year?"

**Fix:** Add YoY comparison to each KPI card:
- "494 contracts (+18% vs 2025)"
- "$213.1M total (+$42M vs 2025)"
- Small sparkline or trend arrow beside each number

### 2. FILTER STATE VISIBILITY (Priority: HIGH)
**Best practice:** Applied filters shown as removable chips above the data area.

**Our gap:** When a user selects "Frisco" from the city dropdown, there's no persistent visual indicator of the active filter state. Users forget what's filtered and misinterpret the data.

**Fix:** Add a filter chip bar below the filter row:
```
[x Frisco] [x Roadway] [Clear All]
```

### 3. HORIZONTAL BAR CHARTS FOR LONG LABELS (Priority: MEDIUM)
**Best practice:** When category labels are long ("Construction Inspection Services", "Right of Way Acquisition"), use horizontal bars. Vertical bars force rotated text that's hard to read.

**Our gap:** The consultant bar chart has long company names that get truncated or rotated.

**Fix:** Switch the top consultant chart from vertical to horizontal bars. Keep "Contracts Over Time" vertical since dates are short.

### 4. NARRATIVE CONTEXT / EXECUTIVE SUMMARY (Priority: HIGH)
**Treasury Fiscal Data pattern:** Bold headline statement before the chart: "In fiscal year 2026, the federal government has *spent* $3.65 trillion."

**Our gap:** Charts appear without context. The CEO has to interpret every chart alone.

**Fix:** Add a 1-sentence narrative summary at the top of the dashboard:
> "In 2025-2026, DFW municipalities awarded **$213M** in engineering contracts across **6 cities**. Halff ranks **#9 of 20 firms** with **$9.5M** (4.4% market share)."

### 5. DATE RANGE FILTER (Priority: MEDIUM)
**Every dashboard analyzed** offers date range selection:
- USAspending: Fiscal year + quarter selector
- Redfin: Time period dropdown
- Power BI: Date slicer

**Our gap:** We have year filter checkboxes but no quick date range presets.

**Fix:** Add preset buttons: "Last 12 Months" | "2025" | "2024" | "All Time" as pill toggles above the year checkboxes.

### 6. CHART SECTION GROUPING (Priority: MEDIUM)
**Best practice (Improvado 40-30-20-10 rule):**
- 40% of screen: Primary metric (our case: total contracts + market share)
- 30%: Secondary KPIs (consultants bar, category doughnut)
- 20%: Trend context (over time charts)
- 10%: Navigation/filters

**Our gap:** All 11 charts are presented in a single long scroll with equal visual weight. No grouping, no hierarchy. The CEO has to scroll through 10+ screens to find what matters.

**Fix:** Group charts into labeled sections with subtle dividers:
- **Market Overview** (KPIs + consultant bar + category doughnut)
- **Trends & Growth** (over time, YoY, market share evolution)
- **Competitive Intelligence** (scatter, size distribution, cumulative spend)
- **Contract Detail** (table + map)

### 7. CHART TITLE + INSIGHT PATTERN (Priority: LOW)
**Dribbble/Behance pattern:** Every chart has a title (left) and a quick-action control (right), plus a one-line insight subtitle.

**Our gap:** Chart titles exist but are plain. No subtitle explaining what the chart shows or why it matters.

**Fix:** Add insight subtitles:
- "Top Consultants by Awards" → subtitle: "Sorted by contract count. Halff highlighted in salmon."
- "Market Share Evolution" → subtitle: "Top 5 firms' share of annual spend over time"

---

## CLUTTER & CLUNKINESS ISSUES

### 1. Filter Bar is Visually Heavy
The multi-row filter area (Year, City, Category, Type, Amount Range + Reset) takes up significant vertical space. Compare to Redfin's single-line dropdown approach.

**Fix:** Collapse into a single horizontal row with compact dropdowns. Move "Reset Filters" to the end of the row, not below.

### 2. Too Many Charts Visible at Once
11 charts in a single scroll = cognitive overload. The Geckoboard TV dashboard principle: "every pixel must earn its place."

**Fix:** Consider showing 4-6 charts by default with a "Show More Analytics" expandable section for the remaining 5-6. Or use the section grouping approach from #6 above.

### 3. Table is Buried at the Bottom
The Top Contracts table is one of the most actionable views (shows specific deals, companies, amounts) but it's below 8 charts requiring extensive scrolling.

**Fix:** Elevate the table. Either:
- Add a "Jump to Table" quick link in the nav
- Or split into "Charts" and "Table" sub-tabs within Contract Intelligence

### 4. Map Adds Little Value in Current Form
The Leaflet map shows city boundaries but provides no interactive drill-down. Compare to USAspending's treemap which communicates proportions instantly.

**Fix:** Either enhance the map with proportional circles (size = contract value) or replace with a treemap showing city spending proportions. The treemap would be more CEO-friendly.

### 5. Doughnut Chart Center is Wasted Space
The category doughnut has an empty center. Premium dashboards use this space for the total.

**Fix:** Add total value or contract count in the doughnut center: "$213.1M" or "494 contracts"

---

## FEATURES TO ADD (ordered by CEO impact)

| Feature | Effort | Impact | Source Inspiration |
|---------|--------|--------|--------------------|
| KPI trend indicators (+12% YoY) | Medium | Very High | Geckoboard, Stripe, Dribbble |
| Executive summary sentence | Low | Very High | Treasury Fiscal Data |
| Filter chips (applied filter badges) | Low | High | PatternFly, SaaS dashboards |
| Chart section grouping with headers | Low | High | Improvado 40-30-20-10 rule |
| Date range presets | Medium | Medium | USAspending, Redfin |
| Horizontal consultant bar chart | Low | Medium | Domo, bar chart best practices |
| Doughnut center label | Low | Medium | Power BI, Tableau defaults |
| Chart insight subtitles | Low | Medium | Dribbble, Behance designs |
| "Jump to" quick links or section nav | Low | Medium | USAspending breadcrumbs |
| Presentation mode (hide nav, enlarge) | Medium | Medium | Geckoboard TV dashboards |
| Treemap for city spending | High | Medium | USAspending treemap |
| Sparklines in KPI cards | High | Medium | Stripe, SaaSFrame examples |

---

## DESIGN PRINCIPLES TO ADOPT

1. **F-Pattern Layout**: Most important metric top-left (total contracts), secondary metrics scan right, details below
2. **40-30-20-10 Rule**: 40% primary, 30% secondary, 20% trends, 10% nav/filters
3. **2-3 Accent Colors Max**: We already do this well (salmon for Halff, teal gradient for others)
4. **Numbers Need Context**: Every number should answer "compared to what?"
5. **Progressive Disclosure**: Show summary first, detail on demand
6. **White Space is a Feature**: Don't fill every pixel — breathing room makes data scannable
7. **Sort by Value, Not Alphabet**: Bar charts sorted descending by value, not A-Z

## Screenshots Reference
All 27 screenshots saved in `docs/ux_research/` for future reference.
