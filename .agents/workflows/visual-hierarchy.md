---
description: Visual Hierarchy with Golden Ratio and 8px Grid
---

## Skill: Jerarquía Visual con Proporción Áurea (φ = 1.618)

Usa este skill cuando añadas una nueva pantalla o componente para garantizar que la jerarquía visual esté fundamentada en matemáticas del diseño.

### 1. Tipografía: Escala Modular (√φ ≈ 1.272)

Cada paso de la escala multiplica al anterior por 1.272. Los tokens ya existen en `:root`:

| Token | Tamaño | Uso |
|---|---|---|
| `--text-xs` | 12px (0.75rem) | Labels, metadata, leyendas |
| `--text-sm` | 14px (0.875rem) | Texto secundario, fechas |
| `--text-base` | 16px (1rem) | Cuerpo de texto principal |
| `--text-md` | 20px (1.25rem) | Subtítulos, leads |
| `--text-lg` | 24px (1.5rem) | Títulos de sección |
| `--text-xl` | 32px (2rem) | Hero subtítulos |
| `--text-2xl` | 42px (2.618rem) | H1 de páginas (φ² × base) |
| `--text-stat` | 52px (3.25rem) | Números grandes (Bento, KPIs) |

**Regla:** nunca saltes más de 2 pasos de escala entre elementos adyacentes.

### 2. Espaciado: Grid de 8px

Usa siempre los tokens de espaciado — **nunca valores arbitrarios**:

```css
padding: var(--space-3);   /* 24px */
gap: var(--space-2);       /* 16px */
margin-bottom: var(--space-φ); /* 1.618rem — separador áureo */
```

| Token | Valor | Uso típico |
|---|---|---|
| `--space-1` | 8px | Micro-espacio entre ítems relacionados |
| `--space-2` | 16px | Padding interno de tarjetas |
| `--space-3` | 24px | Gap entre tarjetas/grids |
| `--space-4` | 32px | Separación de secciones menores |
| `--space-5` | 48px | Padding de secciones grandes |
| `--space-6` | 64px | Separación de bloques de página |
| `--space-φ` | 1.618rem | Separador entre jerarquías |

### 3. Layout: Proporción Áurea en Grids

Cuando tengas un contenido principal con una sidebar:
```css
grid-template-columns: 1.618fr 1fr; /* φ : 1 */
```

Cuando tengas un Bento Grid:
- **Tarjetas wide** (`bento-wide`): `grid-column: span 2` → información más importante
- **Tarjetas small** (`bento-small`): `grid-column: span 1` → métricas secundarias
- Mantén la ratio 2:1 entre wide y small para crear focal points claros.

### 4. Checklist antes de entregar una pantalla

- [ ] ¿El elemento más importante es visualmente 1.5-2× mayor que el segundo?
- [ ] ¿Usé tokens de escala tipográfica en lugar de valores arbitrarios?
- [ ] ¿El espaciado entre elementos usa el grid de 8px?
- [ ] ¿El grid principal respeta la proporción 1.618:1?
- [ ] ¿El focal point (número KPI, CTA principal) tiene suficiente "aire" alrededor?
