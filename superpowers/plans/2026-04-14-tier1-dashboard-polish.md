# Tier 1 Dashboard Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply quick-win visual and UX polish to the Municipal Market Research dashboard — CSS tweaks, Chart.js config improvements, and small rendering logic changes. No architectural changes.

**Architecture:** All changes are in the single file `docs/index.html` (inline `<style>` block for CSS, inline `<script>` block for JS). The file is ~2500 lines. Changes touch: CSS custom properties + component styles, Chart.js `CHART_DEFAULTS` object, and individual chart render functions.

**Tech Stack:** Vanilla HTML/CSS/JS, Chart.js v4.4.0, Leaflet.js v1.9.4.

**Spec:** Tier 1 items from the 2026-04-14 dashboard audit (Phase 3 recommendations).

---

## File Structure

| File | Responsibility |
|------|---------------|
| `docs/index.html` | Complete dashboard. All CSS in `<style>` block (lines 29-893), all JS in `<script>` block (lines 1274-end). This is the only file modified. |

---

## Task 1: CSS Polish — KPI Size, Stat Card Colors, Reduced Motion

**Files:**
- Modify: `docs/index.html` (CSS `<style>` block)

- [ ] **Step 1: Increase KPI value font size from 28px to 36px**

At line 468-474, change `.kpi-value`:

```css
.kpi-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--blue);
  line-height: 1.1;
  white-space: nowrap;
}
```

- [ ] **Step 2: Add `.kpi-compare` sub-element style for YoY comparison badge**

Add immediately after the `.kpi-label` rule (after line 481):

```css
.kpi-compare {
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
}
.kpi-compare.up { color: #155724; }
.kpi-compare.down { color: #9B3426; }
.kpi-compare.neutral { color: var(--seafoam); }
```

- [ ] **Step 3: Differentiate stat card border colors with nth-child rules**

After `.stat-card:hover` (line 621), add:

```css
#stat-total  { border-left-color: var(--blue); }
#stat-count  { border-left-color: var(--teal); }
#stat-firms  { border-left-color: var(--seafoam); }
#stat-avg    { border-left-color: var(--dark); }
#stat-top-firm { border-left-color: var(--salmon); }
#stat-top-type { border-left-color: var(--plum); }
```

- [ ] **Step 4: Add `prefers-reduced-motion` media query**

Add before the closing `</style>` tag (before line 893):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Add comparison sub-elements to KPI card HTML**

In each of the four KPI cards (lines 1002-1038), add a `<div class="kpi-compare">` after each `<div class="kpi-label">`. Example for the first card:

```html
<div class="kpi-body">
  <div class="kpi-value" id="kpi-contracts">&mdash;</div>
  <div class="kpi-label">Total Contracts</div>
  <div class="kpi-compare neutral" id="kpi-contracts-cmp"></div>
</div>
```

Repeat for all four cards with IDs: `kpi-contracts-cmp`, `kpi-value-cmp`, `kpi-cities-cmp`, `kpi-consultants-cmp`.

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "style: KPI font bump to 36px, stat card color coding, reduced motion, comparison badges"
```

---

## Task 2: Chart.js Global Defaults — Tooltip Styling + borderRadius

**Files:**
- Modify: `docs/index.html` (JS `<script>` block)

- [ ] **Step 1: Enhance tooltip config in CHART_DEFAULTS**

At line 1965-1977, replace the `CHART_DEFAULTS` object with:

```javascript
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { labels: { font: { ...CHART_FONT, size: 11 }, color: '#002B3C', boxWidth: 12, padding: 10 } },
    tooltip: {
      bodyFont: CHART_FONT,
      titleFont: { ...CHART_FONT, weight: '600' },
      backgroundColor: '#002B3C',
      titleColor: '#FFFFFF',
      bodyColor: '#B7CECD',
      borderColor: '#115E6B',
      borderWidth: 1,
      cornerRadius: 6,
      padding: 10,
      displayColors: true,
      boxPadding: 4,
    },
  },
  scales: {
    x: { ticks: { font: { ...CHART_FONT, size: 10 }, color: '#002B3C' }, grid: { color: 'rgba(0,0,0,.05)' } },
    y: { ticks: { font: { ...CHART_FONT, size: 10 }, color: '#002B3C' }, grid: { color: 'rgba(0,0,0,.05)' } },
  },
};
```

Key additions: `backgroundColor`, `titleColor`, `bodyColor`, `borderColor`, `borderWidth`, `cornerRadius`, `padding`, `boxPadding`.

- [ ] **Step 2: Add borderRadius to chartOverTime datasets**

In `renderOverTime()` (around line 2108), the datasets are built dynamically. Add `borderRadius: 6` to each dataset object:

```javascript
const datasets = groupKeys.map((gk, i) => ({
  label: gk,
  data: quarters.map(q => buckets[q][gk] || 0),
  backgroundColor: PALETTE[i % PALETTE.length],
  borderRadius: 6,
}));
```

- [ ] **Step 3: Add borderRadius to chartNewRepeat datasets**

In `renderNewRepeat()` (around line 2379-2384), add `borderRadius: 6` to both datasets:

```javascript
makeChart('chartNewRepeat', 'bar', {
  labels: years,
  datasets: [
    { label: 'Repeat', data: repeatCounts, backgroundColor: C.TEAL, stack: 'a', borderRadius: 6 },
    { label: 'New', data: newCounts, backgroundColor: C.MINT, stack: 'a', borderRadius: 6 },
  ],
```

- [ ] **Step 4: Increase borderRadius on existing charts from 4 to 6**

In `renderConsultantBar()` (line 2013), change `borderRadius: 4` → `borderRadius: 6`.

In `renderYoY()` (line 2330), change `borderRadius: 4` → `borderRadius: 6`.

- [ ] **Step 5: Commit**

```bash
git add docs/index.html
git commit -m "style: branded tooltips, consistent borderRadius 6 on all bar charts"
```

---

## Task 3: Doughnut Chart — Top 6 + Other

**Files:**
- Modify: `docs/index.html` — `renderTypeDoughnut()` function (lines 2041-2081)

- [ ] **Step 1: Modify renderTypeDoughnut to aggregate tail categories into "Other"**

Replace the body of `renderTypeDoughnut()` (lines 2041-2081) with:

```javascript
function renderTypeDoughnut() {
  const grouped = groupBy(STATE.filteredData, r => r.type || 'Unknown');
  const entries = Object.entries(grouped)
    .map(([name, rows]) => ({ name, total: sumBy(rows, r => r.amount) }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = entries.reduce((s, e) => s + e.total, 0);

  // Show top 6 categories; aggregate the rest into "Other"
  const MAX_SLICES = 6;
  let display;
  if (entries.length <= MAX_SLICES + 1) {
    display = entries;
  } else {
    const top = entries.slice(0, MAX_SLICES);
    const otherTotal = entries.slice(MAX_SLICES).reduce((s, e) => s + e.total, 0);
    display = [...top, { name: 'Other', total: otherTotal }];
  }

  const labels = display.map(e => e.name);
  const values = display.map(e => e.total);
  const colors = display.map((_, i) => PALETTE[i % PALETTE.length]);

  makeChart('chartTypeDoughnut', 'doughnut', {
    labels,
    datasets: [{ data: values, backgroundColor: colors }],
  }, {
    ...CHART_DEFAULTS,
    cutout: '55%',
    scales: {},
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        ...CHART_DEFAULTS.plugins.legend,
        position: 'right',
      },
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        callbacks: {
          label(ctx) {
            const pct = grandTotal > 0 ? ((ctx.raw / grandTotal) * 100).toFixed(1) : 0;
            return ctx.label + ': ' + fmtMoneyFull(ctx.raw) + ' (' + pct + '%)';
          },
        },
      },
    },
    onClick(evt, elements) {
      if (elements.length > 0) {
        const idx = elements[0].index;
        if (labels[idx] !== 'Other') {
          filterToType(labels[idx]);
        }
      }
    },
  });
}
```

Key changes: (a) top 6 + "Other" aggregation, (b) clicking "Other" does nothing (can't filter to multiple types), (c) unchanged chart options.

- [ ] **Step 2: Commit**

```bash
git add docs/index.html
git commit -m "feat: doughnut chart shows top 6 categories + Other for readability"
```

---

## Task 4: Choropleth Map — Brand Teal Gradient

**Files:**
- Modify: `docs/index.html` — `getCityStyle()` function (lines 2405-2421)

- [ ] **Step 1: Replace green gradient with teal gradient**

In `getCityStyle()`, change the `lerpColor` call and border color from green to Halff teal:

Replace line 2419:
```javascript
  const fillColor = lerpColor('#e8f5e9', '#1b5e20', Math.min(t, 1));
```
with:
```javascript
  const fillColor = lerpColor('#E0F0F1', '#115E6B', Math.min(t, 1));
```

Replace line 2420:
```javascript
  return { fillColor: fillColor, fillOpacity: 0.65, color: '#2e7d32', weight: 1.5, opacity: 0.8 };
```
with:
```javascript
  return { fillColor: fillColor, fillOpacity: 0.65, color: '#0D4E5A', weight: 1.5, opacity: 0.8 };
```

The gradient now runs from pale mint (#E0F0F1) to deep teal (#115E6B), with teal borders (#0D4E5A). This matches the Halff brand teal and integrates visually with the rest of the dashboard.

- [ ] **Step 2: Commit**

```bash
git add docs/index.html
git commit -m "style: choropleth map uses brand teal gradient instead of green"
```

---

## Task 5: KPI Comparison Badges — YoY Change

**Files:**
- Modify: `docs/index.html` — `renderKPIs()` function (lines 1798-1814)

- [ ] **Step 1: Extend renderKPIs to compute and display YoY comparison**

Replace `renderKPIs()` (lines 1798-1814) with:

```javascript
function renderKPIs() {
  const data = STATE.filteredData;
  const totalContracts = data.length;
  const totalValue = sumBy(data, r => r.amount);
  const cities = unique(data.map(r => r.city));
  const consultants = unique(data.map(r => r.company));

  const el = (id, val) => {
    const e = document.getElementById(id);
    if (e) e.textContent = val;
  };

  el('kpi-contracts', totalContracts.toLocaleString());
  el('kpi-value', fmtMoney(totalValue));
  el('kpi-cities', cities.length.toLocaleString());
  el('kpi-consultants', consultants.length.toLocaleString());

  // YoY comparison: compare latest full year to the prior year
  const years = unique(data.map(r => r.year).filter(Boolean)).sort();
  if (years.length >= 2) {
    const curYear = years[years.length - 1];
    const prevYear = years[years.length - 2];
    const curData = data.filter(r => r.year === curYear);
    const prevData = data.filter(r => r.year === prevYear);

    const setCmp = (id, curVal, prevVal, fmt) => {
      const e = document.getElementById(id);
      if (!e || prevVal === 0) { if (e) e.textContent = ''; return; }
      const pct = ((curVal - prevVal) / prevVal) * 100;
      const arrow = pct >= 0 ? '\u2191' : '\u2193';
      e.textContent = arrow + ' ' + Math.abs(Math.round(pct)) + '% vs ' + prevYear;
      e.className = 'kpi-compare ' + (pct >= 0 ? 'up' : 'down');
    };

    setCmp('kpi-contracts-cmp', curData.length, prevData.length);
    setCmp('kpi-value-cmp', sumBy(curData, r => r.amount), sumBy(prevData, r => r.amount));
    setCmp('kpi-cities-cmp', unique(curData.map(r => r.city)).length, unique(prevData.map(r => r.city)).length);
    setCmp('kpi-consultants-cmp', unique(curData.map(r => r.company)).length, unique(prevData.map(r => r.company)).length);
  } else {
    ['kpi-contracts-cmp','kpi-value-cmp','kpi-cities-cmp','kpi-consultants-cmp'].forEach(id => {
      const e = document.getElementById(id);
      if (e) e.textContent = '';
    });
  }
}
```

Key behavior: compares the latest year in the loaded data to the prior year, shows an up/down arrow with percentage change and the comparison year label.

- [ ] **Step 2: Commit**

```bash
git add docs/index.html
git commit -m "feat: KPI cards show YoY comparison badges (arrow + % vs prior year)"
```

---

## Verification

After all tasks, open `docs/index.html` in a browser (via `file://` or local server), click "Load sample demo data", and verify:
- KPI numbers are 36px and bold
- Each KPI card shows a comparison badge (e.g., "↑ 23% vs 2025")
- All bar charts have rounded corners
- Tooltips have dark background with teal border
- Doughnut shows at most 7 slices (6 + Other)
- Map uses teal gradient, not green
- Stat cards below the map have distinct colored left borders
- With `prefers-reduced-motion: reduce` enabled in OS settings, no animations play
