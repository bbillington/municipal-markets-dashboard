/**
 * app.js — Municipal Markets dashboard application.
 * Reads docs/data/contracts.json and docs/data/cip.json client-side.
 */

// ── Category taxonomy (mirrors Processing/config.py) ─────────────────────────
const CATEGORIES = {
  roads:      'Roads & Transportation',
  waterww:    'Water/Wastewater',
  waterres:   'Water Resources',
  traffic:    'Traffic & Signals',
  parks:      'Parks & Trails',
  facilities: 'Facilities & Buildings',
  technology: 'Technology & GIS',
  row:        'Right of Way Acquisition',
  survey:     'Survey & SUE',
  cei:        'Construction Inspection Services',
  planning:   'Planning & Engineering Services',
};

const CITY_LABELS = {
  Dallas: 'Dallas', FortWorth: 'Fort Worth', McKinney: 'McKinney',
  Frisco: 'Frisco', Carrollton: 'Carrollton', Celina: 'Celina',
  Plano: 'Plano', Garland: 'Garland', Richardson: 'Richardson',
  Lancaster: 'Lancaster', GrandPrairie: 'Grand Prairie',
};

// Extended color palette — Halff colors for chrome, extended for data series
const CHART_COLORS = [
  '#1C355E','#68949E','#115E6B','#B7CECD','#FC6758',
  '#5B7FA6','#9BB8BE','#2A7F8C','#D4E8E6','#E8776E',
  '#3D5A8A','#7AABB6','#1A8A9A','#C5DDE0','#F49E97',
  '#2B4570','#4D8FA0','#0D6B79','#A8CFCE','#F77B6F',
];

// ── State ─────────────────────────────────────────────────────────────────────
let contracts = [];
let cipData   = [];
let charts    = {};

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  [contracts, cipData] = await Promise.all([
    fetchJSON('data/contracts.json'),
    fetchJSON('data/cip.json'),
  ]);
  renderContracts();
  renderPmTracker();
  renderCip();
  renderProfiles();
});

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// ── Tab routing ───────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt$(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}

function fmtDate(d) {
  if (!d) return '—';
  return d.slice(0, 10);
}

function catLabel(code) {
  if (!code) return '—';
  const clean = code.replace('*', '');
  return CATEGORIES[clean] || code;
}

function cityLabel(c) { return CITY_LABELS[c] || c; }

function sum(arr, key) { return arr.reduce((a, r) => a + (r[key] || 0), 0); }

function groupBy(arr, key) {
  return arr.reduce((acc, r) => {
    const k = r[key] || 'Unknown';
    acc[k] = acc[k] || [];
    acc[k].push(r);
    return acc;
  }, {});
}

function topN(obj, n, valFn) {
  return Object.entries(obj)
    .map(([k, v]) => ({ key: k, val: valFn(v) }))
    .sort((a, b) => b.val - a.val)
    .slice(0, n);
}

function populateSelect(id, values, labelFn) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = sel.options[0].outerHTML;
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = labelFn ? labelFn(v) : v;
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ── CONTRACT AWARDS ───────────────────────────────────────────────────────────
function renderContracts() {
  const cities = [...new Set(contracts.map(r => r.city).filter(Boolean))].sort();
  const cats   = [...new Set(contracts.map(r => (r.project_type || '').replace('*', '')).filter(Boolean))].sort();
  const years  = [...new Set(contracts.map(r => r.year).filter(Boolean))].sort((a, b) => b - a);

  populateSelect('f-city', cities, cityLabel);
  populateSelect('f-cat',  cats,   catLabel);
  populateSelect('f-year', years);
  populateSelect('pm-f-city', cities, cityLabel);
  populateSelect('pm-f-cat',  cats,   catLabel);

  ['f-city','f-cat','f-year','f-firm'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyContractFilters);
    document.getElementById(id)?.addEventListener('input',  applyContractFilters);
  });

  applyContractFilters();
  renderContractCharts(contracts);
}

function getFilteredContracts() {
  const city = document.getElementById('f-city')?.value || '';
  const cat  = document.getElementById('f-cat')?.value  || '';
  const year = document.getElementById('f-year')?.value || '';
  const firm = (document.getElementById('f-firm')?.value || '').toLowerCase();

  return contracts.filter(r => {
    const rCat = (r.project_type || '').replace('*', '');
    return (!city || r.city === city)
      && (!cat  || rCat === cat)
      && (!year || String(r.year) === year)
      && (!firm || (r.company || '').toLowerCase().includes(firm));
  });
}

function applyContractFilters() {
  const filtered = getFilteredContracts();
  renderContractTable(filtered);
  renderContractStats(filtered);
  renderContractCharts(filtered);
}

function clearContractFilters() {
  ['f-city','f-cat','f-year'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('f-firm').value = '';
  applyContractFilters();
}

function renderContractStats(data) {
  const total   = data.length;
  const volume  = sum(data, 'amount');
  const firms   = new Set(data.map(r => r.company).filter(Boolean)).size;
  const cities  = new Set(data.map(r => r.city).filter(Boolean)).size;

  document.getElementById('contract-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Contracts</div><div class="stat-value">${total.toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-label">Total Value</div><div class="stat-value">${fmt$(volume)}</div></div>
    <div class="stat-card"><div class="stat-label">Firms</div><div class="stat-value">${firms}</div></div>
    <div class="stat-card"><div class="stat-label">Cities</div><div class="stat-value">${cities}</div></div>
  `;
}

function renderContractTable(data) {
  const tbody = document.getElementById('contracts-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray4);">No contracts match the current filters.</td></tr>`;
    document.getElementById('contracts-count').textContent = '';
    return;
  }

  const sorted = [...data].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  tbody.innerHTML = sorted.map(r => `
    <tr>
      <td style="white-space:nowrap;">${fmtDate(r.date)}</td>
      <td><span class="city-badge">${cityLabel(r.city)}</span></td>
      <td>${r.company || '—'}</td>
      <td style="color:var(--gray4);font-size:12px;">${r.pm_name || '—'}</td>
      <td>${r.project_name || '—'}</td>
      <td><span class="cat-badge">${catLabel(r.project_type)}</span></td>
      <td class="amt">${fmt$(r.amount)}</td>
    </tr>`).join('');

  document.getElementById('contracts-count').textContent =
    `Showing ${data.length.toLocaleString()} contract${data.length === 1 ? '' : 's'}`;
}

function renderContractCharts(data) {
  // Firm bar chart (top 10 by total value)
  destroyChart('firm');
  const byFirm = topN(groupBy(data, 'company'), 10, arr => sum(arr, 'amount'));
  charts.firm = new Chart(document.getElementById('chart-firm'), {
    type: 'bar',
    data: {
      labels: byFirm.map(f => f.key.length > 28 ? f.key.slice(0, 26) + '…' : f.key),
      datasets: [{ data: byFirm.map(f => f.val), backgroundColor: '#1C355E', borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => fmt$(v) } } },
    },
  });

  // Category pie
  destroyChart('cat');
  const byCat = topN(groupBy(data, 'project_type'), 11, arr => sum(arr, 'amount'));
  charts.cat = new Chart(document.getElementById('chart-cat'), {
    type: 'doughnut',
    data: {
      labels: byCat.map(c => catLabel(c.key)),
      datasets: [{ data: byCat.map(c => c.val), backgroundColor: CHART_COLORS }],
    },
    options: { plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } } },
  });

  // City bar
  destroyChart('cityChart');
  const byCity = topN(groupBy(data, 'city'), 11, arr => sum(arr, 'amount'));
  charts.cityChart = new Chart(document.getElementById('chart-city'), {
    type: 'bar',
    data: {
      labels: byCity.map(c => cityLabel(c.key)),
      datasets: [{ data: byCity.map(c => c.val), backgroundColor: '#68949E', borderRadius: 4 }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => fmt$(v) } } },
    },
  });

  // Year line
  destroyChart('yearChart');
  const byYear = Object.entries(groupBy(data, 'year'))
    .map(([y, arr]) => ({ year: Number(y), val: sum(arr, 'amount') }))
    .sort((a, b) => a.year - b.year);
  charts.yearChart = new Chart(document.getElementById('chart-year'), {
    type: 'bar',
    data: {
      labels: byYear.map(y => y.year),
      datasets: [{
        data: byYear.map(y => y.val),
        backgroundColor: '#115E6B', borderRadius: 4,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => fmt$(v) } } },
    },
  });
}

// ── PM TRACKER ────────────────────────────────────────────────────────────────
function renderPmTracker() {
  ['pm-f-city','pm-f-cat','pm-f-name'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyPmFilters);
    document.getElementById(id)?.addEventListener('input',  applyPmFilters);
  });
  applyPmFilters();
}

function clearPmFilters() {
  ['pm-f-city','pm-f-cat'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('pm-f-name').value = '';
  applyPmFilters();
}

function applyPmFilters() {
  const cityF = document.getElementById('pm-f-city')?.value || '';
  const catF  = document.getElementById('pm-f-cat')?.value  || '';
  const nameF = (document.getElementById('pm-f-name')?.value || '').toLowerCase();

  // Only include rows with a pm_name
  const withPm = contracts.filter(r => r.pm_name && r.pm_name.trim());

  // Build PM map
  const pmMap = {};
  withPm.forEach(r => {
    if (cityF && r.city !== cityF) return;
    const cat = (r.project_type || '').replace('*', '');
    if (catF  && cat !== catF) return;

    const key = `${r.pm_name}||${r.company}`;
    if (!pmMap[key]) {
      pmMap[key] = { name: r.pm_name, firm: r.company, contracts: [], cities: new Set(), cats: new Set() };
    }
    pmMap[key].contracts.push(r);
    pmMap[key].cities.add(r.city);
    pmMap[key].cats.add(cat);
  });

  let pms = Object.values(pmMap)
    .sort((a, b) => b.contracts.length - a.contracts.length);

  if (nameF) {
    pms = pms.filter(p =>
      p.name.toLowerCase().includes(nameF) ||
      (p.firm || '').toLowerCase().includes(nameF)
    );
  }

  const grid  = document.getElementById('pm-grid');
  const empty = document.getElementById('pm-empty');

  if (!pms.length) {
    grid.innerHTML = '';
    empty.style.display = withPm.length ? 'block' : 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = pms.map(p => {
    const total = sum(p.contracts, 'amount');
    const cats  = [...p.cats].map(c => catLabel(c)).join(', ');
    const cities = [...p.cities].map(c => cityLabel(c)).join(', ');
    return `
      <div class="pm-card">
        <div class="pm-name">${p.name}</div>
        <div class="pm-firm">${p.firm || 'Unknown Firm'}</div>
        <div class="pm-stats">
          <div class="pm-stat-item"><div class="pm-stat-n">${p.contracts.length}</div><div class="pm-stat-lbl">Awards</div></div>
          <div class="pm-stat-item"><div class="pm-stat-n">${fmt$(total)}</div><div class="pm-stat-lbl">Total Value</div></div>
        </div>
        <div class="pm-cities">${cities}</div>
        <div class="pm-cats">${cats}</div>
      </div>`;
  }).join('');
}

// ── CIP & BONDS ───────────────────────────────────────────────────────────────
function renderCip() {
  const cities = [...new Set(cipData.map(r => r.city).filter(Boolean))].sort();
  const cats   = [...new Set(cipData.map(r => r.category).filter(Boolean))].sort();
  const years  = [...new Set(cipData.map(r => r.bond_cip_year).filter(Boolean))].sort((a, b) => b - a);

  populateSelect('cip-city', cities, cityLabel);
  populateSelect('cip-cat',  cats,   catLabel);
  populateSelect('cip-year', years);

  ['cip-city','cip-cat','cip-year'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyCipFilters);
  });

  applyCipFilters();
}

function applyCipFilters() {
  const cityF = document.getElementById('cip-city')?.value || '';
  const catF  = document.getElementById('cip-cat')?.value  || '';
  const yearF = document.getElementById('cip-year')?.value || '';

  const filtered = cipData.filter(r =>
    (!cityF || r.city === cityF) &&
    (!catF  || r.category === catF) &&
    (!yearF || String(r.bond_cip_year) === yearF)
  );

  renderCipTable(filtered);
  renderCipChart(filtered);
}

function renderCipTable(data) {
  const tbody = document.getElementById('cip-tbody');
  const empty = document.getElementById('cip-empty');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = [...data]
    .sort((a, b) => (b.bond_cip_year || 0) - (a.bond_cip_year || 0))
    .map(r => `
      <tr>
        <td><span class="city-badge">${cityLabel(r.city)}</span></td>
        <td>${r.project_name || '—'}</td>
        <td><span class="cat-badge">${catLabel(r.category)}</span></td>
        <td>${r.bond_cip_year || '—'}</td>
        <td class="amt">${fmt$(r.funded_amount)}</td>
        <td><span style="color:var(--teal);font-size:12px;">${r.status || '—'}</span></td>
      </tr>`).join('');
}

function renderCipChart(data) {
  destroyChart('cipBar');

  const years = [...new Set(data.map(r => r.bond_cip_year).filter(Boolean))].sort();
  const catKeys = [...new Set(data.map(r => r.category).filter(Boolean))].sort();

  const datasets = catKeys.map((cat, i) => ({
    label: catLabel(cat),
    data: years.map(y => sum(data.filter(r => r.category === cat && r.bond_cip_year === y), 'funded_amount')),
    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
    borderRadius: 3,
  }));

  charts.cipBar = new Chart(document.getElementById('chart-cip-bar'), {
    type: 'bar',
    data: { labels: years, datasets },
    options: {
      plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, ticks: { callback: v => fmt$(v) } },
      },
    },
  });
}

// ── CITY PROFILES ─────────────────────────────────────────────────────────────
function renderProfiles() {
  const grid  = document.getElementById('profiles-grid');
  const empty = document.getElementById('profiles-empty');

  const cities = [...new Set(contracts.map(r => r.city).filter(Boolean))].sort();

  if (!cities.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = cities.map(city => {
    const cc = contracts.filter(r => r.city === city);
    const total  = sum(cc, 'amount');
    const recent = [...cc].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);

    // Top firm
    const byFirm = groupBy(cc, 'company');
    const topFirm = topN(byFirm, 1, arr => arr.length)[0];

    // Top category
    const byCat = groupBy(cc, 'project_type');
    const topCat = topN(byCat, 1, arr => sum(arr, 'amount'))[0];

    // CIP spend
    const cipCity = cipData.filter(r => r.city === city);
    const cipTotal = sum(cipCity, 'funded_amount');

    const recentRows = recent.map(r =>
      `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid var(--gray1);color:var(--dark);">
        ${fmtDate(r.date)} — ${(r.company || '').slice(0, 28)} — ${fmt$(r.amount)}
      </div>`
    ).join('');

    return `
      <div class="profile-card">
        <div class="profile-city">${cityLabel(city)}</div>
        <div class="profile-row"><span class="profile-key">Contracts</span><span class="profile-val">${cc.length}</span></div>
        <div class="profile-row"><span class="profile-key">Total Awarded</span><span class="profile-val">${fmt$(total)}</span></div>
        <div class="profile-row"><span class="profile-key">Top Firm</span><span class="profile-val">${topFirm ? topFirm.key.slice(0, 24) : '—'}</span></div>
        <div class="profile-row"><span class="profile-key">Top Category</span><span class="profile-val">${topCat ? catLabel(topCat.key) : '—'}</span></div>
        ${cipTotal ? `<div class="profile-row"><span class="profile-key">CIP Pipeline</span><span class="profile-val">${fmt$(cipTotal)}</span></div>` : ''}
        ${recentRows ? `<div style="margin-top:10px;"><div style="font-size:11px;color:var(--gray4);margin-bottom:4px;">RECENT AWARDS</div>${recentRows}</div>` : ''}
      </div>`;
  }).join('');
}
