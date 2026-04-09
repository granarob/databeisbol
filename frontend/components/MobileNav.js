'use client';

import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function MobileNav({ leagues = [] }) {
  const [open, setOpen] = useState(false);
  const [ligasOpen, setLigasOpen] = useState(false);

  return (
    <>
      <button
        className="mobile-hamburger"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        style={{ color: 'var(--text)' }}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)}>
          <nav
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
            role="navigation"
            aria-label="Menú móvil"
          >
            {/* Mobile logo */}
            <a href="/" className="navbar-logo" style={{ marginBottom: '1rem', fontSize: '1.1rem' }} onClick={() => setOpen(false)}>
              ⚾ BEISBOL<span>DATA</span>
            </a>

            <a href="/" className="mobile-menu__link" onClick={() => setOpen(false)}>
              Inicio
            </a>

            <button
              className="mobile-menu__link mobile-menu__dropdown-toggle"
              onClick={() => setLigasOpen(!ligasOpen)}
            >
              Ligas <ChevronDown size={16} className={ligasOpen ? 'rotated' : ''} />
            </button>
            {ligasOpen && leagues.length > 0 && (
              <div className="mobile-menu__sub">
                {leagues.map((l) => (
                  <a
                    key={l.id}
                    href={`/liga/${l.id}`}
                    className="mobile-menu__sub-link"
                    onClick={() => setOpen(false)}
                  >
                    {l.name}
                  </a>
                ))}
              </div>
            )}

            <a href="/estadisticas" className="mobile-menu__link" onClick={() => setOpen(false)}>
              Líderes
            </a>
            <a href="/calendario" className="mobile-menu__link" onClick={() => setOpen(false)}>
              Calendario
            </a>
            <a href="/resultados" className="mobile-menu__link" onClick={() => setOpen(false)}>
              Resultados
            </a>
            <a href="/equipos" className="mobile-menu__link" onClick={() => setOpen(false)}>
              Equipos
            </a>
            <a href="/comparar" className="mobile-menu__link" onClick={() => setOpen(false)}>
              🆚 Comparar
            </a>

            <div className="mobile-menu__cta-wrap">
              <a href="/admin-panel" className="navbar-cta" onClick={() => setOpen(false)}>
                Registrar Academia
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
