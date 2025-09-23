/* =================== CONFIG =================== */
const PATHS = {
  csv: 'data/distritos.csv',
  // ← EXISTE en tu repo (ver /data)
  provincias: 'data/provincias.json',
  // Fallback por si subes un GeoJSON separado
  provinciasFallback: 'data/provincias.geojson',
  // tu index.html ya carga logo.png desde raíz
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
// Búsqueda normalizada
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
const map = L.map('map', { zoomControl:true }).setView([-1.8312, -78.1834], 6);
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
    const r = await fetch(url);
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
  const res = await fetch(PATHS.csv);
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
  suggestEl = document.createElement('div');
  suggestEl.id = 'suggest';
  Object.assign(suggestEl.style, {
    position:'absolute', top:(qEl.offsetTop+qEl.offsetHeight+6)+'px',
    left:qEl.offsetLeft+'px', right:0, background:'#0a1c3b',
    border:'1px solid #284a91', borderRadius:'8px', display:'none',
    maxHeight:'260px', overflowY:'auto', zIndex:1000
  });
  wrap.appendChild(suggestEl);
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
    const div=document.createElement('div');
    div.textContent = `${r.campos.COD_DISTRI||''} — ${r.campos.NOM_DISTRI||''} (${r.provincia}/${r.canton})`;
    Object.assign(div.style,{padding:'8px 10px',cursor:'pointer'});
    div.onmouseenter=()=>{ activeIndex=i; highlight(); };
    div.onclick=()=>{ suggestEl.style.display='none'; openPopupFor(r); };
    suggestEl.appendChild(div);
  });
  suggestEl.style.display='block';
}
function highlight(){
  Array.from(suggestEl.children).forEach((el,i)=>{
    el.style.background = (i===activeIndex) ? '#143166' : 'transparent';
  });
}

/* ===== UI helpers ===== */
function makeChips(){
  const c = {};
  for(const r of records){
    const k=r.complement&&r.complement.trim()?r.complement:'SIN ETIQUETA';
    c[k]=(c[k]||0)+1;
  }
  chips = Object.entries(c)
    .sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]))
    .map(([nombre,count])=>({nombre,count}));
  const box = Q('#chips'); box.innerHTML='';
  chips.forEach(ch=>{
    const el=document.createElement('button'); el.className='chip'; el.textContent=`${ch.nombre} (${ch.count})`;
    el.onclick=()=>{ 
      if(el.classList.contains('active')){el.classList.remove('active');selectedCats.delete(ch.nombre);}
      else{el.classList.add('active');selectedCats.add(ch.nombre);}
      applyFilters(true);
    };
    box.appendChild(el);
  });
}
function buildCombos(){
  const setProv = new Set(records.map(r=>r.provincia).filter(Boolean));
  provs = Array.from(setProv).sort((a,b)=>a.localeCompare(b));
  const provSel = Q('#provSel');
  provSel.innerHTML = '<option value="">Todas</option>' + provs.map(p=>`<option>${p}</option>`).join('');
  cantByProv = {};
  for(const r of records){
    const p = r.provincia||''; const c = r.canton||'';
    cantByProv[p] = cantByProv[p] || new Set();
    if(c) cantByProv[p].add(c);
  }
  provSel.onchange = ()=>{
    const p = provSel.value;
    const cantSel = Q('#cantonSel'); 
    const cants = Array.from((cantByProv[p]||new Set())).sort((a,b)=>a.localeCompare(b));
    cantSel.innerHTML = '<option value="">Todos</option>' + cants.map(c=>`<option>${c}</option>`).join('');
    applyFilters(true);
  };
  Q('#cantonSel').onchange = ()=> applyFilters(true);
}
function markerFor(r){
  const m = L.circleMarker([r.lat,r.lng],{radius:8,fillColor:colorFor(r.complement),color:'#fff',weight:2,fillOpacity:.95});
  m.bindPopup(popupHTML(r.campos),{maxWidth:560,autoPan:false});
  m.bindTooltip(`${r.campos.COD_DISTRI||""}`,{permanent:false,direction:'top',opacity:.85});
  m.on('click', ()=>{ if (window.showDistritoDetails) window.showDistritoDetails(r.campos); });
  return m;
}
function render(){
  cluster.clearLayers();
  filtered.forEach(r=> cluster.addLayer(markerFor(r)));
  const nTotal = (FORCE_COUNT ?? records.length);
  Q('#nTotal').textContent = nTotal.toLocaleString();
  Q('#nFilt').textContent  = filtered.length.toLocaleString();
  Q('#counter').innerHTML  = `${nTotal} distritos • filtros activos: ${filtered.length} visibles`;
  if (window.updateDashboard) window.updateDashboard(records, filtered);
}
function applyFilters(updateUrl=false){
  const q  = Q('#q').value.trim();
  const p  = Q('#provSel').value;
  const c  = Q('#cantonSel').value;
  filtered = records.filter(r=>{
    if(p && r.provincia!==p) return false;
    if(c && r.canton!==c) return false;
    if(selectedCats.size>0 && !selectedCats.has(r.complement)) return false;
    if(q){
      const haystack = norm(`${r.campos.COD_DISTRI||''} ${r.campos.NOM_DISTRI||''} ${r.provincia||''} ${r.canton||''}`);
      if (!haystack.includes(norm(q))) return false;
    }
    return true;
  });
  if(updateUrl){
    const params = new URLSearchParams();
    if(q) params.set('q', q);
    if(p) params.set('prov', p);
    if(c) params.set('canton', c);
    if(selectedCats.size>0) params.set('cats', Array.from(selectedCats).join('|'));
    history.replaceState(null,'','?'+params.toString());
  }
  render();
}
function loadFromURL(){
  const u = new URL(location.href);
  const q = u.searchParams.get('q')||'';
  const p = u.searchParams.get('prov')||'';
  const c = u.searchParams.get('canton')||'';
  const cats = (u.searchParams.get('cats')||'').split('|').filter(Boolean);
  Q('#q').value = q;
  if(p) Q('#provSel').value = p;
  if(p){
    const cants = Array.from((cantByProv[p]||new Set())).sort((a,b)=>a.localeCompare(b));
    Q('#cantonSel').innerHTML = '<option value="">Todos</option>' + cants.map(x=>`<option>${x}</option>`).join('');
    if(c) Q('#cantonSel').value = c;
  }
  const box = Q('#chips');
  cats.forEach(cat=>{
    selectedCats.add(cat);
    Array.from(box.children).forEach(b=>{ if(b.textContent.startsWith(cat+' ')) b.classList.add('active'); });
  });
}
function exportCSV(){
  if(!filtered.length){ alert('No hay registros filtrados para exportar.'); return; }
  const cols = Object.keys(filtered[0].campos);
  const lines = [cols.join(',')];
  filtered.forEach(r=>{
    const row = cols.map(k=>{
      const v = (r.campos[k]??'').toString().replace(/"/g,'""');
      return `"${v}"`;
    }).join(',');
    lines.push(row);
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'distritos_filtrados.csv';
  a.click();
}

/* ===== Arranque ===== */
async function init(){
  try{
    // Logo opcional
    fetch(PATHS.logo).catch(()=>{});

    // Provincias
    await loadProvincias();

    // Supabase o CSV
    supabaseClient = initSupabase();
    if (supabaseClient) {
      try{
        records = await loadFromSupabase(supabaseClient);
      }catch(err){
        console.warn('Fallo Supabase, usando CSV:', err);
        records = await loadCSV();
      }
    } else {
      records = await loadCSV();
    }

    if(!records.length) throw new Error('No se pudieron cargar datos');

    // ÍNDICE búsqueda + UI
    buildSearchIndex();
    setupSuggest();
    makeChips();
    buildCombos();
    loadFromURL();

    Q('#q').addEventListener('input', ()=>applyFilters(true));
    Q('#btnAll').onclick = ()=>{
      Q('#q').value=''; Q('#provSel').value=''; Q('#cantonSel').innerHTML='<option value="">Todos</option>';
      selectedCats.clear(); document.querySelectorAll('.chip.active').forEach(x=>x.classList.remove('active'));
      history.replaceState(null,'',' ');
      applyFilters(false);
    };
    Q('#btnExport').onclick = exportCSV;
    Q('#btnProv').onclick = ()=>{ 
      if(!provLayer) return; 
      if(map.hasLayer(provLayer)){ map.removeLayer(provLayer); Q('#btnProv').textContent='Provincias: OFF'; }
      else { provLayer.addTo(map); Q('#btnProv').textContent='Provincias: ON'; }
    };

    if(records.length){
      const lat = records.reduce((a,b)=>a+b.lat,0)/records.length;
      const lng = records.reduce((a,b)=>a+b.lng,0)/records.length;
      map.setView([lat,lng], 6);
    }
    filtered = records.slice();
    applyFilters(false);
  }catch(e){
    console.error(e);
    Q('#counter').innerHTML = "❌ Error cargando datos";
    alert("No se pudieron cargar los datos (Supabase/CSV) o provincias.");
  }finally{
    const loading = document.getElementById('loading');
    if (loading) loading.style.display='none';
  }
}
init();


