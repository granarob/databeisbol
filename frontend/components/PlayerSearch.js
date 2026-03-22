'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/players/?search=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setResults(list.slice(0, 8));
        setOpen(list.length > 0);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="player-search-wrap" ref={wrapperRef}>
      <div className="player-search-input-wrap">
        <Search className="player-search-icon" size={20} />
        <input
          id="global-player-search"
          type="text"
          className="player-search-input"
          placeholder="Busca a un pelotero por nombre"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
          aria-label="Buscar jugador"
        />
        {query && (
          <button className="player-search-clear" onClick={clearSearch} aria-label="Limpiar búsqueda">
            <X size={16} />
          </button>
        )}
        {loading && <span className="player-search-spinner" />}
      </div>

      {open && results.length > 0 && (
        <div className="player-search-dropdown" role="listbox">
          {results.map((p) => (
            <a
              key={p.id}
              href={`/jugadores/${p.id}`}
              className="player-search-result"
              role="option"
              onClick={() => setOpen(false)}
            >
              <div className="player-search-result__avatar">
                <User size={18} />
              </div>
              <div className="player-search-result__info">
                <span className="player-search-result__name">
                  {p.first_name} {p.last_name}
                </span>
                <span className="player-search-result__meta">
                  {p.bats_hand === 'R' ? 'Derecho' : p.bats_hand === 'L' ? 'Zurdo' : 'Ambos'}
                  {p.birth_date && ` · ${new Date().getFullYear() - new Date(p.birth_date).getFullYear()} años`}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
