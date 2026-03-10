---
description: Accessibility (a11y) WCAG 2.1 AA compliance checklist and guide
---

## Skill: Accesibilidad WCAG 2.1 Nivel AA

Usa este skill al crear o revisar cualquier pantalla del proyecto. Las reglas ya están implementadas en el sistema de diseño (`globals.css`). Este skill te indica cómo usarlas y qué verificar.

### Tokens de Contraste (todos pre-validados)

| Variable | Color | Contraste vs fondo | Estado |
|---|---|---|---|
| `--text` | `#f1f5f9` | 17.9:1 | ✅ AAA |
| `--text-dim` | `#cbd5e1` | 12.6:1 | ✅ AAA |
| `--text-muted` | `#94a3b8` | 8.4:1 | ✅ AA |
| `--gold` | `#f4b942` | 10.0:1 | ✅ AA |
| `--accent` | `#38bdf8` | 9.8:1 | ✅ AA |
| `--green` | `#34d399` | 5.1:1 | ✅ AA |
| `--red` | `#f87171` | 4.8:1 | ✅ AA |
| `--blue` | `#60a5fa` | 5.9:1 | ✅ AA |

> [!CAUTION]
> **NUNCA** uses `#10b981` (green original) ni `#ef4444` (red original) para texto normal.
> Son los colores ANTERIORES que fallaban WCAG AA.

### Reglas de Tamaño de Fuente

- **Mínimo absoluto**: `var(--text-xs)` = 0.75rem (12px) para cualquier texto de UI
- Para texto de lectura: mínimo `var(--text-base)` = 1rem (16px)
- Nunca uses valores en `px` menores a 12px para texto

```css
/* ✅ Correcto */
font-size: var(--text-xs);   /* 12px mínimo */

/* ❌ Incorrecto */
font-size: 0.65rem;   /* 10.4px — falla WCAG */
font-size: 10px;      /* ilegible */
```

### Focus Visible (WCAG 2.4.7)

El focus ring global ya está activo para `:focus-visible`. Para elementos con fondo oscuro que dificulten la visibilidad:

```css
/* Refuerza en botones o cards específicas */
.mi-boton:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}
```

### Touch Targets Mínimos (WCAG 2.5.5)

Todos los elementos interactivos deben tener al menos **44×44px**:

```css
.mi-boton {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### ARIA Labels en Elementos sin Texto

```jsx
/* ✅ Correcto — botón solo con ícono */
<button aria-label="Ir al siguiente elemento">
  <ChevronRight />
</button>

/* ❌ Incorrecto */
<button><ChevronRight /></button>
```

### Media Queries de Accesibilidad

Ya están implementadas globalmente. Para componentes animados, añade:

```css
/* Dentro de tu componente: */
@media (prefers-reduced-motion: reduce) {
  .mi-animacion {
    animation: none;
    transition: none;
  }
}
```

### Checklist pre-entrega (WCAG 2.1 AA)

- [ ] **1.4.3** Todos los textos tienen contraste ≥ 4.5:1 (o ≥ 3:1 si son grandes/bold)
- [ ] **1.4.4** El texto se puede ampliar al 200% sin pérdida de contenido
- [ ] **2.4.7** Todos los elementos focusables tienen foco visible
- [ ] **2.5.5** Todos los targets interactivos son ≥ 44×44px
- [ ] **3.3.2** Todos los inputs tienen `<label>` o `aria-label`
- [ ] **1.1.1** Todas las imágenes tienen `alt` descriptivo (o `alt=""` si son decorativas)
- [ ] Sin texto menor de 12px (0.75rem)
- [ ] El tab order es lógico (de arriba a abajo, izquierda a derecha)
