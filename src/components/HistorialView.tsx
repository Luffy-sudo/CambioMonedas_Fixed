import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Download, Filter, Search } from 'lucide-react';
import { Moneda, CambioMoneda } from '../types';
import { api } from '../services/api';

interface HistorialViewProps {
  monedas: Moneda[];
}

export const HistorialView: React.FC<HistorialViewProps> = ({ monedas }) => {
  const [selectedMonedaId, setSelectedMonedaId] = useState<number>(35); // COP default
  const [desde, setDesde] = useState<string>('2023-01-01');
  const [hasta, setHasta] = useState<string>('2024-12-31');
  const [cambios, setCambios] = useState<CambioMoneda[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<CambioMoneda | null>(null);

  // Default to COP or first available
  useEffect(() => {
    if (monedas.length > 0 && !monedas.some(m => m.id === selectedMonedaId)) {
      const cop = monedas.find(m => m.sigla === 'COP');
      if (cop) setSelectedMonedaId(cop.id);
      else setSelectedMonedaId(monedas[0].id);
    }
  }, [monedas]);

  const loadData = async () => {
    if (!selectedMonedaId) return;
    setLoading(true);
    try {
      const data = await api.listarPorPeriodo(selectedMonedaId, desde || undefined, hasta || undefined);
      setCambios(data);
    } catch (err) {
      console.error('Error fetching historial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonedaId, desde, hasta]);

  const selectedMoneda = monedas.find(m => m.id === selectedMonedaId);

  // Presets
  const setPreset = (type: '1m' | '6m' | '1y' | '5y' | 'all') => {
    const end = '2025-10-31';
    let start = '2024-01-01';
    if (type === '1m') start = '2025-09-01';
    if (type === '6m') start = '2025-04-01';
    if (type === '1y') start = '2024-10-01';
    if (type === '5y') start = '2020-01-01';
    if (type === 'all') start = '2010-01-01';
    setDesde(start);
    setHasta(end);
  };

  // Metrics
  const stats = useMemo(() => {
    if (cambios.length === 0) return null;
    let min = cambios[0];
    let max = cambios[0];
    let sum = 0;

    cambios.forEach(c => {
      if (c.cambio < min.cambio) min = c;
      if (c.cambio > max.cambio) max = c;
      sum += c.cambio;
    });

    const avg = sum / cambios.length;
    const first = cambios[0].cambio;
    const last = cambios[cambios.length - 1].cambio;
    const changePct = ((last - first) / first) * 100;

    return { min, max, avg, first, last, changePct, total: cambios.length };
  }, [cambios]);

  // Downsample data for smooth chart rendering if too many points (> 200 points)
  const chartPoints = useMemo(() => {
    if (cambios.length <= 200) return cambios;
    const step = Math.ceil(cambios.length / 200);
    const sampled: CambioMoneda[] = [];
    for (let i = 0; i < cambios.length; i += step) {
      sampled.push(cambios[i]);
    }
    // Always include the very last point
    if (sampled[sampled.length - 1] !== cambios[cambios.length - 1]) {
      sampled.push(cambios[cambios.length - 1]);
    }
    return sampled;
  }, [cambios]);

  // SVG Chart Dimensions
  const chartWidth = 800;
  const chartHeight = 260;
  const padding = { top: 20, right: 20, bottom: 35, left: 60 };

  const svgCoords = useMemo(() => {
    if (chartPoints.length < 2 || !stats) return [];
    const minVal = stats.min.cambio * 0.98;
    const maxVal = stats.max.cambio * 1.02;
    const range = maxVal - minVal || 1;

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    return chartPoints.map((p, idx) => {
      const x = padding.left + (idx / (chartPoints.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((p.cambio - minVal) / range) * innerHeight;
      return { x, y, point: p };
    });
  }, [chartPoints, stats]);

  const linePath = useMemo(() => {
    if (svgCoords.length === 0) return '';
    return svgCoords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [svgCoords]);

  const areaPath = useMemo(() => {
    if (svgCoords.length === 0) return '';
    const firstX = svgCoords[0].x;
    const lastX = svgCoords[svgCoords.length - 1].x;
    const bottomY = chartHeight - padding.bottom;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [svgCoords, linePath]);

  const exportCSV = () => {
    if (cambios.length === 0) return;
    const headers = 'Id,IdMoneda,Fecha,TasaCambioUSD\n';
    const rows = cambios.map(c => `${c.id},${c.idMoneda},${c.fecha},${c.cambio}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historial_${selectedMoneda?.sigla || 'moneda'}_${desde}_${hasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Controls card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Historial de Tasas de Cambio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consulta de períodos por fecha a través de <code>/api/monedas/listarporperiodo</code>.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Rango:</span>
            {[
              { label: '1M', id: '1m' as const },
              { label: '6M', id: '6m' as const },
              { label: '1A', id: '1y' as const },
              { label: '5A', id: '5y' as const },
              { label: 'Todo', id: 'all' as const },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seleccionar Divisa
            </label>
            <select
              id="select-moneda-historial"
              value={selectedMonedaId}
              onChange={e => setSelectedMonedaId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {monedas.map(m => (
                <option key={m.id} value={m.id}>
                  {m.sigla} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha Desde
            </label>
            <input
              id="input-fecha-desde"
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha Hasta
            </label>
            <input
              id="input-fecha-hasta"
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="md:col-span-1 flex justify-end">
            <button
              onClick={exportCSV}
              disabled={cambios.length === 0}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors disabled:opacity-40"
              title="Descargar CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats summary cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tasa Actual / Última</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.last.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
              <span className="text-xs text-slate-400">USD/{selectedMoneda?.sigla}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Registrada en {cambios[cambios.length - 1]?.fecha}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Variación Período</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-xl font-bold ${stats.changePct >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {stats.changePct >= 0 ? '+' : ''}
                {stats.changePct.toFixed(2)}%
              </span>
              {stats.changePct >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{stats.total.toLocaleString()} registros analizados</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mínimo Período</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.min.cambio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{stats.min.fecha}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Máximo Período</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {stats.max.cambio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{stats.max.fecha}</p>
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Gráfico de Tendencia Histórica ({selectedMoneda?.sigla} vs USD)
            </h2>
            <p className="text-xs text-slate-400">
              Pase el cursor sobre la gráfica para inspeccionar fechas y valores puntuales.
            </p>
          </div>

          {hoveredPoint && (
            <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm border border-slate-700">
              <span className="text-slate-400 mr-2">{hoveredPoint.fecha}:</span>
              <strong className="text-emerald-400">
                {hoveredPoint.cambio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
                {selectedMoneda?.sigla}
              </strong>
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Cargando datos históricos...
          </div>
        ) : cambios.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              No hay tasas registradas para esta moneda en el período seleccionado.
            </p>
            <p className="mt-1">
              Pruebe seleccionando monedas con historial completo (COP, EUR, BRL, CNY, GBP, JPY) o ampliando las fechas.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-64 select-none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + ratio * (chartHeight - padding.top - padding.bottom);
                const val = stats ? stats.max.cambio - ratio * (stats.max.cambio - stats.min.cambio) : 0;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-700/60"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </text>
                  </g>
                );
              })}

              {/* Area */}
              <path d={areaPath} fill="url(#chartGradient)" />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive invisible hover columns */}
              {svgCoords.map((pt, i) => (
                <rect
                  key={i}
                  x={pt.x - 4}
                  y={padding.top}
                  width="8"
                  height={chartHeight - padding.top - padding.bottom}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredPoint(pt.point)}
                />
              ))}

              {/* Hover dot */}
              {hoveredPoint && (() => {
                const found = svgCoords.find(s => s.point.id === hoveredPoint.id || s.point.fecha === hoveredPoint.fecha);
                if (!found) return null;
                return (
                  <g>
                    <line
                      x1={found.x}
                      y1={padding.top}
                      x2={found.x}
                      y2={chartHeight - padding.bottom}
                      stroke="#10b981"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={found.x} cy={found.y} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                  </g>
                );
              })()}

              {/* Bottom dates */}
              {svgCoords.length > 0 && (
                <>
                  <text
                    x={padding.left}
                    y={chartHeight - 10}
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {svgCoords[0].point.fecha}
                  </text>
                  <text
                    x={chartWidth - padding.right}
                    y={chartHeight - 10}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {svgCoords[svgCoords.length - 1].point.fecha}
                  </text>
                </>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Detalle de Registros ({cambios.length} filas en este período)
        </h3>
        <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-4">ID</th>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Tasa (1 USD = X {selectedMoneda?.sigla})</th>
                <th className="py-2.5 px-4">Inverso (1 {selectedMoneda?.sigla} = X USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {cambios.slice(0, 100).map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="py-2 px-4 text-slate-400">{c.id}</td>
                  <td className="py-2 px-4 font-semibold text-slate-900 dark:text-white">{c.fecha}</td>
                  <td className="py-2 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {c.cambio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-2 px-4 text-slate-500">
                    {(1 / c.cambio).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cambios.length > 100 && (
          <p className="text-[11px] text-slate-400 mt-2 text-right">
            Mostrando los primeros 100 registros. Use el botón CSV para exportar todos los {cambios.length} registros.
          </p>
        )}
      </div>
    </div>
  );
};
