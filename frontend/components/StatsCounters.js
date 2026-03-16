'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Trophy, BarChart3 } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="counter-value">
      {prefix}{count.toLocaleString('es-VE')}{suffix}
    </span>
  );
}

export default function StatsCounters({ summary }) {
  const stats = [
    {
      icon: <Users size={28} />,
      value: summary?.players_count || 0,
      prefix: '+',
      label: 'Peloteros registrados',
    },
    {
      icon: <Trophy size={28} />,
      value: summary?.leagues_count || 0,
      label: 'Ligas activas',
    },
    {
      icon: <BarChart3 size={28} />,
      value: summary?.games_count || 0,
      prefix: '+',
      label: 'Juegos analizados',
    },
  ];

  return (
    <section className="counters-section">
      <div className="container">
        <div className="counters-grid">
          {stats.map((stat, i) => (
            <div key={i} className="counter-card">
              <div className="counter-icon">{stat.icon}</div>
              <AnimatedCounter
                target={stat.value}
                prefix={stat.prefix || ''}
              />
              <span className="counter-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
