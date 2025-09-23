/* =================== CONFIG =================== */
const PATHS = {
  csv: 'data/distritos.csv',
  provincias: 'data/provincias.json',        // Topology (TopoJSON)
  provinciasFallback: 'data/provincias.geojson', // GeoJSON
  logo: 'logo.png'
};
// Fuerza contador fijo (ej. 140). null = dinámico
const FORCE_COUNT = 140;

// === Supabase (usa el SDK UMD que incluyes en index.html) ===
const USE_SUPABASE = true;
const SUPABASE = {
  url: 'https://eunujfywdwipguopstru.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bnVqZnl3ZHdpcGd1b3BzdHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzM3MDksImV4cCI6MjA3NDE0OTcwOX0.Jf-QSpS6K0yh_JCX1IVtEC8Amq1Or9XwLjc9dtsxLAs'
};

/* ===== Utils ===== */
const Q = sel => document.querySelector(sel);
function toFloat(v){
  if(v==null || v==='') return null;
  if(typeof v==='number') return v;
  let s = String(v).trim().replace(/\s+/g,'');
  if(s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',', '.');
  else if(s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function colorFor(cat){
  const t={
    "MINEDUC":"#2563eb",
    "SENECYT":"#10b981",
    "SENECYT - ZONA DEPORTE":"#0ea5e9",
    "ZONA DEPORTE":"#f59e0b",
    "OT DEPORTE":"#ef4444",
    "SIN ETIQUETA":"#6b7280"
  };
  for (const k in t) if (cat && cat.toUpperCase().indexOf(k)>=0) return t[k];
  return "#2563eb";
}
function popupHTML(c){
  const row=(l,v)=>!v||String(v).trim()===''?'':`<div style="padding:6px;border-left:3px solid #3a5899"><b>${l}:</b> <span style="opacity:.9">${v}</span></div>`;
  return `<div style="width:520px;font-family:system-ui;">
    <div style="background:linear-gradient(135deg,#5b7cff,#7a4ad8);color:#fff;padding:12px;margin:-8px -8px 10px;border-radius:10px;">
      <div style="font-weight:800">${c.COD_DISTRI||""} — ${c.NOM_DISTRI||""}</div>
      <div style="opacity:.9;font-size:.9em">🌐 ${Number(c.Latitud).toFixed(6)}, ${Number(c.Longitud).toFixed(6)}</div>
    </div>
    ${row("Dirección",c.DIRECCION)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${row("X",c.X)}${row("Y",c.Y)}${row("Parroquia (código)",c.DPA_PARROQ)}${row("Parroquia",c.DPA_DESPAR)}
      ${row("Cantón (código)",c.DPA_CANTON)}${row("Cantón",c.DPA_DESCAN)}${row("Provincia (código)",c.DPA_PROVIN)}${row("Provincia",c.DPA_DESPRO)}
      ${row("Zona",c.ZONA)}${row("NMT_25",c.NMT_25)}${row("COMPLEMENT",c.COMPLEMENT)}${row("Capital_Pr",c.Capital_Pr)}
      ${row("Longitud",c.Longitud)}${row("Latitud",c.Latitud)}
    </div></div>`;
}
function norm(s){ return (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase(); }

/* ===== Estado global ===== */
let records = [];
let filtered = [];
let chips = [];
let provs = [];
let cantByProv = {};
let selectedCats = new Set();
let provLayer=null;
let supabaseClient = null;
let SEARCH = { index: [] };

/* ===== Mapa ===== */
const map = L.map('map', { zoomControl:true, preferCanvas:true }).setView([-1.8312, -78.1834], 6);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'© OpenStreetMap'}).addTo(map);
const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{ attribution:'© Esri' });
L.control.layers({"Mapa Estándar":osm,"Vista Satelital":sat},{},{collapsed:false}).addTo(map);
const cluster = L.markerClusterGroup({
  chunkedLoading:true,
  maxClusterRadius:60,
  spiderfyOnMaxZoom:true,
  showCoverageOnHover:false,
  disableClusteringAtZoom:15
});
map.addLayer(cluster);

/* ===== Provincias (TopoJSON o GeoJSON con fallback) ===== */
async function loadProvincias(){
  async function tryLoad(url){
    const r = await fetch(url, {cache:'no-cache'});
    if(!r.ok) throw new Error('No encontrado: '+url);
    const j = await r.json();
    if (j && j.type === 'Topology' && typeof topojson !== 'undefined') {
      const first = Object.values(j.objects)[0];
      return topojson.feature(j, first);
    }
    return j; // ya es GeoJSON
  }
  try{
    const gj = await tryLoad(PATHS.provincias);
    provLayer = L.geoJSON(gj,{style:{color:'#7a4ad8',weight:2,opacity:.8,fillOpacity:.05}}).addTo(map);
  }catch(e){
    try{
      const gj2 = await tryLoad(PATHS.provinciasFallback);
      provLayer = L.geoJSON(gj2,{style:{color:'#7a4ad8',weight:2,opacity:.8,fillOpacity:.05}}).addTo(map);
    }catch(err){ console.warn('Sin capas de provincias disponibles', err); }
  }
}

/* ===== CSV (fallback) ===== */
async function loadCSV(){
  const res = await fetch(PATHS.csv, {cache:'no-cache'});
  if(!res.ok) throw new Error('No se pudo descargar CSV '+PATHS.csv);
  const txt = await res.text();
  const parsed = Papa.parse(txt, { header:true, skipEmptyLines:true });
  const rows = parsed.data;

  const want = k => Object.keys(rows[0]||{}).find(x=>x && x.toLowerCase().trim()==k.toLowerCase());
  const col = {
    cod: want('COD_DISTRI') || want('cod_distri') || want('codigo'),
    nom: want('NOM_DISTRI') || want('nom_distri') || want('distrito'),
    dir: want('DIRECCION'),
    x: want('X'), y: want('Y'),
    parCod: want('DPA_PARROQ'), parNom: want('DPA_DESPAR'),
    canCod: want('DPA_CANTON'), canNom: want('DPA_DESCAN'),
    provCod: want('DPA_PROVIN'), provNom: want('DPA_DESPRO'),
    zona: want('ZONA'), nmt: want('NMT_25'),
    comp: want('COMPLEMENT'),
    cap: want('Capital_Pr') || want('capital_pr'),
    lon: want('Longitud') || want('longitud') || want('lon'),
    lat: want('Latitud')  || want('latitud')  || want('lat')
  };
  const recs = [];
  for(const r of rows){
    const lat = toFloat(r[col.lat]), lng = toFloat(r[col.lon]);
    if(lat==null || lng==null) continue;
    if(!(lat>=-5.8 && lat<=2.2 && lng>=-92.5 && lng<=-74.0)) continue;
    recs.push({
      lat, lng,
      provincia: (r[col.provNom]||'').toString(),
      canton: (r[col.canNom]||'').toString(),
      complement: (r[col.comp]||'').toString() || 'SIN ETIQUETA',
      campos: {
        COD_DISTRI:r[col.cod], NOM_DISTRI:r[col.nom], DIRECCION:r[col.dir], X:r[col.x], Y:r[col.y],
        DPA_PARROQ:r[col.parCod], DPA_DESPAR:r[col.parNom], DPA_CANTON:r[col.canCod], DPA_DESCAN:r[col.canNom],
        DPA_PROVIN:r[col.provCod], DPA_DESPRO:r[col.provNom], ZONA:r[col.zona], NMT_25:r[col.nmt], COMPLEMENT:r[col.comp],
        Capital_Pr:r[col.cap], Longitud:r[col.lon], Latitud:r[col.lat]
      }
    });
  }
  return recs;
}

/* ===== Supabase ===== */
function initSupabase(){
  if (!USE_SUPABASE) return null;
  if (!window.supabase || !window.supabase.createClient) return null;
  if (!SUPABASE.url || !SUPABASE.anonKey) return null;
  try{
    return window.supabase.createClient(SUPABASE.url, SUPABASE.anonKey);
  }catch(e){
    console.warn('No se pudo crear cliente de Supabase:', e);
    return null;
  }
}
async function loadFromSupabase(client){
  const cols = [
    'COD_DISTRI','NOM_DISTRI','DIRECCION',
    'DPA_PARROQ','DPA_DESPAR','DPA_CANTON','DPA_DESCAN',
    'DPA_PROVIN','DPA_DESPRO','ZONA','NMT_25','COMPLEMENT',
    'Capital_Pr','Latitud','Longitud'
  ].join(',');
  const { data, error } = await client.from('distritos').select(cols);
  if (error) throw error;
  return data.map(r => ({
    lat: Number(r.Latitud),
    lng: Number(r.Longitud),
    provincia: r.DPA_DESPRO || '',
    canton: r.DPA_DESCAN || '',
    complement: (r.COMPLEMENT || '').toString() || 'SIN ETIQUETA',
    campos: { ...r }
  })).filter(d =>
    Number.isFinite(d.lat) && Number.isFinite(d.lng) &&
    d.lat>=-5.8 && d.lat<=2.2 && d.lng>=-92.5 && d.lng<=-74.0
  );
}

/* ===== Búsqueda avanzada + Autocomplete ===== */
function buildSearchIndex(){
  SEARCH.index = records.map(r => ({
    r,
    text: norm(`${r.campos.COD_DISTRI||''} ${r.campos.NOM_DISTRI||''} ${r.provincia||''} ${r.canton||''}`)
  }));
}
function searchTop(q, limit=8){
  q = norm(q);
  if(!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const out = [];
  for(const item of SEARCH.index){
    const t = item.text;
    let score = 0;
    if (t === q) score += 200;
    if (t.startsWith(q)) score += 120;
    if (t.includes(q)) score += 60;
    for (const w of words){ if (t.includes(w)) score += 10; }
    if (score>0) out.push({r:item.r, score});
  }
  out.sort((a,b)=>b.score-a.score);
  return out.slice(0,limit).map(x=>x.r);
}
function openPopupFor(r){
  let found=null;
  cluster.eachLayer(l=>{
    const p=l.getLatLng();
    if (Math.abs(p.lat-r.lat)<1e-6 && Math.abs(p.lng-r.lng)<1e-6) found=l;
  });
  map.setView([r.lat,r.lng], 12);
  if(found){
    found.openPopup();
    if (window.showDistritoDetails) window.showDistritoDetails(r.campos);
  }
}

/* Autocomplete UI */
let suggestEl=null, activeIndex=-1, lastSuggestRows=[];
function setupSuggest(){
  const qEl = Q('#q'); const wrap = qEl.parentElement;
  wrap.style.position = 'relative';
  suggestEl = Q('#suggest');
  qEl.addEventListener('input', onSearchInput);
  qEl.addEventListener('keydown', onSearchKey);
  qEl.addEventListener('blur', ()=> setTimeout(()=>suggestEl.style.display='none',150));
}
function onSearchInput(e){
  const q = e.target.value;
  applyFilters(true);
  lastSuggestRows = searchTop(q, 8);
  renderSuggest(lastSuggestRows);
}
function onSearchKey(e){
  if(suggestEl.style.display!=='block') return;
  const n = suggestEl.children.length;
  if (e.key==='ArrowDown'){ e.preventDefault(); activeIndex=(activeIndex+1)%n; highlight(); }
  else if (e.key==='ArrowUp'){ e.preventDefault(); activeIndex=(activeIndex-1+n)%n; highlight(); }
  else if (e.key==='Enter'){
    e.preventDefault();
    const target = activeIndex>=0 ? lastSuggestRows[activeIndex] : lastSuggestRows[0];
    if(target){ suggestEl.style.display='none'; openPopupFor(target); }
  }
}
function renderSuggest(rows){
  suggestEl.innerHTML=''; activeIndex=-1;
  if(!rows.length){ suggestEl.style.display='none'; return; }
  rows.forEach((r,i)=>{
    const div=document.c
