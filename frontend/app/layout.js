import './globals.css';
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: 'BeisbolData — Estadísticas de Béisbol Menor Venezuela',
  description: 'Plataforma de estadísticas, líderes y resultados de las ligas de béisbol menor en Venezuela.',
};

function Navbar() {
  return (
    <nav className="navbar animate-in slide-up">
      <div className="container navbar-inner">
        <a href="/" className="navbar-logo animate-in fade-in delay-100">
          ⚾ BEISBOL<span style={{ color: 'var(--accent)' }}>DATA</span>
        </a>
        <ul className="navbar-links">
          <li className="animate-in fade-in delay-200"><a href="/">Inicio</a></li>
          <li className="animate-in fade-in delay-300"><a href="/equipos">Equipos</a></li>
          <li className="animate-in fade-in delay-400"><a href="/estadisticas">Estadísticas</a></li>
          <li className="animate-in fade-in delay-500"><a href="/jugadores">Jugadores</a></li>
          <li className="animate-in fade-in delay-500"><a href="/calendario">Calendario</a></li>
          <li className="animate-in fade-in delay-500"><a href="/comparar" style={{ color: 'var(--accent)' }}>🆚 Comparar</a></li>
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
