/* =================== CONFIG =================== */
const PATHS = {
  csv: 'data/distritos.csv',              // tu CSV
  provincias: 'data/provincias.geojson',  // opcional
  logo: 'data/logo.png'                   // opcional
};
// Fuerza contador fijo (ej. 140). Pon null para dinámico.
const FORCE_COUNT = null; // 140;

/* ============== Utilidades & normalización ============== */
function normalizeName(s){
  if(s==null) return '';
  s = String(s);
  const map = {'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','Ñ':'N'};
  s = s.replace(/[ÁÉÍÓÚÑ]/g, m=>map[m]||m);
  s = s.toUpperCase().replace(/[^A-Z0-9]+/g,'');
  return s;
}
const CANON = [
  "COD_DISTRI","NOM_DISTRI","DIRECCION","X","Y","DPA_PARROQ","DPA_DESPAR","DPA_CANTON","DPA_DESCAN",
  "DPA_PROVIN","DPA_DESPRO","ZONA","NMT_25","COMPLEMENT","Capital_Pr","Longitud","Latitud"
];
function toFloat(v){
  if(v==null || v==='') return null;
  if(typeof v==='number') return v;
  let s = String(v).trim().replace(/\s+/g,'');
  if(s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',', '.');
  else if(s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ============== Lectura CSV (PapaParse) ============== */
async function readCSV(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('No se pudo descargar el CSV: '+path);
  const text = await res.text();
  const parsed = Papa.parse(text, {header:true, skipEmptyLines:true, transformHeader: h=>h});
  if(parsed.errors?.length){
    console.warn('PapaParse warnings:', parsed.errors.slice(0,5));
  }
  const data = parsed.data;

  // Mapeo de columnas
  const normMap = {};
  Object.keys(data[0]||{}).forEach(k => normMap[normalizeName(k)] = k);
  const mapped = {};
  for(const canon of CANON){
    const nn = normalizeName(canon);
    const candidates = [nn, nn.replace('NMT25','NMT_25'), nn.replace('CAPITALPR','CAPITALPR')];
    let found = null;
    for(const c of candidates){ if(normMap[c]){ found = normMap[c]; break; } }
    if(!found && canon==='Capital_Pr'){
      const alts = ['CAPITALPR','CAPITAL','ESCAPITAL','CAPITAL_P','CAPITAL_PR'];
      for(const a of alts){ if(normMap[normalizeName(a)]){ found = normMap[normalizeName(a)]; break; } }
    }
    if(!found && canon==='NMT_25'){
      const alts = ['NMT_25','NMT25'];
      for(const a of alts){ if(normMap[normalizeName(a)]){ found = normMap[normalizeName(a)]; break; } }
    }
    mapped[canon] = found; // puede ser undefined
  }

  if(!mapped['Latitud'] || !mapped['Longitud']){
    throw new Error("No se encontraron columnas Latitud / Longitud en el CSV.");
  }

  const registros = [];
  for(const row of data){
    const lat = toFloat(row[mapped['Latitud']]);
    const lng = toFloat(row[mapped['Longitud']]);
    if(lat==null || lng==null) continue;
    // Rango Ecuador (incluye Galápagos si quieres ampliar longitudes)
    if(!(lat>=-5.8 && lat<=2.2 && lng>=-92.5 && lng<=-74.0)) continue;

    const campos = {};
    CANON.forEach(c=>{
      const key = mapped[c];
      campos[c] = key ? String(row[key] ?? '') : '';
    });
    campos['Latitud']  = String(row[mapped['Latitud']]);
    campos['Longitud'] = String(row[mapped['Longitud']]);

    registros.push({
      lat, lng,
      categoria: mapped['COMPLEMENT'] ? String(row[mapped['COMPLEMENT']]||'') : 'SIN ETIQUETA',
      campos
    });
  }

  const lat_c = registros.reduce((a,b)=>a+b.lat,0)/Math.max(registros.length,1);
  const lng_c = registros.reduce((a,b)=>a+b.lng,0)/Math.max(registros.length,1);

  // Categorías desde COMPLEMENT
  const counts = {};
  for(const r of registros){
    const k = (r.categoria && r.categoria.trim()) ? r.categoria : 'SIN ETIQUETA';
    counts[k] = (counts[k]||0)+1;
  }
  const cat_list = Object.entries(counts)
    .sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]))
    .map(([nombre,count])=>({nombre,count}));

  return {registros, lat_c, lng_c, cat_list};
}

/* ============== Mapa y UI ============== */
const map = L.map('map', {zoomControl:true}).setView([-1.8312,-78.1834], 6);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {attribution:'© OpenStreetMap'}).addTo(map);
const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {attribution:'© Esri'});
L.control.layers({"Mapa Estándar":osm,"Vista Satelital":sat},{},{collapsed:false}).addTo(map);
const cluster = L.markerClusterGroup({chunkedLoading:true,maxClusterRadius:60,spiderfyOnMaxZoom:true,showCoverageOnHover:false,disableClusteringAtZoom:15});
map.addLayer(cluster);

let selected = new Set();
let provLayer=null;

function colorFor(cat){
  const t={"MINEDUC":"#2563eb","SENECYT":"#10b981","SENECYT - ZONA DEPORTE":"#0ea5e9","ZONA DEPORTE":"#f59e0b","OT DEPORTE":"#ef4444","SIN ETIQUETA":"#6b7280"};
  for (const k in t) if (cat && cat.toUpperCase().indexOf(k)>=0) return t[k]; return "#2563eb";
}
function row(l,v){ if(v==null || String(v).trim()==="") return ""; return `<div style="padding:6px;border-left:3px solid #eef"><b>${l}:</b> <span style="opacity:.9">${v}</span></div>`; }
function popup(c){ return `<div style="width:520px;font-family:system-ui;">
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

function render(arr){
  cluster.clearLayers();
  arr.forEach(r=>{
    const m=L.circleMarker([r.lat,r.lng],{radius:8,fillColor:colorFor(r.categoria),color:'#fff',weight:2,fillOpacity:.95});
    m.bindPopup(popup(r.campos),{maxWidth:560,autoPan:false});
    m.bindTooltip(`${r.campos.COD_DISTRI||""}`,{permanent:false,direction:'top',opacity:.85});
    cluster.addLayer(m);
  });
  const n = (FORCE_COUNT ?? arr.length);
  document.getElementById('nTotal').textContent = n.toLocaleString();
  document.getElementById('counter').innerHTML = `${n} distritos`;
}

function filtrar(base){ 
  let out = base; 
  if(selected.size>0){ out = base.filter(d=>selected.has((d.categoria||"").toString())); }
  render(out);
}
function makeChips(cats, base){
  const box=document.getElementById('chips'); box.innerHTML="";
  cats.forEach(c=>{
    const el=document.createElement('button'); el.className='chip'; el.textContent=`${c.nombre} (${c.count})`;
    el.onclick=()=>{ 
      if(el.classList.contains('active')){el.classList.remove('active');selected.delete(c.nombre);}
      else{el.classList.add('active');selected.add(c.nombre);} 
      filtrar(base);
    };
    box.appendChild(el);
  });
}

/* ============== Cargar logo y provincias ============== */
fetch(PATHS.logo).then(r=>{ if(r.ok){ document.getElementById('logo').src=PATHS.logo; document.getElementById('logo').style.display='block'; }});
let btnProv = document.getElementById('btnProv');
btnProv.onclick = ()=>{ if(!provLayer) return; if(map.hasLayer(provLayer)){ map.removeLayer(provLayer); btnProv.textContent="Provincias: OFF"; } else { provLayer.addTo(map); btnProv.textContent="Provincias: ON"; } };
fetch(PATHS.provincias)
  .then(r=> r.ok ? r.json() : Promise.reject('no prov'))
  .then(gj=>{
    provLayer = L.geoJSON(gj,{style:{color:'#7a4ad8',weight:2,opacity:.8,fillOpacity:.05},
      onEachFeature:(f,ly)=>{const p=f.properties||{};const n=p.DPA_DESPRO||p.PROVINCIA||p.NAME_1||"Provincia";ly.bindTooltip(n,{sticky:true});}
    }).addTo(map);
  })
  .catch(()=>{}); // opcional

/* ============== Arranque: leer CSV y pintar ============== */
(async ()=>{
  document.getElementById('loading').style.display='flex';
  try{
    const {registros, lat_c, lng_c, cat_list} = await readCSV(PATHS.csv);
    map.setView([lat_c,lng_c], 6);
    makeChips(cat_list, registros);
    document.getElementById('btnAll').onclick = ()=>{ selected.clear(); document.querySelectorAll('.chip.active').forEach(x=>x.classList.remove('active')); filtrar(registros); };
    filtrar(registros);
  }catch(err){
    document.getElementById('counter').innerHTML = "❌ Error cargando datos";
    console.error(err);
    alert("No se pudo leer el CSV. Verifica que exista data/distritos.csv y que tenga columnas Latitud/Longitud.");
  }finally{
    document.getElementById('loading').style.display='none';
  }
})();
