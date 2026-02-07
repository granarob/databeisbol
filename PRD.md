
# PRD: Plataforma de Gestión y Estadísticas de Béisbol (Nombre Clave: BeisbolData)

**Versión:** 1.0
**Fecha:** 07 de Febrero, 2026
**Estado:** Borrador Inicial

## 1. Resumen Ejecutivo
El objetivo de este proyecto es desarrollar una plataforma web integral para la gestión, recopilación y visualización de estadísticas de béisbol, enfocada específicamente en digitalizar las ligas de béisbol menor en Venezuela.

La plataforma permitirá a los administradores de ligas gestionar torneos, equipos y calendarios, y registrar la actuación detallada de cada jugador (box scores). Para el usuario final (padres, scouts y fanáticos), ofrecerá una interfaz rápida para consultar líderes, perfiles de jugadores, resultados y una herramienta interactiva de comparación de peloteros.

## 2. Perfiles de Usuario (User Personas)

1.  **Super Administrador / Administrador de Liga:**
    *   Encargado de configurar la liga, categorías y equipos.
    *   Responsable de la carga de datos (vaciar estadísticas) post-juego.
    *   Necesita herramientas de entrada de datos rápidas y masivas.
2.  **Usuario Público (Fanático/Padre/Scout):**
    *   Accede para ver el rendimiento de sus hijos o jugadores de interés.
    *   Valora la velocidad de carga y la facilidad para entender los números.
    *   Utiliza la herramienta de comparación para análisis.

## 3. Requisitos Funcionales

### 3.1. Módulo de Administración (Back-Office)

#### A. Gestión de Estructura
*   **Creación de Ligas:** Capacidad de crear múltiples ligas (Ej. Liga Criollitos, Liga Federada).
*   **Gestión de Categorías:** Crear divisiones por edad (Ej. Semillita, Pre-Infantil, Juvenil).
*   **Gestión de Equipos:** Registro de equipos asociados a una liga y categoría, incluyendo logo y nombre.
*   **Gestión de Roster:** Alta y baja de jugadores con datos básicos (Nombre, Fecha Nacimiento, Posición, Batea/Lanza, Número).

#### B. Gestión de Torneo y Calendario
*   **Generador de Calendario:** Crear juegos programados (Equipo A vs Equipo B, Fecha, Hora, Estadio).
*   **Estado del Juego:** Marcar juegos como "Por jugar", "En progreso", "Finalizado", "Suspendido".

#### C. Carga de Datos (El "Vaciado" de Información)
*   **Hoja de Anotación Digital:** Interfaz para ingresar el resumen del juego una vez finalizado.
    *   **Ofensiva:** Turnos (VB), Carreras (C), Hits (H), Dobles (2B), Triples (3B), Jonrones (HR), Impulsadas (CI), Bases por Bolas (BB), Ponches (K), Bases Robadas (BR).
    *   **Pitcheo:** Innings Lanzados (IP), Hits permitidos, Carreras Limpias (CL), Boletos, Ponches, Juegos Ganados/Perdidos/Salvados.
    *   **Defensa (Opcional fase 1):** Errores.
*   **Cálculo Automático:** El sistema debe calcular automáticamente los promedios (AVG, OBP, SLG, OPS) y efectividad (ERA, WHIP) al guardar la data.

#### D. Reportes y Descargas (Dashboard Admin)
*   Posibilidad de descargar la data ingresada en formatos Excel/CSV o PDF para control interno de la liga.

### 3.2. Módulo Público (Front-End)

#### A. Panel Principal (Home)
*   Resumen de noticias o destacados.
*   Pizarra de resultados recientes (Ticker de juegos).
*   Tabla de posiciones actualizada automáticamente.

#### B. Estadísticas y Líderes
*   **Líderes de Bateo:** Top 10 en AVG, HR, RBI, etc., filtrable por categoría.
*   **Líderes de Pitcheo:** Top 10 en ERA, Ganados, Ponches, etc.
*   **Página de Estadísticas Globales:** Tabla completa ordenable por columnas.

#### C. Perfil del Jugador
*   Foto, datos biográficos.
*   Estadísticas de la temporada actual y desglose juego por juego (Game Log).

#### D. Módulo de Comparación (El "Plus")
*   **Selector de Jugadores:** Buscador para elegir Jugador A y Jugador B (deben ser de la misma categoría).
*   **Selector de Campos:** Checkbox para que el usuario elija qué comparar (Ej. Solo Fuerza: HR, SLG, CI; o Solo Contacto: AVG, H, K).
*   **Visualización:** Tabla comparativa "Cara a Cara" y gráfico de barras simple (Radar Chart opcional).

#### E. Calendario y Resultados
*   Vista de calendario mensual o semanal.
*   Resultados en "Tiempo Real" (Se refiere a que apenas el admin guarda el juego, el resultado aparece en la web sin demora de caché excesiva).

## 4. Requisitos No Funcionales (Técnicos)

### 4.1. Escalabilidad y Robustez
*   **Base de Datos Relacional:** Se recomienda PostgreSQL o MySQL para mantener la integridad de las relaciones (Ligas -> Equipos -> Jugadores -> Stats).
*   **Arquitectura:** Separación de Frontend y Backend (API REST o GraphQL). Esto permite que si en el futuro se crea una App Móvil, se use la misma base de datos.

### 4.2. Rendimiento (Velocidad)
*   **Caching:** Uso de tecnologías como Redis para almacenar las tablas de líderes. Dado que las estadísticas no cambian segundo a segundo (sino juego a juego), no se debe recalcular todo cada vez que un usuario entra. Esto garantiza velocidad extrema.
*   **Optimización de Imágenes:** Compresión automática de logos de equipos y fotos de jugadores.

### 4.3. Seguridad
*   **Autenticación:** Sistema robusto (JWT o OAuth2) para los administradores.
*   **Roles y Permisos:** Un anotador de la "Liga A" no debe poder modificar datos de la "Liga B".
*   **Protección de Datos:** Cumplimiento con normas básicas de privacidad, especialmente al manejar nombres y fechas de nacimiento de menores de edad. Uso obligatorio de HTTPS.

## 5. Diseño de Interfaz (Sitemap Propuesto)

1.  **Login (Admin)**
2.  **Dashboard (Admin)**
    *   Ligas / Categorías / Equipos
    *   Calendario / Carga de Resultados
3.  **Home (Público)**
    *   Slider de noticias / Resultados de ayer.
4.  **Menú: Equipos**
    *   Lista de equipos -> Detalle de Equipo (Roster y Calendario del equipo).
5.  **Menú: Estadísticas**
    *   Líderes Bateo / Líderes Pitcheo.
    *   Estadísticas Colectivas.
6.  **Menú: Jugadores**
    *   Buscador -> Perfil de Jugador.
7.  **Menú: Comparador**
    *   Herramienta interactiva de comparación.

## 6. Stack Tecnológico Recomendado

Para lograr robustez, escalabilidad y rapidez en Venezuela (considerando conexiones lentas):

*   **Frontend (Lo que ve el usuario):** React.js o Next.js (Next.js es excelente para SEO y velocidad de carga inicial).
*   **Backend (Lógica):** Node.js (rápido para I/O) o Python/Django (excelente para manejo de mucha data y cálculos matemáticos).
*   **Base de Datos:** PostgreSQL.
*   **Infraestructura:** AWS (Amazon Web Services) o Vercel/Supabase (para un despliegue rápido y escalable).

## 7. Fases de Desarrollo (Roadmap)

*   **Fase 1 (MVP - Producto Mínimo Viable):** Gestión de ligas, carga manual de resultados, cálculo automático de stats básicas, perfiles de jugadores y líderes.
*   **Fase 2 (Interacción):** Módulo de comparación de jugadores, filtros avanzados, exportación de PDF.
*   **Fase 3 (Tiempo Real Avanzado):** Posibilidad de anotar el juego "Play by Play" (jugada a jugada) desde el campo con una tablet (esto es más complejo pero sería el paso final).

---

### ¿Por qué esto soluciona el problema en Venezuela?
1.  **Centralización:** Elimina el uso de cuadernos físicos o Excel aislados que se pierden.
2.  **Visibilidad:** Da a los niños la sensación de ser "profesionales" al ver sus caras y números en una web.
3.  **Escalabilidad:** Al estar en la nube, no importa si la liga tiene 4 equipos o 100, el sistema aguanta.
4.  **Bajo consumo de datos:** Al optimizar la carga (Next.js + Caching), la página abrirá rápido incluso con datos móviles (Digitel/Movistar) en los estadios.