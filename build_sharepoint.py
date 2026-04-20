"""
Build a self-contained HTML file for SharePoint deployment.
Inlines contract_data.json, city_boundaries.js, and logo images
so no fetch() calls are needed.

Usage:
    py docs/build_sharepoint.py

Output:
    docs/dashboard_sharepoint.html
"""

import base64
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(SCRIPT_DIR, "index.html")
JSON_PATH = os.path.join(SCRIPT_DIR, "contract_data.json")
BOUNDARIES_PATH = os.path.join(SCRIPT_DIR, "city_boundaries.js")
LOGO_PATH = os.path.join(SCRIPT_DIR, "assets", "halff_logo.png")
ICON_PATH = os.path.join(SCRIPT_DIR, "assets", "halff_icon.png")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "dashboard_sharepoint.html")


def file_to_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def main():
    # Read source files
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        html = f.read()
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        json_data = f.read()
    with open(BOUNDARIES_PATH, "r", encoding="utf-8") as f:
        boundaries_js = f.read()

    # Base64 encode images
    logo_b64 = file_to_base64(LOGO_PATH)
    icon_b64 = file_to_base64(ICON_PATH)

    # 1. Replace city_boundaries.js script tag with inline
    html = html.replace(
        '<script src="city_boundaries.js"></script>',
        f"<script>\n{boundaries_js}\n</script>",
    )

    # 2. Replace logo image src with base64 data URI
    html = html.replace(
        'src="assets/halff_logo.png"', f'src="data:image/png;base64,{logo_b64}"'
    )

    # 3. Replace favicon with base64 data URI
    html = html.replace(
        'href="assets/halff_icon.png"', f'href="data:image/png;base64,{icon_b64}"'
    )

    # 4. Replace the entire loadContractData() function with inlined data.
    #    Find exact function boundaries using string markers.
    fn_start = "function loadContractData() {"
    fn_end_marker = "\nfunction generateDemoData"
    start_idx = html.find(fn_start)
    end_idx = html.find(fn_end_marker, start_idx)
    if start_idx >= 0 and end_idx >= 0:
        inline_loader = "function loadContractData() {\n"
        inline_loader += "  // Data inlined for SharePoint deployment\n"
        inline_loader += "  var json = " + json_data + ";\n"
        inline_loader += """  var contracts = json.contracts || [];
  if (contracts.length === 0) {
    hideLoading();
    showToast('No Data', 'No contracts found in inlined data.', 'error');
    return;
  }
  contracts.forEach(function(r) {
    if (r.date && typeof r.date === 'string') {
      r.date = new Date(r.date + 'T00:00:00');
    }
  });
  STATE.allData = contracts;
  STATE.filesLoaded = json.cities_loaded ? json.cities_loaded.length : 1;
  STATE.lastModified = json.generated ? new Date(json.generated).getTime() : Date.now();
  STATE.dataGenerated = json.generated || null;
  updateLoadingText('Loaded ' + contracts.length + ' contracts from ' + (json.cities_loaded || []).length + ' cities');
  finalizeDashboard();
  if (json.generated) {
    showToast('Data Loaded', json.total_contracts + ' contracts from ' + (json.cities_loaded || []).length + ' cities. Data generated: ' + json.generated);
  }
  if (json.cities_skipped && json.cities_skipped.length > 0) {
    showToast('Cities Skipped', json.cities_skipped.join(', '), 'warn');
  }
}

"""
        html = (
            html[:start_idx] + inline_loader + html[end_idx + 1 :]
        )  # +1 to skip the \n
        print("  OK   Replaced loadContractData() with inlined data")
    else:
        print(
            f"  WARN Could not find loadContractData() — start={start_idx} end={end_idx}"
        )

    # Write output
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"  Output: {OUTPUT_PATH}")
    print(f"  Size:   {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
