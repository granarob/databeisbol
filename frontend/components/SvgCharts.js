'use client';

import React, { useState } from 'react';

/**
 * BarChart Component
 * A comparative horizontal bar chart for two values.
 */
export function BarChart({ metricLabel, valueA, valueB, nameA, nameB, higherIsBetter = true }) {
    const a = parseFloat(valueA) || 0;
    const b = parseFloat(valueB) || 0;
    const max = Math.max(a, b, 0.001);
    const pctA = Math.min((a / max) * 100, 100);
    const pctB = Math.min((b / max) * 100, 100);

    const winA = higherIsBetter ? a >= b : a <= b;
    const winB = higherIsBetter ? b >= a : b <= a;

    return (
        <div className="bar-chart">
            <div className="bar-title">{metricLabel}</div>
            <div className="bar-row">
                <span className="bar-player-label">{nameA?.split(' ')[0]}</span>
                <div className="bar-track">
                    <div
                        className={`bar-fill bar-a${winA ? ' bar-winner' : ''}`}
                        style={{ width: `${pctA}%` }}
                    />
                </div>
                <span className={`bar-value${winA ? ' bar-value-winner' : ''}`}>{valueA}</span>
            </div>
            <div className="bar-row">
                <span className="bar-player-label">{nameB?.split(' ')[0]}</span>
                <div className="bar-track">
                    <div
                        className={`bar-fill bar-b${winB ? ' bar-winner' : ''}`}
                        style={{ width: `${pctB}%` }}
                    />
                </div>
                <span className={`bar-value${winB ? ' bar-value-winner' : ''}`}>{valueB}</span>
            </div>
        </div>
    );
}

/**
 * RadarChart Component
 * A radar (spider) chart for multidimensional comparisons.
 */
export function RadarChart({ size = 300, dataA, dataB, labels, nameA, nameB }) {
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: 0, label: '', color: '' });
    
    const padding = 40;
    const center = size / 2;
    const radius = center - padding;
    const angleStep = (Math.PI * 2) / labels.length;

    // Helper para convertir valor (0-100) y ángulo en coordenadas (x,y)
    const getCoords = (val, i) => {
        const r = (radius * val) / 100;
        const angle = i * angleStep - Math.PI / 2; // Empezar arriba
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Generar polígonos
    const pointsA = dataA.map((v, i) => {
        const c = getCoords(v, i);
        return `${c.x},${c.y}`;
    }).join(' ');

    const pointsB = dataB.map((v, i) => {
        const c = getCoords(v, i);
        return `${c.x},${c.y}`;
    }).join(' ');

    // Ejes y Niveles (telaraña)
    const levels = [20, 40, 60, 80, 100];

    const handleHover = (show, e, val, label, color) => {
        if (!show) {
            setTooltip({ ...tooltip, show: false });
            return;
        }
        setTooltip({
            show: true,
            x: e.target.cx.baseVal.value,
            y: e.target.cy.baseVal.value,
            value: val,
            label: label,
            color: color
        });
    };

    return (
        <div className="radar-chart-container" style={{ position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-svg">
                {/* Telaraña de niveles */}
                {levels.map(lvl => (
                    <polygon
                        key={lvl}
                        points={labels.map((_, i) => {
                            const c = getCoords(lvl, i);
                            return `${c.x},${c.y}`;
                        }).join(' ')}
                        className="radar-grid-line"
                    />
                ))}

                {/* Ejes radiales */}
                {labels.map((label, i) => {
                    const c = getCoords(100, i);
                    return (
                        <g key={i}>
                            <line
                                x1={center} y1={center}
                                x2={c.x} y2={c.y}
                                className="radar-axis-line"
                            />
                            {/* Labels de texto */}
                            <text
                                x={center + (radius + 15) * Math.cos(i * angleStep - Math.PI / 2)}
                                y={center + (radius + 15) * Math.sin(i * angleStep - Math.PI / 2)}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                className="radar-label"
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}

                {/* Área Jugador B (debajo de A para que A resalte más) */}
                <polygon points={pointsB} className="radar-area-b" />

                {/* Área Jugador A */}
                <polygon points={pointsA} className="radar-area-a" />

                {/* Puntos de datos Jugador B */}
                {dataB.map((v, i) => {
                    const c = getCoords(v, i);
                    return (
                        <circle 
                            key={`b-${i}`} 
                            cx={c.x} cy={c.y} r="5" 
                            className="radar-dot-b"
                            onMouseEnter={(e) => handleHover(true, e, v, labels[i], 'var(--red)')}
                            onMouseLeave={() => handleHover(false)}
                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                        />
                    );
                })}

                {/* Puntos de datos Jugador A */}
                {dataA.map((v, i) => {
                    const c = getCoords(v, i);
                    return (
                        <circle 
                            key={`a-${i}`} 
                            cx={c.x} cy={c.y} r="5" 
                            className="radar-dot-a"
                            onMouseEnter={(e) => handleHover(true, e, v, labels[i], 'var(--accent)')}
                            onMouseLeave={() => handleHover(false)}
                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                        />
                    );
                })}
            </svg>

            {/* Tooltip Dinámico */}
            {tooltip.show && (
                <div 
                    className="radar-tooltip"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 10,
                        borderColor: tooltip.color
                    }}
                >
                    <div className="rt-label">{tooltip.label}</div>
                    <div className="rt-value" style={{ color: tooltip.color }}>{tooltip.value}%</div>
                </div>
            )}

            <div className="radar-legend">
                <div className="legend-item"><span className="dot dot-a"></span> {nameA}</div>
                <div className="legend-item"><span className="dot dot-b"></span> {nameB}</div>
            </div>
        </div>
    );
}
