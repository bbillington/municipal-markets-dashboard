"""
Build dashboard data — reads Contract Logs Excel files and produces
docs/contract_data.json for the static dashboard.

Usage:
    py docs/build_dashboard_data.py

Reads:
    - docs/cities_config.json   (which cities to include)
    - Contract Logs/<slug>_contracts.xlsx  (Config sheet per city)

Writes:
    - docs/contract_data.json   (single JSON consumed by dashboard)
"""

import json
import os
import re
import sys
from datetime import datetime, date

# Ensure UTF-8 output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# ---------- paths ----------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
CONFIG_PATH = os.path.join(SCRIPT_DIR, "cities_config.json")
LOGS_DIR = os.path.join(REPO_ROOT, "Contract Logs")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "contract_data.json")

# Project type normalization (matches dashboard spec)
TYPE_MAP = {
    "roads": "Roadway",
    "road": "Roadway",
    "roadway": "Roadway",
    "planning": "Planning / Study",
    "study": "Planning / Study",
    "planning / study": "Planning / Study",
    "waterres": "Water / Wastewater",
    "water resources": "Water / Wastewater",
    "waterww": "Water / Wastewater",
    "water/wastewater": "Water / Wastewater",
    "water / wastewater": "Water / Wastewater",
    "parks": "Park / Trail",
    "park": "Park / Trail",
    "trail": "Park / Trail",
    "park / trail": "Park / Trail",
    "traffic": "Traffic & Signals",
    "signals": "Traffic & Signals",
    "traffic & signals": "Traffic & Signals",
    "facilities": "Facilities",
    "buildings": "Facilities",
    "facilities & buildings": "Facilities",
    "facilities / buildings": "Facilities",
    "survey": "Survey & SUE",
    "sue": "Survey & SUE",
    "survey & sue": "Survey & SUE",
    "surveying": "Survey & SUE",
    "cei": "Construction Inspection",
    "inspection": "Construction Inspection",
    "construction inspection": "Construction Inspection",
    "technology": "Technology & GIS",
    "gis": "Technology & GIS",
    "technology & gis": "Technology & GIS",
    "row": "Right of Way",
    "right of way": "Right of Way",
    "drainage": "Drainage",
    "storm drainage": "Drainage",
    "drainage / stormwater": "Drainage",
    "environmental": "Environmental",
    "streambank stabilization": "Drainage",
    "intersection / traffic": "Traffic & Signals",
    "bridge / structural": "Bridge / Structural",
    "on-call": "On-Call",
    "other engineering": "Other Engineering",
}


MIN_YEAR = 2023  # Exclude contracts before this year

# ── Architecture & non-engineering firm exclusions ──────────────────────────
# These firms are filtered OUT of contract_data.json so the dashboard never
# sees them.  The dashboard JS (index.html) has a parallel runtime filter as
# a safety net, but this is the authoritative gate — it keeps the JSON small
# and prevents architecture/non-engineering contracts from inflating stats.
#
# Rules:
#   - Architecture firms: case-insensitive *partial* match against company name.
#   - PGAL: exact-word match (avoids false positives on other acronyms).
#   - Non-engineering firms: partial match with optional conditions.
#   - Landscape architecture firms (Talley, JBI Partners, Mesa Design, SWA
#     Group, Dunaway, Freese and Nichols, etc.) are deliberately KEPT.
#   - Planning/study work is kept even if awarded to an architecture firm
#     (that filtering is handled by project_type, not company name).
#
# To add/remove firms, edit the lists below and re-run this script.

EXCLUDED_ARCHITECTURE_FIRMS = [
    "harley ellis",
    "quorum architects",
    "conduit architecture",
    "magee architects",
    "hoefer welker",
    "brinkley sargent",
    "smithgroup",
    # Gensler (M. Arthur Gensler Jr. & Associates, Inc.) — world's largest
    # architecture firm by revenue. Pure architecture / interior design.
    # No civil engineering practice. Hard-exclude (not toggleable).
    "gensler",
    "m. arthur gensler",
    # KAI Enterprises — architecture-led firm. KBHCC Component 4 = architecture.
    # Hard-exclude.
    "kai/alliance",
    "kai design",
    "kai enterprises",
    # PGAL is handled separately via exact-word match below
]

EXCLUDED_NON_ENGINEERING_FIRMS = [
    # Only the PM division — "Jacobs Engineering" must NOT be excluded.
    "jacobs project management",
    # Construction contractor, not an engineering consultant.
    "kik underground",
]

# Toggleable outliers: kept in the JSON with outlier=True so the dashboard can
# flip them on/off. Rationale: architecture-led civic-campus/stadium work with
# dollar values orders of magnitude above typical engineering PSAs. Distorts
# charts and totals when mixed with engineering consultants.
#
# Flat firm list — EVERY contract from these firms is an outlier:
#   - Perkins & Will: architecture firm, only hits civic-campus work at Halff's scale
#   - DLR Group: architecture firm, same
#   - Inspire Dallas LLC: project manager / owner's rep for KBHCC Master Plan
#     (NOT an engineering firm — same category as jacobs project management)
OUTLIER_TOGGLEABLE_FIRMS = [
    "perkins & will",
    "dlr group",
    "inspire dallas",
]

# Threshold rules — firms whose large civic-campus/stadium work is an outlier
# but who also do legitimate smaller engineering/planning work that should stay.
# A contract is flagged only if firm matches AND amount >= min_amount.
# (Empty list for now — Gensler and KAI moved to hard-exclude. Kept for
# future use if a firm shows up that needs a per-amount rule.)
OUTLIER_TOGGLEABLE_THRESHOLDS: list = []


def _is_toggleable_outlier(company: str, amount: float = 0) -> bool:
    """Return True if the contract should be flagged as a toggleable outlier."""
    if not company:
        return False
    name = company.lower()
    for firm in OUTLIER_TOGGLEABLE_FIRMS:
        if firm in name:
            return True
    try:
        amt = float(amount) if amount else 0
    except (ValueError, TypeError):
        amt = 0
    for rule in OUTLIER_TOGGLEABLE_THRESHOLDS:
        if rule["match"] in name and amt >= rule["min_amount"]:
            return True
    return False


def _is_excluded_firm(company: str) -> bool:
    """Return True if the company should be excluded from the dashboard JSON.

    Architecture firms use case-insensitive substring matching.
    PGAL uses word-boundary matching to avoid false positives.
    Non-engineering firms use case-insensitive substring matching.
    Toggleable outliers (Perkins & Will, DLR Group) are NOT excluded here —
    they pass through with outlier=True so the dashboard can show/hide them.
    """
    if not company:
        return False
    name = company.lower()

    # Architecture firms — partial match
    for firm in EXCLUDED_ARCHITECTURE_FIRMS:
        if firm in name:
            return True

    # PGAL — exact word match (surrounded by word boundaries or at string edges)
    # Matches: "PGAL", "PGAL, Inc.", "PGAL Architects" but not "xyzPGALabc"
    if re.search(r"\bpgal\b", name):
        return True

    # Non-engineering firms — partial match
    for firm in EXCLUDED_NON_ENGINEERING_FIRMS:
        if firm in name:
            return True

    return False


def normalize_type(raw):
    if not raw:
        return "Unknown"
    key = str(raw).strip().lower()
    if key in TYPE_MAP:
        return TYPE_MAP[key]
    # Title-case passthrough
    return str(raw).strip().title()


def parse_date(val):
    """Convert Excel date value to ISO string."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, date):
        return val.strftime("%Y-%m-%d")
    # Try string parsing
    s = str(val).strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def read_city(slug, label, xlsx_path):
    """Read Config sheet from a city Excel file, return list of row dicts."""
    import openpyxl

    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    if "Config" not in wb.sheetnames:
        print(f"  WARNING: {slug} has no Config sheet, skipping")
        wb.close()
        return []

    ws = wb["Config"]

    # Detect column layout — old Config has 12 cols (no PM Name), new has 13
    header_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
    headers = [str(h).strip().lower() if h else "" for h in header_row]
    has_pm = "pm name" in headers
    # Column offsets after Notes (index 7): with PM → +1 shift for src/city/pdf/page
    pm_off = 1 if has_pm else 0

    rows = []
    for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
        year = row[0]
        date_val = parse_date(row[1])
        company = str(row[2]).strip() if row[2] else ""
        amount = row[3]
        project = str(row[4]).strip() if row[4] else ""
        proj_type = normalize_type(row[5])
        limits = str(row[6]).strip() if row[6] else ""
        notes = str(row[7]).strip() if row[7] else ""
        pm_name = str(row[8]).strip() if has_pm and len(row) > 8 and row[8] else ""
        src_file = (
            str(row[8 + pm_off]).strip()
            if len(row) > 8 + pm_off and row[8 + pm_off]
            else ""
        )
        city = label  # Use the config label, not whatever is in the cell
        pdf_idx = 10 + pm_off
        page_idx = 11 + pm_off
        pdf_link = (
            str(row[pdf_idx]).strip() if len(row) > pdf_idx and row[pdf_idx] else ""
        )
        page_num = row[page_idx] if len(row) > page_idx else None

        # Skip rows with no company and no amount (metadata rows)
        if not company and not amount:
            continue

        # Exclude contracts before MIN_YEAR
        if year is not None and year < MIN_YEAR:
            continue

        # Ensure amount is numeric
        try:
            amount = float(amount) if amount else 0
        except (ValueError, TypeError):
            amount = 0

        # Ensure year is int
        try:
            year = int(year) if year else None
        except (ValueError, TypeError):
            year = None

        row_dict = {
            "year": year,
            "date": date_val,
            "company": company,
            "amount": amount,
            "project": project,
            "type": proj_type,
            "limits": limits,
            "notes": notes,
            "pmName": pm_name,
            "srcFile": src_file,
            "city": city,
            "pdfLink": pdf_link,
            "pageNum": int(page_num) if page_num else None,
        }
        if _is_toggleable_outlier(company, amount):
            row_dict["outlier"] = True
        rows.append(row_dict)

    wb.close()
    return rows


def main():
    # Load city config
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    cities = config.get("cities", {})
    all_rows = []
    loaded_cities = []
    skipped_cities = []
    total_excluded = 0

    for slug, info in cities.items():
        if not info.get("enabled", True):
            skipped_cities.append(info.get("label", slug))
            continue

        xlsx_path = os.path.join(LOGS_DIR, f"{slug}_contracts.xlsx")
        if not os.path.exists(xlsx_path):
            print(f"  SKIP {slug}: file not found at {xlsx_path}")
            skipped_cities.append(info.get("label", slug))
            continue

        label = info.get("label", slug.title())
        try:
            rows = read_city(slug, label, xlsx_path)
            # Filter out architecture / non-engineering firms before adding
            before = len(rows)
            excluded_names = []
            kept = []
            for r in rows:
                if _is_excluded_firm(r.get("company", "")):
                    excluded_names.append(r.get("company", "?"))
                else:
                    kept.append(r)
            rows = kept
            n_excluded = before - len(rows)
            total_excluded += n_excluded

            all_rows.extend(rows)
            loaded_cities.append(label)
            n_outliers = sum(1 for r in rows if r.get("outlier"))
            parts = []
            if n_excluded:
                parts.append(f"{n_excluded} excluded")
            if n_outliers:
                parts.append(f"{n_outliers} outlier-flagged")
            suffix = f"  ({', '.join(parts)})" if parts else ""
            print(f"  OK   {label:20s} {len(rows):5d} contracts{suffix}")
        except PermissionError:
            print(f"  LOCK {label:20s} file is open in another program, skipping")
            skipped_cities.append(label)
        except Exception as e:
            print(f"  ERR  {label:20s} {e}")
            skipped_cities.append(label)

    # Build output
    output = {
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "cities_loaded": sorted(loaded_cities),
        "cities_skipped": sorted(skipped_cities),
        "total_contracts": len(all_rows),
        "contracts": all_rows,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    print()
    print(f"Output: {OUTPUT_PATH}")
    print(f"Cities loaded: {len(loaded_cities)} ({', '.join(sorted(loaded_cities))})")
    if skipped_cities:
        print(
            f"Cities skipped: {len(skipped_cities)} ({', '.join(sorted(skipped_cities))})"
        )
    print(f"Total contracts: {len(all_rows)}")
    if total_excluded:
        print(f"Excluded (arch/non-eng firms): {total_excluded}")
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"File size: {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
