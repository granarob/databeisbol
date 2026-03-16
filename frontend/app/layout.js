import './globals.css';
import NextTopLoader from 'nextjs-toploader';
import { getLeagues } from '@/lib/api';
import MobileNav from '@/components/MobileNav';
import { ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'BeisbolData — Estadísticas de Béisbol Menor Venezuela',
  description: 'Plataforma de estadísticas en tiempo real, líderes y resultados de las ligas de béisbol menor en Venezuela.',
};

async function Navbar() {
  let leagues = [];
  try {
    const data = await getLeagues();
    leagues = Array.isArray(data) ? data : (data?.results ?? []);
  } catch {}

  return (
    <nav className="navbar animate-in slide-up" role="navigation" aria-label="Navegación principal">
      <div className="container navbar-inner">
        <a href="/" className="navbar-logo animate-in fade-in delay-100">
          ⚾ BEISBOL<span style={{ color: 'var(--accent)' }}>DATA</span>
        </a>

        {/* Desktop Links */}
        <ul className="navbar-links">
          <li className="animate-in fade-in delay-200">
            <a href="/">Inicio</a>
          </li>

          {/* Ligas Dropdown */}
          <li className="navbar-dropdown animate-in fade-in delay-300">
            <button className="navbar-dropdown__trigger" aria-haspopup="true">
              Ligas <ChevronDown size={14} />
            </button>
            <div className="navbar-dropdown__menu" role="menu">
              {leagues.map((l) => (
                <a key={l.id} href={`/liga/${l.id}`} className="navbar-dropdown__item" role="menuitem">
                  {l.name}
                  {l.city && <span className="navbar-dropdown__city">{l.city}</span>}
                </a>
              ))}
              {leagues.length === 0 && (
                <span className="navbar-dropdown__empty">Cargando ligas...</span>
              )}
            </div>
          </li>

          <li className="animate-in fade-in delay-400">
            <a href="/estadisticas">Líderes</a>
          </li>
          <li className="animate-in fade-in delay-400">
            <a href="/calendario">Calendario</a>
          </li>
          <li className="animate-in fade-in delay-400">
            <a href="/resultados">Resultados</a>
          </li>
          <li className="animate-in fade-in delay-500">
            <a href="/equipos">Equipos</a>
          </li>
          <li className="animate-in fade-in delay-500">
            <a href="/comparar" style={{ color: 'var(--accent)' }}>🆚 Comparar</a>
          </li>
        </ul>

        {/* Desktop CTA */}
        <a href="/admin-panel" className="navbar-cta animate-in fade-in delay-500">
          Registrar Academia
        </a>

        {/* Mobile Hamburger */}
        <MobileNav leagues={leagues} />
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer-pro" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-col">
            <a href="/" className="footer-brand">
              ⚾ BEISBOL<span>DATA</span>
            </a>
            <p className="footer-desc">
              Plataforma de estadísticas en tiempo real para ligas de béisbol menor en Venezuela.
            </p>
          </div>

          {/* Navegación */}
          <div className="footer-col">
            <h4 className="footer-col__title">Navegación</h4>
            <ul className="footer-col__links">
              <li><a href="/">Inicio</a></li>
              <li><a href="/estadisticas">Líderes</a></li>
              <li><a href="/calendario">Calendario</a></li>
              <li><a href="/resultados">Resultados</a></li>
              <li><a href="/equipos">Equipos</a></li>
              <li><a href="/comparar">Comparar</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4 className="footer-col__title">Legal</h4>
            <ul className="footer-col__links">
              <li><a href="#">Términos y Condiciones</a></li>
              <li><a href="#">Política de Privacidad</a></li>
              <li><a href="#">Protección de Datos de Menores</a></li>
            </ul>
          </div>

          {/* Redes Sociales */}
          <div className="footer-col">
            <h4 className="footer-col__title">Síguenos</h4>
            <div className="footer-socials">
              <a href="#" className="footer-social" aria-label="Instagram" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
              </a>
              <a href="#" className="footer-social" aria-label="X / Twitter" title="X / Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768"/></svg>
              </a>
              <a href="#" className="footer-social" aria-label="Facebook" title="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} <strong>BeisbolData</strong> — Todos los derechos reservados.</p>
          <p className="footer-bottom__minor">Los datos de menores de edad son protegidos según las normativas vigentes.</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <NextTopLoader
          color="#38bdf8"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #38bdf8, 0 0 5px #38bdf8"
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
