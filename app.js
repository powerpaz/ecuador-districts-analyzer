/* =================== CONFIG =================== */
const PATHS = {
  csv: 'data/distritos.csv',
  provincias: 'data/provincias.topo.json', // preferido (liviano)
  provinciasFallback: 'data/provincias.geojson', // por si no hay topo
  logo: 'data/logo.png' // opcional
};
// Fuerza contador fijo (ej. 140). null = dinámico
const FORCE_COUNT = null;

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
  const t={"MINEDUC":"#2563eb","SENECYT":"#10b981","SENECYT - ZONA DEPORTE":"#0ea5e9","ZONA DEPORTE":"#f59e0b","OT DEPORTE":"#ef4444","SIN ETIQUETA":"#6b7280"};
  for (const k in t) if (cat && cat.toUpperCase().indexOf(k)>=0) return t[k]; return "#2563eb";
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

/* ===== Estado global ===== */
let records = [];       // base
let filtered = [];      // filtrada
let chips = [];         // lista de categorías
let provs = [];         // provincias únicas
let cantByProv = {};    // cantones por provincia
let selectedCats = new Set();
let provLayer=null;

const map = L.map('map', { zoomControl:true }).setView([-1.8312, -78.1834], 6);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'© OpenStreetMap'}).addTo(map);
const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{ attribution:'© Esri'});
L.control.layers({"Mapa Estándar":osm,"Vista Satelital":sat},{},{collapsed:false}).addTo(map);
const cluster = L.markerClusterGroup({ chunkedLoading:true, maxClusterRadius:60, spiderfyOnMaxZoom:true, showCoverageOnHover:false, disableClusteringAtZoom:15 });
map.addLayer(cluster);

/* ===== Carga de Provincias (TopoJSON con fallback a GeoJSON) ===== */
async function loadProvincias(){
  try{
    const r = await fetch(PATHS.provincias);
    if(!r.ok) throw new Error('Topo no disponible');
    const topo = await r.json();
    const gj = topo.type === 'Topology'
      ? topojson.feature(topo, Object.values(topo.objects)[0])
      : topo; // por si subes un geojson con ese nombre
    provLayer = L.geoJSON(gj,{style:{color:'#7a4ad8',weight:2,opacity:.8,fillOpacity:.05}}).addTo(map);
  }catch(e){
    // Fallback a GeoJSON tradicional
    try{
      const r2 = await fetch(PATHS.provinciasFallback);
      if(!r2.ok) return; // silencioso si no hay fallback
      const gj2 = await r2.json();
      provLayer = L.geoJSON(gj2,{style:{color:'#7a4ad8',weight:2,opacity:.8,fillOpacity:.05}}).addTo(map);
    }catch(err){ /* opcional: console.warn('Sin provincias'); */ }
  }
}

/* ===== Carga de CSV ===== */
async function loadCSV(){
  const res = await fetch(PATHS.csv);
  if(!res.ok) throw new Error('No se pudo descargar CSV '+PATHS.csv);
  const txt = await res.text();
  const parsed = Papa.parse(txt, { header:true, skipEmptyLines:true });
  const rows = parsed.data;

  // Normalización mínima
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

function makeChips(){
  const c = {};
  for(const r of records){ const k=r.complement&&r.complement.trim()?r.complement:'SIN ETIQUETA'; c[k]=(c[k]||0)+1; }
  chips = Object.entries(c).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).map(([nombre,count])=>({nombre,count}));
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
  // provincias
  const setProv = new Set(records.map(r=>r.provincia).filter(Boolean));
  provs = Array.from(setProv).sort((a,b)=>a.localeCompare(b));
  const provSel = Q('#provSel'); provSel.innerHTML = '<option value="">Todas</option>' + provs.map(p=>`<option>${p}</option>`).join('');
  // cantones por provincia
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
  return m;
}

function render(){
  cluster.clearLayers();
  filtered.forEach(r=> cluster.addLayer(markerFor(r)));
  const nTotal = (FORCE_COUNT ?? records.length);
  Q('#nTotal').textContent = nTotal.toLocaleString();
  Q('#nFilt').textContent  = filtered.length.toLocaleString();
  Q('#counter').innerHTML  = `${nTotal} distritos • filtros activos: ${filtered.length} visibles`;
}

function applyFilters(updateUrl=false){
  const q  = Q('#q').value.trim().toLowerCase();
  const p  = Q('#provSel').value;
  const c  = Q('#cantonSel').value;
  filtered = records.filter(r=>{
    if(p && r.provincia!==p) return false;
    if(c && r.canton!==c) return false;
    if(selectedCats.size>0 && !selectedCats.has(r.complement)) return false;
    if(q){
      const s = `${r.campos.COD_DISTRI||''} ${r.campos.NOM_DISTRI||''}`.toLowerCase();
      if(!s.includes(q)) return false;
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
  if(p){ // cargar cantones para provincia
    const cants = Array.from((cantByProv[p]||new Set())).sort((a,b)=>a.localeCompare(b));
    Q('#cantonSel').innerHTML = '<option value="">Todos</option>' + cants.map(x=>`<option>${x}</option>`).join('');
    if(c) Q('#cantonSel').value = c;
  }
  // activar chips
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

async function init(){
  try{
    // Logo opcional (si alguna vez lo muestras)
    fetch(PATHS.logo).then(r=>{ /* noop */ });

    // Provincias (TopoJSON con fallback)
    await loadProvincias();

    // CSV distritos
    records = await loadCSV();
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

    // Toggle provincias
    Q('#btnProv').onclick = ()=>{ 
      if(!provLayer) return; 
      if(map.hasLayer(provLayer)){ map.removeLayer(provLayer); Q('#btnProv').textContent='Provincias: OFF'; }
      else { provLayer.addTo(map); Q('#btnProv').textContent='Provincias: ON'; }
    };

    // centrar al promedio
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
    alert("No se pudo leer data/distritos.csv o provincias.");
  }finally{
    document.getElementById('loading').style.display='none';
  }
}
init();
