# SYSTEM RULES & DIRECTIVES: SEO TÉCNICO, GEO (GENERATIVE ENGINE OPTIMIZATION) Y ARQUITECTURA SEMÁNTICA DE VANGUARDIA

Este documento define las reglas operativas obligatorias para el desarrollo, estructuración de datos y generación de vistas en la plataforma **Playballdata** (Béisbol y Softball). Todo agente AI, desarrollador y pipeline debe adherirse estrictamente a estas directrices para maximizar el posicionamiento tradicional en motores de búsqueda (SEO) y las citaciones en motores de respuesta basados en Inteligencia Artificial (GEO - ChatGPT, Gemini, Claude, Perplexity, etc.).

---

## 1. DIRECTRICES DE GEO (GENERATIVE ENGINE OPTIMIZATION)

Para que los modelos de lenguaje (LLMs) entiendan, extraigan y citen los datos de **Playballdata**, la información no debe residir únicamente en tablas crudas. Los LLMs "piensan" y recuperan mejor la información expresada en prosa fluida y coherente.

### A. Generación de Contexto en Lenguaje Natural
*   **Obligatoriedad:** Cada perfil de jugador, página de equipo y resumen de liga/categoría debe incluir un componente de servidor o lógica backend que traduzca las estadísticas más destacadas a **1 o 2 párrafos de prosa fluida y natural**.
*   **Ejemplo:** En lugar de mostrar solo `AVG: .340 | HR: 5`, la página debe renderizar un bloque de texto que diga:
    > *"El infielder juvenil de los Leones, [Nombre], está teniendo una temporada sobresaliente en la categoría Sub-15, bateando para un promedio destacado de .340 con 5 cuadrangulares, liderando a su equipo en porcentaje de embasado (OBP) y consolidándose como uno de los prospectos más sólidos del béisbol menor en Venezuela."*
*   **Variabilidad Léxica (Sinónimos Deportivos):** Evita la repetición monótona. Utiliza un banco de sinónimos para béisbol y softball:
    *   *Pitcher:* Lanzador, serpentinero, abridor, relevista, monticulista.
    *   *Batter:* Bateador, toletero, slugger, cañonero.
    *   *Team:* Novena, escuadra, club, divisa, conjunto.
    *   *Game:* Encuentro, partido, juego, compromiso, choque.

### B. Claridad Semántica y Glosario Explícito
*   Las abreviaturas como `AVG`, `OBP`, `SLG`, `OPS`, `ERA`, `WHIP` deben estar acompañadas de un atributo de ayuda visual y semántica.
*   Usa la etiqueta `<abbr title="Porcentaje de Embasado / On-Base Percentage">OBP</abbr>` en los encabezados. Esto proporciona metainformación explícita que los crawlers de LLMs devoran e interpretan con precisión milimétrica.

### C. Bloque Q&A Auto-Generado (Preguntas Frecuentes)
*   Integra un acordeón semántico al final de los perfiles con respuestas directas a intenciones de búsqueda frecuentes en lenguaje natural:
    *   *¿Quién es [Nombre]?*
    *   *¿Cuáles son las estadísticas actuales de [Nombre]?*
    *   *¿En qué liga y equipo juega [Nombre]?*

---

## 2. DIRECTRICES DE SEO TÉCNICO Y ARQUITECTURA WEB

### A. Renderizado del Servidor (SSR / ISR)
*   **Contenido Crítico es Sagrado:** Los nombres de jugadores, estadísticas acumuladas de la temporada, clasificaciones y fixtures de juegos **deben ser renderizados en el servidor (Server-Side Rendering o Incremental Static Regeneration)**.
*   **Prohibición:** No dependas de llamadas API en el cliente (`useEffect`/`fetch` en CSR) para pintar datos estructurados clave o nombres indexables. El HTML inicial enviado por el servidor debe contener el 100% del contenido de datos.

### B. Estructura HTML 100% Semántica
*   Las tablas de estadísticas deben usar exclusivamente la estructura estándar HTML5:
    ```html
    <table class="data-table">
      <caption>Tabla de estadísticas oficiales de [Equipo/Liga]</caption>
      <thead>
        <tr>
          <th scope="col"><abbr title="Posición">POS</abbr></th>
          <th scope="col">Bateador</th>
          ...
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td class="name-col"><a href="/jugadores/1">Juan Pérez</a></td>
          ...
        </tr>
      </tbody>
    </table>
    ```
*   **Prohibición:** Evita maquetar tablas utilizando estructuras puramente de `div` (`grid`/`flex`) ya que rompe la jerarquía de rastreo semántico para los robots de búsqueda.

### C. Enlazado Interno Semántico (Internal Cross-Linking)
*   Cada entidad debe estar conectada bidireccionalmente:
    *   `Perfil de Jugador` ➔ Enlaza a su `Equipo` e `Historial de Juegos`.
    *   `Perfil de Equipo` ➔ Enlaza a su `Liga`, `Roster de Jugadores` y `Próximos Partidos`.
    *   `Página de Liga` ➔ Enlaza a la tabla de posiciones de la `Categoría`, `Equipos` y `Estadísticas de Líderes`.
*   **Textos de Anclaje (Anchor Texts) Descriptivos:** Nunca uses "Ver más" o "Click aquí". Utiliza textos con intención de búsqueda: `href="/jugadores/45"` con texto `Ver perfil completo de Juan Pérez`.

---

## 3. DATOS ESTRUCTURADOS (SCHEMA MARKUP / JSON-LD)

Cada página dinámica debe inyectar dinámicamente en el `<head>` un bloque estructurado en formato `application/ld+json`.

### A. Esquema para Perfil de Jugador (`Person` + `SportsTeam` / `Athlete`)
```json
{
  "@context": "https://schema.org",
  "@type": "Athlete",
  "name": "Juan Pérez",
  "jobTitle": "Bateador / Shortstop",
  "memberOf": {
    "@type": "SportsTeam",
    "name": "Leones del Caracas Juvenil",
    "sport": "Baseball"
  },
  "description": "Resumen automatizado en lenguaje natural del rendimiento actual del pelotero Juan Pérez en la temporada actual de Playballdata.",
  "nationality": {
    "@type": "Country",
    "name": "Venezuela"
  },
  "url": "https://playballdata.com/jugadores/123",
  "knowsAbout": ["Baseball", "Softball", "Estadísticas de Béisbol Menor"]
}
```

### B. Esquema para Tablas y Posiciones (`Dataset`)
Para indicar a buscadores y a herramientas como Google Dataset Search que la información estadística es una fuente estructurada, verídica y consultable:
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Estadísticas de Líderes de Bateo - Liga Sub-15 de Béisbol Menor",
  "description": "Tabla interactiva de líderes de bateo, promedio, cuadrangulares y carreras empujadas de la Liga Sub-15 en Playballdata.",
  "url": "https://playballdata.com/estadisticas",
  "keywords": ["Estadísticas de Béisbol", "Líderes de Bateo", "Béisbol Menor Venezuela", "Softball"],
  "creator": {
    "@type": "Organization",
    "name": "PlayballData"
  }
}
```

---

## 4. PROTOCOLO DE DESARROLLADOR AI (CÓMO PROCEDER)

Cuando se solicite crear una nueva vista, modificar una consulta de base de datos o implementar un componente visual, debes responder entregando obligatoriamente:

1.  **Código del Componente Semántico Optimizado:** Garantizando maquetación HTML semántica y soporte SSR/ISR.
2.  **Bloque de Esquema JSON-LD:** Específico para los datos que se manejan en la página.
3.  **Lógica del Resumen GEO en Prosa:** Función en Node/JS/Python que concatene de forma dinámica los campos de la base de datos (por ejemplo, sumando juegos, hits, carreras empujadas, etc.) y retorne el párrafo enriquecido semánticamente para indexación de LLMs.

---

*¡Guarda este archivo en la raíz del proyecto para que actúe como directiva eterna de desarrollo para la optimización absoluta de PlayballData!*
