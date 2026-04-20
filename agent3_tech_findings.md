# Agent 3: Technical Lead Findings

**Reviewer:** Senior Developer / Architect perspective
**Date:** 2026-04-16
**Dashboard:** `docs/index.html` — 3846 lines, single-file SPA
**Pipeline:** Scrapers -> PDFs -> Claude Haiku -> Excel -> `build_dashboard_data.py` -> JSON -> Dashboard

---

## 1. Code Quality

### HTML Structure: GOOD
- Semantic layout: `<nav>`, `<footer>`, `<main>` content via tab panels
- ARIA: `role="group"` on filter containers, `aria-label` on filter groups
- Proper `<button>` elements (not clickable `<div>`s) for interactive elements
- SVG icons inline — no icon font dependency

### JavaScript: GOOD
- Clean state management via single `STATE` object
- Consistent function naming and organization (10 clearly labeled sections)
- `escHtml()` used for all user-data interpolation — XSS prevention
- Debounced filter rendering (150ms) prevents render thrash
- Chart instances properly destroyed before recreation (`destroyChart`)
- No global variable leaks — everything contained in `STATE` or scoped
- One `console.log` in `finalizeDashboard` — acceptable

### CSS: EXCELLENT
- CSS custom properties for all brand colors — easy to theme
- Well-organized with section comment headers
- Responsive breakpoints at 1100px and 700px
- `prefers-reduced-motion` media query
- Custom scrollbar styling
- Box-shadow variables for consistent elevation
- `forced-color-adjust: none` for Windows High Contrast

### Concerns
| Item | Severity | Notes |
|------|----------|-------|
| 3846-line single file | Low | Monolith is fine for a PoC; would split for production |
| No module system | Low | All JS inline in `<script>` tag — appropriate for static deployment |
| `auth.js` password in plaintext | Low | "1950" visible in source; acceptable for internal demo, not production |
| No CSP headers | Low | Static file served locally or via GitHub Pages — not a concern yet |
| `var` vs `const/let` mixed | Cosmetic | Some functions use `var` (older style), others use `const/let`; functional |

---

## 2. Performance

### Data Size
- `contract_data.json`: 260KB, 462 contracts — trivially small
- `city_boundaries.js`: 53KB GeoJSON — fine
- Chart.js + Leaflet CDN: ~350KB combined (cached after first load)
- Total page weight: ~900KB first load, <100KB cached

### Rendering
- Debounced filter rendering (150ms) — good
- Chart.js animations are smooth at 462 data points
- Top Contracts table renders all rows without pagination — fine at 462 rows
- Map tile loading depends on internet speed — CartoDB Positron is fast
- Staggered card entrance animations add visual polish without blocking

### Demo Risk: LOW
- 462 contracts is a small dataset — no performance concerns
- All charts render sub-second on modern hardware
- No API calls after initial JSON fetch — everything is client-side
- `?demo=1` mode generates ~600 rows of fake data — also fast

### One concern: PDF export
`html2canvas` captures the entire `#tab-contracts` panel at 1.5x scale. With 12 charts + map + tables, this could take 3-5 seconds and briefly freeze the UI. Not a demo risk unless the presenter clicks "Export PDF" — recommend avoiding it live.

---

## 3. Data Pipeline Integration

### How data flows:
```
City council websites
  → Playwright scrapers (11 cities, per-portal logic)
  → Downloaded PDFs (scraped-data/<city>/)
  → build_pdf_list.py (builds processing queue)
  → run_all.py (orchestrates extraction)
    → pdf_extractor.py (pdfplumber + OCR fallback)
    → claude_client.py (Claude Haiku extraction)
    → excel_writer.py (writes to city Excel files)
  → Contract Logs/<city>_contracts.xlsx
  → build_dashboard_data.py (Excel → JSON)
  → docs/contract_data.json
  → index.html (client-side rendering)
```

### Data refresh workflow:
1. Run scrapers (new PDFs downloaded to `scraped-data/`)
2. `py Processing/build_pdf_list.py` — scan for new PDFs
3. `py Processing/run_all.py` — extract contracts via Claude API
4. `py docs/build_dashboard_data.py` — rebuild JSON from Excel
5. Dashboard auto-loads `contract_data.json` on page load

**Current state:**
- `contract_data.json` generated: 2026-04-14 16:35:13
- 462 contracts from 11 cities (Prosper disabled)
- 399 of 462 (86%) have dollar amounts

### Data schema (`contract_data.json`):
```json
{
  "generated": "2026-04-14 16:35:13",
  "cities_loaded": ["Carrollton", "Celina", "Dallas", ...],
  "cities_skipped": ["Prosper"],
  "total_contracts": 462,
  "contracts": [
    {
      "year": 2026,
      "date": "2026-01-14",
      "company": "HDR Engineering, Inc.",
      "amount": 991727.0,
      "project": "Traffic Signal Design Services...",
      "type": "Traffic & Signals",
      "limits": "Five intersections...",
      "notes": "Professional engineering...",
      "srcFile": "Dallas_CityCouncil_2026-01-14_Agenda.pdf",
      "city": "Dallas",
      "pdfLink": "Open PDF",
      "pageNum": 1
    }
  ]
}
```

### JSON builder (`build_dashboard_data.py`): SOLID
- Reads `cities_config.json` for city enable/disable
- Reads Config sheet from each city's Excel file
- Normalizes project types via `TYPE_MAP` (handles both old and new taxonomy)
- Handles mixed date formats (datetime objects, ISO strings, US date strings)
- Filters out contracts before 2023 (MIN_YEAR)
- Handles `PermissionError` gracefully (file open in Excel)
- Outputs metadata (generated timestamp, cities loaded/skipped, total count)

---

## 4. Robustness

| Scenario | Handled? | How |
|----------|----------|-----|
| `contract_data.json` missing | Yes | Drop screen shows error + "Load sample demo data" link |
| JSON empty (zero contracts) | Yes | Toast error + demo link fallback |
| Leaflet CDN down | Yes | Fallback message in map div |
| Network error during fetch | Yes | Try/catch, error displayed |
| No city boundaries data | Yes | Map renders without GeoJSON |
| Missing amounts ($0) | Yes | Treated as 0, included in counts |
| Unknown project type | Yes | `normalize_type` returns title-cased passthrough |
| Excel file locked (open in another app) | Yes | `build_dashboard_data.py` catches PermissionError, skips city |
| Browser without JavaScript | No | Dashboard is entirely JS-rendered — blank page |

---

## 5. Data Quality Issues

| Issue | Impact | Recommendation |
|-------|--------|---------------|
| **Duplicate firm names** — "Dunaway Associates" (7) and "Dunaway Associates, LLC" (7) are the same firm | Inflates firm count by ~5, splits chart bars | Fix in `consultant_aliases.json` normalization layer |
| **63 missing amounts** (14%) — mostly Plano (60) and Celina (5) | Underreports total value by estimated $30-50M | Document as "minimum known value" or extract amounts from source PDFs |
| **Richardson: 1 contract, $0** | Looks thin; choropleth shows gray | Either disable Richardson until more data, or note it's newly added |
| **"Unknown" project type** shows in filter chips | Mildly confusing | Could rename to "Uncategorized" or filter out |
| **Frisco has 51 contracts but older data shows 1700+ rows** | Config sheet includes summary rows that get filtered by builder; some were lost | Verify Config sheet data completeness |

---

## 6. Next Phase Architecture

### 6a. PM Scraping

**Current state:** No PM data extracted. The `claude_client.py` prompt extracts: company, amount, project name, project type, limits, notes.

**Proposed approach:**
1. **Add `pm_name` to Claude API prompt** — ask for "Project Manager" or "Key Personnel" from the contract document
2. **Extraction point:** PM names typically appear in:
   - PSA signature blocks (at the end of the document)
   - "Key Personnel" or "Project Team" sections within the PSA
   - Agenda memo staff contact (city-side PM, not consultant PM)
3. **Schema addition:** Add `pm_name` column to Excel (col L) and JSON output
4. **Dashboard integration:** PM Tracker tab already has the filter/card UI — just needs data
5. **Confidence:** Medium — PM names are inconsistently formatted across cities and sometimes absent

### 6b. Exhibit A Retrieval Without Full Re-scrape

**Goal:** Retrieve Exhibit A (scope/fee) documents for contracts we already have metadata on.

**Proposed approach:**
1. **Use existing contract metadata** — we have project name, company, date, and city for every contract
2. **Source file links** — many entries include `srcFile` (the PDF they were extracted from) and `pdfLink`
3. **Targeted retrieval strategy:**
   - For cities with CivicClerk/NovusAgenda portals: navigate to the specific meeting agenda, find the contract item, look for Exhibit A attachment
   - Use `project name + "Exhibit A"` as search terms within the portal
   - Key constraint: Exhibit A is usually a PDF attachment to the agenda item, not inline text
4. **Data model:** Add `exhibitA_url` field to contract records; store downloaded PDFs in `scraped-data/<city>/exhibit_a/`
5. **Priority:** Lower than PM scraping — Exhibit A is most useful for detailed competitive analysis, not dashboard display

### 6c. Data Freshness

**Current state:** Footer shows "Data freshness: [timestamp]" and `contract_data.json` includes `generated` timestamp.

**Proposed improvements:**
1. **Per-city last-scraped date** — add `last_scraped` to `cities_config.json`, update after each scraper run
2. **Staleness warning** — if data is >14 days old, show a yellow banner: "Data was last refreshed [X] days ago. Run the pipeline to update."
3. **Automated rebuild** — add `build_dashboard_data.py` as a post-processing step in `run_all.py`'s end-of-run checks
4. **GitHub Actions** — for future: schedule a daily/weekly rebuild and push to GitHub Pages

---

## 7. Architecture Observations

### Strengths
- **Single-file deployment** — `index.html` + `contract_data.json` + assets. No build step, no node_modules. Can serve from any static host or open as a local file.
- **SharePoint version** — `dashboard_sharepoint.html` (631KB) exists as a self-contained single file for intranet deployment. Good for enterprise distribution.
- **URL state** — filter state persists in URL params, enabling shareable links.
- **Demo mode** — `?demo=1` generates fake data for presentations without real data. Smart defensive design.
- **Graceful degradation** — every external dependency has a fallback path.

### Risks for scaling
- **Single-file monolith:** At 3846 lines, the file is manageable but approaching the limit. A build tool (Vite, esbuild) would help if features keep growing.
- **Client-side rendering only:** All 462 contracts are rendered in the browser. Fine for current size, but at 5000+ contracts, chart rendering and table display could slow.
- **No incremental updates:** The entire `contract_data.json` is rebuilt from scratch each time. Fine for 462 records.

---

## Summary

The codebase is clean, well-organized, and production-grade for a PoC. No blocking technical issues for the demo. The data pipeline is robust with proper error handling, and the dashboard handles edge cases gracefully.

**Technical items for demo prep:**
1. Re-run `py docs/build_dashboard_data.py` morning of April 21 for fresh data
2. Test the dashboard on the actual demo machine/projector to verify CDN assets load and map renders
3. Have `?demo=1` URL ready as a fallback if `contract_data.json` fails to load
4. Fix consultant alias duplicates ("Dunaway Associates" / "Dunaway Associates, LLC") in `consultant_aliases.json` if time permits
