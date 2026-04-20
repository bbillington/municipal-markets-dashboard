# Scraper Strategy Guide — Building New City Scrapers

Reference for adding new municipalities to the Contract Intelligence pipeline.
Based on lessons learned troubleshooting 11 Texas cities across 6 different
municipal meeting platforms.

---

## Step 1: Identify the Platform

Open the city's agenda/meeting page in a browser and check the URL patterns:

| Platform | URL Indicators | Template Scraper |
|----------|---------------|------------------|
| **Legistar** | `cityname.legistar.com` | `Dallas_Scraper.pyw` / `FortWorth_Scraper.pyw` / `McKinney_Scraper.pyw` |
| **CivicClerk** | `cityname.portal.civicclerk.com` | `Celina_Scraper.pyw` / `Garland_Scraper.pyw` |
| **Granicus** | `cityname.granicus.com` | `Carrollton_Scraper.pyw` |
| **OnBase** | `agenda.cityname.gov/OnBaseAgendaOnline` | `Frisco_Scraper.pyw` |
| **NovusAgenda** | `cityname.novusagenda.com/agendapublic` | `Plano_Scraper.pyw` |
| **Municode** | `meetings.municode.com/PublishPage/index?cid=CITY` | `GrandPrairie_Scraper.pyw` |
| **CivicPlus** | `cityname.civicplus.com/AgendaCenter` | `Lancaster_Scraper.pyw` (partial) |

If none of these match, check for:
- Embedded iframes (view page source, search for `<iframe`)
- RSS feeds (`/rss.aspx`, `/Feed.ashx`, `/ViewPublisherRSS.php`)
- Direct PDF links on the meeting page

---

## Step 2: Playwright Probe Script

Run this first to understand the page structure before writing any scraper code:

```python
from playwright.sync_api import sync_playwright
import time, re

CITY_URL = "https://example-city.gov/meetings"

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(CITY_URL, timeout=30000)
    time.sleep(5)

    # 1. What links exist?
    print("=== Links with agenda/meeting keywords ===")
    for link in page.query_selector_all("a"):
        text = (link.inner_text() or "").strip()[:60]
        href = link.get_attribute("href") or ""
        if any(kw in text.lower() for kw in ["agenda", "packet", "minute", "council", "meeting"]):
            print(f'  "{text}" -> {href[:120]}')
        elif ".pdf" in href.lower():
            print(f'  [PDF] "{text}" -> {href[:120]}')

    # 2. Are there iframes? (Municode, PDF viewers, embedded portals)
    print("\n=== Iframes ===")
    for iframe in page.query_selector_all("iframe"):
        src = iframe.get_attribute("src") or ""
        print(f"  {src[:150]}")

    # 3. What dropdowns/filters exist?
    print("\n=== Dropdowns ===")
    for select in page.query_selector_all("select"):
        sid = select.get_attribute("id") or ""
        options = [(o.get_attribute("value"), o.inner_text().strip())
                   for o in select.query_selector_all("option")]
        print(f'  <select id="{sid}"> {options[:5]}')

    # 4. Check for direct API/blob download URLs
    print("\n=== API/download URLs in page ===")
    for link in page.query_selector_all("a"):
        href = link.get_attribute("href") or ""
        if any(kw in href.lower() for kw in ["getmeetingfile", "viewfile", "view.ashx",
                                               "blob.core", "displayagendapdf"]):
            print(f"  {href[:150]}")

    browser.close()
```

---

## Step 3: Platform-Specific Patterns

### Legistar (Dallas, FortWorth, McKinney)

**Key details:**
- DepartmentDetail pages show a single body (City Council) pre-filtered
- Calendar pages show all bodies and need filtering
- The "All Years" date filter requires a **2-step click**: first click the
  current view trigger ("This Month" / "This Year"), then click "All Years"
  in the dropdown that opens
- Grid table uses `rgMasterTable` class with `rgRow`/`rgAltRow` rows
- Agenda PDFs at `View.ashx?M=A&ID=...`, minutes at `View.ashx?M=M&ID=...`
- Meeting details at `MeetingDetail.aspx?ID=...`
- Pagination via `rgPageNext` button

**Common pitfall:** The date filter dropdown trigger text varies by page.
Try these selectors in order:
```python
for trigger in ["a:has-text('This Month')", "a:has-text('This Year')",
                "a:has-text('Date:')", "a:has-text('Month')"]:
    page.click(trigger, timeout=1500)
    page.click("a:has-text('All Years')", timeout=3000)
```

### CivicClerk (Celina, Garland)

**Key details:**
- React MUI single-page application
- Event cards are wrapped in `<a href="/event/{id}/files">` anchors
- The anchor's `inner_text()` contains the full card: day name, date, time,
  then meeting name (e.g., "City Council Regular Meeting")
- **Do NOT use `el.closest("div,li")` for title extraction** — the React
  component tree doesn't map to simple HTML nesting
- Filter by "council" in the anchor's full text

**Download strategy (most reliable):**
Navigate to `/event/{id}/files` and look for direct API URLs:
```python
links = page.query_selector_all("a")
for link in links:
    href = link.get_attribute("href") or ""
    if "GetMeetingFileStream" in href or "civicclerk.blob.core.windows.net" in href:
        # Direct PDF download via requests.get(href)
```
The first URL is typically the Agenda; the second is the Agenda Packet.

**Common pitfall:** `most_recent_only` may pick a future meeting that has no
files posted yet. Prefer the most recent **past** meeting.

### Granicus (Carrollton)

**Key details:**
- RSS feed at `/ViewPublisherRSS.php?view_id=N&mode=agendas`
- Meeting pages use JavaScript to render the PDF viewer
- Use Playwright to open each meeting page and scan for `DocumentViewer.php`
  URLs in iframes, embeds, objects, or page source

### OnBase (Frisco)

**Key details:**
- Custom date-range search with `dropid=11` (Custom Date Range)
- Search params: `dropsv`/`dropev` for start/end timestamps, `mtids` for meeting type
- Agenda items are expandable — click to reveal download links
- Use Playwright `expect_download()` for file downloads
- Per-meeting `_downloaded_log.json` tracks by href to avoid re-downloads

### NovusAgenda (Plano)

**Key details:**
- Playwright selects meeting type from dropdown (e.g., "City Council Regular Meeting")
- Custom date range via dropdown + input fields
- Pagination via "Next Page" link
- Direct PDF URLs: `DisplayAgendaPDF.ashx?MeetingID=XXXX`
- Fragile element IDs (`SearchAgendasMeetings_ctl00`, etc.) — will break if site updates

### Municode (GrandPrairie)

**Key details:**
- Often embedded as an iframe on the city's main meeting page
- Navigate directly to the Municode URL: `meetings.municode.com/PublishPage/index?cid=CITY&ppid=GUID`
- Table with columns: Meeting, Venue, Date, Time, Agenda, Packet, Minutes
- Direct PDF links at `mccmeetings.blob.core.usgovcloudapi.net`
- Filter by "council" in the meeting name column
- Pagination links at bottom of table

### CivicPlus (Lancaster, Richardson)

**Key details — this is the hardest platform:**
- JavaScript SPA that may render empty even with Playwright
- `requests.get()` returns skeleton HTML without content
- Try these approaches in order:
  1. Check for embedded Municode iframe
  2. Try RSS feed at `/AgendaCenter/RSS/`
  3. Navigate to specific pages: `/1548/City-Council-Agendas`, `/ArchiveCenter/ViewFile/Item/N`
  4. Use Calendar event pages: `/Calendar.aspx?EID=NNNN`
  5. Interact with category dropdown + Search button via Playwright
- Some CivicPlus sites (Richardson) have aggressive WAF that returns 403 on all
  automated requests — flag these for manual download

---

## Step 4: Common Issues and Fixes

### Date range defaults
Always include future meetings — agenda packets are often posted before the
meeting date:
```python
if most_recent_only or not start_date:
    end_date = datetime.now() + timedelta(days=60)
    start_date = datetime.now() - timedelta(days=90)
```

### Windows encoding crashes
Headless scrapers pipe stdout through Windows cp1252 encoding. Avoid Unicode
characters in log messages (`->` not `\u2192`). Set environment variable:
```python
env["PYTHONIOENCODING"] = "utf-8"
```

### PDF signature verification
Always verify downloaded files start with `%PDF-`:
```python
with open(path, "rb") as f:
    if f.read(5) != b"%PDF-":
        os.remove(path)  # HTML error page, not a PDF
```

### build_pdf_list.py keyword filter
Cities that download individual attachments (Dallas, FortWorth, McKinney, Frisco)
use keyword filtering. Ensure the keyword list includes:
`AGENDA, RESOLUTION, ORDINANCE, CONTRACT, AWARD, PSA, ENGINEER, SERVICE, AMENDMENT`

Cities that download full agenda packets (Plano, Celina, Carrollton, Garland,
GrandPrairie, Lancaster, Richardson) should use `"all_pdfs": True`.

### Headless mode
Every scraper must support `HALFF_HEADLESS=1` environment variable:
```python
if __name__ == "__main__":
    if os.environ.get("HALFF_HEADLESS") == "1":
        run_headless()
    else:
        main()
```
The `run_headless()` function creates stub widgets, loads settings from JSON,
and calls the core scraper function directly.

### Settings bridge
The Master Launcher writes panel values (dates, headless toggle, search terms)
to each scraper's settings JSON before launching it. Scraper settings files
live in `Scrapers/` with names like `cityname_scraper_settings.json`.

---

## Step 5: New Scraper Checklist

- [ ] Identify platform (Step 1)
- [ ] Run Playwright probe (Step 2)
- [ ] Copy closest template scraper and rename
- [ ] Update: `CITY`, `BASE_URL`, `COUNCIL_URL`, `VERSION`, `CITY_CONFIG`
- [ ] Update: `DEFAULT_DOWNLOAD_ROOT`, `SETTINGS_FILE`, folder prefix
- [ ] Implement `_collect_meetings()` or equivalent for the platform
- [ ] Implement download logic (prefer direct URLs over viewer extraction)
- [ ] Add `run_headless()` with `HALFF_HEADLESS` dispatch
- [ ] Guard any `messagebox` calls with `if not headless:`
- [ ] Add city to `Master_Launcher.pyw`: `SCRAPERS`, `CITY_EXCEL_FILES`, `SCRAPER_SETTINGS`
- [ ] Add city to `Processing/config.py`: `SCRAPER_DOWNLOAD_DIRS`, `CITIES`
- [ ] Add city to `Processing/build_pdf_list.py`: `CITY_CONFIGS`
- [ ] Test: `HALFF_HEADLESS=1 py Scrapers/NewCity_Scraper.pyw`
- [ ] Test: `py Processing/build_pdf_list.py` (verify PDFs queued)
- [ ] Test: `py Processing/run_all.py --city NewCity --limit 3`
- [ ] Verify Excel output in `Contract Logs/newcity_contracts.xlsx`
- [ ] Run `ruff check Scrapers/NewCity_Scraper.pyw --fix && ruff format`
