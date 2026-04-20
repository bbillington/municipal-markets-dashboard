# Municipal Market Research Dashboard — 2026-04-20 Meeting Cheat Sheet

## Headline numbers

| | Value |
|---|---|
| Total contracts tracked | **905** |
| Total value | **$592.8M** |
| DFW cities covered | **10** |
| Consultants competing | **212** |
| **Halff rank** | **#2 of 212** |
| **Halff market share** | **9.0%** ($53.3M / 48 contracts) |
| Data period | **2023–Q2 2026** |

## Top 5 firms (all legitimate engineering)

| Rank | Firm | Contracts | Total value |
|---|---|---|---|
| 1 | Kimley-Horn and Associates | 98 | $59.3M |
| 2 | **Halff Associates** | 48 | $53.3M |
| 3 | Freese and Nichols | 80 | $42.6M |
| 4 | Garver, LLC | — | $34.9M |
| 5 | HDR Engineering | 49 | $24.1M |

## What's on each tab

### Contract Intelligence (default view)
- Filter bar at top — cities, years, categories, consultants
- Outlier banner (runtime excludes): 134 contracts filtered — duplicates, remaining architecture hits, non-engineering
- KPI row: total contracts, total value, cities, consultants
- Halff Scorecard: rank, market share, total value, cities active
- 12 charts: Top-10 consultant bar, Value Over Time, Category Doughnut, City Bar, Consultant Profile (scatter), Category × City Heatmap, Quarterly Growth, New vs Repeat, Cumulative Spend, City × Quarter, Market Share Evolution, Avg Contract Size
- Interactive DFW map (circles + boundary fill)
- Contract Detail table at bottom

### Consultant Intel
- 212 firm cards, sorted by contract count
- Each card: contracts, total value, avg, cities, categories, known PMs
- Filter by city / category / name search

### Budgets & Bonds
- "Coming Soon" placeholder — intentional. Future home for CIP budget data vs awarded contract data.

### My View
- User-curated custom layout. User picks which charts to see together.

## Things to point at if asked

**"Why is Halff #2?"** — Kimley-Horn has more contracts (98 vs 48) and higher total despite 48 contracts being spread well. Halff has the highest avg contract value in the top 5.

**"Why do contracts per year drop in 2026?"** — We're only 4 months into 2026. The Quarterly Growth Rate chart excludes the in-progress quarter so it doesn't show as a false "-70% drop".

**"What does 'outliers removed' mean?"** — Architecture firms (Perkins & Will, Gensler, KAI, HKS etc.), construction/PM firms (Jacobs PM, KIK Underground), and duplicates. All filtered because they're not engineering consultants. Full list in the banner's expand-for-details.

**"How is this data collected?"** — Automated scrapers pull Council agenda packets from each city's portal nightly. Claude Haiku extracts contract awards from the PDFs. Output lands in Excel files per city, then regenerates this dashboard.

**"How current is the data?"** — Shows `generated` timestamp in the JSON. Nightly pipeline. Current as of today's morning run plus in-session updates.

**"Can I filter?"** — Yes, any combination of:
- Cities (click Cities dropdown in filter bar)
- Years (2023–2026)
- Contract categories (17: Roadway, Planning, Water/Wastewater, etc.)
- Consultants (search or pick)
- Combinations: e.g., "Halff only + Roadway only" → 12 contracts across 5 cities

**"Can I expand a chart to fullscreen?"** — Yes, every chart card has an expand button in the top-right. ESC or click the scrim to close.

**"Why doesn't the map change when I filter to one city?"** — By design. The map shows all DFW context so you can see where selected firms/categories are active across the region, not just inside your city filter. Single-city filter outlines that city in salmon as a UI cue.

## What's deferred (next iteration)

- **Live xlsx → dashboard** (currently rebuilt nightly; user wants dynamic reload)
- **Richardson Bid Log scraper** — Richardson uses Sec. 2-52(d) admin authority, so Council packets are almost empty. The Bid Log on cor.net has the formal solicitations but missing staff reports.
- **Legistar per-item attachments** — Cities like Carrollton store staff-report attachments separately from the main packet. Current scraper misses them, so some contract detail (per-firm splits on multi-firm awards) isn't available.
- **OCR rerun of 97 skipped scanned PDFs** — running in background now. Frisco adds 63, McKinney 12, others smaller. Data will grow during/after meeting.

## Data hygiene caveats (transparency, not blockers)

- Hebron Parkway (Carrollton 2025): Garver/Huitt/Halff joint $6.49M contract. Individual amounts confirmed for Huitt ($2.385M via Dec 2025 amendment) and Halff ($2.018M via internal records). Garver = residual $2.084M.
- ~5-10 rows with `amount unknown` on the dashboard — these are awards where Claude extracted the firm + project but the Council resolution didn't state the award value (common for RFQ shortlists / CMAR selections where dollar figure is negotiated post-Council).
- "Duplicates" banner is the runtime safety net. Most genuine duplicates get caught by the processor's hard-dedup at Excel-write time. The banner shows what slipped through.

## Version

**v2.7** (2026-04-20) — pushed to https://github.com/bbillington/Municipal-Market-Research
