# MMR Contract Intelligence Dashboard — Design Spec

**Date:** 2026-04-13
**Status:** Approved
**Replaces:** `docs/index.html` (existing JSON-backed dashboard)

## Overview

A single-page client-side dashboard for analyzing municipal engineering contract data across North Texas cities. Users drag-and-drop Excel workbooks (`*_contracts.xlsx`), and the dashboard renders interactive charts, a choropleth map, and filterable tables — all without a server.

## Deliverables

| File | Purpose |
|------|---------|
| `docs/index.html` | Complete dashboard — CSS + JS inline. Replaces existing file. |
| `docs/city_boundaries.js` | Embedded GeoJSON boundary polygons for North Texas cities. Loaded via `<script src>`. |
| `docs/assets/halff_logo.png` | Existing logo (unchanged). |

## Constraints

- No build tools, no npm, no React. Pure vanilla HTML/CSS/JS.
- Must work via `file://` — SheetJS reads files from `<input type="file">`, no server needed.
- All CDN loads from `cdnjs.cloudflare.com`.
- Dollar formatting: `Intl.NumberFormat('en-US', {style:'currency', currency:'USD'})` and shorthand `$XX.XM`.
- Responsive for 1920px monitor and laptop screens.
- Gracefully handle cities with no loaded data (gray on map, excluded from charts).

## CDN Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| SheetJS (xlsx.js) | v0.18.5 | Client-side Excel parsing |
| Chart.js | v4.4.0 | Bar, doughnut, scatter, time-series charts |
| Leaflet.js | v1.9.4 | Interactive choropleth map (JS + CSS) |

All loaded from `cdnjs.cloudflare.com`.

## Halff Brand Identity

**Colors:**
| Name | Hex | Usage |
|------|-----|-------|
| Blue | #1C355E | Primary dark / headers / nav |
| Seafoam | #68949E | Primary accent |
| Dark Blue | #002B3C | Deep backgrounds |
| Teal | #115E6B | Secondary accent / active states |
| Mint | #B7CECD | Light accent / hover states |
| Cool Gray | #D9DAE4 | Borders / subtle backgrounds |
| Salmon | #FC6758 | Highlights / alerts / call-to-action |
| Red | #9B3426 | Warnings |
| Plum | #6F2740 | Tertiary accent |

**Fonts:** Public Sans (primary, via Google Fonts), Arial as system fallback.

**Aesthetic:** Professional, clean, data-forward. Light background (`#F4F5F9`) with Halff Blue header/nav. Cards with subtle Cool Gray borders. Charts use brand-coordinated palette — Seafoam and Teal dominant, Salmon for emphasis, Plum and Dark Blue for additional series.

## Data Source

Each city has a `*_contracts.xlsx` file with a **Config** sheet as the canonical data source:

| Col | Header | Type |
|-----|--------|------|
| A | Year | Number |
| B | Date of Meeting | Date (Excel serial or string) |
| C | Awarded Engineering Company | String |
| D | Contract Amount | Number |
| E | Project Name | String |
| F | Project Type | String (normalized at load) |
| G | Length / Limits | String |
| H | Notes | String |
| I | Source File | String |
| J | City | String |
| K | PDF Link | String (URL) |
| L | Page # | Number |

Columns M+ are pipeline metadata — ignored during parsing.

### Project Type Normalization

Applied at parse time. Case-insensitive matching:

| Raw values | Normalized to |
|------------|---------------|
| roads, road, roadway | Roadway |
| planning, study, planning / study | Planning / Study |
| waterres, water resources, waterww, water/wastewater, water / wastewater | Water / Wastewater |
| parks, park, trail, park / trail | Park / Trail |
| traffic, signals, traffic & signals | Traffic & Signals |
| facilities, buildings, facilities & buildings | Facilities |
| survey, sue, survey & sue | Survey & SUE |
| cei, inspection, construction inspection | Construction Inspection |
| technology, gis, technology & gis | Technology & GIS |
| row, right of way | Right of Way |

Unrecognized values are title-cased and passed through.

### Current Cities (11)

Dallas, Fort Worth, McKinney, Frisco, Carrollton, Celina, Plano, Garland, Richardson, Lancaster, Grand Prairie.

More will be added over time. The dashboard dynamically adapts to whatever cities are loaded.

## Navigation Structure

Three tabs in the top nav bar:

| Tab | Status | Description |
|-----|--------|-------------|
| **Contract Intelligence** | Full build | Main dashboard — map, charts, filters, stats |
| **PM Tracker** | Scaffold | PM card grid, basic filters. Populated from loaded Excel data. |
| **CIP & Bonds** | Scaffold | "Coming Soon" placeholder with table/chart structure. Populated when CIP scraping is built. |

Each tab has its own filter context. Tab switching does not lose filter state.

## Contract Intelligence Tab

### Top Bar

- Background: Halff Blue (`#1C355E`)
- Halff logo (SVG or PNG)
- Title: "Municipal Market Research — Contract Intelligence"
- Inline summary stats: total contracts, total dollar value, cities loaded
- "Add City Data" button (to load more Excel files after initial load)
- "Export CSV" button

### Data Loading

- **First load:** Clean branded drop zone prompting user to select one or more `*_contracts.xlsx` files. Drag-and-drop or file picker.
- **After load:** Drop zone collapses. Dashboard renders immediately. "Add City Data" button in header for incremental loading.
- **Loading overlay:** Spinner + progress text ("Parsed 3 of 5 files...").
- **Demo mode:** "Load sample demo data" link generates synthetic data for testing.
- **Large dataset warning:** Banner when >10,000 rows.

### Filter Bar (below header)

- **View Mode toggle:** All Cities | Single City | Single Consultant
- **City selector:** Multi-select checkboxes with "All" toggle + count badge. Populated from loaded data.
- **Year filter:** Multi-select checkboxes (e.g. 2024, 2025, 2026).
- **Project Type filter:** Multi-select checkboxes (normalized names).
- **Consultant search:** Searchable text input. Prominent in Single Consultant view mode.
- **Reset Filters** button (Salmon `#FC6758` accent).
- All charts and map reactively update when any filter changes. Debounced at 150ms.

### Main Content — 2-Column Grid

Stacks to single column below ~1100px. Filter bar collapses to a compact dropdown panel below 700px.

#### Left Column — Charts

**1. Consultant Bar Chart (horizontal)**
- Top 15 consultants by total contract value within current filters.
- Dollar amounts on bars. Sorted descending.
- Seafoam/Teal gradient for bars.
- Click a bar → filters dashboard to that consultant.
- Per-chart PNG export button.

**2. Project Type Doughnut Chart**
- Distribution of contract dollars by normalized project type.
- Percentages shown on slices.
- Full brand palette (Seafoam, Teal, Plum, Salmon, Dark Blue, Mint, etc.).
- Click a slice → filters to that project type.
- Per-chart PNG export button.

**3. Contracts Over Time**
- Quarterly grouped/stacked bar showing contract value over time.
- Stack by project type in All Cities / Single City mode.
- Group by city when multiple cities are selected.
- Per-chart PNG export button.

**4. Consultant Scatter Plot**
- Each consultant as a dot: x = number of contracts, y = total dollar value, dot size = average contract size.
- Helps spot who gets many small contracts vs few large ones.
- Tooltip shows consultant name, count, total, average.
- Per-chart PNG export button.

**5. Category Heatmap by City** (adopted from existing)
- Full-width table: cities as rows, project types as columns.
- Cells color-scaled by dollar value (light → dark using brand colors).
- Sticky header row and first column.
- CSV export button.

**6. Average Contract Size Over Time** (adopted from existing)
- Line chart showing mean contract value per year.
- Trend badge (up/down %) comparing latest year to prior.
- Per-chart PNG export button.

**7. Year-over-Year Growth Rate** (adopted from existing)
- Bar chart of % change in total contract value vs prior year.
- Positive bars use Teal, negative bars use Salmon.
- Per-chart PNG export button.

**8. New vs Repeat Consultants** (adopted from existing)
- Stacked bar by year: first-time firms vs returning firms.
- Helps reveal market openness vs incumbency.
- Per-chart PNG export button.

#### Right Column — Map + Summary Cards

**9. City Boundary Choropleth Map**

Leaflet map centered on North Texas (~33.1N, -96.8W, zoom ~10).

City boundary polygons for:
- **Data cities (11):** Dallas, Fort Worth, McKinney, Frisco, Carrollton, Celina, Plano, Garland, Richardson, Lancaster, Grand Prairie
- **Neighbor cities (neutral gray, no data):** Prosper, Allen, Anna, Murphy, Wylie, Sachse, Rowlett, Lewisville, Flower Mound, Denton, The Colony, Little Elm, Fairview, Lucas

Green choropleth fill based on total contract value within current filters:
- $0 / no data = light neutral gray (`#e0e0e0`)
- Lowest value = pale green (`#e8f5e9`)
- Highest value = deep green (`#1b5e20`)
- Scale dynamically based on filtered dataset's min/max

City name labels centered on each polygon.

**Hover tooltip:** City name, total contract value, contract count.

**Click behavior:** Clicking a city polygon filters the entire dashboard to that city.

**Auto-updates** colors and values when any filter changes.

**10. Summary Stat Cards** (below the map)

- Total contract value (formatted $XX.XM)
- Number of contracts
- Unique consultants
- Average contract size
- Top consultant + their % share
- Top project type + its % share

White cards with Seafoam left-border accents.

### Chart Interactivity

- Click a consultant bar → filters dashboard to that consultant
- Click a doughnut slice → filters to that project type
- Click a city on the map → filters to that city
- All filters are additive and reflect in every chart + map simultaneously
- Smooth Chart.js transitions on updates (400ms animation)

### Footer

- Dark Blue (`#002B3C`) background
- Data freshness date, file count, total contract count
- "Generated by Halff Municipal Market Research Pipeline"

## PM Tracker Tab (Scaffold)

Populated from the same loaded Excel data. Groups contracts by consultant (company field).

**Filters:** City dropdown, Category dropdown, Name/firm search text input.

**Content:** Card grid. Each card shows:
- Consultant name
- Firm
- Award count
- Total value
- Cities active in
- Categories worked

**Status:** Basic scaffold — functional but minimal styling. To be fleshed out later.

## CIP & Bonds Tab (Scaffold)

**Status:** Placeholder. Displays "Coming Soon — CIP data scraping is under development" message.

**Structure in place:**
- Filter dropdowns (city, category, bond year) — disabled/empty
- Table skeleton (city, project, category, year, funded amount, status)
- Stacked bar chart placeholder (funding by category over time)

Will be populated when CIP scraping pipeline is built.

## GeoJSON Boundaries (`city_boundaries.js`)

Separate file loaded via `<script src="city_boundaries.js">`.

Exports a global `CITY_BOUNDARIES` object: `{ type: "FeatureCollection", features: [...] }`.

Each feature has:
- `properties.name` — city name (matching what appears in Excel data)
- `properties.label` — display name
- `geometry` — simplified MultiPolygon or Polygon coordinates

**Cities included (25):**
- 11 data cities + 14 neighbor cities (listed above)
- Approximate municipal boundaries — simplified for performance, not survey-grade

Coordinates sourced from Census TIGER/Line shapefiles, simplified to reduce file size.

## Utilities Adopted from Existing Dashboard

- `escHtml()` — XSS protection for dynamic content
- `fmtMoney()` / `fmtMoneyFull()` — Dollar formatting (short and full)
- `parseExcelDate()` — Handles Excel serial dates and string dates
- `cityFromFilename()` — Derives city name from filename
- `groupBy()`, `sumBy()`, `unique()` — Data aggregation helpers
- `lerpColor()`, `contrastColor()` — Color interpolation for heatmap
- `destroyChart()` — Safe Chart.js instance cleanup
- Debounced filter rendering (150ms `scheduleRender()`)

## Responsive Breakpoints

| Width | Behavior |
|-------|----------|
| > 1100px | 2-column grid (charts left, map+stats right), full filter bar |
| 700–1100px | Single column, charts stack, map goes full width, filter bar horizontal |
| < 700px | Filter bar collapses to dropdown panel, compact single-column layout |
