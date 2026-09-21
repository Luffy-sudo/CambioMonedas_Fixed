import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowRight, ShieldAlert, Sparkles, Filter, CheckCircle, AlertTriangle } from 'lucide-react';
import { Moneda, AnalisisInversionDTO } from '../types';
import { api } from '../services/api';

interface InversionViewProps {
  monedas: Moneda[];
}

export const InversionView: React.FC<InversionViewProps> = ({ monedas }) => {
  const [selectedMonedaId, setSelectedMonedaId] = useState<number>(35); // COP default
  const [desde, setDesde] = useState<string>('2024-01-01');
  const [hasta, setHasta] = useState<string>('2025-10-31');
  const [umbral, setUmbral] = useState<number>(1.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    moneda: Moneda;
    totalPuntos: number;
    umbral: number;
    cambioActual: number;
    fechaActual: string;
    analisis: AnalisisInversionDTO[];
  } | null>(null);

  const handleAnalizar = async () => {
    if (!selectedMonedaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.analizarInversion(selectedMonedaId, undefined, desde || undefined, hasta || undefined, umbral);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar el análisis de inversión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAnalizar();
  }, [selectedMonedaId, umbral]);

  const selectedMoneda = monedas.find(m => m.id === selectedMonedaId);

  // Latest recommendation
  const ultimaRecomendacion = data?.analisis.length ? data.analisis[data.analisis.length - 1] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Análisis de Inversión en Dólares (USD)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Algoritmo de análisis técnico basado en la especificación del servicio Spring Boot (<code>MonedaServicio.AnalizarInversionDolar</code>).
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            Umbrales de Volatilidad
          </span>
        </div>

        {/* Filter controls */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Moneda a Analizar vs USD
            </label>
            <select
              id="select-moneda-inversion"
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
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Umbral Cambio (%)
            </label>
            <select
              value={umbral}
              onChange={e => setUmbral(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="0.5">0.5% (Alta Sensibilidad)</option>
              <option value="1.0">1.0% (Estándar ITM)</option>
              <option value="1.5">1.5% (Recomendado)</option>
              <option value="2.0">2.0% (Moderado)</option>
              <option value="3.0">3.0% (Baja Frecuencia)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalizar}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            {loading ? 'Calculando...' : 'Reejecutar Análisis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary recommendation banner */}
      {ultimaRecomendacion && data && (
        <div
          className={`rounded-2xl p-6 shadow-md border ${
            ultimaRecomendacion.recomendacion === 'Comprar USD'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500'
              : ultimaRecomendacion.recomendacion === 'Vender USD'
              ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white border-amber-500'
              : 'bg-slate-800 text-white border-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Señal de Inversión Más Reciente ({data.fechaActual})
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1">
                {ultimaRecomendacion.recomendacion}
              </h2>
              <p className="text-xs text-white/90 mt-2 max-w-xl leading-relaxed">
                {ultimaRecomendacion.recomendacion === 'Comprar USD'
                  ? `La divisa ${data.moneda.sigla} se ha apreciado frente al USD o el tipo de cambio ha retrocedido, marcando un punto de entrada oportuno para adquirir dólares.`
                  : ultimaRecomendacion.recomendacion === 'Vender USD'
                  ? `El tipo de cambio ha subido fuertemente (${data.cambioActual.toLocaleString()} ${data.moneda.sigla}/USD), lo que genera una señal de toma de utilidades vendiendo dólares a favor de moneda local.`
                  : 'El mercado se mantiene dentro de los márgenes de tolerancia del umbral sin rupturas significativas.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-xs space-y-1 sm:text-right">
              <p className="text-white/80">Tasa de Cierre Analizada</p>
              <p className="text-xl font-extrabold">{data.cambioActual.toLocaleString()} {data.moneda.sigla}</p>
              <p className="text-[11px] text-white/80">Variación ciclo: {ultimaRecomendacion.variacionPorcentaje}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Periods list */}
      {data && data.analisis.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Historial de Señales Detectadas ({data.analisis.length} períodos de tendencia)
              </h3>
              <p className="text-xs text-slate-400">
                Transiciones de señal cuando la variación porcentual acumulada supera el {data.umbral}%.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.analisis.slice().reverse().map((periodo, idx) => {
              const isComprar = periodo.recomendacion === 'Comprar USD';
              const isVender = periodo.recomendacion === 'Vender USD';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 ${
                        isComprar
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : isVender
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {periodo.recomendacion}
                    </span>

                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {periodo.fechaInicio} → {periodo.fechaFin}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tasa: {periodo.cambioMonedaAInicio.toLocaleString()} → {periodo.cambioMonedaAFin.toLocaleString()} {periodo.siglaMonedaA}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Variación Ciclo</span>
                      <span
                        className={`font-bold ${
                          periodo.cambioMonedaAFin >= periodo.cambioMonedaAInicio
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {periodo.cambioMonedaAFin >= periodo.cambioMonedaAInicio ? '+' : '-'}
                        {periodo.variacionPorcentaje}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
