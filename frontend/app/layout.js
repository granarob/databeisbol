import './globals.css';

export const metadata = {
  title: 'BeisbolData — Estadísticas de Béisbol Menor Venezuela',
  description: 'Plataforma de estadísticas, líderes y resultados de las ligas de béisbol menor en Venezuela.',
};

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="/" className="navbar-logo">
          ⚾ BEISBOL<span>DATA</span>
        </a>
        <ul className="navbar-links">
          <li><a href="/">Inicio</a></li>
          <li><a href="/equipos">Equipos</a></li>
          <li><a href="/estadisticas">Estadísticas</a></li>
          <li><a href="/jugadores">Jugadores</a></li>
          <li><a href="/calendario">Calendario</a></li>
          <li><a href="/comparar" style={{ color: 'var(--accent)' }}>🆚 Comparar</a></li>
        </ul>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} <strong>BeisbolData</strong> — Ligas de béisbol menor en Venezuela</p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
