# 🇪🇨 Ecuador Districts Analyzer

Herramienta completa para el análisis de distritos educativos de Ecuador. Incluye análisis de datos con Python y un **mapa web interactivo** con Leaflet para visualizar los 144 distritos educativos distribuidos en las 24 provincias del país.

## 🚀 Características

### 📊 Análisis de Datos (Python)
- **📊 Análisis completo** de distribución territorial
- **🔍 Búsqueda avanzada** por provincia, cantón o zona
- **📈 Gráficos interactivos** con matplotlib
- **💾 Exportación** a CSV, Excel y JSON
- **🗺️ Mapas ASCII** simples pero efectivos

### 🌐 Mapa Web Interactivo (HTML)
- **🗺️ Mapa interactivo** con Leaflet.js
- **🏛️ Visualización de provincias** (polígonos)
- **🏫 Instituciones educativas** con clustering
- **📍 Distritos educativos** marcados
- **🎛️ Controles interactivos** para mostrar/ocultar capas
- **📊 Estadísticas en tiempo real**

## 📋 Requisitos

```bash
pip install pandas matplotlib numpy openpyxl
```

## 🎯 Uso Rápido

### 📊 Análisis con Python:
```python
python ecuador_districts_analyzer.py
```

### 🌐 Mapa Web Interactivo:
1. Abre `index.html` en tu navegador
2. O usa un servidor local:
```bash
# Con Python
python -m http.server 8000
# Luego abre: http://localhost:8000

# Con Node.js
npx serve .
```

### 📁 Generar archivos GeoJSON:
```python
python generate_geojson.py
```

### 🛠️ Usar como módulo:
```python
from ecuador_districts_analyzer import *

# Cargar datos
df = cargar_datos_directo()

# Análisis básico
informacion_basica(df)
analisis_por_provincia(df)

# Búsquedas
buscar_distritos(df, "QUITO")
filtrar_por_provincia(df, "PICHINCHA")

# Visualizaciones
crear_graficos_basicos(df)
mapa_simple_ascii(df)

# Exportar
exportar_datos(df, "excel", "mi_analisis")
```

## 🗺️ Cobertura de Datos

El dataset incluye distritos representativos de todas las regiones:

- **🏖️ Costa**: Guayas, Esmeraldas, El Oro, Manabí, Santa Elena, Los Ríos
- **🏔️ Sierra**: Pichincha, Azuay, Loja, Tungurahua, Chimborazo, Cotopaxi, Carchi, Imbabura, Bolívar, Cañar
- **🌿 Oriente**: Sucumbíos, Orellana, Pastaza, Napo, Morona Santiago, Zamora Chinchipe  
- **🐢 Galápagos**: San Cristóbal

## 📊 Funciones Principales

| Función | Descripción |
|---------|-------------|
| `informacion_basica(df)` | Estadísticas generales del dataset |
| `analisis_por_provincia(df)` | Ranking y análisis por provincias |
| `analisis_por_zona(df)` | Análisis por zonas administrativas |
| `buscar_distritos(df, "termino")` | Búsqueda de distritos |
| `filtrar_por_provincia(df, "provincia")` | Filtrar por provincia específica |
| `crear_graficos_basicos(df)` | Visualizaciones con matplotlib |
| `mapa_simple_ascii(df)` | Mapa en formato ASCII |
| `exportar_datos(df, formato)` | Exportar a CSV/Excel/JSON |

## 🌐 Mapa Web Interactivo

### Características del mapa:
- **🗺️ Mapa base**: OpenStreetMap con controles de zoom
- **🏛️ Provincias**: Polígonos con información básica
- **🏫 Instituciones**: Puntos con clustering automático y colores por tipo
- **📍 Distritos**: Marcadores especiales para distritos educativos
- **🎛️ Controles**: Botones para mostrar/ocultar capas
- **📊 Estadísticas**: Contador en tiempo real de elementos

### Colores en el mapa:
- 🟢 **Verde**: Instituciones fiscales
- 🔴 **Rojo**: Instituciones particulares  
- 🟠 **Naranja**: Instituciones fiscomisionales
- 🔵 **Azul**: Otras instituciones
- 🟠 **Distrito**: Marcadores de distritos educativos

### Cómo usar:
1. Abre `index.html` en cualquier navegador moderno
2. Usa los controles del panel derecho para mostrar/ocultar capas
3. Haz clic en cualquier punto para ver información detallada
4. El mapa agrupa automáticamente instituciones cercanas (clustering)

## 🎯 Casos de Uso

### Para Administradores Educativos:
- **📊 Análisis territorial** con el script Python
- **🌍 Visualización geográfica** con el mapa web  
- **📋 Identificación de gaps** de cobertura educativa
- **📈 Planificación** de nuevos distritos

### Para Investigadores:
- **🔍 Análisis estadístico** detallado con Python
- **🗺️ Mapas interactivos** para presentaciones
- **📊 Exportación de datos** en múltiples formatos
- **📈 Visualizaciones** personalizables

## 🎨 Ejemplos de Visualización

- Distribución geográfica de distritos
- Rankings por provincia y zona administrativa
- Histogramas de coordenadas
- Análisis de capitales vs no capitales
- Mapas ASCII interactivos

## 📁 Estructura del Proyecto

```
ecuador-districts-analyzer/
├── 📊 ANÁLISIS DE DATOS
│   ├── ecuador_districts_analyzer.py  # Script principal de análisis
│   ├── generate_geojson.py            # Generador de archivos GeoJSON
│   └── demo.py                        # Demostración interactiva
├── 🌐 MAPA WEB
│   └── index.html                     # Mapa interactivo con Leaflet
├── 📁 DATA
│   ├── distritos.geojson             # Distritos educativos (generado)
│   ├── instituciones.geojson         # Instituciones educativas (opcional)
│   └── provincias.geojson            # Límites provinciales (opcional)
├── 📋 DOCUMENTACIÓN
│   ├── README.md                     # Esta documentación
│   ├── requirements.txt              # Dependencias Python
│   └── LICENSE                       # Licencia MIT
└── 🔧 CONFIG
    └── .gitignore                    # Archivos a ignorar en Git
```

## 🚀 Instalación y Setup

### 1. Clonar el repositorio:
```bash
git clone https://github.com/powerpaz/ecuador-districts-analyzer.git
cd ecuador-districts-analyzer
```

### 2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

### 3. Ejecutar análisis:
```bash
# Análisis completo
python ecuador_districts_analyzer.py

# Demostración interactiva
python demo.py

# Generar archivos para mapa web
python generate_geojson.py
```

### 4. Ver mapa web:
```bash
# Servidor local con Python
python -m http.server 8000

# O simplemente abre index.html en tu navegador
```

## 📊 Ejemplos de Uso

### Búsqueda básica:
```python
from ecuador_districts_analyzer import *

df = cargar_datos_directo()

# Buscar distritos en Quito
quito_districts = buscar_distritos(df, "QUITO")

# Analizar provincia específica
pichincha = filtrar_por_provincia(df, "PICHINCHA")
```

### Análisis avanzado:
```python
# Análisis por zona administrativa
analisis_por_zona(df)

# Crear visualizaciones
crear_graficos_basicos(df)

# Exportar resultados
exportar_datos(df, "excel", "analisis_completo")
```

### Generar datos para mapa web:
```python
# Generar archivos GeoJSON
python generate_geojson.py

# Los archivos se guardan en data/
# - distritos.geojson
# - sample_instituciones.geojson  
# - sample_provincias.geojson
```

## 🛠️ Desarrollo

### Agregar nuevas funciones:
```python
def mi_nueva_funcion(df):
    """Agregar tu función de análisis aquí"""
    # Tu código aquí
    pass
```

### Personalizar el mapa:
- Edita `index.html` para cambiar estilos
- Modifica colores en la sección CSS
- Agrega nuevas capas de datos
- Personaliza popups y controles

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🐛 Reportar Problemas

Si encuentras algún problema:

1. Verifica que tengas todas las dependencias instaladas
2. Revisa que los archivos estén en las ubicaciones correctas
3. Consulta la documentación en los comentarios del código
4. Abre un Issue en GitHub con detalles del problema

## 💡 FAQ

### ¿Cómo obtengo datos reales de instituciones?
Visita el portal de datos abiertos del Ministerio de Educación del Ecuador y descarga el directorio oficial de instituciones educativas.

### ¿Puedo usar esto para otros países?
Sí, el código es adaptable. Cambia los datos de entrada y ajusta las coordenadas de referencia.

### ¿Funciona sin conexión a internet?
El análisis Python sí. El mapa web necesita conexión para cargar los tiles de OpenStreetMap.

### ¿Cómo agrego más tipos de análisis?
Revisa las funciones existentes como ejemplo y agrega nuevas funciones siguiendo el mismo patrón.

## 👤 Autor

**PowerPaz** - Análisis de datos educativos Ecuador

- GitHub: [@powerpaz](https://github.com/powerpaz)
- Email: Disponible en el perfil de GitHub

## 🙏 Agradecimientos

- Ministerio de Educación del Ecuador por los datos públicos
- Comunidad Python por las excelentes librerías
- OpenStreetMap por los mapas base gratuitos
- Leaflet.js por la librería de mapas
- Contribuidores y usuarios del proyecto

## 📈 Roadmap

### Próximas características:
- [ ] Integración con APIs en tiempo real
- [ ] Análisis de densidad poblacional
- [ ] Mapas de calor interactivos  
- [ ] Dashboard web completo
- [ ] Análisis predictivo con ML
- [ ] Integración con datos socioeconómicos

## 🏆 Showcase

Este proyecto demuestra:
- ✅ Análisis de datos geoespaciales
- ✅ Visualización web interactiva
- ✅ Código Python bien documentado
- ✅ Integración de múltiples tecnologías
- ✅ Proyecto completo y funcional

---

⭐ **Si este proyecto te fue útil, considera darle una estrella en GitHub!**

🔗 **Links útiles:**
- [Datos Abiertos Ecuador](https://www.datosabiertos.gob.ec/)
- [Ministerio de Educación](https://educacion.gob.ec/)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [Pandas Documentation](https://pandas.pydata.org/)

---

*Última actualización: Diciembre 2024*