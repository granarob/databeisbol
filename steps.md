# Steps: Plan de Desarrollo por Fases — BeisbolData

> Basado en el PRD v1.0 (07 de Febrero, 2026) y el esquema de base de datos `squema.dbml`

---

## 🗓️ Fase 1 — MVP (Producto Mínimo Viable)

**Objetivo:** Plataforma funcional para gestionar la liga, registrar resultados post-juego y consultar estadísticas básicas.

---

### �️ 1.1 Base de Datos — PostgreSQL

#### Tablas a crear (en orden de dependencia)

**Bloque 1: Usuarios y Seguridad**
- [x] Crear tabla `users`
  - `id`, `username` (correo, único), `password_hash`, `full_name`
  - `role`: enum `user_role` → valores: `super_admin`, `league_admin`, `viewer`
  - `created_at`, `is_active`
- [x] Crear enum `user_role`

**Bloque 2: Estructura Organizacional**
- [x] Crear tabla `leagues`
  - `id`, `name`, `country` (default: `Venezuela`), `city`, `logo_url`
  - `admin_id` → FK a `users.id`
- [x] Crear tabla `seasons`
  - `id`, `league_id` → FK a `leagues.id`
  - `name` (Ej: `Temporada 2025-2026`), `start_date`, `end_date`, `is_active`
- [x] Crear tabla `categories`
  - `id`, `league_id` → FK a `leagues.id`
  - `name` (Ej: `Semillita`, `Pre-Infantil`, `Juvenil`), `age_min`, `age_max`
- [x] Crear tabla `teams`
  - `id`, `name`, `short_name` (Ej: `MAG`), `logo_url`, `manager_name`
  - `category_id` → FK a `categories.id`
  - `season_id` → FK a `seasons.id`
  - `won`, `lost`, `tied` (default: `0`) — cache de tabla de posiciones

**Bloque 3: Jugadores y Rosters**
- [x] Crear tabla `players`
  - `id`, `first_name`, `last_name`, `birth_date`
  - `height_cm`, `weight_kg`
  - `bats_hand` char(1): `R`, `L`, `S`
  - `throws_hand` char(1): `R`, `L`
  - `bio` (texto libre), `photo_url`, `created_at`
- [x] Crear tabla `rosters` (tabla pivote histórica)
  - `id`, `team_id` → FK `teams.id`, `player_id` → FK `players.id`
  - `jersey_number`, `position` (Ej: `P`, `C`, `1B`, `2B`, `SS`, `LF`, etc.)
  - `is_active` → permite cambios de equipo entre temporadas sin perder historial

**Bloque 4: Estadios y Juegos**
- [x] Crear tabla `stadiums`
  - `id`, `name`, `location`
- [x] Crear tabla `games`
  - `id`, `season_id` → FK `seasons.id`, `category_id` → FK `categories.id`
  - `home_team_id` → FK `teams.id`, `away_team_id` → FK `teams.id`
  - `stadium_id` → FK `stadiums.id`
  - `game_date` (datetime)
  - `status`: enum `game_status` → `scheduled`, `live`, `finished`, `suspended`, `postponed`
  - `home_score`, `away_score` (cache del resultado, default `0`)
  - `winning_pitcher_id`, `losing_pitcher_id`, `save_pitcher_id` → FK `players.id`
- [x] Crear enum `game_status`

**Bloque 5: Estadísticas (Box Scores)**
- [x] Crear tabla `stats_batting`
  - `id`, `game_id`, `team_id`, `player_id`
  - Métricas ofensivas:
    - `pa` (Plate Appearances / Apariciones al plato)
    - `ab` (Turnos al bate oficiales)
    - `r` (Carreras anotadas)
    - `h` (Hits)
    - `doubles` (2B), `triples` (3B), `hr` (Jonrones)
    - `rbi` (Carreras Impulsadas)
    - `bb` (Bases por Bolas), `so` (Ponches)
    - `sb` (Bases Robadas), `cs` (Capturado en robo)
    - `hbp` (Golpeado por lanzador), `sf` (Sacrificios Fly)
  - `created_at`
- [x] Crear tabla `stats_pitching`
  - `id`, `game_id`, `team_id`, `player_id`
  - Métricas de pitcheo:
    - `ip_outs` (Innings como OUTS para precisión: Ej. `1.1 innings = 4 outs`)
    - `h` (Hits permitidos), `r` (Carreras totales), `er` (Carreras Limpias — clave para ERA)
    - `bb` (Boletos), `so` (Ponches), `hr` (Jonrones permitidos)
    - `wp` (Wild Pitch), `bk` (Balks), `hbp` (Golpeados)
  - `decision`: enum `pitch_decision` → `win`, `loss`, `save`, `hold`, `null`
- [x] Crear enum `pitch_decision`

#### Cálculos automáticos al guardar stats
- [x] **Bateo:** `AVG = h/ab`, `OBP = (h+bb+hbp)/(ab+bb+hbp+sf)`, `SLG = (h + 2B + 2×3B + 3×HR)/ab`, `OPS = OBP + SLG`
- [x] **Pitcheo:** `ERA = (er × 27) / ip_outs`, `WHIP = (bb + h) / (ip_outs / 3)`
- [ ] Actualizar automáticamente `games.home_score` / `away_score` al registrar stats (Fase 1.2 — signals)
- [ ] Actualizar `teams.won` / `lost` / `tied` al cerrar un juego (Fase 1.2 — signals)

---

### 🔐 1.2 Backend — API REST

- [x] Configurar Django REST Framework
- [x] Implementar autenticación con **JWT** via SimpleJWT
  - `POST /api/v1/auth/login/` → devuelve access + refresh token
  - `POST /api/v1/auth/refresh/` → renueva el token
  - `GET  /api/v1/auth/me/` → usuario actual
- [x] Middleware de autorización por rol (`super_admin`, `league_admin`, `viewer`)
  - Un `league_admin` solo puede operar sobre su propia `league_id`
- [x] Signals para auto-actualizar `home_score`/`away_score` al registrar stats
- [x] Signals para auto-actualizar `won`/`lost`/`tied` al cerrar un juego

#### Endpoints CRUD por módulo

| Módulo | Endpoints principales |
|---|---|
| **Users** | `GET/POST /api/v1/users/`, `PUT/DELETE /api/v1/users/{id}/` |
| **Leagues** | `GET/POST /api/v1/leagues/`, `PUT/DELETE /api/v1/leagues/{id}/` |
| **Seasons** | `GET/POST /api/v1/seasons/`, `PUT/DELETE /api/v1/seasons/{id}/` |
| **Categories** | `GET/POST /api/v1/categories/`, `PUT/DELETE /api/v1/categories/{id}/` |
| **Teams** | `GET/POST /api/v1/teams/`, `GET /api/v1/teams/standings/` |
| **Players** | `GET/POST /api/v1/players/`, `GET /api/v1/players/{id}/stats/`, `GET /api/v1/players/{id}/gamelog/` |
| **Rosters** | `GET/POST /api/v1/rosters/`, `PUT/DELETE /api/v1/rosters/{id}/` |
| **Stadiums** | `GET/POST /api/v1/stadiums/`, `PUT/DELETE /api/v1/stadiums/{id}/` |
| **Games** | `GET/POST /api/v1/games/`, `PATCH /api/v1/games/{id}/status/`, `GET /api/v1/games/recent/` |
| **Stats Batting** | `GET/POST /api/v1/stats/batting/`, `GET /api/v1/stats/batting/leaders/` |
| **Stats Pitching** | `GET/POST /api/v1/stats/pitching/`, `GET /api/v1/stats/pitching/leaders/` |

---

### 🌐 1.3 Frontend Público — Next.js

- [ ] Configurar proyecto Next.js (SSR/SSG para SEO y velocidad)
- [ ] Optimización de imágenes con `next/image` (logos de equipos, fotos de jugadores)

#### Páginas públicas

**Home (`/`)**
- [ ] Ticker de resultados recientes (últimos juegos `status: finished`)
- [ ] Tabla de posiciones por categoría (`teams.won`, `lost`, `tied`)

**Equipos (`/equipos`)**
- [ ] Lista de equipos con logo y `short_name`
- [ ] Detalle de equipo: Roster (`rosters` con `players`) + Calendario de juegos

**Estadísticas (`/estadisticas`)**
- [ ] **Líderes de Bateo:** Top 10 en AVG, HR, RBI — filtrable por `category_id`
- [ ] **Líderes de Pitcheo:** Top 10 en ERA, Ganados, Ponches — filtrable por `category_id`
- [ ] Tabla global de estadísticas (ordenable por columnas)

**Perfil de Jugador (`/jugadores/{id}`)**
- [ ] Foto (`photo_url`), nombre, `birth_date`, `height_cm`, `weight_kg`
- [ ] `bats_hand`, `throws_hand`, posición (`rosters.position`), número (`rosters.jersey_number`)
- [ ] `bio` del jugador
- [ ] Stats acumuladas de la temporada (calculadas en backend)
- [ ] Game Log: desglose juego a juego (`stats_batting` / `stats_pitching` agrupado por `game_id`)

**Calendario (`/calendario`)**
- [ ] Vista mensual/semanal de juegos (`games`)
- [ ] Mostrar estado del juego: `scheduled`, `live`, `finished`, `suspended`, `postponed`
- [ ] Resultados reflejados al instante de guardarse (sin caché excesivo)

---

### 🖥️ 1.4 Panel de Administración — Dashboard

**Objetivo:** Interfaz web administrativa para gestionar toda la estructura de la liga, los equipos, jugadores y registrar los resultados de cada juego.

---

#### 🔐 Acceso

- [ ] **Login** (`/admin/login`) — autenticación JWT, redirige según rol (`super_admin` / `league_admin`)
- [ ] Protección de rutas: redirigir a login si no hay token válido
- [ ] Persistencia de sesión con refresh token automático

---

#### 📊 Dashboard Principal (`/admin/dashboard`)

- [ ] Resumen general por liga: total de equipos, jugadores, juegos jugados, juegos pendientes
- [ ] Accesos rápidos a cada módulo de gestión
- [ ] Indicador de temporada activa

---

#### 🏆 Gestión de Ligas (`/admin/ligas`)

**CRUD de Ligas:**
- [x] **CREATE** - Crear nueva liga: `name`, `country`, `city`, `logo_url`, asignar `admin_id`
- [x] **READ** - Listar todas las ligas existentes con filtros de búsqueda
- [x] **UPDATE** - Editar datos de liga (excepto `id`), cambiar administrador
- [x] **DELETE** - Desactivar liga (soft delete, no eliminar físicamente)

**CRUD de Temporadas (por liga):**
- [x] **CREATE** - Crear temporada: `name`, `start_date`, `end_date`
- [x] **READ** - Listar temporadas de la liga con estado activo/inactivo
- [x] **UPDATE** - Editar fechas, nombre, activar/desactivar (`is_active`)
- [x] **DELETE** - Eliminar temporada (solo si no tiene equipos/juegos asociados)

**CRUD de Categorías (por liga):**
- [x] **CREATE** - Crear categoría: `name`, `age_min`, `age_max`
- [x] **READ** - Listar categorías con equipos asignados
- [x] **UPDATE** - Editar nombre, rangos de edad
- [x] **DELETE** - Eliminar categoría (validar que no tenga equipos activos)

---

#### ⚾ Gestión de Equipos (`/admin/equipos`)

**CRUD de Equipos:**
- [x] **CREATE** - Crear equipo: `name`, `short_name`, `logo_url` (upload), `manager_name`, `category_id`, `season_id`
- [x] **READ** - Listar equipos con filtros por `season_id`, `category_id`, búsqueda por nombre
- [x] **UPDATE** - Editar datos del equipo, cambiar logo, manager
- [x] **DELETE** - Eliminar equipo (validar que no tenga juegos registrados)

**Vistas Adicionales:**
- [ ] Ver estadísticas de record (`won`, `lost`, `tied`) — solo lectura, calculado automáticamente
- [ ] Ver roster actual del equipo
- [ ] Historial de juegos del equipo

---

#### 👤 Gestión de Jugadores (`/admin/jugadores`)

**CRUD de Jugadores:**
- [x] **CREATE** - Crear jugador: `first_name`, `last_name`, `birth_date`, `height_cm`, `weight_kg`, `bats_hand`, `throws_hand`, `bio`, `photo_url` (upload)
- [x] **READ** - Listar jugadores con búsqueda por nombre, filtros por edad, posición
- [x] **UPDATE** - Editar todos los datos del jugador, cambiar foto
- [x] **DELETE** - Eliminar jugador (soft delete, mantener historial en rosters)

**Vistas Adicionales:**
- [ ] Ver historial de equipos del jugador (rosters anteriores)
- [ ] Estadísticas acumuladas del jugador
- [ ] Game log (historial de juegos)

---

#### 📋 Gestión de Rosters (`/admin/rosters`)

**CRUD de Rosters:**
- [x] **CREATE** - Agregar jugador existente al roster: `team_id`, `player_id`, `jersey_number`, `position`
- [x] **READ** - Ver roster completo del equipo: tabla con foto, nombre, número, posición, estado
- [x] **UPDATE** - Modificar número de camiseta, posición, activar/desactivar (`is_active`)
- [x] **DELETE** - Remover jugador del roster (soft delete, mantener historial)

**Funcionalidades Adicionales:**
- [ ] Seleccionar equipo y temporada para gestionar su roster
- [ ] Buscar jugador existente por nombre para agregar al roster
- [ ] Crear jugador nuevo directamente desde la pantalla de roster (flujo rápido)
- [ ] Validar que no haya números de camiseta duplicados en el mismo equipo
- [ ] Historial de cambios en el roster

---

#### 🏟️ Gestión de Estadios (`/admin/estadios`)

**CRUD de Estadios:**
- [x] **CREATE** - Crear estadio: `name`, `location`
- [x] **READ** - Listar todos los estadios con búsqueda por nombre/ubicación
- [x] **UPDATE** - Editar nombre y ubicación del estadio
- [x] **DELETE** - Eliminar estadio (validar que no tenga juegos programados)

---

#### 📅 Calendario de Juegos (`/admin/juegos`)

**CRUD de Juegos:**
- [x] **CREATE** - Crear juego: seleccionar `home_team_id`, `away_team_id`, `stadium_id`, `game_date`, `category_id`, `season_id`
- [x] **READ** - Listar juegos con filtros por `season_id`, `category_id`, fecha, `status`, equipo
- [x] **UPDATE** - Modificar fecha, estadio, cambiar estado (`scheduled`, `live`, `finished`, `suspended`, `postponed`)
- [x] **DELETE** - Eliminar juego (solo si `status` = `scheduled` y no tiene stats)

**Funcionalidades Adicionales:**
- [ ] Botón para abrir la **Hoja de Anotación** del juego (solo si `status` ≠ `finished`)
- [ ] Vista de calendario mensual/semanal
- [ ] Validar que equipos no jueguen contra sí mismos
- [ ] Validar disponibilidad de estadio en misma fecha/hora

---

#### 📝 Hoja de Anotación Digital — Vaciado Post-Juego (`/admin/juegos/{id}/anotacion`)

**Objetivo:** Plantilla digital para ingresar toda la información de la hoja de anotación física de cada juego.

- [ ] Encabezado del juego: equipos, fecha, estadio, categoría, inning final
- [ ] **Sección Bateo — Equipo Local y Visitante:**
  - Tabla con los jugadores del roster del equipo (pre-cargados desde `rosters`)
  - Campos editables por fila de jugador:
    - `pa` (Apariciones al plato), `ab` (Turnos oficiales)
    - `r` (Carreras), `h` (Hits), `doubles` (2B), `triples` (3B), `hr` (Jonrones)
    - `rbi` (Impulsadas), `bb` (Bases por bolas), `so` (Ponches)
    - `sb` (Bases robadas), `cs` (Capturado robando)
    - `hbp` (Golpeado por lanzador), `sf` (Sacrificio fly)
  - Totales de equipo calculados automáticamente en la fila inferior
- [ ] **Sección Pitcheo — Equipo Local y Visitante:**
  - Tabla con los pitchers que participaron en el juego
  - Campos editables por fila de pitcher:
    - `ip_outs` (Innings lanzados como outs: 1 inning completo = 3 outs)
    - `h` (Hits permitidos), `r` (Carreras), `er` (Carreras limpias)
    - `bb` (Boletos), `so` (Ponches), `hr` (Jonrones permitidos)
    - `wp` (Wild pitch), `bk` (Balk), `hbp` (Golpeados)
    - `decision`: `win`, `loss`, `save`, `hold`, o ninguna
- [ ] **Decisiones del Juego:**
  - Selector `winning_pitcher_id` (pitcher ganador)
  - Selector `losing_pitcher_id` (pitcher perdedor)
  - Selector `save_pitcher_id` (pitcher salvado — opcional)
- [ ] Botón **Guardar Borrador** — guarda sin cerrar el juego
- [ ] Botón **Confirmar y Cerrar Juego** — valida datos, guarda stats, calcula promedios y cambia `status` a `finished`
  - Trigger automático: recalcula `home_score` / `away_score` en `games`
  - Trigger automático: actualiza `won` / `lost` / `tied` en `teams`
  - Trigger automático: invalida caché Redis de líderes y tabla de posiciones

---

### ⚙️ 1.5 Infraestructura

- [ ] Deploy de PostgreSQL en **Supabase** o **AWS RDS**
- [ ] Deploy del backend en **Railway**, **Render** o **AWS EC2**
- [ ] Deploy del frontend en **Vercel**
- [ ] Configurar **HTTPS** obligatorio en todos los entornos
- [ ] Configurar variables de entorno (`.env`) para conexión a BD y secretos JWT

---

## 🚀 Fase 2 — Interacción y Análisis

**Objetivo:** Herramientas de análisis avanzado, exportación de datos y performance optimizada.

---

### 🆚 2.1 Módulo de Comparación de Jugadores

- [x] Buscador de jugadores (debe buscar en `players` filtrando por `category_id` de la misma categoría)
- [x] Selector Jugador A y Jugador B
- [x] Selector de campos a comparar (checkboxes):
  - **Fuerza:** `hr`, `slg`, `rbi`
  - **Contacto:** `avg`, `h`, `so`
  - **Velocidad:** `sb`, `cs`
  - **Pitcheo:** `era`, `whip`, `so`, `bb`
- [x] Vista "Cara a Cara" — tabla comparativa lado a lado
- [x] Gráfico de barras simple por métrica seleccionada
- [x] *(Opcional)* Radar Chart con las métricas elegidas

---

### 🔍 2.2 Filtros Avanzados

- [ ] Filtrar estadísticas por: `league_id`, `season_id`, `category_id`, `team_id`
- [ ] Tabla de estadísticas globales ordenable por cualquier columna (frontend)
- [ ] Paginación en listas largas de jugadores y stats

---

### 📥 2.3 Exportación de Datos (Dashboard Admin)

- [ ] Exportar estadísticas de bateo/pitcheo en **Excel/CSV**
- [ ] Exportar reportes de tabla de posiciones en **PDF**
- [ ] Exportar game log de un jugador en PDF

---

### ⚡ 2.4 Performance — Redis Cache

- [x] Integrar **Redis** como capa de caché
- [x] Cachear:
  - Tablas de líderes (bateo/pitcheo) por `category_id` y `season_id`
  - Tabla de posiciones por categoría
  - Stats acumuladas por jugador en la temporada activa
- [x] Invalidación automática de caché al registrar un nuevo box score o cerrar un juego
- [x] TTL (tiempo de vida) configurado según frecuencia de actualización (Ej: 1 hora)

---

### 🛡️ 2.5 Seguridad y Permisos Avanzados

- [ ] Control estricto: `league_admin` solo opera sobre su `league_id` (validado en backend)
- [ ] Cumplimiento de privacidad de datos de menores: no exponer `birth_date` completa en la API pública
- [ ] Auditoría básica de cambios en stats (¿quién y cuándo registró el box score?)

---

## ✅ Resumen del Roadmap

| Fase | Descripción                                      | Estado    |
|------|--------------------------------------------------|-----------|
| 1    | MVP: BD + API + Frontend + Admin Dashboard       | 🔴 Alta   |
| 2    | Comparación + Exportación + Redis + Seguridad    | 🟡 Media  |

---

## 📐 Diagrama de Relaciones — Esquema BD

```
users
  └── leagues (admin_id)
        ├── seasons (league_id)
        │     ├── teams (season_id)
        │     │     └── rosters ──────── players
        │     └── games (season_id)
        │           ├── stats_batting  ─ players
        │           └── stats_pitching ─ players
        └── categories (league_id)
              ├── teams (category_id)
              └── games (category_id)

stadiums ──── games (stadium_id)
```

---

## 🎯 Próximos Pasos — Prioridades de Desarrollo

### 📋 Orden Sugerido de Implementación

1. **Base de Datos PostgreSQL** (Bloque 1-5) — Fundamento del sistema
2. **Backend API REST** con autenticación JWT — Motor de la aplicación
3. **Panel de Administración** — Herramienta principal para alimentar datos
4. **Frontend Público** — Cara visible para fans y jugadores
5. **Infraestructura y Deploy** — Puesta en producción

### 🔥 Funcionalidades Críticas para el MVP

- ✅ Crear ligas, temporadas, categorías
- ✅ Crear equipos y asignar administradores
- ✅ Crear jugadores y gestionar rosters por equipo
- ✅ Programar juegos y actualizar estados
- ✅ **Hoja de anotación digital** — vaciar estadísticas post-juego
- ✅ Visualización pública de tabla de posiciones y estadísticas

### 💡 Notas Importantes

- La **hoja de anotación digital** es el corazón del sistema — permite convertir datos físicos a digitales
- El dashboard de administración debe ser intuitivo para usuarios no técnicos
- Considerar validaciones robustas en la hoja de anotación (ej: innings lanzados ≥ 0, PA ≥ AB, etc.)
- Los cálculos automáticos (promedios, records) deben ser transparentes y verificables

---

## 📞 Contacto y Soporte

Para dudas sobre implementación o ajustes al plan:
- Revisar esquema de base de datos `squema.dbml`
- Consultar PRD v1.0 para requisitos detallados
- Validar cada módulo contra las tablas correspondientes

---

*Última actualización: Marzo 2026*
