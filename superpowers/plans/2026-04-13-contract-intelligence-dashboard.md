# MMR Contract Intelligence Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side contract intelligence dashboard that reads Excel workbooks via drag-and-drop and renders interactive charts, a choropleth map, and filterable tables — no server required.

**Architecture:** Single `index.html` with all CSS and JS inline, plus a separate `city_boundaries.js` for GeoJSON data. CDN libraries (SheetJS, Chart.js, Leaflet) loaded from cdnjs.cloudflare.com. State managed via a global `STATE` object. Filter changes trigger debounced re-render of all charts and map. Three nav tabs: Contract Intelligence (full), PM Tracker (scaffold), CIP & Bonds (scaffold).

**Tech Stack:** Vanilla HTML/CSS/JS, SheetJS v0.18.5, Chart.js v4.4.0, Leaflet.js v1.9.4, Google Fonts (Public Sans).

**Spec:** `docs/superpowers/specs/2026-04-13-contract-intelligence-dashboard-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `docs/index.html` | Complete dashboard. Replaces existing. Contains all CSS in a `<style>` block and all JS in a `<script>` block. ~2000-2500 lines. |
| `docs/city_boundaries.js` | GeoJSON FeatureCollection for 25 North Texas cities. Loaded via `<script src>`. Assigns to `window.CITY_BOUNDARIES`. ~3000-5000 lines of coordinate data. |
| `docs/assets/halff_logo.png` | Existing logo. No changes. |

The HTML file is organized into clearly commented sections:
1. `<head>` — meta, fonts, CDN links, `<style>` block
2. `<body>` — nav, tab panels (3), drop zone, loading overlay, footer
3. `<script>` — constants, state, helpers, data loading, filters, KPIs, map, charts (8), exports, PM tracker, CIP scaffold, event listeners

---

## Task 1: GeoJSON City Boundaries File

**Files:**
- Create: `docs/city_boundaries.js`

This is a pure data file. It must contain simplified polygon boundaries for 25 North Texas cities. The coordinates come from Census TIGER/Line shapefiles, simplified to ~50-100 vertices per city for performance.

- [ ] **Step 1: Create `city_boundaries.js` with the FeatureCollection structure**

The file assigns a global variable. Each feature has `properties.name` (matching Excel city names), `properties.label` (display name), and `geometry` (Polygon or MultiPolygon).

```javascript
// docs/city_boundaries.js
// Simplified municipal boundary polygons for North Texas cities.
// Source: Census TIGER/Line, simplified for dashboard use.
window.CITY_BOUNDARIES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Frisco', label: 'Frisco' },
      geometry: {
        type: 'Polygon',
        coordinates: [[ /* [lng, lat] pairs forming the boundary */ ]]
      }
    },
    // ... 24 more cities
  ]
};
```

The 25 cities to include with their `name` property values (must match what appears in the Excel `City` column or the `cityFromFilename()` derivation):

**Data cities (11):** `Dallas`, `Fort Worth`, `McKinney`, `Frisco`, `Carrollton`, `Celina`, `Plano`, `Garland`, `Richardson`, `Lancaster`, `Grand Prairie`

**Neighbor cities (14):** `Prosper`, `Allen`, `Anna`, `Murphy`, `Wylie`, `Sachse`, `Rowlett`, `Lewisville`, `Flower Mound`, `Denton`, `The Colony`, `Little Elm`, `Fairview`, `Lucas`

Source the actual coordinates by fetching simplified boundaries from the Census TIGER/Line cartographic boundary API or by downloading and simplifying the Texas places shapefile. Each city needs an outer ring of `[longitude, latitude]` coordinate pairs forming a closed polygon (first point = last point). Simplify to ~50-100 vertices per city. The total file should be under 500KB.

- [ ] **Step 2: Verify the GeoJSON is valid**

Open browser console, load the file via `<script>`, and check:

```javascript
// Verify in console after loading
console.log(CITY_BOUNDARIES.features.length); // Should be 25
CITY_BOUNDARIES.features.forEach(f => {
  console.log(f.properties.name, f.geometry.coordinates[0].length, 'vertices');
});
```

- [ ] **Step 3: Commit**

```bash
git add docs/city_boundaries.js
git commit -m "feat: add GeoJSON city boundaries for 25 North Texas cities"
```

---

## Task 2: HTML Skeleton + Full CSS

**Files:**
- Create: `docs/index.html` (replaces existing — back up first)

Build the complete HTML structure and all CSS. No JavaScript yet — just the static shell with all three tab panels, the drop zone, loading overlay, and footer.

- [ ] **Step 1: Back up the existing dashboard**

```bash
cp docs/index.html docs/index.html.bak
```

- [ ] **Step 2: Write the HTML `<head>` and CSS**

Create `docs/index.html` with:
- DOCTYPE, charset, viewport meta
- Google Fonts link (Public Sans weights 200, 300, 400, 600, 700)
- CDN script tags for SheetJS, Chart.js, Leaflet (JS + CSS)
- `<script src="city_boundaries.js"></script>`
- Complete `<style>` block with all CSS

```html
<!DOCTYPE html>
<html lang="en" style="color-scheme: light;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Municipal Market Research — Contract Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@200;300;400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script src="city_boundaries.js"></script>
```

CSS variables (`:root` block):
```css
:root {
  --blue:      #1C355E;
  --seafoam:   #68949E;
  --dark:      #002B3C;
  --teal:      #115E6B;
  --mint:      #B7CECD;
  --cool-gray: #D9DAE4;
  --salmon:    #FC6758;
  --red:       #9B3426;
  --plum:      #6F2740;
  --white:     #FFFFFF;
  --bg:        #F4F5F9;
  --shadow:    0 2px 8px rgba(0,43,60,.10);
  --shadow-md: 0 4px 16px rgba(0,43,60,.12);
  --radius:    8px;
  --nav-h:     56px;
  --filter-h:  auto;
}
```

The CSS must include styles for all of these sections (carry forward the design patterns from the existing dashboard — see `docs/index.html.bak` for reference):

1. **Reset & base** — box-sizing, margin/padding reset, body font, background
2. **Nav bar** — `#1C355E` background, sticky top, flex layout, logo, title, inline stats, buttons
3. **Nav tabs** — tab buttons in the nav bar, active state with bottom border
4. **Tab panels** — `.tab-panel` hidden by default, `.tab-panel.active` visible
5. **Drop zone** — centered, dashed border `#68949E`, hover/drag-over states, upload icon SVG, browse button
6. **Loading overlay** — fixed, semi-transparent backdrop, spinner animation, progress text
7. **Filter bar** — below nav, `#FFFFFF` background, horizontal flex with wrapping, view mode toggle, multi-select groups, reset button
8. **Filter controls** — `.filter-group` with label, `.check-list` with scrollable checkboxes, `.check-all-row`, `.filter-badge` count, consultant search input
9. **2-column grid** — `#content-grid` with `grid-template-columns: 1fr 380px`, gap 20px
10. **Chart cards** — white background, border-radius, shadow, chart title/subtitle, export button, canvas wrapper
11. **Map container** — `#map` height 450px, border-radius, within a chart card
12. **Stat cards** — grid of 6 small cards below map, white bg, seafoam left border
13. **KPI row** — 4 cards across the top of the dashboard, same pattern as existing
14. **Heatmap table** — sticky headers, color-scaled cells
15. **PM Tracker** — card grid, filter bar (simpler), PM cards with stats
16. **CIP scaffold** — placeholder message, disabled filter dropdowns, table skeleton
17. **Footer** — `#002B3C` background, centered text
18. **Responsive** — `@media (max-width: 1100px)` single column, `@media (max-width: 700px)` compact
19. **Scrollbars** — thin custom scrollbar styling
20. **Trend badge** — positioned absolute, green up / red down

- [ ] **Step 3: Write the HTML `<body>` structure**

The body contains these elements in order:

```html
<body>
<!-- NAV BAR -->
<nav id="nav">
  <div class="nav-logo-wrap">
    <svg class="nav-logo-svg" viewBox="0 0 90 32" ...>
      <rect width="90" height="32" rx="3" fill="#1C355E"/>
      <text x="8" y="22" ...>HALFF</text>
    </svg>
  </div>
  <span class="nav-title">Municipal Market Research</span>
  <div class="nav-stats" id="nav-stats"><!-- filled by JS --></div>
  <div class="nav-tabs">
    <button class="nav-tab active" data-tab="contracts">Contract Intelligence</button>
    <button class="nav-tab" data-tab="pm">PM Tracker</button>
    <button class="nav-tab" data-tab="cip">CIP & Bonds</button>
  </div>
  <button id="btn-add-data" style="display:none;">+ Add City Data</button>
  <button id="btn-export-csv">Export CSV</button>
  <input type="file" id="file-input-add" accept=".xlsx" multiple style="display:none;">
</nav>

<!-- DROP SCREEN (shown before data loaded) -->
<div id="drop-screen">
  <div id="drop-zone" role="button" tabindex="0">
    <svg width="64" height="64" ...><!-- upload icon --></svg>
    <div class="drop-title">Drop Excel files here</div>
    <div class="drop-sub">One .xlsx file per city &middot; all years merged automatically</div>
    <button id="btn-browse">Browse Files</button>
    <input type="file" id="file-input" accept=".xlsx" multiple style="display:none;">
    <div class="demo-link" id="demo-link">Or load sample demo data</div>
  </div>
</div>

<!-- LOADING OVERLAY -->
<div id="loading-overlay">
  <div class="spinner"></div>
  <div class="loading-text" id="loading-text">Parsing Excel files...</div>
</div>

<!-- ═══════════ TAB: CONTRACT INTELLIGENCE ═══════════ -->
<div class="tab-panel active" id="tab-contracts" style="display:none;">

  <!-- FILTER BAR -->
  <div id="filter-bar">
    <div class="filter-group">
      <div class="filter-label">View Mode</div>
      <div class="view-mode-toggle">
        <button class="vm-btn active" data-mode="all">All Cities</button>
        <button class="vm-btn" data-mode="city">Single City</button>
        <button class="vm-btn" data-mode="consultant">Single Consultant</button>
      </div>
    </div>
    <div class="filter-group" id="fg-cities">
      <div class="filter-label">Cities <span class="filter-badge" id="city-badge">0</span></div>
      <label class="check-all-row"><input type="checkbox" id="city-all" checked> All Cities</label>
      <div class="check-list" id="city-list"></div>
    </div>
    <div class="filter-group" id="fg-years">
      <div class="filter-label">Years <span class="filter-badge" id="year-badge">0</span></div>
      <label class="check-all-row"><input type="checkbox" id="year-all" checked> All Years</label>
      <div class="check-list" id="year-list"></div>
    </div>
    <div class="filter-group" id="fg-types">
      <div class="filter-label">Project Types <span class="filter-badge" id="type-badge">0</span></div>
      <label class="check-all-row"><input type="checkbox" id="type-all" checked> All Types</label>
      <div class="check-list" id="type-list"></div>
    </div>
    <div class="filter-group" id="fg-consultant">
      <div class="filter-label">Consultant</div>
      <input type="text" class="consultant-search" id="consultant-search" placeholder="Search consultant...">
      <div class="search-hint" id="search-hint"></div>
    </div>
    <button id="btn-reset-filters">Reset Filters</button>
  </div>

  <!-- LARGE DATASET BANNER -->
  <div class="banner" id="large-banner"></div>

  <!-- KPI ROW -->
  <div id="kpi-row">
    <div class="kpi-card"><div class="kpi-icon"><!-- svg --></div><div class="kpi-body"><div class="kpi-value" id="kpi-contracts">--</div><div class="kpi-label">Total Contracts</div></div></div>
    <div class="kpi-card"><div class="kpi-icon"><!-- svg --></div><div class="kpi-body"><div class="kpi-value" id="kpi-value">--</div><div class="kpi-label">Total Value</div></div></div>
    <div class="kpi-card"><div class="kpi-icon"><!-- svg --></div><div class="kpi-body"><div class="kpi-value" id="kpi-cities">--</div><div class="kpi-label">Cities</div></div></div>
    <div class="kpi-card"><div class="kpi-icon"><!-- svg --></div><div class="kpi-body"><div class="kpi-value" id="kpi-consultants">--</div><div class="kpi-label">Consultants</div></div></div>
  </div>

  <!-- 2-COLUMN GRID -->
  <div id="content-grid">

    <!-- LEFT: CHARTS -->
    <div id="chart-col">
      <!-- Chart 1: Consultant Bar -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Top Consultants by Contract Value</div>
          <div class="chart-subtitle">Top 15 firms by total dollar value</div></div>
          <button class="btn-export-chart" data-chart="chartConsultantBar">PNG</button>
        </div>
        <div class="chart-wrap"><canvas id="chartConsultantBar"></canvas></div>
      </div>

      <!-- Chart 2: Project Type Doughnut -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Contract Value by Project Type</div>
          <div class="chart-subtitle">Distribution of dollars by category</div></div>
          <button class="btn-export-chart" data-chart="chartTypeDoughnut">PNG</button>
        </div>
        <div class="chart-wrap"><canvas id="chartTypeDoughnut"></canvas></div>
      </div>

      <!-- Chart 3: Contracts Over Time -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Contracts Over Time</div>
          <div class="chart-subtitle">Quarterly contract value, stacked by type</div></div>
          <button class="btn-export-chart" data-chart="chartOverTime">PNG</button>
        </div>
        <div class="chart-wrap"><canvas id="chartOverTime"></canvas></div>
      </div>

      <!-- Chart 4: Consultant Scatter -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Consultant Profile</div>
          <div class="chart-subtitle">Count vs value &middot; dot size = average contract</div></div>
          <button class="btn-export-chart" data-chart="chartScatter">PNG</button>
        </div>
        <div class="chart-wrap"><canvas id="chartScatter"></canvas></div>
      </div>

      <!-- Chart 5: Category Heatmap (full-width) -->
      <div class="chart-card chart-full">
        <div class="chart-header">
          <div><div class="chart-title">Category Heatmap by City</div>
          <div class="chart-subtitle">Total investment per city x category &middot; darker = higher spend</div></div>
          <button class="btn-export-chart" data-export="heatmap-csv">CSV</button>
        </div>
        <div id="heatmap-wrap"><table id="heatmap-table"></table></div>
      </div>

      <!-- Chart 6: Avg Contract Size -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Average Contract Size Over Time</div>
          <div class="chart-subtitle">Mean deal size per year</div></div>
          <button class="btn-export-chart" data-chart="chartAvgSize">PNG</button>
        </div>
        <div class="chart-wrap" style="position:relative;">
          <canvas id="chartAvgSize"></canvas>
          <div class="trend-badge" id="trend-badge"></div>
        </div>
      </div>

      <!-- Chart 7: YoY Growth -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Year-over-Year Growth Rate</div>
          <div class="chart-subtitle">% change in total value vs prior year</div></div>
          <button class="btn-export-chart" data-chart="chartYoY">PNG</button>
        </div>
        <div class="chart-wrap"><canvas id="chartYoY"></canvas></div>
      </div>

      <!-- Chart 8: New vs Repeat -->
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">New vs Repeat Consultants</div>
          <div class="chart-subtitle">First-time vs returning firms by year</div></div>
          <button class="btn-export-chart" data-chart="chartNewRepeat">PNG</button>
        </div>
        <div class="chart-wrap"><canvas id="chartNewRepeat"></canvas></div>
      </div>
    </div>

    <!-- RIGHT: MAP + STATS -->
    <div id="map-col">
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Contract Value by City</div>
          <div class="chart-subtitle">Click a city to filter dashboard</div></div>
        </div>
        <div id="map"></div>
      </div>

      <!-- Summary Stat Cards -->
      <div id="stat-cards">
        <div class="stat-card"><div class="stat-label">Total Value</div><div class="stat-value" id="stat-total">--</div></div>
        <div class="stat-card"><div class="stat-label">Contracts</div><div class="stat-value" id="stat-count">--</div></div>
        <div class="stat-card"><div class="stat-label">Consultants</div><div class="stat-value" id="stat-firms">--</div></div>
        <div class="stat-card"><div class="stat-label">Avg Size</div><div class="stat-value" id="stat-avg">--</div></div>
        <div class="stat-card"><div class="stat-label">Top Consultant</div><div class="stat-value" id="stat-top-firm">--</div></div>
        <div class="stat-card"><div class="stat-label">Top Type</div><div class="stat-value" id="stat-top-type">--</div></div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════ TAB: PM TRACKER ═══════════ -->
<div class="tab-panel" id="tab-pm" style="display:none;">
  <div id="pm-filter-bar">
    <div class="filter-group">
      <div class="filter-label">City</div>
      <select id="pm-f-city"><option value="">All Cities</option></select>
    </div>
    <div class="filter-group">
      <div class="filter-label">Category</div>
      <select id="pm-f-cat"><option value="">All Categories</option></select>
    </div>
    <div class="filter-group">
      <div class="filter-label">Search</div>
      <input type="text" id="pm-f-name" class="consultant-search" placeholder="Search name or firm...">
    </div>
    <button id="pm-btn-reset" class="btn-reset-small">Reset</button>
  </div>
  <div id="pm-grid"></div>
  <div id="pm-empty" style="display:none;text-align:center;padding:60px;color:var(--seafoam);">
    No PM data available. Load Excel files first.
  </div>
</div>

<!-- ═══════════ TAB: CIP & BONDS ═══════════ -->
<div class="tab-panel" id="tab-cip" style="display:none;">
  <div class="cip-placeholder">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#EEF1F7"/>
      <path d="M20 44V20h24v24H20z" stroke="#68949E" stroke-width="2" fill="none"/>
      <path d="M28 32h8M32 28v8" stroke="#68949E" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <h3>CIP & Bonds</h3>
    <p>Coming Soon &mdash; CIP data scraping is under development.</p>
  </div>
  <div id="cip-filters" style="display:none;">
    <select id="cip-city" disabled><option>City</option></select>
    <select id="cip-cat" disabled><option>Category</option></select>
    <select id="cip-year" disabled><option>Bond Year</option></select>
  </div>
  <table id="cip-table" style="display:none;">
    <thead><tr><th>City</th><th>Project</th><th>Category</th><th>Year</th><th>Funded Amount</th><th>Status</th></tr></thead>
    <tbody id="cip-tbody"></tbody>
  </table>
  <div class="chart-card" style="display:none;"><canvas id="chart-cip-bar"></canvas></div>
</div>

<!-- FOOTER -->
<footer id="footer">
  <div id="footer-text">Drop Excel files to get started</div>
  <div>Generated by Halff Municipal Market Research Pipeline</div>
</footer>
</body>
</html>
```

- [ ] **Step 4: Verify static shell loads in browser**

Open `docs/index.html` in a browser. Verify:
- Nav bar renders with blue background, title, tab buttons
- Drop zone is centered with upload icon, browse button, demo link
- Clicking tabs does nothing yet (JS not wired)
- No console errors (CDN libraries load)
- Responsive: resize to 700px, verify layout doesn't break

- [ ] **Step 5: Commit**

```bash
git add docs/index.html docs/index.html.bak
git commit -m "feat: HTML skeleton + complete CSS for contract intelligence dashboard"
```

---

## Task 3: State Management + Data Loading + Helpers

**Files:**
- Modify: `docs/index.html` (add `<script>` block)

Add the JavaScript foundation: constants, state object, helper functions, SheetJS parser, project type normalization, file loading with drag-and-drop, demo data generator.

- [ ] **Step 1: Add constants and state object**

At the top of the `<script>` block:

```javascript
'use strict';

/* ════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════ */
const C = {
  BLUE: '#1C355E', SEAFOAM: '#68949E', DARK: '#002B3C',
  TEAL: '#115E6B', MINT: '#B7CECD', COOL_GRAY: '#D9DAE4',
  SALMON: '#FC6758', RED: '#9B3426', PLUM: '#6F2740',
  WHITE: '#FFFFFF', BG: '#F4F5F9',
};

const PALETTE = [
  '#68949E','#115E6B','#1C355E','#B7CECD','#FC6758',
  '#6F2740','#002B3C','#9B3426','#3A7CA5','#4CAF82',
  '#8C6D4F','#2196A5',
];

// Project type normalization: raw lowercase → display name
const TYPE_NORMALIZE = {
  roads: 'Roadway', road: 'Roadway', roadway: 'Roadway',
  planning: 'Planning / Study', study: 'Planning / Study', 'planning / study': 'Planning / Study',
  waterres: 'Water / Wastewater', 'water resources': 'Water / Wastewater',
  waterww: 'Water / Wastewater', 'water/wastewater': 'Water / Wastewater', 'water / wastewater': 'Water / Wastewater',
  parks: 'Park / Trail', park: 'Park / Trail', trail: 'Park / Trail', 'park / trail': 'Park / Trail',
  traffic: 'Traffic & Signals', signals: 'Traffic & Signals', 'traffic & signals': 'Traffic & Signals',
  facilities: 'Facilities', buildings: 'Facilities', 'facilities & buildings': 'Facilities',
  survey: 'Survey & SUE', sue: 'Survey & SUE', 'survey & sue': 'Survey & SUE',
  cei: 'Construction Inspection', inspection: 'Construction Inspection', 'construction inspection': 'Construction Inspection',
  technology: 'Technology & GIS', gis: 'Technology & GIS', 'technology & gis': 'Technology & GIS',
  row: 'Right of Way', 'right of way': 'Right of Way',
};

function normalizeType(raw) {
  if (!raw) return 'Unknown';
  const key = raw.toString().trim().toLowerCase().replace(/\*/g, '');
  if (TYPE_NORMALIZE[key]) return TYPE_NORMALIZE[key];
  // Title-case fallback
  return key.replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
}

/* ════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════ */
const STATE = {
  allData:       [],   // All parsed contract rows
  filteredData:  [],   // After filters applied
  filesLoaded:   0,
  lastModified:  null,
  charts:        {},   // chartId → Chart instance
  map:           null, // Leaflet map instance
  geoLayer:      null, // Leaflet GeoJSON layer
  viewMode:      'all', // 'all' | 'city' | 'consultant'
  filters: {
    cities:      new Set(),
    years:       new Set(),
    types:       new Set(),
    consultant:  '',
  },
  allCities:     [],
  allYears:      [],
  allTypes:      [],
  debounceTimer: null,
};
```

- [ ] **Step 2: Add helper functions**

```javascript
/* ════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════ */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtMoney(v) {
  if (v == null || isNaN(v)) return '--';
  if (Math.abs(v) >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v.toFixed(0);
}

function fmtMoneyFull(v) {
  if (v == null || isNaN(v)) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function parseExcelDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d)) return d;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d)) return d;
  }
  if (val instanceof Date) return val;
  return null;
}

function cityFromFilename(name) {
  const base = name.replace(/_contracts\.xlsx$/i, '').replace(/\.xlsx$/i, '');
  // Map known filenames to proper display names
  const map = {
    frisco: 'Frisco', plano: 'Plano', carrollton: 'Carrollton',
    celina: 'Celina', dallas: 'Dallas', fortworth: 'Fort Worth',
    mckinney: 'McKinney', garland: 'Garland', richardson: 'Richardson',
    lancaster: 'Lancaster', grandprairie: 'Grand Prairie',
  };
  const key = base.toLowerCase().replace(/[\s_-]/g, '');
  return map[key] || base.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function groupBy(arr, key) {
  const m = {};
  arr.forEach(r => { const k = r[key] || 'Unknown'; (m[k] = m[k] || []).push(r); });
  return m;
}

function sumBy(arr, key) {
  return arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

function unique(arr) {
  return [...new Set(arr)];
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
}

function lerpColor(hex1, hex2, t) {
  const [r1,g1,b1] = hexToRgb(hex1);
  const [r2,g2,b2] = hexToRgb(hex2);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function contrastColor(bgHex) {
  try {
    const [r,g,b] = hexToRgb(bgHex);
    return (0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255)) > 0.35 ? '#002B3C' : '#FFFFFF';
  } catch { return '#002B3C'; }
}

function destroyChart(id) {
  if (STATE.charts[id]) { STATE.charts[id].destroy(); delete STATE.charts[id]; }
}

function today() {
  return new Date().toISOString().split('T')[0].replace(/-/g, '');
}
```

- [ ] **Step 3: Add data loading functions**

```javascript
/* ════════════════════════════════════════════════
   DATA LOADING
════════════════════════════════════════════════ */
function parseWorkbook(wb, cityHint) {
  const rows = [];
  const configSheet = wb.Sheets['Config'] || wb.Sheets['config'];
  if (!configSheet) return rows;

  const json = XLSX.utils.sheet_to_json(configSheet, { header: 1, defval: null });
  // Skip header row if first cell is text
  let startRow = 0;
  if (json.length > 0 && json[0] && typeof json[0][0] === 'string' && isNaN(json[0][0])) {
    startRow = 1;
  }

  for (let i = startRow; i < json.length; i++) {
    const r = json[i];
    if (!r) continue;

    const yearCell = r[0];
    const rawDate  = r[1];
    const company  = (r[2] || '').toString().trim();
    const amount   = parseFloat(r[3]) || 0;
    const project  = (r[4] || '').toString().trim();
    const rawType  = (r[5] || '').toString().trim();
    const limits   = (r[6] || '').toString().trim();
    const notes    = (r[7] || '').toString().trim();
    const srcFile  = (r[8] || '').toString().trim();
    const cityCol  = (r[9] || '').toString().trim();
    const pdfLink  = (r[10] || '').toString().trim();
    const pageNum  = r[11];

    if (!company && !rawDate && !yearCell) continue;

    const date = parseExcelDate(rawDate);
    const year = date ? date.getFullYear() : (parseInt(yearCell) || null);
    const city = cityCol || cityHint || 'Unknown';
    const type = normalizeType(rawType);

    rows.push({ date, year, company, amount, project, type, limits, notes, srcFile, city, pdfLink, pageNum });
  }
  return rows;
}

function loadFiles(files) {
  showLoading('Parsing Excel files...');
  STATE.filesLoaded += files.length;
  let processed = 0;

  Array.from(files).forEach(file => {
    const cityHint = cityFromFilename(file.name);
    const lastMod = file.lastModified ? new Date(file.lastModified) : null;
    if (!STATE.lastModified || (lastMod && lastMod > STATE.lastModified)) {
      STATE.lastModified = lastMod;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        STATE.allData.push(...parseWorkbook(wb, cityHint));
      } catch (err) {
        console.error('Parse error for ' + file.name + ':', err);
      }
      processed++;
      updateLoadingText(`Parsed ${processed} of ${files.length} files...`);
      if (processed === files.length) finalizeDashboard();
    };
    reader.readAsArrayBuffer(file);
  });
}

function generateDemoData() {
  const cities = ['Frisco','Plano','Carrollton','McKinney','Richardson','Celina'];
  const companies = ['Halff Associates','Kimley-Horn','Freese & Nichols','Garver Engineers',
    'Teague Nall & Perkins','Dunaway Associates','Westwood','Cobb Fendley','Parkhill','BGE Inc.'];
  const types = ['Roadway','Water / Wastewater','Park / Trail','Traffic & Signals',
    'Planning / Study','Facilities','Survey & SUE','Construction Inspection','Technology & GIS','Right of Way'];
  const data = [];
  for (let year = 2020; year <= 2026; year++) {
    cities.forEach(city => {
      const n = Math.floor(Math.random() * 15) + 5;
      for (let i = 0; i < n; i++) {
        const mo = Math.floor(Math.random() * 12);
        const dy = Math.floor(Math.random() * 28) + 1;
        data.push({
          date: new Date(year, mo, dy),
          year,
          company: companies[Math.floor(Math.random() * companies.length)],
          amount: Math.round((Math.random() * 4000000) + 50000),
          project: `${city} ${types[Math.floor(Math.random() * types.length)]} Project ${i + 1}`,
          type: types[Math.floor(Math.random() * types.length)],
          limits: '', notes: '', srcFile: 'demo', city, pdfLink: '', pageNum: null,
        });
      }
    });
  }
  return data;
}
```

- [ ] **Step 4: Add loading UI helpers**

```javascript
/* ════════════════════════════════════════════════
   LOADING UI
════════════════════════════════════════════════ */
function showLoading(msg) {
  document.getElementById('loading-text').textContent = msg;
  document.getElementById('loading-overlay').classList.add('active');
}
function updateLoadingText(msg) {
  document.getElementById('loading-text').textContent = msg;
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('active');
}
```

- [ ] **Step 5: Verify parsing works with demo data**

In the `DOMContentLoaded` handler (to be wired in Task 6), temporarily add:
```javascript
STATE.allData = generateDemoData();
console.log('Demo rows:', STATE.allData.length);
console.log('Sample:', STATE.allData[0]);
console.log('Types:', unique(STATE.allData.map(r => r.type)));
```

Open in browser, check console output. Should show ~420+ rows, a sample row object with all fields, and the 10 project types.

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "feat: add state management, data loading, SheetJS parser, and helpers"
```

---

## Task 4: Filter System + Event Wiring

**Files:**
- Modify: `docs/index.html` (add filter logic and DOMContentLoaded handler)

Wire up the filter bar: view mode toggle, multi-select checkboxes for cities/years/types, consultant search, reset button, and debounced filter application.

- [ ] **Step 1: Add filter rendering and application logic**

```javascript
/* ════════════════════════════════════════════════
   FILTERS
════════════════════════════════════════════════ */
function renderFilters() {
  // City checkboxes
  const cityList = document.getElementById('city-list');
  cityList.innerHTML = STATE.allCities.map(c => `
    <label class="check-item"><input type="checkbox" class="city-cb" value="${escHtml(c)}" ${STATE.filters.cities.has(c)?'checked':''}> ${escHtml(c)}</label>`).join('');
  cityList.querySelectorAll('.city-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) STATE.filters.cities.add(cb.value);
      else STATE.filters.cities.delete(cb.value);
      syncAllToggle('city');
      scheduleRender();
    });
  });

  // Year checkboxes
  const yearList = document.getElementById('year-list');
  yearList.innerHTML = STATE.allYears.map(y => `
    <label class="check-item"><input type="checkbox" class="year-cb" value="${y}" ${STATE.filters.years.has(y)?'checked':''}> ${y}</label>`).join('');
  yearList.querySelectorAll('.year-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const v = parseInt(cb.value);
      if (cb.checked) STATE.filters.years.add(v);
      else STATE.filters.years.delete(v);
      syncAllToggle('year');
      scheduleRender();
    });
  });

  // Type checkboxes
  const typeList = document.getElementById('type-list');
  typeList.innerHTML = STATE.allTypes.map(t => `
    <label class="check-item"><input type="checkbox" class="type-cb" value="${escHtml(t)}" ${STATE.filters.types.has(t)?'checked':''}> ${escHtml(t)}</label>`).join('');
  typeList.querySelectorAll('.type-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) STATE.filters.types.add(cb.value);
      else STATE.filters.types.delete(cb.value);
      syncAllToggle('type');
      scheduleRender();
    });
  });

  updateBadges();
}

function syncAllToggle(which) {
  if (which === 'city') document.getElementById('city-all').checked = STATE.filters.cities.size === STATE.allCities.length;
  if (which === 'year') document.getElementById('year-all').checked = STATE.filters.years.size === STATE.allYears.length;
  if (which === 'type') document.getElementById('type-all').checked = STATE.filters.types.size === STATE.allTypes.length;
  updateBadges();
}

function updateBadges() {
  document.getElementById('city-badge').textContent = STATE.filters.cities.size;
  document.getElementById('year-badge').textContent = STATE.filters.years.size;
  document.getElementById('type-badge').textContent = STATE.filters.types.size;
}

function applyFilters() {
  const { cities, years, types, consultant } = STATE.filters;
  const term = consultant.toLowerCase().trim();

  STATE.filteredData = STATE.allData.filter(r => {
    if (!cities.has(r.city)) return false;
    if (r.year && !years.has(r.year)) return false;
    if (!types.has(r.type)) return false;
    if (term && !r.company.toLowerCase().includes(term)) return false;
    return true;
  });

  renderKPIs();
  renderStatCards();
  renderAllCharts();
  updateMap();
  updateNavStats();
  updateFooter();
}

function scheduleRender() {
  clearTimeout(STATE.debounceTimer);
  STATE.debounceTimer = setTimeout(applyFilters, 150);
}

function resetFilters() {
  STATE.filters.cities = new Set(STATE.allCities);
  STATE.filters.years = new Set(STATE.allYears);
  STATE.filters.types = new Set(STATE.allTypes);
  STATE.filters.consultant = '';
  STATE.viewMode = 'all';
  document.getElementById('consultant-search').value = '';
  document.getElementById('search-hint').textContent = '';
  document.querySelectorAll('.vm-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'all'));
  renderFilters();
  applyFilters();
}
```

- [ ] **Step 2: Add the finalizeDashboard function**

```javascript
/* ════════════════════════════════════════════════
   FINALIZE DASHBOARD
════════════════════════════════════════════════ */
function finalizeDashboard() {
  STATE.allCities = unique(STATE.allData.map(r => r.city)).filter(Boolean).sort();
  STATE.allYears  = unique(STATE.allData.map(r => r.year)).filter(Boolean).sort();
  STATE.allTypes  = unique(STATE.allData.map(r => r.type)).filter(Boolean).sort();

  STATE.filters.cities = new Set(STATE.allCities);
  STATE.filters.years  = new Set(STATE.allYears);
  STATE.filters.types  = new Set(STATE.allTypes);
  STATE.filters.consultant = '';

  renderFilters();
  initMap();
  applyFilters();

  document.getElementById('drop-screen').style.display = 'none';
  document.getElementById('tab-contracts').style.display = '';
  document.getElementById('btn-add-data').style.display = '';
  hideLoading();

  if (STATE.lastModified) {
    document.getElementById('footer-text').textContent =
      `Data as of: ${STATE.lastModified.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}`;
  }

  if (STATE.allData.length > 10000) {
    const b = document.getElementById('large-banner');
    b.textContent = `Large dataset (${STATE.allData.length.toLocaleString()} rows) — some charts may render slowly.`;
    b.classList.add('warn');
  }

  renderPmTracker();
  updateFooter();
}
```

- [ ] **Step 3: Add the DOMContentLoaded event handler with all event wiring**

```javascript
/* ════════════════════════════════════════════════
   EVENT LISTENERS + INIT
════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Tab switching
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const panel = document.getElementById('tab-' + tab.dataset.tab);
      if (panel) panel.style.display = '';
    });
  });

  // Demo mode via URL param
  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    showLoading('Generating demo data...');
    setTimeout(() => {
      STATE.allData = generateDemoData();
      STATE.filesLoaded = 1;
      STATE.lastModified = new Date();
      finalizeDashboard();
    }, 300);
    return;
  }

  // Drop zone
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  document.getElementById('btn-browse').addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) loadFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', e => { if (e.target.files.length) loadFiles(e.target.files); });

  // Demo link
  document.getElementById('demo-link').addEventListener('click', e => {
    e.stopPropagation();
    showLoading('Generating demo data...');
    setTimeout(() => {
      STATE.allData = generateDemoData();
      STATE.filesLoaded = 1;
      STATE.lastModified = new Date();
      finalizeDashboard();
    }, 300);
  });

  // Add City Data button
  const addInput = document.getElementById('file-input-add');
  document.getElementById('btn-add-data').addEventListener('click', () => addInput.click());
  addInput.addEventListener('change', e => { if (e.target.files.length) loadFiles(e.target.files); });

  // Page-wide drop (after data loaded)
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const xlsx = Array.from(e.dataTransfer.files).filter(f => /\.xlsx$/i.test(f.name));
    if (xlsx.length && STATE.allData.length > 0) loadFiles(xlsx);
  });

  // View mode toggle
  document.querySelectorAll('.vm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vm-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.viewMode = btn.dataset.mode;
      scheduleRender();
    });
  });

  // All-toggles
  document.getElementById('city-all').addEventListener('change', e => {
    if (e.target.checked) STATE.allCities.forEach(c => STATE.filters.cities.add(c));
    else STATE.filters.cities.clear();
    renderFilters(); scheduleRender();
  });
  document.getElementById('year-all').addEventListener('change', e => {
    if (e.target.checked) STATE.allYears.forEach(y => STATE.filters.years.add(y));
    else STATE.filters.years.clear();
    renderFilters(); scheduleRender();
  });
  document.getElementById('type-all').addEventListener('change', e => {
    if (e.target.checked) STATE.allTypes.forEach(t => STATE.filters.types.add(t));
    else STATE.filters.types.clear();
    renderFilters(); scheduleRender();
  });

  // Consultant search
  let consultDebounce;
  document.getElementById('consultant-search').addEventListener('input', e => {
    clearTimeout(consultDebounce);
    consultDebounce = setTimeout(() => {
      STATE.filters.consultant = e.target.value;
      const val = e.target.value.trim().toLowerCase();
      if (val) {
        const matches = unique(STATE.allData.map(r => r.company).filter(Boolean))
          .filter(co => co.toLowerCase().includes(val));
        document.getElementById('search-hint').textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;
      } else {
        document.getElementById('search-hint').textContent = '';
      }
      applyFilters();
    }, 150);
  });

  // Reset filters
  document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);

  // Export CSV
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    if (!STATE.filteredData.length) return;
    exportAllCSV();
  });

  // Chart PNG export (delegated)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-export-chart');
    if (!btn) return;
    const chartId = btn.dataset.chart;
    const exportType = btn.dataset.export;
    if (chartId) exportChartPNG(chartId);
    else if (exportType === 'heatmap-csv') exportHeatmapCSV();
  });
});
```

- [ ] **Step 4: Add stub functions for things not yet implemented**

These prevent errors when `applyFilters()` calls functions we haven't written yet:

```javascript
// Stubs — replaced in later tasks
function renderKPIs() {}
function renderStatCards() {}
function renderAllCharts() {}
function initMap() {}
function updateMap() {}
function updateNavStats() {}
function updateFooter() {}
function renderPmTracker() {}
function exportAllCSV() {}
function exportChartPNG(id) {}
function exportHeatmapCSV() {}
```

- [ ] **Step 5: Verify filters work with demo data**

Open `docs/index.html?demo=1` in browser. Verify:
- Drop zone disappears, dashboard panel appears
- Filter bar renders with city, year, type checkboxes
- Toggling a checkbox updates filter badges
- Console shows no errors
- Tab switching works (PM/CIP tabs show placeholder content)

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "feat: add filter system, event wiring, and data loading pipeline"
```

---

## Task 5: KPI Cards + Summary Stats + Nav Stats + Footer + Exports

**Files:**
- Modify: `docs/index.html` (replace stub functions)

- [ ] **Step 1: Implement KPI, stat card, nav stats, and footer rendering**

Replace the stub functions with real implementations:

```javascript
/* ════════════════════════════════════════════════
   KPIs + STATS
════════════════════════════════════════════════ */
function renderKPIs() {
  const d = STATE.filteredData;
  document.getElementById('kpi-contracts').textContent = d.length.toLocaleString();
  document.getElementById('kpi-value').textContent = fmtMoney(sumBy(d, 'amount'));
  document.getElementById('kpi-cities').textContent = unique(d.map(r => r.city)).filter(Boolean).length;
  document.getElementById('kpi-consultants').textContent = unique(d.map(r => r.company).filter(Boolean)).length;
}

function renderStatCards() {
  const d = STATE.filteredData;
  const total = sumBy(d, 'amount');
  const count = d.length;
  const firms = unique(d.map(r => r.company).filter(Boolean));
  const avg = count > 0 ? total / count : 0;

  document.getElementById('stat-total').textContent = fmtMoney(total);
  document.getElementById('stat-count').textContent = count.toLocaleString();
  document.getElementById('stat-firms').textContent = firms.length.toLocaleString();
  document.getElementById('stat-avg').textContent = fmtMoney(avg);

  // Top consultant
  const byFirm = groupBy(d, 'company');
  const topFirm = Object.entries(byFirm)
    .map(([co, rows]) => ({ co, total: sumBy(rows, 'amount') }))
    .filter(x => x.co)
    .sort((a, b) => b.total - a.total)[0];
  if (topFirm && total > 0) {
    const pct = ((topFirm.total / total) * 100).toFixed(0);
    document.getElementById('stat-top-firm').innerHTML = `${escHtml(topFirm.co.length > 20 ? topFirm.co.substring(0,20) + '...' : topFirm.co)}<br><span style="font-size:11px;color:var(--seafoam);">${pct}% share</span>`;
  } else {
    document.getElementById('stat-top-firm').textContent = '--';
  }

  // Top project type
  const byType = groupBy(d, 'type');
  const topType = Object.entries(byType)
    .map(([t, rows]) => ({ t, total: sumBy(rows, 'amount') }))
    .filter(x => x.t && x.t !== 'Unknown')
    .sort((a, b) => b.total - a.total)[0];
  if (topType && total > 0) {
    const pct = ((topType.total / total) * 100).toFixed(0);
    document.getElementById('stat-top-type').innerHTML = `${escHtml(topType.t)}<br><span style="font-size:11px;color:var(--seafoam);">${pct}% share</span>`;
  } else {
    document.getElementById('stat-top-type').textContent = '--';
  }
}

function updateNavStats() {
  const d = STATE.filteredData;
  const stats = document.getElementById('nav-stats');
  stats.innerHTML = `
    <span class="nav-stat">${d.length.toLocaleString()} contracts</span>
    <span class="nav-stat">${fmtMoney(sumBy(d, 'amount'))}</span>
    <span class="nav-stat">${unique(d.map(r => r.city)).filter(Boolean).length} cities</span>`;
}

function updateFooter() {
  const lastMod = STATE.lastModified
    ? STATE.lastModified.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '--';
  document.getElementById('footer-text').textContent =
    `Data freshness: ${lastMod} | ${STATE.filesLoaded} Excel file(s) loaded | ${STATE.allData.length.toLocaleString()} total contracts`;
}
```

- [ ] **Step 2: Implement export functions**

```javascript
/* ════════════════════════════════════════════════
   EXPORTS
════════════════════════════════════════════════ */
function exportChartPNG(id) {
  const chart = STATE.charts[id];
  if (!chart) return;
  const url = chart.toBase64Image('image/png', 1.0);
  const link = document.createElement('a');
  link.href = url;
  link.download = `halff_${id}_${today()}.png`;
  link.click();
}

function exportHeatmapCSV() {
  const d = STATE.filteredData;
  const types = unique(d.map(r => r.type)).filter(Boolean).sort();
  const cities = unique(d.map(r => r.city)).filter(Boolean).sort();
  let csv = 'City,' + types.join(',') + '\n';
  cities.forEach(city => {
    const row = [city];
    types.forEach(t => {
      row.push(sumBy(d.filter(r => r.city === city && r.type === t), 'amount').toFixed(0));
    });
    csv += row.join(',') + '\n';
  });
  downloadBlob(csv, `halff_heatmap_${today()}.csv`, 'text/csv');
}

function exportAllCSV() {
  const cols = ['year','date','city','company','amount','project','type','limits','notes','pdfLink','pageNum'];
  let csv = cols.join(',') + '\n';
  STATE.filteredData.forEach(r => {
    csv += [
      r.year,
      r.date ? r.date.toISOString().split('T')[0] : '',
      csvCell(r.city), csvCell(r.company), r.amount,
      csvCell(r.project), csvCell(r.type), csvCell(r.limits),
      csvCell(r.notes), csvCell(r.pdfLink),
      r.pageNum != null ? r.pageNum : '',
    ].join(',') + '\n';
  });
  downloadBlob(csv, `halff_market_research_${today()}.csv`, 'text/csv');
}

function csvCell(v) {
  const s = String(v || '');
  return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g,'""')}"` : s;
}

function downloadBlob(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Verify KPIs and exports**

Open `docs/index.html?demo=1`. Verify:
- KPI cards show contract count, total value, city count, consultant count
- Stat cards below map show totals, top consultant with %, top type with %
- Nav bar shows inline stats
- Footer shows data freshness info
- "Export CSV" button downloads a CSV file
- Changing filters updates all stats

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "feat: add KPI cards, summary stats, nav stats, footer, and CSV/PNG exports"
```

---

## Task 6: Leaflet Choropleth Map

**Files:**
- Modify: `docs/index.html` (replace `initMap` and `updateMap` stubs)

- [ ] **Step 1: Implement map initialization and choropleth rendering**

Replace the `initMap()` and `updateMap()` stubs:

```javascript
/* ════════════════════════════════════════════════
   LEAFLET MAP
════════════════════════════════════════════════ */
function initMap() {
  if (STATE.map) return; // Already initialized

  STATE.map = L.map('map', {
    center: [33.1, -96.8],
    zoom: 10,
    scrollWheelZoom: true,
    zoomControl: true,
  });

  // Light tile layer (no API key needed — uses CartoDB Positron)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 18,
  }).addTo(STATE.map);

  // Add GeoJSON layer
  if (window.CITY_BOUNDARIES) {
    STATE.geoLayer = L.geoJSON(CITY_BOUNDARIES, {
      style: feature => getCityStyle(feature.properties.name),
      onEachFeature: (feature, layer) => {
        const name = feature.properties.label || feature.properties.name;

        // Tooltip on hover
        layer.bindTooltip(name, {
          permanent: false,
          direction: 'center',
          className: 'city-tooltip',
        });

        // Click to filter
        layer.on('click', () => {
          filterToCity(feature.properties.name);
        });

        layer.on('mouseover', () => {
          layer.setStyle({ weight: 3, fillOpacity: 0.8 });
          const cityData = STATE.filteredData.filter(r => r.city === feature.properties.name);
          const total = sumBy(cityData, 'amount');
          layer.setTooltipContent(
            `<strong>${escHtml(name)}</strong><br>${fmtMoney(total)}<br>${cityData.length} contracts`
          );
        });

        layer.on('mouseout', () => {
          STATE.geoLayer.resetStyle(layer);
        });
      }
    }).addTo(STATE.map);

    // Add permanent city name labels
    CITY_BOUNDARIES.features.forEach(f => {
      const bounds = L.geoJSON(f).getBounds();
      const center = bounds.getCenter();
      L.marker(center, {
        icon: L.divIcon({
          className: 'city-label',
          html: `<span>${escHtml(f.properties.label || f.properties.name)}</span>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10],
        })
      }).addTo(STATE.map);
    });

    // Fit bounds to data cities
    const dataCities = CITY_BOUNDARIES.features.filter(f =>
      STATE.allCities.includes(f.properties.name)
    );
    if (dataCities.length) {
      const group = L.geoJSON({ type: 'FeatureCollection', features: dataCities });
      STATE.map.fitBounds(group.getBounds().pad(0.1));
    }
  }
}

function getCityStyle(cityName) {
  const cityData = STATE.filteredData.filter(r => r.city === cityName);
  const total = sumBy(cityData, 'amount');

  if (total === 0 || !STATE.allCities.includes(cityName)) {
    return { fillColor: '#e0e0e0', fillOpacity: 0.4, color: '#999', weight: 1 };
  }

  // Green choropleth scale based on filtered data range
  const allTotals = STATE.allCities.map(c =>
    sumBy(STATE.filteredData.filter(r => r.city === c), 'amount')
  ).filter(v => v > 0);
  const maxVal = Math.max(...allTotals, 1);
  const t = Math.sqrt(total / maxVal); // sqrt scale for better distribution

  const GREEN_SCALE = ['#e8f5e9', '#a5d6a7', '#66bb6a', '#388e3c', '#1b5e20'];
  const idx = Math.min(Math.floor(t * (GREEN_SCALE.length - 1)), GREEN_SCALE.length - 2);
  const frac = t * (GREEN_SCALE.length - 1) - idx;
  const fillColor = lerpColor(GREEN_SCALE[idx], GREEN_SCALE[idx + 1], frac);

  return { fillColor, fillOpacity: 0.65, color: '#2e7d32', weight: 1.5 };
}

function updateMap() {
  if (!STATE.geoLayer) return;
  STATE.geoLayer.eachLayer(layer => {
    const name = layer.feature.properties.name;
    layer.setStyle(getCityStyle(name));
  });
}

function filterToCity(cityName) {
  // Set view mode to single city, select only that city
  STATE.viewMode = 'city';
  document.querySelectorAll('.vm-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'city'));
  STATE.filters.cities = new Set([cityName]);
  renderFilters();
  applyFilters();
}
```

- [ ] **Step 2: Add CSS for map labels and tooltips**

Add to the `<style>` block:

```css
.city-label span {
  font-family: 'Public Sans', Arial, sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--dark);
  text-shadow: 1px 1px 2px white, -1px -1px 2px white;
  white-space: nowrap;
  pointer-events: none;
}
.city-tooltip {
  font-family: 'Public Sans', Arial, sans-serif;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
}
```

- [ ] **Step 3: Verify map renders with demo data**

Open `docs/index.html?demo=1`. Verify:
- Map renders in the right column with tile layer visible
- City polygons appear (if `city_boundaries.js` is loaded)
- Green choropleth coloring — cities with more contract value are darker green
- Hovering a city shows tooltip with name, value, count
- Clicking a city filters the dashboard to that city
- City name labels are centered on polygons

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "feat: add Leaflet choropleth map with city boundaries, tooltips, and click-to-filter"
```

---

## Task 7: Core Charts (1-4)

**Files:**
- Modify: `docs/index.html` (replace `renderAllCharts` stub)

- [ ] **Step 1: Add the `renderAllCharts` function and shared chart options**

```javascript
/* ════════════════════════════════════════════════
   CHARTS — SHARED
════════════════════════════════════════════════ */
const CHART_FONT = { family: "'Public Sans', Arial, sans-serif" };

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { labels: { font: { ...CHART_FONT, size: 11 }, color: C.DARK, boxWidth: 12, padding: 10 } },
    tooltip: { bodyFont: CHART_FONT, titleFont: { ...CHART_FONT, weight: '600' } },
  },
  scales: {
    x: { ticks: { font: { ...CHART_FONT, size: 10 }, color: C.DARK }, grid: { color: 'rgba(0,0,0,.05)' } },
    y: { ticks: { font: { ...CHART_FONT, size: 10 }, color: C.DARK }, grid: { color: 'rgba(0,0,0,.05)' } },
  },
};

function makeChart(id, type, data, options) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  STATE.charts[id] = new Chart(ctx, { type, data, options });
}

function renderAllCharts() {
  renderConsultantBar();
  renderTypeDoughnut();
  renderOverTime();
  renderScatter();
  renderHeatmap();
  renderAvgSize();
  renderYoY();
  renderNewRepeat();
}
```

- [ ] **Step 2: Chart 1 — Consultant Bar (horizontal)**

```javascript
/* ── Chart 1: Top Consultants by Value (horizontal bar) ── */
function renderConsultantBar() {
  const d = STATE.filteredData;
  const groups = groupBy(d, 'company');
  const sorted = Object.entries(groups)
    .map(([co, rows]) => ({ co, total: sumBy(rows, 'amount') }))
    .filter(x => x.co)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  makeChart('chartConsultantBar', 'bar', {
    labels: sorted.map(x => x.co.length > 28 ? x.co.substring(0, 26) + '...' : x.co),
    datasets: [{
      data: sorted.map(x => x.total),
      backgroundColor: sorted.map((_, i) => i % 2 === 0 ? C.SEAFOAM + 'CC' : C.TEAL + 'CC'),
      borderColor: sorted.map((_, i) => i % 2 === 0 ? C.SEAFOAM : C.TEAL),
      borderWidth: 1,
      borderRadius: 4,
    }]
  }, {
    ...CHART_DEFAULTS,
    indexAxis: 'y',
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${fmtMoneyFull(ctx.parsed.x)}` } },
    },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: v => fmtMoney(v) } },
      y: { ticks: { font: { ...CHART_FONT, size: 10 }, color: C.DARK }, grid: { display: false } },
    },
    onClick: (e, elements) => {
      if (elements.length) {
        const idx = elements[0].index;
        const firmName = sorted[idx].co;
        filterToConsultant(firmName);
      }
    },
  });
}

function filterToConsultant(name) {
  STATE.viewMode = 'consultant';
  document.querySelectorAll('.vm-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'consultant'));
  STATE.filters.consultant = name;
  document.getElementById('consultant-search').value = name;
  applyFilters();
}
```

- [ ] **Step 3: Chart 2 — Project Type Doughnut**

```javascript
/* ── Chart 2: Project Type Doughnut ── */
function renderTypeDoughnut() {
  const d = STATE.filteredData;
  const groups = groupBy(d, 'type');
  const sorted = Object.entries(groups)
    .map(([t, rows]) => ({ t, total: sumBy(rows, 'amount') }))
    .filter(x => x.t && x.t !== 'Unknown')
    .sort((a, b) => b.total - a.total);

  const grandTotal = sorted.reduce((s, x) => s + x.total, 0);

  makeChart('chartTypeDoughnut', 'doughnut', {
    labels: sorted.map(x => x.t),
    datasets: [{
      data: sorted.map(x => x.total),
      backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length] + 'DD'),
      borderColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 2,
    }]
  }, {
    ...CHART_DEFAULTS,
    cutout: '55%',
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { position: 'right', labels: { font: { ...CHART_FONT, size: 10 }, color: C.DARK, boxWidth: 10, padding: 6 } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const pct = grandTotal > 0 ? ((ctx.parsed / grandTotal) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${fmtMoney(ctx.parsed)} (${pct}%)`;
          }
        }
      },
    },
    scales: {},
    onClick: (e, elements) => {
      if (elements.length) {
        const idx = elements[0].index;
        const typeName = sorted[idx].t;
        filterToType(typeName);
      }
    },
  });
}

function filterToType(typeName) {
  STATE.filters.types = new Set([typeName]);
  renderFilters();
  applyFilters();
}
```

- [ ] **Step 4: Chart 3 — Contracts Over Time (stacked bar)**

```javascript
/* ── Chart 3: Contracts Over Time (quarterly stacked bar) ── */
function renderOverTime() {
  const d = STATE.filteredData.filter(r => r.date);

  // Build quarterly buckets
  const buckets = {};
  d.forEach(r => {
    const q = Math.floor(r.date.getMonth() / 3) + 1;
    const key = `${r.year} Q${q}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(r);
  });

  const labels = Object.keys(buckets).sort();

  if (STATE.viewMode === 'all' || STATE.viewMode === 'consultant') {
    // Stack by project type
    const types = unique(d.map(r => r.type)).filter(Boolean).sort();
    const datasets = types.map((t, i) => ({
      label: t,
      data: labels.map(q => sumBy((buckets[q] || []).filter(r => r.type === t), 'amount')),
      backgroundColor: PALETTE[i % PALETTE.length] + 'CC',
      borderColor: PALETTE[i % PALETTE.length],
      borderWidth: 1,
      stack: 'stack',
    }));

    makeChart('chartOverTime', 'bar', { labels, datasets }, {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y)}` } },
      },
      scales: {
        x: { ...CHART_DEFAULTS.scales.x, stacked: true },
        y: { ...CHART_DEFAULTS.scales.y, stacked: true, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => fmtMoney(v) } },
      },
    });
  } else {
    // Group by city
    const cities = unique(d.map(r => r.city)).filter(Boolean).sort();
    const datasets = cities.map((city, i) => ({
      label: city,
      data: labels.map(q => sumBy((buckets[q] || []).filter(r => r.city === city), 'amount')),
      backgroundColor: PALETTE[i % PALETTE.length] + 'CC',
      borderColor: PALETTE[i % PALETTE.length],
      borderWidth: 1,
    }));

    makeChart('chartOverTime', 'bar', { labels, datasets }, {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y)}` } },
      },
      scales: {
        x: { ...CHART_DEFAULTS.scales.x },
        y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => fmtMoney(v) } },
      },
    });
  }
}
```

- [ ] **Step 5: Chart 4 — Consultant Scatter Plot**

```javascript
/* ── Chart 4: Consultant Scatter (bubble) ── */
function renderScatter() {
  const d = STATE.filteredData;
  const groups = groupBy(d, 'company');
  const points = Object.entries(groups)
    .map(([co, rows]) => {
      const total = sumBy(rows, 'amount');
      const count = rows.length;
      const avg = count > 0 ? total / count : 0;
      return { co, count, total, avg };
    })
    .filter(x => x.co && x.count > 0);

  const maxAvg = Math.max(...points.map(p => p.avg), 1);

  makeChart('chartScatter', 'bubble', {
    datasets: [{
      data: points.map(p => ({
        x: p.count,
        y: p.total,
        r: 4 + 16 * Math.sqrt(p.avg / maxAvg),
        _label: p.co,
        _avg: p.avg,
      })),
      backgroundColor: C.SEAFOAM + '88',
      borderColor: C.TEAL,
      borderWidth: 1,
    }]
  }, {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            const p = ctx.raw;
            return [
              ` ${p._label}`,
              ` ${p.x} contracts`,
              ` ${fmtMoney(p.y)} total`,
              ` ${fmtMoney(p._avg)} avg`,
            ];
          }
        }
      },
    },
    scales: {
      x: {
        ...CHART_DEFAULTS.scales.x,
        title: { display: true, text: 'Number of Contracts', font: CHART_FONT, color: C.DARK },
      },
      y: {
        ...CHART_DEFAULTS.scales.y,
        title: { display: true, text: 'Total Contract Value', font: CHART_FONT, color: C.DARK },
        ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => fmtMoney(v) },
      },
    },
  });
}
```

- [ ] **Step 6: Verify all 4 charts render**

Open `docs/index.html?demo=1`. Verify:
- Consultant bar chart shows top 15 firms, horizontal, Seafoam/Teal alternating
- Clicking a bar filters to that consultant
- Doughnut shows project types with percentages in tooltips
- Clicking a slice filters to that type
- Over Time chart shows quarterly stacked bars
- Scatter plot shows consultant bubbles with proper tooltips
- All charts update when filters change

- [ ] **Step 7: Commit**

```bash
git add docs/index.html
git commit -m "feat: add core charts — consultant bar, type doughnut, time series, scatter"
```

---

## Task 8: Adopted Charts (5-8)

**Files:**
- Modify: `docs/index.html` (add remaining chart functions)

- [ ] **Step 1: Chart 5 — Category Heatmap**

```javascript
/* ── Chart 5: Category Heatmap by City (HTML table) ── */
function renderHeatmap() {
  const d = STATE.filteredData;
  const types = unique(d.map(r => r.type)).filter(Boolean).sort();
  const cities = unique(d.map(r => r.city)).filter(Boolean).sort();

  const matrix = {};
  const colMax = {};
  types.forEach(t => { colMax[t] = 0; });

  cities.forEach(city => {
    matrix[city] = {};
    types.forEach(t => {
      const total = sumBy(d.filter(r => r.city === city && r.type === t), 'amount');
      matrix[city][t] = total;
      if (total > colMax[t]) colMax[t] = total;
    });
  });

  let html = '<thead><tr><th>City</th>';
  types.forEach(t => { html += `<th>${escHtml(t)}</th>`; });
  html += '</tr></thead><tbody>';

  cities.forEach(city => {
    html += `<tr><td>${escHtml(city)}</td>`;
    types.forEach(t => {
      const val = matrix[city][t] || 0;
      const pct = colMax[t] > 0 ? val / colMax[t] : 0;
      const bg = lerpColor('#FFFFFF', C.BLUE, pct);
      const fg = pct > 0.4 ? '#FFFFFF' : '#002B3C';
      html += `<td style="background:${bg};color:${fg};">${val > 0 ? fmtMoney(val) : '--'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';

  document.getElementById('heatmap-table').innerHTML = html;
}
```

- [ ] **Step 2: Chart 6 — Average Contract Size Over Time**

```javascript
/* ── Chart 6: Average Contract Size Over Time (line) ── */
function renderAvgSize() {
  const d = STATE.filteredData;
  const years = unique(d.map(r => r.year)).filter(Boolean).sort();
  const avgs = years.map(y => {
    const rows = d.filter(r => r.year === y && r.amount > 0);
    return rows.length ? sumBy(rows, 'amount') / rows.length : 0;
  });

  // Trend badge
  const badge = document.getElementById('trend-badge');
  if (avgs.length >= 2) {
    const first = avgs[0], last = avgs[avgs.length - 1];
    if (first > 0) {
      const pct = (((last - first) / first) * 100).toFixed(0);
      badge.textContent = last >= first ? `+${pct}%` : `${pct}%`;
      badge.className = 'trend-badge ' + (last >= first ? 'trend-up' : 'trend-down');
    } else {
      badge.textContent = '';
      badge.className = 'trend-badge';
    }
  } else {
    badge.textContent = '';
    badge.className = 'trend-badge';
  }

  makeChart('chartAvgSize', 'line', {
    labels: years.map(String),
    datasets: [{
      label: 'Avg Contract Size',
      data: avgs,
      borderColor: C.BLUE,
      backgroundColor: C.BLUE + '22',
      tension: 0.3,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: C.BLUE,
    }]
  }, {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${fmtMoney(ctx.parsed.y)}` } },
    },
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => fmtMoney(v) } },
    },
  });
}
```

- [ ] **Step 3: Chart 7 — YoY Growth Rate**

```javascript
/* ── Chart 7: YoY Growth Rate ── */
function renderYoY() {
  const d = STATE.filteredData;
  const years = unique(d.map(r => r.year)).filter(Boolean).sort();
  const totals = years.map(y => sumBy(d.filter(r => r.year === y), 'amount'));

  const growthYears = years.slice(1);
  const growthVals = totals.slice(1).map((v, i) => totals[i] > 0 ? ((v - totals[i]) / totals[i]) * 100 : 0);

  makeChart('chartYoY', 'bar', {
    labels: growthYears.map(String),
    datasets: [{
      data: growthVals,
      backgroundColor: growthVals.map(v => v >= 0 ? C.TEAL + 'CC' : C.SALMON + 'CC'),
      borderColor: growthVals.map(v => v >= 0 ? C.TEAL : C.SALMON),
      borderWidth: 1,
      borderRadius: 4,
    }]
  }, {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) + '%' : '--'}` } },
    },
    scales: {
      x: CHART_DEFAULTS.scales.x,
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v.toFixed(0) + '%' } },
    },
  });
}
```

- [ ] **Step 4: Chart 8 — New vs Repeat Consultants**

```javascript
/* ── Chart 8: New vs Repeat Consultants ── */
function renderNewRepeat() {
  const d = STATE.filteredData;
  const years = unique(d.map(r => r.year)).filter(Boolean).sort();

  const seenBefore = new Set();
  const newCounts = [];
  const repeatCounts = [];

  years.forEach(y => {
    const yearRows = d.filter(r => r.year === y);
    const yearCos = unique(yearRows.map(r => r.company).filter(Boolean));
    let nw = 0, rep = 0;
    yearCos.forEach(co => {
      const rows = yearRows.filter(r => r.company === co);
      if (seenBefore.has(co)) rep += rows.length;
      else nw += rows.length;
      seenBefore.add(co);
    });
    newCounts.push(nw);
    repeatCounts.push(rep);
  });

  makeChart('chartNewRepeat', 'bar', {
    labels: years.map(String),
    datasets: [
      { label: 'Repeat', data: repeatCounts, backgroundColor: C.TEAL + 'CC', borderColor: C.TEAL, borderWidth: 1, stack: 'stack' },
      { label: 'New', data: newCounts, backgroundColor: C.MINT + 'CC', borderColor: C.MINT, borderWidth: 1, stack: 'stack' },
    ]
  }, {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} contracts` } },
    },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x, stacked: true },
      y: { ...CHART_DEFAULTS.scales.y, stacked: true },
    },
  });
}
```

- [ ] **Step 5: Verify all 8 charts**

Open `docs/index.html?demo=1`. Verify:
- All 8 charts render without console errors
- Heatmap table has colored cells, sticky headers
- Avg Size chart shows trend badge (up/down %)
- YoY chart has green/salmon bars for positive/negative
- New vs Repeat shows stacked bars
- Changing filters updates all charts

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "feat: add adopted charts — heatmap, avg size, YoY growth, new vs repeat"
```

---

## Task 9: PM Tracker Tab (Scaffold)

**Files:**
- Modify: `docs/index.html` (replace `renderPmTracker` stub)

- [ ] **Step 1: Implement PM Tracker rendering**

Replace the `renderPmTracker()` stub:

```javascript
/* ════════════════════════════════════════════════
   PM TRACKER (SCAFFOLD)
════════════════════════════════════════════════ */
function renderPmTracker() {
  const cities = STATE.allCities;
  const types = STATE.allTypes;

  // Populate filter dropdowns
  const citySelect = document.getElementById('pm-f-city');
  citySelect.innerHTML = '<option value="">All Cities</option>' +
    cities.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');

  const catSelect = document.getElementById('pm-f-cat');
  catSelect.innerHTML = '<option value="">All Categories</option>' +
    types.map(t => `<option value="${escHtml(t)}">${escHtml(t)}</option>`).join('');

  // Wire filters
  ['pm-f-city', 'pm-f-cat'].forEach(id => {
    document.getElementById(id).addEventListener('change', applyPmFilters);
  });
  document.getElementById('pm-f-name').addEventListener('input', applyPmFilters);
  document.getElementById('pm-btn-reset').addEventListener('click', () => {
    document.getElementById('pm-f-city').value = '';
    document.getElementById('pm-f-cat').value = '';
    document.getElementById('pm-f-name').value = '';
    applyPmFilters();
  });

  applyPmFilters();
}

function applyPmFilters() {
  const cityF = document.getElementById('pm-f-city').value;
  const catF = document.getElementById('pm-f-cat').value;
  const nameF = (document.getElementById('pm-f-name').value || '').toLowerCase();

  // Group by company
  const pmMap = {};
  STATE.allData.forEach(r => {
    if (!r.company || !r.company.trim()) return;
    if (cityF && r.city !== cityF) return;
    if (catF && r.type !== catF) return;

    const key = r.company;
    if (!pmMap[key]) {
      pmMap[key] = { name: r.company, contracts: [], cities: new Set(), types: new Set() };
    }
    pmMap[key].contracts.push(r);
    pmMap[key].cities.add(r.city);
    pmMap[key].types.add(r.type);
  });

  let pms = Object.values(pmMap).sort((a, b) => b.contracts.length - a.contracts.length);

  if (nameF) {
    pms = pms.filter(p => p.name.toLowerCase().includes(nameF));
  }

  const grid = document.getElementById('pm-grid');
  const empty = document.getElementById('pm-empty');

  if (!pms.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = pms.map(p => {
    const total = sumBy(p.contracts, 'amount');
    const cities = [...p.cities].sort().join(', ');
    const types = [...p.types].sort().join(', ');
    return `
      <div class="pm-card">
        <div class="pm-name">${escHtml(p.name)}</div>
        <div class="pm-stats">
          <div class="pm-stat"><div class="pm-stat-n">${p.contracts.length}</div><div class="pm-stat-l">Awards</div></div>
          <div class="pm-stat"><div class="pm-stat-n">${fmtMoney(total)}</div><div class="pm-stat-l">Total Value</div></div>
        </div>
        <div class="pm-detail"><strong>Cities:</strong> ${escHtml(cities)}</div>
        <div class="pm-detail"><strong>Categories:</strong> ${escHtml(types)}</div>
      </div>`;
  }).join('');
}
```

- [ ] **Step 2: Verify PM Tracker**

Open `docs/index.html?demo=1`, click "PM Tracker" tab. Verify:
- Card grid renders with consultant names, award counts, totals
- City and category filters work
- Name search filters cards
- Reset button clears filters

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "feat: add PM Tracker tab scaffold with card grid and filters"
```

---

## Task 10: Final Polish + Responsive Verification

**Files:**
- Modify: `docs/index.html` (final tweaks)

- [ ] **Step 1: Verify responsive breakpoints**

Open `docs/index.html?demo=1` and resize browser:
- **>1100px**: 2-column grid, charts left, map right
- **700-1100px**: Single column, map goes full width above or below charts
- **<700px**: Filter bar collapses, compact layout

Fix any CSS issues found during testing.

- [ ] **Step 2: Verify with real Excel data**

Load actual `*_contracts.xlsx` files from `Contract Logs/`. Verify:
- Config sheet parsing works
- Project type normalization produces clean labels
- City names match between Excel data and GeoJSON boundaries
- Map choropleth colors update correctly
- All charts populate with real data
- Export CSV produces valid output

- [ ] **Step 3: Verify cross-chart interactivity end-to-end**

- Click a consultant bar → view mode switches to "Single Consultant", search field populated, all charts update
- Click a doughnut slice → project type filter narrows to that type, all charts update
- Click a city on map → view mode switches to "Single City", city filter narrows, all charts update
- "Reset Filters" returns everything to default

- [ ] **Step 4: Clean up backup file**

```bash
rm docs/index.html.bak
```

- [ ] **Step 5: Final commit**

```bash
git add docs/index.html
git commit -m "feat: polish responsive layout and verify cross-chart interactivity"
```

---

## Summary of Commits

1. `feat: add GeoJSON city boundaries for 25 North Texas cities`
2. `feat: HTML skeleton + complete CSS for contract intelligence dashboard`
3. `feat: add state management, data loading, SheetJS parser, and helpers`
4. `feat: add filter system, event wiring, and data loading pipeline`
5. `feat: add KPI cards, summary stats, nav stats, footer, and CSV/PNG exports`
6. `feat: add Leaflet choropleth map with city boundaries, tooltips, and click-to-filter`
7. `feat: add core charts — consultant bar, type doughnut, time series, scatter`
8. `feat: add adopted charts — heatmap, avg size, YoY growth, new vs repeat`
9. `feat: add PM Tracker tab scaffold with card grid and filters`
10. `feat: polish responsive layout and verify cross-chart interactivity`
