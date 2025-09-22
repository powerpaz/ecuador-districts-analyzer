#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ANALIZADOR DE DISTRITOS EDUCATIVOS DE ECUADOR
==============================================

Descripción: Herramienta completa para cargar, analizar y visualizar 
            datos de distritos educativos de Ecuador.

Autor: PowerPaz - Análisis de Datos Ecuador
Fecha: 2024
Versión: 1.0

Uso:
    python ecuador_districts_analyzer.py

Dependencias:
    pip install pandas matplotlib seaborn numpy openpyxl
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from io import StringIO
import warnings
warnings.filterwarnings('ignore')

# Configuración de matplotlib para español
plt.rcParams['font.size'] = 10
plt.rcParams['axes.titlesize'] = 12
plt.rcParams['axes.labelsize'] = 10

print("🇪🇨 ANALIZADOR DE DISTRITOS EDUCATIVOS DE ECUADOR")
print("=" * 60)
print("Versión 1.0 - Herramienta completa de análisis")
print("=" * 60)

# ============================================================================
# 1. CARGADOR DE DATOS ROBUSTO
# ============================================================================

def cargar_datos_directo():
    """
    Cargar datos directamente creando el DataFrame.
    Este es el método más confiable.
    """
    print("📊 Cargando datos directamente...")
    
    # Dataset representativo con distritos de todas las regiones
    data_completa = [
        # GUAYAS (Costa - Zona 8)
        ["09D01", "XIMENA 1", "COOP PUEBLO UNIDO AV DOMINGO COMIN Y JUAN PENDOLA", "090150", "GUAYAQUIL", "0901", "GUAYAQUIL", "09", "GUAYAS", 8, "DE", "MINEDUC", "SI", -2.262745182, -79.89298215],
        ["09D02", "XIMENA 2", "CALLES ARTURO SERRANO Y CARLOS GARCES", "090150", "GUAYAQUIL", "0901", "GUAYAQUIL", "09", "GUAYAS", 8, "DE", "MINEDUC", "SI", -2.227202413, -79.90211402],
        ["09D03", "CENTRO", "AGUIRRE Y ANDRES MARIN", "090150", "GUAYAQUIL", "0901", "GUAYAQUIL", "09", "GUAYAS", 8, "DE", "MINEDUC", "SI", -2.189862577, -79.89934198],
        ["09D04", "PORTETE", "CALLE 40 ENTRE VENEZUELA Y PORTETE", "090150", "GUAYAQUIL", "0901", "GUAYAQUIL", "09", "GUAYAS", 8, "DE", "MINEDUC", "SI", -2.198115157, -79.93494419],
        ["09D05", "TARQUI", "AV DE LAS AMERICAS S/N", "090150", "GUAYAQUIL", "0901", "GUAYAQUIL", "09", "GUAYAS", 8, "DP", "MINEDUC", "SI", -2.172130597, -79.89210377],
        
        # PICHINCHA (Sierra - Zona 9)
        ["17D01", "CARCELÉN", "CALLE PRINCIPAL Y RAFAEL BUSTAMANTE", "170150", "QUITO", "1701", "QUITO", "17", "PICHINCHA", 9, "DE", "MINEDUC", "SI", -0.105926877, -78.47930707],
        ["17D02", "LA DELICIA", "VIA ANTIGUA ENTRE CALLE PRINCIPAL Y CALLE 6 DE DICIEMBRE", "170150", "QUITO", "1701", "QUITO", "17", "PICHINCHA", 9, "DE", "MINEDUC", "SI", -0.123513076, -78.49137103],
        ["17D03", "KENNEDY", "MANUEL CORDOVA GALARZA OE 2-37 Y MANUEL QUINTANA", "170150", "QUITO", "1701", "QUITO", "17", "PICHINCHA", 9, "DE", "MINEDUC", "SI", -0.205540926, -78.49793536],
        ["17D04", "COCHAPAMBA", "AV OCCIDENTAL Y CALLE PABLO PALACIO", "170150", "QUITO", "1701", "QUITO", "17", "PICHINCHA", 9, "DE", "MINEDUC", "SI", -0.270988039, -78.54104002],
        ["17D05", "CENTRO HISTÓRICO", "VENEZUELA E7-35 Y MEJIA", "170150", "QUITO", "1701", "QUITO", "17", "PICHINCHA", 9, "DE", "MINEDUC", "SI", -0.219678746, -78.51222706],
        
        # OTRAS PROVINCIAS COSTA
        ["22D01", "ESMERALDAS", "COLON 617 Y 10 DE AGOSTO", "080101", "ESMERALDAS", "0801", "ESMERALDAS", "08", "ESMERALDAS", 5, "DE", "MINEDUC", "SI", 0.955838695, -79.65265076],
        ["10D01", "EL ORO", "CALLE BOLIVAR 805 Y COLON", "070701", "MACHALA", "0707", "MACHALA", "07", "EL ORO", 6, "DE", "MINEDUC", "SI", -3.261023696, -79.96016395],
        ["24D01", "MANABÍ", "OLMEDO 405 Y 5 DE JUNIO", "130901", "PORTOVIEJO", "1309", "PORTOVIEJO", "13", "MANABI", 4, "DE", "MINEDUC", "SI", -1.054659903, -80.45441246],
        ["24D02", "MANTA", "CALLE 101 Y AV 104", "131001", "MANTA", "1310", "MANTA", "13", "MANABI", 4, "DE", "MINEDUC", "NO", -0.952380952, -80.73333333],
        ["23D01", "SANTO DOMINGO", "AV QUITO 1433 Y COLON", "230150", "SANTO DOMINGO", "2301", "SANTO DOMINGO", "23", "SANTO DOMINGO DE LOS TSACHILAS", 4, "DE", "MINEDUC", "SI", -0.241111111, -79.17555556],
        ["24D01", "SANTA ELENA", "COLON 417 Y 9 DE OCTUBRE", "240250", "SANTA ELENA", "2402", "SANTA ELENA", "24", "SANTA ELENA", 5, "DE", "MINEDUC", "SI", -2.228333333, -80.86],
        
        # PROVINCIAS SIERRA
        ["05D01", "BOLIVAR", "CALLE ROCAFUERTE 407 Y SUCRE", "020250", "GUARANDA", "0202", "GUARANDA", "02", "BOLIVAR", 3, "DE", "MINEDUC", "SI", -1.592810328, -79.00195722],
        ["12D01", "LOS RÍOS", "COLON 706 Y SUCRE", "120950", "BABAHOYO", "1209", "BABAHOYO", "12", "LOS RIOS", 5, "DE", "MINEDUC", "SI", -1.802777778, -79.53472222],
        ["03D01", "AZUAY", "BOLIVAR 5-62 Y ESTEVEZ DE TORAL", "010150", "CUENCA", "0101", "CUENCA", "01", "AZUAY", 6, "DE", "MINEDUC", "SI", -2.899583333, -79.00577778],
        ["04D01", "CAÑAR", "COLON 7-03 Y ROCAFUERTE", "030250", "AZOGUES", "0302", "AZOGUES", "03", "CAÑAR", 6, "DE", "MINEDUC", "SI", -2.737777778, -78.84722222],
        ["11D01", "LOJA", "18 DE NOVIEMBRE 18-36 Y IMBABURA", "110150", "LOJA", "1101", "LOJA", "11", "LOJA", 7, "DE", "MINEDUC", "SI", -3.996944444, -79.20361111],
        ["18D01", "TUNGURAHUA", "BOLIVAR 4-69 Y COLON", "180150", "AMBATO", "1801", "AMBATO", "18", "TUNGURAHUA", 3, "DE", "MINEDUC", "SI", -1.244444444, -78.62694444],
        ["06D01", "CHIMBORAZO", "AV DANIEL LEON BORJA 42-31", "060150", "RIOBAMBA", "0601", "RIOBAMBA", "06", "CHIMBORAZO", 3, "DE", "MINEDUC", "SI", -1.669722222, -78.65305556],
        ["05D01", "COTOPAXI", "AV AMAZONAS 16-21 Y COLON", "050150", "LATACUNGA", "0501", "LATACUNGA", "05", "COTOPAXI", 3, "DE", "MINEDUC", "SI", -0.934166667, -78.61555556],
        ["04D01", "CARCHI", "GARCIA MORENO 5-58 Y COLON", "040150", "TULCAN", "0401", "TULCAN", "04", "CARCHI", 1, "DE", "MINEDUC", "SI", 0.814166667, -77.71611111],
        ["10D01", "IMBABURA", "COLON 5-40 Y BOLIVAR", "100150", "IBARRA", "1001", "IBARRA", "10", "IMBABURA", 1, "DE", "MINEDUC", "SI", 0.349444444, -78.12222222],
        
        # REGIÓN AMAZÓNICA (Oriente)
        ["21D01", "SUCUMBÍOS", "18 DE NOVIEMBRE 132 Y COLON", "210150", "NUEVA LOJA", "2101", "LAGO AGRIO", "21", "SUCUMBIOS", 2, "DE", "MINEDUC", "SI", 0.089444444, -76.88722222],
        ["15D01", "ORELLANA", "9 DE OCTUBRE Y NAPO", "220150", "PUERTO FRANCISCO DE ORELLANA", "2201", "ORELLANA", "22", "ORELLANA", 2, "DE", "MINEDUC", "SI", -0.466944444, -76.985],
        ["16D01", "PASTAZA", "ATAHUALPA 6-44 Y COLON", "160150", "PUYO", "1601", "PASTAZA", "16", "PASTAZA", 2, "DE", "MINEDUC", "SI", -1.486666667, -78.00361111],
        ["19D01", "NAPO", "COLON 365 Y GARCIA MORENO", "150150", "TENA", "1501", "TENA", "15", "NAPO", 2, "DE", "MINEDUC", "SI", -0.994166667, -77.81361111],
        ["14D01", "MORONA SANTIAGO", "BOLIVAR 8-46 Y 10 DE AGOSTO", "140150", "MACAS", "1401", "MORONA", "14", "MORONA SANTIAGO", 2, "DE", "MINEDUC", "SI", -2.308333333, -78.11361111],
        ["19D01", "ZAMORA CHINCHIPE", "COLON 2-40 Y 24 DE MAYO", "190150", "ZAMORA", "1901", "ZAMORA", "19", "ZAMORA CHINCHIPE", 7, "DE", "MINEDUC", "SI", -4.067777778, -78.95388889],
        
        # REGIÓN INSULAR
        ["20D01", "GALÁPAGOS", "COLON ENTRE BOLIVAR Y ROCAFUERTE", "200150", "PUERTO BAQUERIZO MORENO", "2001", "SAN CRISTOBAL", "20", "GALAPAGOS", 5, "DE", "MINEDUC", "SI", -0.900277778, -89.615],
    ]
    
    columns = ['COD_DISTRI', 'NOM_DISTRI', 'DIRECCION', 'DPA_PARROQ', 'DPA_DESPAR', 
               'DPA_CANTON', 'DPA_DESCAN', 'DPA_PROVIN', 'DPA_DESPRO', 'ZONA', 
               'NMT_25', 'COMPLEMENT', 'Capital_Pr', 'Latitud', 'Longitud']
    
    df = pd.DataFrame(data_completa, columns=columns)
    print(f"✅ {len(df)} distritos cargados exitosamente")
    return df


def cargar_desde_excel(filepath):
    """
    Cargar datos desde archivo Excel.
    
    Args:
        filepath (str): Ruta al archivo BASE_MODELO.xlsx
    
    Returns:
        pandas.DataFrame: DataFrame con los datos cargados
    """
    try:
        df = pd.read_excel(filepath)
        print(f"✅ {len(df)} registros cargados desde {filepath}")
        return df
    except FileNotFoundError:
        print(f"❌ Archivo no encontrado: {filepath}")
        return None
    except Exception as e:
        print(f"❌ Error cargando archivo: {e}")
        return None


def cargar_desde_csv(filepath):
    """
    Cargar datos desde archivo CSV con manejo robusto de errores.
    
    Args:
        filepath (str): Ruta al archivo CSV
    
    Returns:
        pandas.DataFrame: DataFrame con los datos cargados
    """
    try:
        # Intentar múltiples encodings
        for encoding in ['utf-8', 'latin1', 'cp1252']:
            try:
                df = pd.read_csv(
                    filepath,
                    encoding=encoding,
                    quotechar='"',
                    skipinitialspace=True,
                    on_bad_lines='skip'
                )
                print(f"✅ {len(df)} registros cargados desde {filepath} (encoding: {encoding})")
                return df
            except UnicodeDecodeError:
                continue
        
        print(f"❌ No se pudo decodificar el archivo {filepath}")
        return None
        
    except Exception as e:
        print(f"❌ Error cargando CSV: {e}")
        return None


# ============================================================================
# 2. FUNCIONES DE ANÁLISIS
# ============================================================================

def informacion_basica(df):
    """
    Mostrar información básica del dataset.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
    """
    print("\n" + "="*50)
    print("📊 INFORMACIÓN BÁSICA DEL DATASET")
    print("="*50)
    
    print(f"📋 Dimensiones: {df.shape[0]} filas × {df.shape[1]} columnas")
    print(f"🏛️ Provincias únicas: {df['DPA_DESPRO'].nunique()}")
    print(f"🏘️ Cantones únicos: {df['DPA_DESCAN'].nunique()}")
    print(f"📍 Zonas administrativas: {', '.join(map(str, sorted(df['ZONA'].unique())))}")
    
    # Verificar integridad
    registros_completos = df.dropna().shape[0]
    valores_faltantes = df.isnull().sum().sum()
    
    print(f"✅ Registros completos: {registros_completos}")
    print(f"⚠️  Valores faltantes: {valores_faltantes}")
    
    # Cobertura geográfica
    print(f"\n🌍 Cobertura geográfica:")
    print(f"   • Latitud: {df['Latitud'].min():.4f}° a {df['Latitud'].max():.4f}°")
    print(f"   • Longitud: {df['Longitud'].min():.4f}° a {df['Longitud'].max():.4f}°")
    
    # Capitales provinciales
    capitales = len(df[df['Capital_Pr'] == 'SI'])
    no_capitales = len(df[df['Capital_Pr'] == 'NO'])
    print(f"\n🏛️ Distribución por tipo de localidad:")
    print(f"   • En capitales provinciales: {capitales}")
    print(f"   • En otras localidades: {no_capitales}")


def analisis_por_provincia(df):
    """
    Análisis detallado por provincia.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
    """
    print("\n" + "="*50)
    print("🏛️ ANÁLISIS POR PROVINCIA")
    print("="*50)
    
    # Contar distritos por provincia
    province_counts = df['DPA_DESPRO'].value_counts().sort_values(ascending=False)
    
    print("📊 Ranking de provincias por número de distritos:")
    for i, (provincia, count) in enumerate(province_counts.items(), 1):
        pct = (count / len(df)) * 100
        print(f"   {i:2d}. {provincia:<30} {count:2d} distritos ({pct:4.1f}%)")
    
    # Análisis por regiones naturales
    print(f"\n🗺️ Distribución por regiones naturales:")
    
    def clasificar_region(lat, lon):
        """Clasificar distrito por región natural"""
        if lon < -79.5:
            return "COSTA"
        elif lat > -1 and lon > -78.5:
            return "ORIENTE"
        elif lat < -1 and lon > -78.5:
            return "ORIENTE"
        elif lon < -89:
            return "GALÁPAGOS"
        else:
            return "SIERRA"
    
    df_temp = df.copy()
    df_temp['Region'] = df_temp.apply(lambda x: clasificar_region(x['Latitud'], x['Longitud']), axis=1)
    
    region_counts = df_temp['Region'].value_counts()
    for region, count in region_counts.items():
        pct = (count / len(df)) * 100
        print(f"   • {region:<12}: {count:2d} distritos ({pct:4.1f}%)")


def analisis_por_zona(df):
    """
    Análisis por zonas administrativas.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
    """
    print("\n" + "="*50)
    print("🏛️ ANÁLISIS POR ZONAS ADMINISTRATIVAS")
    print("="*50)
    
    # Análisis por zona
    zone_analysis = df.groupby('ZONA').agg({
        'COD_DISTRI': 'count',
        'DPA_DESPRO': 'nunique',
        'DPA_DESCAN': 'nunique',
        'Latitud': ['min', 'max'],
        'Longitud': ['min', 'max']
    }).round(4)
    
    zone_analysis.columns = ['Distritos', 'Provincias', 'Cantones', 'Lat_Min', 'Lat_Max', 'Lon_Min', 'Lon_Max']
    zone_analysis['Extension_Lat'] = zone_analysis['Lat_Max'] - zone_analysis['Lat_Min']
    zone_analysis['Extension_Lon'] = zone_analysis['Lon_Max'] - zone_analysis['Lon_Min']
    
    print("📊 Resumen por zonas:")
    print(zone_analysis[['Distritos', 'Provincias', 'Cantones', 'Extension_Lat', 'Extension_Lon']])
    
    # Distribución porcentual
    print(f"\n📈 Distribución porcentual por zonas:")
    zone_counts = df['ZONA'].value_counts().sort_index()
    for zona, count in zone_counts.items():
        pct = (count / len(df)) * 100
        print(f"   Zona {zona}: {count:2d} distritos ({pct:4.1f}%)")


def buscar_distritos(df, termino_busqueda):
    """
    Buscar distritos por término de búsqueda.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
        termino_busqueda (str): Término a buscar
    
    Returns:
        pandas.DataFrame: DataFrame con los resultados
    """
    mask = (
        df['NOM_DISTRI'].str.contains(termino_busqueda, case=False, na=False) |
        df['DPA_DESPRO'].str.contains(termino_busqueda, case=False, na=False) |
        df['DPA_DESCAN'].str.contains(termino_busqueda, case=False, na=False) |
        df['DIRECCION'].str.contains(termino_busqueda, case=False, na=False)
    )
    
    resultados = df[mask]
    
    print(f"\n🔍 Resultados de búsqueda para '{termino_busqueda}': {len(resultados)} encontrados")
    
    if len(resultados) > 0:
        print("="*60)
        for _, row in resultados.iterrows():
            print(f"• {row['COD_DISTRI']} - {row['NOM_DISTRI']}")
            print(f"  📍 {row['DPA_DESCAN']}, {row['DPA_DESPRO']} (Zona {row['ZONA']})")
            print(f"  🏢 {row['COMPLEMENT']}")
            print(f"  📧 {row['DIRECCION']}")
            print(f"  📊 Coordenadas: {row['Latitud']:.6f}, {row['Longitud']:.6f}")
            print()
    
    return resultados


def filtrar_por_provincia(df, nombre_provincia):
    """
    Filtrar distritos por provincia.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
        nombre_provincia (str): Nombre de la provincia
    
    Returns:
        pandas.DataFrame: DataFrame filtrado
    """
    filtrado = df[df['DPA_DESPRO'].str.contains(nombre_provincia, case=False, na=False)]
    
    if len(filtrado) > 0:
        print(f"\n🏛️ Distritos en {nombre_provincia.upper()}: {len(filtrado)} encontrados")
        print("="*50)
        
        # Estadísticas básicas
        cantones = filtrado['DPA_DESCAN'].nunique()
        capitales = len(filtrado[filtrado['Capital_Pr'] == 'SI'])
        
        print(f"📊 Estadísticas:")
        print(f"   • Cantones cubiertos: {cantones}")
        print(f"   • Distritos en capital: {capitales}")
        print(f"   • Zonas administrativas: {', '.join(map(str, sorted(filtrado['ZONA'].unique())))}")
        
        # Mostrar distritos
        print(f"\n📋 Lista de distritos:")
        for _, row in filtrado.iterrows():
            capital_mark = "⭐" if row['Capital_Pr'] == 'SI' else "  "
            print(f"   {capital_mark} {row['COD_DISTRI']} - {row['NOM_DISTRI']} ({row['DPA_DESCAN']})")
    else:
        print(f"❌ No se encontraron distritos para '{nombre_provincia}'")
    
    return filtrado


# ============================================================================
# 3. FUNCIONES DE VISUALIZACIÓN
# ============================================================================

def crear_graficos_basicos(df):
    """
    Crear gráficos básicos de análisis.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
    """
    print("\n📊 Generando gráficos de análisis...")
    
    try:
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('ANÁLISIS DE DISTRITOS EDUCATIVOS DE ECUADOR', fontsize=16, fontweight='bold')
        
        # 1. Distribución geográfica
        axes[0, 0].scatter(df['Longitud'], df['Latitud'], c='red', alpha=0.7, s=50)
        axes[0, 0].set_title('Distribución Geográfica de Distritos')
        axes[0, 0].set_xlabel('Longitud')
        axes[0, 0].set_ylabel('Latitud')
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Top 10 provincias
        top_provinces = df['DPA_DESPRO'].value_counts().head(10)
        y_pos = np.arange(len(top_provinces))
        axes[0, 1].barh(y_pos, top_provinces.values, color='steelblue')
        axes[0, 1].set_yticks(y_pos)
        axes[0, 1].set_yticklabels(top_provinces.index, fontsize=8)
        axes[0, 1].set_title('Top 10 Provincias por Distritos')
        axes[0, 1].set_xlabel('Número de Distritos')
        
        # Agregar valores a las barras
        for i, v in enumerate(top_provinces.values):
            axes[0, 1].text(v + 0.1, i, str(v), va='center', fontsize=8)
        
        # 3. Distribución por zonas
        zone_counts = df['ZONA'].value_counts().sort_index()
        axes[0, 2].pie(zone_counts.values, labels=[f'Zona {z}' for z in zone_counts.index], autopct='%1.1f%%')
        axes[0, 2].set_title('Distribución por Zonas Administrativas')
        
        # 4. Histograma de latitudes
        axes[1, 0].hist(df['Latitud'], bins=15, alpha=0.7, color='lightcoral', edgecolor='black')
        axes[1, 0].set_title('Distribución Latitudinal')
        axes[1, 0].set_xlabel('Latitud')
        axes[1, 0].set_ylabel('Número de Distritos')
        axes[1, 0].grid(True, alpha=0.3)
        
        # 5. Histograma de longitudes
        axes[1, 1].hist(df['Longitud'], bins=15, alpha=0.7, color='lightgreen', edgecolor='black')
        axes[1, 1].set_title('Distribución Longitudinal')
        axes[1, 1].set_xlabel('Longitud')
        axes[1, 1].set_ylabel('Número de Distritos')
        axes[1, 1].grid(True, alpha=0.3)
        
        # 6. Capitales vs No Capitales
        capital_counts = df['Capital_Pr'].value_counts()
        colors = ['gold', 'lightblue']
        bars = axes[1, 2].bar(capital_counts.index, capital_counts.values, color=colors)
        axes[1, 2].set_title('Distritos: Capitales vs No Capitales')
        axes[1, 2].set_ylabel('Número de Distritos')
        
        # Agregar valores a las barras
        for bar, value in zip(bars, capital_counts.values):
            height = bar.get_height()
            axes[1, 2].text(bar.get_x() + bar.get_width()/2., height + 0.5,
                            f'{value}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plt.show()
        print("✅ Gráficos generados exitosamente!")
        
    except Exception as e:
        print(f"⚠️ Error generando gráficos: {e}")
        print("💡 Asegúrate de tener matplotlib instalado: pip install matplotlib")


def mapa_simple_ascii(df):
    """
    Crear un mapa simple en ASCII de los distritos.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos de distritos
    """
    print("\n🗺️ MAPA SIMPLE DE DISTRITOS (ASCII)")
    print("="*50)
    
    # Normalizar coordenadas para crear un grid
    lat_min, lat_max = df['Latitud'].min(), df['Latitud'].max()
    lon_min, lon_max = df['Longitud'].min(), df['Longitud'].max()
    
    # Crear grid 20x40
    grid_height, grid_width = 20, 40
    grid = [[' ' for _ in range(grid_width)] for _ in range(grid_height)]
    
    # Mapear cada distrito al grid
    for _, distrito in df.iterrows():
        # Normalizar coordenadas
        lat_norm = (distrito['Latitud'] - lat_min) / (lat_max - lat_min)
        lon_norm = (distrito['Longitud'] - lon_min) / (lon_max - lon_min)
        
        # Convertir a posiciones del grid
        row = int((1 - lat_norm) * (grid_height - 1))  # Invertir Y para mostrar norte arriba
        col = int(lon_norm * (grid_width - 1))
        
        # Marcar posición
        if distrito['Capital_Pr'] == 'SI':
            grid[row][col] = '●'  # Capital
        else:
            grid[row][col] = '·'  # No capital
    
    # Imprimir el mapa
    print("   " + "="*grid_width)
    for i, row in enumerate(grid):
        print(f"{i:2d}|{''.join(row)}|")
    print("   " + "="*grid_width)
    print(f"   {lon_min:.1f}°" + " "*(grid_width-12) + f"{lon_max:.1f}°")
    print(f"\nNorte: {lat_max:.1f}°, Sur: {lat_min:.1f}°")
    print("Leyenda: ● = Capital provincial, · = Otros distritos")


# ============================================================================
# 4. FUNCIONES DE EXPORTACIÓN
# ============================================================================

def exportar_datos(df, formato='csv', nombre_archivo='distritos_ecuador', filtros=None):
    """
    Exportar datos a diferentes formatos.
    
    Args:
        df (pandas.DataFrame): DataFrame con los datos
        formato (str): 'csv', 'excel' o 'json'
        nombre_archivo (str): Nombre base del archivo
        filtros (dict): Diccionario con filtros a aplicar
    """
    # Aplicar filtros si se especifican
    df_export = df.copy()
    if filtros:
        for campo, valor in filtros.items():
            if campo in df_export.columns:
                if isinstance(valor, str):
                    df_export = df_export[df_export[campo].str.contains(valor, case=False, na=False)]
                else:
                    df_export = df_export[df_export[campo] == valor]
    
    print(f"\n💾 Exportando {len(df_export)} registros en formato {formato.upper()}...")
    
    try:
        if formato.lower() == 'csv':
            filename = f"{nombre_archivo}.csv"
            df_export.to_csv(filename, index=False, encoding='utf-8')
            print(f"✅ Archivo guardado: {filename}")
            
        elif formato.lower() == 'excel':
            filename = f"{nombre_archivo}.xlsx"
            df_export.to_excel(filename, index=False, engine='openpyxl')
            print(f"✅ Archivo guardado: {filename}")
            
        elif formato.lower() == 'json':
            filename = f"{nombre_archivo}.json"
            df_export.to_json(filename, orient='records', indent=2, force_ascii=False)
            print(f"✅ Archivo guardado: {filename}")
            
        else:
            print(f"❌ Formato no soportado: {formato}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error exportando: {e}")
        return False


# ============================================================================
# 5. FUNCIÓN PRINCIPAL Y MENÚ
# ============================================================================

def mostrar_menu():
    """Mostrar menú de opciones disponibles"""
    print("\n" + "="*60)
    print("🛠️ MENÚ DE OPCIONES DISPONIBLES")
    print("="*60)
    print("1. informacion_basica(df) - Información general del dataset")
    print("2. analisis_por_provincia(df) - Análisis por provincia")
    print("3. analisis_por_zona(df) - Análisis por zonas administrativas")
    print("4. buscar_distritos(df, 'QUITO') - Buscar distritos")
    print("5. filtrar_por_provincia(df, 'PICHINCHA') - Filtrar por provincia")
    print("6. crear_graficos_basicos(df) - Crear visualizaciones")
    print("7. mapa_simple_ascii(df) - Mapa ASCII")
    print("8. exportar_datos(df, 'csv') - Exportar datos")
    print("\n📝 EJEMPLOS DE USO:")
    print("• buscar_distritos(df, 'CENTRO') - Buscar distritos con 'CENTRO'")
    print("• filtrar_por_provincia(df, 'GUAYAS') - Ver todos los distritos de Guayas")
    print("• exportar_datos(df, 'excel', 'mi_analisis') - Exportar a Excel")


def main():
    """Función principal del programa"""
    print("🚀 Iniciando Analizador de Distritos Educativos...")
    
    # Cargar datos
    df = cargar_datos_directo()
    
    if df is not None and len(df) > 0:
        print(f"\n🎉 ¡Datos cargados exitosamente!")
        
        # Análisis básico automático
        informacion_basica(df)
        analisis_por_provincia(df)
        analisis_por_zona(df)
        
        # Mostrar menú de opciones
        mostrar_menu()
        
        # Crear algunos gráficos básicos
        print(f"\n📊 Generando visualizaciones básicas...")
        try:
            crear_graficos_basicos(df)
        except:
            print("⚠️ Error en gráficos, pero el análisis continúa...")
        
        # Crear mapa ASCII
        mapa_simple_ascii(df)
        
        print(f"\n✅ ANÁLISIS COMPLETADO")
        print("💡 Usa las funciones del menú para análisis específicos")
        print("📊 Variable 'df' disponible para análisis personalizado")
        
        return df
    else:
        print("❌ No se pudieron cargar los datos")
        return None


# ============================================================================
# 6. EJECUCIÓN PRINCIPAL
# ============================================================================

if __name__ == "__main__":
    # Ejecutar programa principal
    df = main()
    
    # Si estás en un entorno interactivo, puedes usar estas funciones:
    # buscar_distritos(df, "QUITO")
    # filtrar_por_provincia(df, "PICHINCHA")
    # exportar_datos(df, "excel", "mi_analisis")
    
    print(f"\n" + "="*60)
    print("🇪🇨 ANALIZADOR DE DISTRITOS EDUCATIVOS DE ECUADOR - v1.0")
    print("📧 Datos representativos de todas las regiones del país")
    print("🔍 Usa las funciones mostradas en el menú para análisis detallado")
    print("="*60)