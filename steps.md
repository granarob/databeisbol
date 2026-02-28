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

### 🖥️ 1.4 Panel de Administración

- [ ] **Login** (`/admin/login`) — autenticación JWT
- [ ] **Dashboard** — resumen general por liga
- [ ] **Gestión de Ligas / Temporadas / Categorías**
- [ ] **Gestión de Equipos** (con upload de logo)
- [ ] **Gestión de Jugadores** (con upload de foto)
- [ ] **Gestión de Rosters** — asignar `player_id` + `jersey_number` + `position` a un equipo/temporada
- [ ] **Gestión de Estadios**
- [ ] **Calendario de Juegos** — crear/editar juegos, actualizar estado
- [ ] **Hoja de Anotación Digital (Vaciado post-juego)**
  - Cargar stats de bateo por jugador: `pa`, `ab`, `r`, `h`, `doubles`, `triples`, `hr`, `rbi`, `bb`, `so`, `sb`, `cs`, `hbp`, `sf`
  - Cargar stats de pitcheo: `ip_outs`, `h`, `r`, `er`, `bb`, `so`, `hr`, `wp`, `bk`, `hbp`, `decision`
  - Seleccionar `winning_pitcher_id`, `losing_pitcher_id`, `save_pitcher_id`
  - Trigger automático para calcular promedios y cerrar juego

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

- [ ] Buscador de jugadores (debe buscar en `players` filtrando por `category_id` de la misma categoría)
- [ ] Selector Jugador A y Jugador B
- [ ] Selector de campos a comparar (checkboxes):
  - **Fuerza:** `hr`, `slg`, `rbi`
  - **Contacto:** `avg`, `h`, `so`
  - **Velocidad:** `sb`, `cs`
  - **Pitcheo:** `era`, `whip`, `so`, `bb`
- [ ] Vista "Cara a Cara" — tabla comparativa lado a lado
- [ ] Gráfico de barras simple por métrica seleccionada
- [ ] *(Opcional)* Radar Chart con las métricas elegidas

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

- [ ] Integrar **Redis** como capa de caché
- [ ] Cachear:
  - Tablas de líderes (bateo/pitcheo) por `category_id` y `season_id`
  - Tabla de posiciones por categoría
  - Stats acumuladas por jugador en la temporada activa
- [ ] Invalidación automática de caché al registrar un nuevo box score o cerrar un juego
- [ ] TTL (tiempo de vida) configurado según frecuencia de actualización (Ej: 1 hora)

---

### 🛡️ 2.5 Seguridad y Permisos Avanzados

- [ ] Control estricto: `league_admin` solo opera sobre su `league_id` (validado en backend)
- [ ] Cumplimiento de privacidad de datos de menores: no exponer `birth_date` completa en la API pública
- [ ] Auditoría básica de cambios en stats (¿quién y cuándo registró el box score?)

---

## 🎙️ Fase 3 — Tiempo Real Avanzado (Play by Play)

**Objetivo:** Anotación en vivo del juego desde el campo (tablet/móvil), jugada a jugada.

---

### 📡 3.1 Anotación en Tiempo Real

- [ ] Cambiar el estado `games.status` a `live` al iniciar un juego
- [ ] Nueva tabla `plays` o `game_events` para registrar cada jugada individual
  - `game_id`, `inning`, `half` (top/bottom), `batter_id`, `pitcher_id`, `event_type`, `result_description`, `timestamp`
- [ ] Cálculo automático de `home_score` / `away_score` en tiempo real conforme se anotan jugadas
- [ ] Actualización en vivo en la web pública usando **WebSockets** (o Server-Sent Events como alternativa más ligera)

### 📱 3.2 Interfaz de Anotador en Campo

- [ ] Interfaz táctil optimizada para tablet (pantallas táctiles de 10")
- [ ] Funcionalidad **PWA** (Progressive Web App) — instalable sin App Store
- [ ] Funcionamiento offline básico con sincronización al recuperar conexión (útil en estadios con mala señal)
- [ ] Diseño de bajo consumo de datos (conexiones Digitel/Movistar en los estadios)

### 🔗 3.3 API Lista para App Móvil

- [ ] Documentar la API REST completa (Swagger/OpenAPI)
- [ ] Versionar la API (`/api/v1/`) para estabilidad futura
- [ ] Asegurar que todos los endpoints estén listos para consumirse desde una app nativa (iOS/Android)

---

## ✅ Resumen del Roadmap

| Fase | Descripción                            | Estado    |
|------|----------------------------------------|-----------|
| 1    | MVP: BD + API + Frontend + Admin       | 🔴 Alta   |
| 2    | Comparación + Exportación + Redis      | 🟡 Media  |
| 3    | Play by Play en tiempo real + PWA      | 🟢 Futura |

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
