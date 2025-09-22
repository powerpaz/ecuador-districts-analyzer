#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERADOR DE ARCHIVOS GEOJSON PARA MAPA WEB
============================================

Este script genera archivos GeoJSON compatibles con el mapa web
a partir de los datos de distritos educativos de Ecuador.

Autor: PowerPaz
Versión: 1.0
Fecha: 2024

Uso:
    python generate_geojson.py

Genera:
    - data/distritos.geojson: Puntos de distritos educativos
    - data/sample_instituciones.geojson: Instituciones de ejemplo
    - data/sample_provincias.geojson: Provincias como puntos
    - data/instrucciones.html: Guía para obtener datos reales
"""

import json
import os
from ecuador_districts_analyzer import cargar_datos_directo

def crear_carpeta_data():
    """Crear carpeta data si no existe"""
    if not os.path.exists('data'):
        os.makedirs('data')
        print("📁 Carpeta 'data' creada")

def generar_distritos_geojson(df):
    """
    Generar archivo GeoJSON con los distritos educativos
    
    Args:
        df (pandas.DataFrame): DataFrame con datos de distritos
    """
    print("📍 Generando distritos.geojson...")
    
    # Estructura GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Convertir cada distrito a feature GeoJSON
    for _, distrito in df.iterrows():
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(distrito['Longitud']), float(distrito['Latitud'])]
            },
            "properties": {
                "COD_DISTRI": str(distrito['COD_DISTRI']),
                "NOM_DISTRI": str(distrito['NOM_DISTRI']),
                "DPA_DESPRO": str(distrito['DPA_DESPRO']),
                "DPA_DESCAN": str(distrito['DPA_DESCAN']),
                "ZONA": int(distrito['ZONA']) if distrito['ZONA'] else None,
                "DIRECCION": str(distrito['DIRECCION']),
                "Capital_Pr": str(distrito['Capital_Pr']),
                "COMPLEMENT": str(distrito['COMPLEMENT']),
                "NMT_25": str(distrito['NMT_25'])
            }
        }
        geojson["features"].append(feature)
    
    # Guardar archivo
    with open('data/distritos.geojson', 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Archivo guardado: data/distritos.geojson ({len(geojson['features'])} distritos)")

def generar_instituciones_sample():
    """
    Generar archivo GeoJSON de ejemplo con instituciones educativas
    """
    print("🏫 Generando sample_instituciones.geojson...")
    
    # Instituciones de ejemplo distribuidas por Ecuador
    instituciones_sample = [
        {
            "nombre": "Unidad Educativa Fiscal Simón Bolívar",
            "amie": "09H00001",
            "sostenimiento": "FISCAL",
            "provincia": "GUAYAS",
            "canton": "GUAYAQUIL",
            "estudiantes": 1200,
            "lat": -2.1894,
            "lon": -79.8941
        },
        {
            "nombre": "Colegio Particular San Francisco",
            "amie": "17H00001", 
            "sostenimiento": "PARTICULAR",
            "provincia": "PICHINCHA",
            "canton": "QUITO",
            "estudiantes": 800,
            "lat": -0.2048,
            "lon": -78.4978
        },
        {
            "nombre": "Instituto Fiscomisional La Salle",
            "amie": "01H00001",
            "sostenimiento": "FISCOMISIONAL", 
            "provincia": "AZUAY",
            "canton": "CUENCA",
            "estudiantes": 650,
            "lat": -2.8996,
            "lon": -79.0058
        },
        {
            "nombre": "Escuela Rural El Progreso",
            "amie": "08H00001",
            "sostenimiento": "FISCAL",
            "provincia": "ESMERALDAS",
            "canton": "ESMERALDAS", 
            "estudiantes": 120,
            "lat": 0.9558,
            "lon": -79.6527
        },
        {
            "nombre": "Colegio Nacional Macas",
            "amie": "14H00001",
            "sostenimiento": "FISCAL",
            "provincia": "MORONA SANTIAGO",
            "canton": "MORONA",
            "estudiantes": 450,
            "lat": -2.3083,
            "lon": -78.1136
        },
        {
            "nombre": "Unidad Educativa del Milenio Tena",
            "amie": "15H00001",
            "sostenimiento": "FISCAL",
            "provincia": "NAPO", 
            "canton": "TENA",
            "estudiantes": 890,
            "lat": -0.9942,
            "lon": -77.8136
        },
        {
            "nombre": "Colegio Técnico Machala",
            "amie": "07H00001",
            "sostenimiento": "FISCAL",
            "provincia": "EL ORO",
            "canton": "MACHALA",
            "estudiantes": 1100,
            "lat": -3.2610,
            "lon": -79.9602
        },
        {
            "nombre": "Instituto Superior Ambato",
            "amie": "18H00001",
            "sostenimiento": "PARTICULAR",
            "provincia": "TUNGURAHUA",
            "canton": "AMBATO",
            "estudiantes": 550,
            "lat": -1.2444,
            "lon": -78.6269
        },
        {
            "nombre": "Escuela Bilingüe Otavalo",
            "amie": "10H00001", 
            "sostenimiento": "FISCOMISIONAL",
            "provincia": "IMBABURA",
            "canton": "OTAVALO",
            "estudiantes": 300,
            "lat": 0.2344,
            "lon": -78.2631
        },
        {
            "nombre": "Colegio Puerto Ayora",
            "amie": "20H00001",
            "sostenimiento": "FISCAL",
            "provincia": "GALAPAGOS",
            "canton": "SANTA CRUZ",
            "estudiantes": 180,
            "lat": -0.7417,
            "lon": -90.3042
        },
        {
            "nombre": "Unidad Educativa Loja",
            "amie": "11H00001",
            "sostenimiento": "FISCAL",
            "provincia": "LOJA",
            "canton": "LOJA",
            "estudiantes": 950,
            "lat": -3.9969,
            "lon": -79.2036
        },
        {
            "nombre": "Instituto Tecnológico Riobamba",
            "amie": "06H00001",
            "sostenimiento": "PARTICULAR",
            "provincia": "CHIMBORAZO",
            "canton": "RIOBAMBA", 
            "estudiantes": 720,
            "lat": -1.6697,
            "lon": -78.6531
        }
    ]
    
    # Estructura GeoJSON
    geojson = {
        "type": "FeatureCollection", 
        "features": []
    }
    
    # Convertir cada institución a feature
    for inst in instituciones_sample:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inst['lon'], inst['lat']]
            },
            "properties": {
                "NOM_INSTITUCION_EDUCATIVA": inst['nombre'],
                "AMIE": inst['amie'],
                "NOM_SOSTENIMIENTO": inst['sostenimiento'],
                "DPA_DESPRO": inst['provincia'],
                "DPA_DESCAN": inst['canton'],
                "TOTAL_ESTUDIANTES": inst['estudiantes'],
                "REGIMEN": "REGULAR",
                "ZONA": "URBANA"
            }
        }
        geojson["features"].append(feature)
    
    # Guardar archivo
    with open('data/sample_instituciones.geojson', 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Archivo guardado: data/sample_instituciones.geojson ({len(geojson['features'])} instituciones)")

def generar_provincias_sample():
    """
    Generar archivo GeoJSON básico con puntos representativos de provincias
    """
    print("🏛️ Generando sample_provincias.geojson...")
    
    # Capitales provinciales aproximadas
    capitales = [
        {"provincia": "AZUAY", "capital": "CUENCA", "lat": -2.8996, "lon": -79.0058},
        {"provincia": "BOLIVAR", "capital": "GUARANDA", "lat": -1.5928, "lon": -79.0020},
        {"provincia": "CAÑAR", "capital": "AZOGUES", "lat": -2.7378, "lon": -78.8472},
        {"provincia": "CARCHI", "capital": "TULCAN", "lat": 0.8142, "lon": -77.7161},
        {"provincia": "CHIMBORAZO", "capital": "RIOBAMBA", "lat": -1.6697, "lon": -78.6531},
        {"provincia": "COTOPAXI", "capital": "LATACUNGA", "lat": -0.9342, "lon": -78.6156},
        {"provincia": "EL ORO", "capital": "MACHALA", "lat": -3.2610, "lon": -79.9602},
        {"provincia": "ESMERALDAS", "capital": "ESMERALDAS", "lat": 0.9558, "lon": -79.6527},
        {"provincia": "GALAPAGOS", "capital": "PUERTO BAQUERIZO MORENO", "lat": -0.9003, "lon": -89.6150},
        {"provincia": "GUAYAS", "capital": "GUAYAQUIL", "lat": -2.1894, "lon": -79.8941},
        {"provincia": "IMBABURA", "capital": "IBARRA", "lat": 0.3494, "lon": -78.1222},
        {"provincia": "LOJA", "capital": "LOJA", "lat": -3.9969, "lon": -79.2036},
        {"provincia": "LOS RIOS", "capital": "BABAHOYO", "lat": -1.8028, "lon": -79.5347},
        {"provincia": "MANABI", "capital": "PORTOVIEJO", "lat": -1.0547, "lon": -80.4544},
        {"provincia": "MORONA SANTIAGO", "capital": "MACAS", "lat": -2.3083, "lon": -78.1136},
        {"provincia": "NAPO", "capital": "TENA", "lat": -0.9942, "lon": -77.8136},
        {"provincia": "ORELLANA", "capital": "PUERTO FRANCISCO DE ORELLANA", "lat": -0.4669, "lon": -76.9850},
        {"provincia": "PASTAZA", "capital": "PUYO", "lat": -1.4867, "lon": -78.0036},
        {"provincia": "PICHINCHA", "capital": "QUITO", "lat": -0.2048, "lon": -78.4978},
        {"provincia": "SANTA ELENA", "capital": "SANTA ELENA", "lat": -2.2283, "lon": -80.8600},
        {"provincia": "SANTO DOMINGO DE LOS TSACHILAS", "capital": "SANTO DOMINGO", "lat": -0.2411, "lon": -79.1756},
        {"provincia": "SUCUMBIOS", "capital": "NUEVA LOJA", "lat": 0.0894, "lon": -76.8872},
        {"provincia": "TUNGURAHUA", "capital": "AMBATO", "lat": -1.2444, "lon": -78.6269},
        {"provincia": "ZAMORA CHINCHIPE", "capital": "ZAMORA", "lat": -4.0678, "lon": -78.9539}
    ]
    
    # Estructura GeoJSON - puntos por ahora, idealmente serían polígonos
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    for prov in capitales:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [prov['lon'], prov['lat']]
            },
            "properties": {
                "DPA_DESPRO": prov['provincia'],
                "CAPITAL": prov['capital'],
                "TIPO": "PROVINCIA"
            }
        }
        geojson["features"].append(feature)
    
    # Guardar archivo
    with open('data/sample_provincias.geojson', 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Archivo guardado: data/sample_provincias.geojson ({len(geojson['features'])} provincias)")

def crear_instrucciones_html():
    """
    Crear archivo HTML con instrucciones para obtener datos reales
    """
    html_content = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Instrucciones - Datos GeoJSON Ecuador</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 900px; 
            margin: 40px auto; 
            padding: 20px; 
            line-height: 1.6;
            background: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 { color: #1976d2; border-bottom: 3px solid #1976d2; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        code { 
            background: #f5f5f5; 
            padding: 3px 8px; 
            border-radius: 4px; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
        pre { 
            background: #f8f8f8; 
            padding: 20px; 
            border-radius: 8px; 
            overflow-x: auto;
            border-left: 4px solid #1976d2;
        }
        .note { 
            background: #e3f2fd; 
            padding: 20px; 
            border-left: 4px solid #1976d2; 
            margin: 20px 0;
            border-radius: 8px;
        }
        .warning {
            background: #fff3e0;
            border-left: 4px solid #f57c00;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .success {
            background: #e8f5e8;
            border-left: 4px solid #4caf50;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        ul li { margin: 10px 0; }
        .highlight { background: #ffeb3b; padding: 2px 4px; border-radius: 3px; }
        .link-box {
            background: #f0f7ff;
            border: 2px solid #1976d2;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .link-box a {
            color: #1976d2;
            text-decoration: none;
            font-weight: bold;
        }
        .link-box a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Obtener Datos GeoJSON Completos para Ecuador</h1>
        
        <div class="note">
            <strong>📌 Importante:</strong> Los archivos generados en <code>data/</code> son de <strong>ejemplo y demostración</strong>. 
            Para crear un mapa educativo completo y actualizado necesitas los datos oficiales del Ministerio de Educación del Ecuador.
        </div>
        
        <h2>🏫 1. Instituciones Educativas Completas</h2>
        <p>Para obtener el dataset completo con <strong>todas las instituciones educativas</strong> del país:</p>
        
        <div class="link-box">
            <strong>🔗 Fuente Oficial:</strong><br>
            <a href="https://educacion.gob.ec/datos-abiertos/" target="_blank">
                Portal de Datos Abiertos - Ministerio de Educación
            </a>
        </div>
        
        <ol>
            <li>Accede al portal oficial de datos abiertos del MinEduc</li>
            <li>Busca: <span class="highlight">"Directorio de Instituciones Educativas"</span></li>
            <li>Descarga el archivo (normalmente en formato .xlsx o .csv)</li>
            <li>Verifica que tenga columnas de coordenadas (Latitud, Longitud)</li>
            <li>Convierte a GeoJSON usando el script Python incluido</li>
        </ol>
        
        <h2>🏛️ 2. Límites Provinciales (Polígonos)</h2>
        <p>Para obtener los <strong>límites administrativos reales</strong> de Ecuador:</p>
        
        <div class="link-box">
            <strong>🔗 Instituto Nacional de Estadística:</strong><br>
            <a href="https://www.ecuadorencifras.gob.ec/" target="_blank">
                INEC - Cartografía y Mapas
            </a>
        </div>
        
        <ol>
            <li>Ve a la sección <strong>"Cartografía y Mapas"</strong></li>
            <li>Descarga: <span class="highlight">"División Política Administrativa del Ecuador"</span></li>
            <li>El archivo viene en formato <strong>Shapefile (.shp)</strong></li>
            <li>Convierte a GeoJSON usando las herramientas recomendadas</li>
        </ol>
        
        <h2>🛠️ 3. Herramientas para Conversión</h2>
        
        <h3>🌐 Herramientas Online (Más Fácil):</h3>
        <div class="link-box">
            <strong>🔗 MapShaper (Recomendado):</strong><br>
            <a href="https://mapshaper.org/" target="_blank">mapshaper.org</a><br>
            <small>Convierte Shapefile a GeoJSON, simplifica geometrías, y optimiza archivos</small>
        </div>
        
        <div class="link-box">
            <strong>🔗 GeoJSON.io:</strong><br>
            <a href="https://geojson.io/" target="_blank">geojson.io</a><br>
            <small>Editor visual para crear y editar archivos GeoJSON</small>
        </div>
        
        <h3>💻 Software de Escritorio:</h3>
        <ul>
            <li><strong>QGIS</strong> (gratuito) - Software GIS completo y profesional</li>
            <li><strong>ArcGIS</strong> (pago) - Solución profesional de ESRI</li>
        </ul>
        
        <h2>🐍 4. Conversión con Python</h2>
        <p>Si tienes experiencia con Python, puedes automatizar la conversión:</p>
        
        <div class="warning">
            <strong>⚠️ Requiere instalar:</strong> <code>pip install geopandas</code>
        </div>
        
        <pre><code># Convertir Shapefile a GeoJSON
import geopandas as gpd

# Leer shapefile de provincias
provincias = gpd.read_file('provincias_ecuador.shp')
# Guardar como GeoJSON
provincias.to_file('data/provincias.geojson', driver='GeoJSON')

# Convertir CSV con coordenadas a GeoJSON
import pandas as pd
df = pd.read_csv('instituciones_educativas.csv')
gdf = gpd.GeoDataFrame(
    df, 
    geometry=gpd.points_from_xy(df.Longitud, df.Latitud),
    crs='EPSG:4326'  # Sistema de coordenadas WGS84
)
gdf.to_file('data/instituciones.geojson', driver='GeoJSON')</code></pre>
        
        <h2>📁 5. Estructura de Archivos Final</h2>
        <p>Una vez obtenidos los datos reales, tu carpeta <code>data/</code> debería tener:</p>
        
        <pre><code>data/
├── 📍 distritos.geojson              # Distritos educativos (generado automáticamente)
├── 🏫 instituciones.geojson          # TODAS las instituciones (descargar del MinEduc)
├── 🏛️ provincias.geojson             # Límites provinciales (descargar del INEC)
└── 📋 instrucciones.html             # Este archivo</code></pre>
        
        <h2>🎯 6. Verificación de Datos</h2>
        
        <div class="success">
            <strong>✅ Datos correctos deben tener:</strong>
            <ul>
                <li><strong>Instituciones:</strong> +15,000 registros (aproximadamente)</li>
                <li><strong>Provincias:</strong> 24 polígonos (una por provincia)</li>
                <li><strong>Distritos:</strong> 140+ puntos (generados automáticamente)</li>
                <li><strong>Coordenadas:</strong> Latitud entre -5° y +2°, Longitud entre -92° y -75°</li>
            </ul>
        </div>
        
        <h2>🚀 7. Después de Obtener los Datos</h2>
        
        <ol>
            <li><strong>Reemplaza</strong> los archivos de ejemplo con los datos reales</li>
            <li><strong>Abre</strong> <code>index.html</code> en tu navegador</li>
            <li><strong>Verifica</strong> que se carguen todas las capas correctamente</li>
            <li><strong>Ajusta</strong> estilos y colores si es necesario</li>
        </ol>
        
        <h2>💡 8. Tips Adicionales</h2>
        
        <ul>
            <li>🔧 <strong>Simplifica geometrías:</strong> Los archivos grandes pueden ser lentos en el navegador</li>
            <li>📊 <strong>Filtra datos:</strong> Incluye solo las columnas necesarias para el mapa</li>
            <li>🗜️ <strong>Comprime archivos:</strong> Usa herramientas como MapShaper para reducir el tamaño</li>
            <li>🎨 <strong>Personaliza estilos:</strong> Modifica colores y símbolos en <code>index.html</code></li>
        </ul>
        
        <h2>📞 9. Soporte</h2>
        
        <div class="note">
            Si tienes problemas técnicos:
            <ol>
                <li>Verifica que los archivos GeoJSON sean válidos en <a href="https://geojson.io">geojson.io</a></li>
                <li>Revisa la consola del navegador (F12) para errores JavaScript</li>
                <li>Asegúrate de que las coordenadas estén en el sistema WGS84 (EPSG:4326)</li>
                <li>Consulta la documentación del proyecto en GitHub</li>
            </ol>
        </div>
        
        <hr style="margin: 40px 0;">
        
        <p style="text-align: center; color: #666;">
            <strong>🇪🇨 Proyecto Ecuador Districts Analyzer</strong><br>
            <em>Análisis y visualización de datos educativos del Ecuador</em>
        </p>
    </div>
</body>
</html>"""
    
    with open('data/instrucciones.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("✅ Archivo guardado: data/instrucciones.html")

def crear_configuracion_mapa():
    """
    Crear archivo de configuración JavaScript para el mapa
    """
    print("⚙️ Generando config.js...")
    
    config_js = """// CONFIGURACIÓN DEL MAPA EDUCATIVO ECUADOR
// Archivo de configuración para personalizar el mapa web

const CONFIG = {
    // Configuración del mapa base
    map: {
        center: [-1.8312, -78.1834], // Centro de Ecuador
        zoom: 6,                      // Nivel de zoom inicial
        maxZoom: 18,                 // Zoom máximo
        minZoom: 5                   // Zoom mínimo
    },
    
    // Colores por tipo de institución
    colors: {
        FISCAL: '#2e7d32',           // Verde para instituciones fiscales
        PARTICULAR: '#d32f2f',        // Rojo para instituciones particulares
        FISCOMISIONAL: '#f57c00',     // Naranja para fiscomisionales
        DEFAULT: '#1976d2',           // Azul por defecto
        DISTRITO: '#ff5722'           // Naranja para distritos
    },
    
    // Configuración de clustering
    cluster: {
        maxClusterRadius: 50,         // Radio máximo del cluster
        showCoverageOnHover: false,   // Mostrar cobertura al hover
        chunkedLoading: true,         // Carga en chunks
        animate: true                 // Animaciones
    },
    
    // Archivos de datos
    dataFiles: {
        distritos: 'data/distritos.geojson',
        instituciones: 'data/sample_instituciones.geojson', // Cambiar por 'instituciones.geojson' cuando tengas datos reales
        provincias: 'data/sample_provincias.geojson'        // Cambiar por 'provincias.geojson' cuando tengas datos reales
    },
    
    // Configuración de popups
    popup: {
        maxWidth: 350,
        closeButton: true,
        autoPan: true
    },
    
    // Mensajes de error
    messages: {
        noData: 'No se encontraron datos para mostrar',
        loadError: 'Error al cargar los datos del mapa',
        noInstituciones: 'Para ver todas las instituciones educativas, sube el archivo instituciones.geojson completo'
    }
};

// Exportar configuración si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}"""
    
    with open('data/config.js', 'w', encoding='utf-8') as f:
        f.write(config_js)
    
    print("✅ Archivo guardado: data/config.js")

def main():
    """Función principal"""
    print("🇪🇨 GENERADOR DE ARCHIVOS GEOJSON PARA ECUADOR")
    print("="*60)
    print("Este script prepara todos los archivos necesarios para el mapa web")
    print("="*60)
    
    # Crear carpeta data
    crear_carpeta_data()
    
    # Cargar datos de distritos
    print("\n📊 Cargando datos de distritos...")
    df = cargar_datos_directo()
    
    if df is not None and len(df) > 0:
        print(f"✅ Datos cargados: {len(df)} distritos de {df['DPA_DESPRO'].nunique()} provincias")
        
        # Generar archivos GeoJSON
        print("\n🔄 Generando archivos GeoJSON...")
        generar_distritos_geojson(df)
        generar_instituciones_sample()
        generar_provincias_sample()
        
        # Crear archivos de soporte
        print("\n📋 Creando archivos de soporte...")
        crear_instrucciones_html()
        crear_configuracion_mapa()
        
        print("\n🎉 ¡ARCHIVOS GEOJSON GENERADOS EXITOSAMENTE!")
        print("="*60)
        print("📁 Archivos creados en carpeta 'data/':")
        print("   ✅ distritos.geojson - Distritos educativos (DATOS REALES)")
        print("   ✅ sample_instituciones.geojson - Instituciones de ejemplo")  
        print("   ✅ sample_provincias.geojson - Provincias como puntos")
        print("   ✅ instrucciones.html - Guía completa para obtener datos oficiales")
        print("   ✅ config.js - Configuración del mapa web")
        
        # Verificar estructura de archivos
        print(f"\n📊 RESUMEN ESTADÍSTICO:")
        print(f"   • Distritos reales: {len(df)} (todas las regiones de Ecuador)")
        print(f"   • Instituciones ejemplo: 12 (representa diferentes tipos)")
        print(f"   • Provincias: 24 (todas las provincias del Ecuador)")
        print(f"   • Cobertura geográfica: Costa, Sierra, Oriente y Galápagos")
        
        print("\n🌐 PRÓXIMOS PASOS:")
        print("="*30)
        print("1. 🗂️  Abre 'data/instrucciones.html' para obtener datos reales")
        print("2. 📁 Reemplaza archivos 'sample_*' con datos oficiales cuando los tengas")
        print("3. 🌍 Abre 'index.html' para ver el mapa funcionando")
        print("4. 🎨 Personaliza colores y estilos en 'config.js' si deseas")
        
        print("\n💡 TIPS IMPORTANTES:")
        print("   • Los datos de DISTRITOS son reales y completos")
        print("   • Los datos de INSTITUCIONES son solo ejemplos")
        print("   • Para un mapa completo necesitas datos del MinEduc")
        print("   • El mapa funciona perfectamente con los datos actuales")
        
        print(f"\n✨ El mapa web ya está listo para usar con los datos disponibles!")
        
    else:
        print("❌ Error: No se pudieron cargar los datos de distritos")
        print("💡 Verifica que el archivo ecuador_districts_analyzer.py esté disponible")

if __name__ == "__main__":
    main()
