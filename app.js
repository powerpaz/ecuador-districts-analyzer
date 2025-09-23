/* =========================================================
   ECUADOR DISTRICTS ANALYZER — JS ROBUSTO PARA PAGES
   ========================================================= */

/* =================== CONFIG =================== */
const CONFIG = {
  // CSV relativo (si /data está junto a index.html)
  csvRelative: 'data/distritos.csv',

  // CSV absoluto (RAW GitHub) — ajusta usuario/repo/rama si cambias
  csvAbsolute:
    'https://raw.githubusercontent.com/powerpaz/ecuador-districts-analyzer/main/data/distritos.csv',

  // TopoJSON/GeoJSON de provincias (primero intenta .json; si no, .geojson)
  provinciasTopo: 'data/provincias.json',
  provinciasGeo: 'data/provincias.geojson',

  // Logo opcional (no detiene la app si no existe)
  logo: 'logo.png',

  // Fuerza contador total visible en cabecera; pon null para que sea dinámico
  forceTotalCount: 140,

  // Supabase (deja url/anonKey en "" si quieres desactivarlo)
  supabaseUrl: 'https://eunujfywdwipguopstru.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bnVqZnl3ZHdpcGd1b3BzdHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzM3MDksImV4cCI6MjA3NDE0OTcwOX0.Jf-QSpS6K0yh_JCX1IVtEC8Amq1Or9XwLjc9dtsxLAs',
};

/* ============ UTILIDADES BÁSICAS ============ */
const $ = (sel) => document.querySelector(sel);
const log = (...a) => console.log('[EC-Distritos]', ...a);
const warn = (...a) => console.warn('[EC-Distritos]', ...a);
const err = (...a) => console.error('[EC-Distritos]', ...a);

function toFloat(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v).trim().replace(/\s+/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function norm(s) {
  return (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
function colorFor(cat) {
  const M = {
    MINEDUC: '#2563eb',
    SENECYT: '#10b981',
    'SENECYT - ZONA DEPORTE': '#06b6d4',
    'ZONA DEPORTE': '#f59e0b',
    'OT DEPORTE': '#ef4444',
    'SIN ETIQUETA': '#6b7280',
  };
  for (const k in M) if ((cat || '').toUpperCase().includes(k)) return M[k];
  return '#6b7280';
}
function formatCoord(c) {
  const n = Number(c);
  return Number.isFinite(n) ? n.toFixed(6) : '—';
}

/* ============ ESTADO GLOBAL ============ */
let records = []; // [{lat,lng,provincia,canton,complement,campos:{...}}]
let filtered = [];
let chips = [];
let provs = [];
let cantByProv = {};
let selectedCats = new Set();
let SEARCH = { index: [] };

let map, cluster, provLayer;
let DATA_SOURCE = 'desconocido';

// ============ POPUP (solo columnas en minúsculas; fallback a MAYÚSCULAS) ============
function popupHTML(c) {
  // lector seguro: primero minúsculas, si no existen prueba MAYÚSCULAS
  const get = (lo, up) => (c?.[lo] ?? c?.[up] ?? '');

  // helper para no imprimir filas vacías
  const row = (label, lo, up) => {
    const v = get(lo, up);
    return (v == null || String(v).trim() === '')
      ? ''
      : `<div style="padding:8px 10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.03)">
           <div style="font-size:.72rem;letter-spacing:.02em;opacity:.75;text-transform:uppercase">${label}</div>
           <div style="font-weight:600">${v}</div>
         </div>`;
  };

  const cod = get('cod_distri','COD_DISTRI');
  const nom = get('nom_distri','NOM_DISTRI');
  const prov = get('dpa_despro','DPA_DESPRO');
  const cant = get('dpa_descan','DPA_DESCAN');

  return `
    <div style="min-width:320px;max-width:520px;font-family:system-ui,Segoe UI,Inter,Roboto,sans-serif">
      <!-- Encabezado -->
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;border-radius:12px;margin:-6px -6px 12px -6px;box-shadow:0 6px 18px rgba(0,0,0,.25)">
        <div style="font-weight:800;font-size:1rem;line-height:1.15">
          ${nom || ''} ${cod ? `<span style="opacity:.9;font-weight:600">(${cod})</span>` : ''}
        </div>
        <div style="opacity:.9;font-size:.85rem;margin-top:2px">
          ${prov || ''}${cant ? ' • ' + cant : ''}
        </div>
      </div>

      <!-- Cuerpo (solo los campos solicitados) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${row('Dirección','direccion','DIRECCION')}
        ${row('Parroquia (código)','dpa_parroq','DPA_PARROQ')}
        ${row('Parroquia','dpa_despar','DPA_DESPAR')}
        ${row('Cantón (código)','dpa_canton','DPA_CANTON')}
        ${row('Cantón','dpa_descan','DPA_DESCAN')}
        ${row('Provincia (código)','dpa_provin','DPA_PROVIN')}
        ${row('Provincia','dpa_despro','DPA_DESPRO')}
        ${row('Zona','zona','ZONA')}
        ${row('NMT_25','nmt_25','NMT_25')}
        ${row('Categoría','complement','COMPLEMENT')}
        ${row('Capital_Pr','capital_pr','Capital_Pr')}
      </div>
    </div>
  `;
}

/* ============ MAPA ============ */
function initMap() {
  map = L.map('map', { zoomControl: true, preferCanvas: true }).setView([-1.8312, -78.1834], 6);

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);

  const sat = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: '© Esri' },
  );

  L.control.layers({ 'Mapa Base': osm, 'Vista Satelital': sat }, {}, { collapsed: false }).addTo(map);

  cluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    disableClusteringAtZoom: 15,
  });
  map.addLayer(cluster);
}

/* ============ PROVINCIAS ============ */
async function loadProvincias() {
  async function tryLoad(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
    const j = await r.json();
    if (j && j.type === 'Topology' && typeof topojson !== 'undefined') {
      const first = Object.values(j.objects)[0];
      return topojson.feature(j, first);
    }
    return j; // GeoJSON
  }
  try {
    const gj = await tryLoad(CONFIG.provinciasTopo);
    provLayer = L.geoJSON(gj, { style: { color: '#7a4ad8', weight: 2, opacity: 0.8, fillOpacity: 0.05 } }).addTo(map);
    log('Provincias TopoJSON OK');
  } catch (e) {
    warn('TopoJSON provincias falló:', e?.message || e);
    try {
      const gj2 = await tryLoad(CONFIG.provinciasGeo);
      provLayer = L.geoJSON(gj2, { style: { color: '#7a4ad8', weight: 2, opacity: 0.8, fillOpacity: 0.05 } }).addTo(map);
      log('Provincias GeoJSON OK');
    } catch (err2) {
      warn('Sin provincias disponibles:', err2?.message || err2);
    }
  }
}

/* ============ CARGA DE DATOS ============ */
function mapRecord(rec) {
  const lat = toFloat(rec.Latitud ?? rec.latitud ?? rec.lat ?? rec.Lat ?? rec.Y ?? rec.y);
  const lng = toFloat(rec.Longitud ?? rec.longitud ?? rec.lng ?? rec.Lng ?? rec.X ?? rec.x);

  const item = {
    lat,
    lng,
    provincia: rec.DPA_DESPRO ?? rec.provincia ?? rec.Provincia ?? '',
    canton: rec.DPA_DESCAN ?? rec.canton ?? rec.Cantón ?? '',
    complement: (rec.COMPLEMENT ?? rec.complement ?? '').toString() || 'SIN ETIQUETA',
    campos: {
      ...rec,
      Latitud: lat,
      Longitud: lng,
      COD_DISTRI:
        rec.COD_DISTRI ?? rec.cod_distri ?? rec.codigo ?? rec.codigo_distrito ?? rec.cod ?? rec.cod_distrito ?? rec.Codigo ?? '',
      NOM_DISTRI: rec.NOM_DISTRI ?? rec.nom_distri ?? rec.nombre ?? rec.nombre_distrito ?? rec.Nombre ?? '',
    },
  };

  return item;
}

function isValidRecord(r) {
  return (
    Number.isFinite(r.lat) &&
    Number.isFinite(r.lng) &&
    r.lat >= -5.8 &&
    r.lat <= 2.2 &&
    r.lng >= -92.5 &&
    r.lng <= -74.0
  );
}

// === Supabase con ALIAS (snake_case → claves que usa el front) ===
async function loadFromSupabase() {
  const url = CONFIG.supabaseUrl;
  const key = CONFIG.supabaseAnonKey;
  if (!url || !key) return null;
  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    warn('Supabase UMD no está disponible; salto a CSV');
    return null;
  }
  try {
    const client = window.supabase.createClient(url, key);
    const cols = [
      'cod_distri as COD_DISTRI',
      'nom_distri as NOM_DISTRI',
      'direccion  as DIRECCION',
      'dpa_parroq as DPA_PARROQ',
      'dpa_despar as DPA_DESPAR',
      'dpa_canton as DPA_CANTON',
      'dpa_descan as DPA_DESCAN',
      'dpa_provin as DPA_PROVIN',
      'dpa_despro as DPA_DESPRO',
      'zona       as ZONA',
      'nmt_25     as NMT_25',
      'complement as COMPLEMENT',
      'capital_pr as Capital_Pr',
      'latitud    as Latitud',
      'longitud   as Longitud'
    ].join(',');

    const { data, error } = await client.from('distritos').select(cols);
    if (error) throw error;

    const mapped = (data || []).map(mapRecord).filter(isValidRecord);
    if (!mapped.length) {
      warn('Supabase devolvió 0 registros; usaré CSV');
      return null;
    }
    log(`Supabase OK: ${mapped.length} registros`);
    return mapped;
  } catch (e) {
    warn('Error Supabase:', e?.message || e);
    return null;
  }
}

async function loadFromCsv(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  const text = await r.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  const mapped = parsed.data.map(mapRecord).filter(isValidRecord);
  return mapped;
}

async function loadData() {
  const fromSb = await loadFromSupabase();
  if (fromSb?.length) {
    DATA_SOURCE = 'Supabase';
    return fromSb;
  }

  try {
    const fromRel = await loadFromCsv(CONFIG.csvRelative);
    if (fromRel.length) {
      DATA_SOURCE = 'CSV relativo';
      log(`CSV relativo OK: ${fromRel.length} registros`);
      return fromRel;
    }
  } catch (e) {
    warn('CSV relativo falló:', e?.message || e);
  }

  const fromAbs = await loadFromCsv(CONFIG.csvAbsolute);
  if (fromAbs.length) {
    DATA_SOURCE = 'CSV RAW';
    log(`CSV absoluto OK: ${fromAbs.length} registros`);
    return fromAbs;
  }
  throw new Error('No se pudo cargar datos de ningún origen');
}

/* ============ BÚSQUEDA Y AUTOCOMPLETE ============ */
function buildSearchIndex() {
  SEARCH.index = records.map((r) => ({
    r,
    text: norm(`${r.campos.COD_DISTRI || ''} ${r.campos.NOM_DISTRI || ''} ${r.provincia || ''} ${r.canton || ''}`),
  }));
}
function searchTop(q, limit = 8) {
  q = norm(q);
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const out = [];
  for (const item of SEARCH.index) {
    const t = item.text;
    let score = 0;
    if (t === q) score += 200;
    if (t.startsWith(q)) score += 120;
    if (t.includes(q)) score += 60;
    for (const w of words) if (t.includes(w)) score += 10;
    if (score > 0) out.push({ r: item.r, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit).map((x) => x.r);
}

let suggestEl = null,
  activeIndex = -1,
  lastSuggestRows = [];
function setupSuggest() {
  const qEl = $('#q');
  if (!qEl) return;
  const wrap = qEl.parentElement;
  wrap.style.position = 'relative';
  suggestEl = document.createElement('div');
  suggestEl.id = 'suggest';
  Object.assign(suggestEl.style, {
    position: 'absolute',
    top: qEl.offsetTop + qEl.offsetHeight + 6 + 'px',
    left: qEl.offsetLeft + 'px',
    right: 0,
    background: '#0a1c3b',
    border: '1px solid #284a91',
    borderRadius: '8px',
    display: 'none',
    maxHeight: '260px',
    overflowY: 'auto',
    zIndex: 1000,
  });
  wrap.appendChild(suggestEl);
  qEl.addEventListener('input', onSearchInput);
  qEl.addEventListener('keydown', onSearchKey);
  qEl.addEventListener('blur', () => setTimeout(() => (suggestEl.style.display = 'none'), 150));
}
function onSearchInput(e) {
  const q = e.target.value;
  applyFilters(true);
  lastSuggestRows = searchTop(q, 8);
  renderSuggest(lastSuggestRows);
}
function onSearchKey(e) {
  if (suggestEl.style.display !== 'block') return;
  const n = suggestEl.children.length;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % n;
    highlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = (activeIndex - 1 + n) % n;
    highlight();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const target = activeIndex >= 0 ? lastSuggestRows[activeIndex] : lastSuggestRows[0];
    if (target) {
      suggestEl.style.display = 'none';
      openPopupFor(target);
    }
  }
}
function renderSuggest(rows) {
  suggestEl.innerHTML = '';
  activeIndex = -1;
  if (!rows.length) {
    suggestEl.style.display = 'none';
    return;
  }
  rows.forEach((r, i) => {
    const div = document.createElement('div');
    div.textContent = `${r.campos.COD_DISTRI || ''} — ${r.campos.NOM_DISTRI || ''} (${r.provincia}/${r.canton})`;
    Object.assign(div.style, { padding: '8px 10px', cursor: 'pointer' });
    div.onmouseenter = () => {
      activeIndex = i;
      highlight();
    };
    div.onclick = () => {
      suggestEl.style.display = 'none';
      openPopupFor(r);
    };
    suggestEl.appendChild(div);
  });
  suggestEl.style.display = 'block';
}
function highlight() {
  Array.from(suggestEl.children).forEach((el, i) => {
    el.style.background = i === activeIndex ? '#143166' : 'transparent';
  });
}
function openPopupFor(r) {
  let found = null;
  cluster.eachLayer((l) => {
    const p = l.getLatLng();
    if (Math.abs(p.lat - r.lat) < 1e-6 && Math.abs(p.lng - r.lng) < 1e-6) found = l;
  });
  map.setView([r.lat, r.lng], 12);
  if (found) {
    found.openPopup();
    if (window.showDistritoDetails) window.showDistritoDetails(r.campos);
  }
}

/* ============ UI ============ */
function makeChips() {
  const c = {};
  for (const r of records) {
    const k = r.complement && r.complement.trim() ? r.complement : 'SIN ETIQUETA';
    c[k] = (c[k] || 0) + 1;
  }
  chips = Object.entries(c)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([nombre, count]) => ({ nombre, count }));
  const box = $('#chips');
  if (!box) return;
  box.innerHTML = '';
  chips.forEach((ch) => {
    const el = document.createElement('button');
    el.className = 'chip';
    el.textContent = `${ch.nombre} (${ch.count})`;
    el.onclick = () => {
      if (el.classList.contains('active')) {
        el.classList.remove('active');
        selectedCats.delete(ch.nombre);
      } else {
        el.classList.add('active');
        selectedCats.add(ch.nombre);
      }
      applyFilters(true);
    };
    box.appendChild(el);
  });
}
function buildCombos() {
  const setProv = new Set(records.map((r) => r.provincia).filter(Boolean));
  provs = Array.from(setProv).sort((a, b) => a.localeCompare(b));
  const provSel = $('#provSel');
  const cantSel = $('#cantonSel');
  if (!provSel || !cantSel) return;

  provSel.innerHTML = '<option value="">Todas</option>' + provs.map((p) => `<option>${p}</option>`).join('');
  cantByProv = {};
  for (const r of records) {
    const p = r.provincia || '';
    const c = r.canton || '';
    cantByProv[p] = cantByProv[p] || new Set();
    if (c) cantByProv[p].add(c);
  }
  provSel.onchange = () => {
    const p = provSel.value;
    const cants = Array.from(cantByProv[p] || new Set()).sort((a, b) => a.localeCompare(b));
    cantSel.innerHTML = '<option value="">Todos</option>' + cants.map((c) => `<option>${c}</option>`).join('');
    applyFilters(true);
  };
  cantSel.onchange = () => applyFilters(true);
}
function markerFor(r) {
  const m = L.circleMarker([r.lat, r.lng], {
    radius: 8,
    fillColor: colorFor(r.complement),
    color: '#fff',
    weight: 2,
    fillOpacity: 0.95,
  });
  m.bindPopup(popupHTML(r.campos), { maxWidth: 560, autoPan: false });
  m.bindTooltip(`${r.campos.COD_DISTRI || ''}`, { permanent: false, direction: 'top', opacity: 0.85 });
  m.on('click', () => {
    if (window.showDistritoDetails) window.showDistritoDetails(r.campos);
  });
  return m;
}
function render() {
  cluster.clearLayers();
  filtered.forEach((r) => cluster.addLayer(markerFor(r)));

  const forced = CONFIG.forceTotalCount;
  const totalShown = forced ?? records.length;

  if ($('#nTotal')) $('#nTotal').textContent = totalShown.toLocaleString();
  if ($('#nFilt')) $('#nFilt').textContent = filtered.length.toLocaleString();

  const el = $('#counter');
  if (el) {
    el.innerHTML = `${totalShown} distritos • filtros activos: ${filtered.length} visibles <span style="opacity:.7">(${DATA_SOURCE})</span>`;
  }

  if (window.updateDashboard) window.updateDashboard(records, filtered);
}
function applyFilters(updateUrl = false) {
  const q = $('#q')?.value.trim() || '';
  const p = $('#provSel')?.value || '';
  const c = $('#cantonSel')?.value || '';

  filtered = records.filter((r) => {
    if (p && r.provincia !== p) return false;
    if (c && r.canton !== c) return false;
    if (selectedCats.size > 0 && !selectedCats.has(r.complement)) return false;
    if (q) {
      const hay = norm(`${r.campos.COD_DISTRI || ''} ${r.campos.NOM_DISTRI || ''} ${r.provincia || ''} ${r.canton || ''}`);
      if (!hay.includes(norm(q))) return false;
    }
    return true;
  });

  if (updateUrl) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p) params.set('prov', p);
    if (c) params.set('canton', c);
    if (selectedCats.size > 0) params.set('cats', Array.from(selectedCats).join('|'));
    history.replaceState(null, '', '?' + params.toString());
  }
  render();
}
function loadFromURL() {
  const u = new URL(location.href);
  const q = u.searchParams.get('q') || '';
  const p = u.searchParams.get('prov') || '';
  const c = u.searchParams.get('canton') || '';
  const cats = (u.searchParams.get('cats') || '').split('|').filter(Boolean);

  if ($('#q')) $('#q').value = q;
  if (p && $('#provSel')) $('#provSel').value = p;
  if (p && $('#cantonSel')) {
    const cants = Array.from(cantByProv[p] || new Set()).sort((a, b) => a.localeCompare(b));
    $('#cantonSel').innerHTML = '<option value="">Todos</option>' + cants.map((x) => `<option>${x}</option>`).join('');
    if (c) $('#cantonSel').value = c;
  }
  const box = $('#chips');
  cats.forEach((cat) => {
    selectedCats.add(cat);
    if (box)
      Array.from(box.children).forEach((b) => {
        if (b.textContent.startsWith(cat + ' ')) b.classList.add('active');
      });
  });
}
function exportCSV() {
  if (!filtered.length) {
    alert('No hay registros filtrados para exportar.');
    return;
  }
  const cols = Object.keys(filtered[0].campos);
  const lines = [cols.join(',')];
  filtered.forEach((r) => {
    const row = cols
      .map((k) => {
        const v = (r.campos[k] ?? '').toString().replace(/"/g, '""');
        return `"${v}"`;
      })
      .join(',');
    lines.push(row);
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `distritos_filtrados_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

/* ============ ARRANQUE ============ */
async function init() {
  const loading = $('#loading');
  try {
    // Opcional: logo (no rompe si falla)
    fetch(CONFIG.logo).catch(() => {});

    initMap();
    await loadProvincias();

    // Datos
    records = await loadData();
    if (!records.length) throw new Error('0 registros cargados');

    // Índices y UI
    buildSearchIndex();
    setupSuggest();
    makeChips();
    buildCombos();
    loadFromURL();

    // Listeners
    $('#q')?.addEventListener('input', () => applyFilters(true));
    $('#btnAll')?.addEventListener('click', () => {
      if ($('#q')) $('#q').value = '';
      if ($('#provSel')) $('#provSel').value = '';
      if ($('#cantonSel')) $('#cantonSel').innerHTML = '<option value="">Todos</option>';
      selectedCats.clear();
      document.querySelectorAll('.chip.active').forEach((x) => x.classList.remove('active'));
      history.replaceState(null, '', ' ');
      applyFilters(false);
    });
    $('#btnExport')?.addEventListener('click', exportCSV);
    $('#btnProv')?.addEventListener('click', () => {
      if (!provLayer) return;
      if (map.hasLayer(provLayer)) {
        map.removeLayer(provLayer);
        $('#btnProv').textContent = 'Provincias: OFF';
      } else {
        provLayer.addTo(map);
        $('#btnProv').textContent = 'Provincias: ON';
      }
    });

    // Vista inicial centrada en promedio
    const avgLat = records.reduce((s, r) => s + r.lat, 0) / records.length;
    const avgLng = records.reduce((s, r) => s + r.lng, 0) / records.length;
    map.setView([avgLat, avgLng], 6);

    filtered = records.slice();
    render();

    log(`✅ Sistema iniciado con ${records.length} registros`);
  } catch (e) {
    err('Error inicializando el sistema:', e?.message || e);
    if ($('#counter')) $('#counter').innerHTML = '❌ Error cargando datos';
    alert(
      'Error cargando el sistema.\n\n' +
        (e?.message || e) +
        '\n\nRevisa:\n' +
        '1) Que el CSV exista y el path sea correcto (intenta abrir data/distritos.csv en el navegador).\n' +
        '2) Políticas RLS de Supabase (SELECT para rol "anon").\n' +
        '3) Encabezados Latitud/Longitud válidos.',
    );
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// ¡Arranque!
init();
