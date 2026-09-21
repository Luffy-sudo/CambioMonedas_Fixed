import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Calendar, Sparkles, TrendingUp, RefreshCw, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';
import { Moneda, Pais, ConversionResult, SyncStatus } from '../types';
import { api } from '../services/api';

interface ConversorViewProps {
  monedas: Moneda[];
  paises: Pais[];
  syncStatus?: SyncStatus | null;
  onSync?: () => void;
  syncing?: boolean;
}

export const ConversorView: React.FC<ConversorViewProps> = ({
  monedas,
  paises,
  syncStatus,
  onSync,
  syncing = false,
}) => {
  const [monto, setMonto] = useState<string>('100');
  const [origenId, setOrigenId] = useState<number>(149); // USD
  const [destinoId, setDestinoId] = useState<number>(35); // COP
  const [fecha, setFecha] = useState<string>('');
  const [resultado, setResultado] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Match USD if exists, or default to reasonable IDs
  useEffect(() => {
    if (monedas.length > 0) {
      const usd = monedas.find(m => m.sigla === 'USD');
      const cop = monedas.find(m => m.sigla === 'COP');
      if (usd) setOrigenId(usd.id);
      if (cop) setDestinoId(cop.id);
    }
  }, [monedas]);

  const handleConvertir = async () => {
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) {
      setError('Por favor ingrese un monto válido mayor a 0');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.convertir(val, origenId, destinoId, fecha || undefined);
      setResultado(res);
    } catch (err: any) {
      setError(err.message || 'Error al realizar la conversión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monedas.length > 0) {
      handleConvertir();
    }
  }, [origenId, destinoId, fecha]);

  const swapCurrencies = () => {
    const temp = origenId;
    setOrigenId(destinoId);
    setDestinoId(temp);
  };

  const setShortcut = (siglaFrom: string, siglaTo: string) => {
    const mFrom = monedas.find(m => m.sigla === siglaFrom);
    const mTo = monedas.find(m => m.sigla === siglaTo);
    if (mFrom && mTo) {
      setOrigenId(mFrom.id);
      setDestinoId(mTo.id);
    }
  };

  const getPaisInfo = (idMoneda: number) => {
    const pList = paises.filter(p => p.idMoneda === idMoneda);
    if (pList.length === 0) return null;
    return pList.map(p => p.nombre).slice(0, 3).join(', ') + (pList.length > 3 ? '...' : '');
  };

  const origenMoneda = monedas.find(m => m.id === origenId);
  const destinoMoneda = monedas.find(m => m.id === destinoId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
              Conversor de Divisas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Conversión oficial calculada sobre la base del historial de tasas del sistema.
            </p>

            {/* Real-Time connection badge */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API en Vivo Conectada: <strong>ExchangeRate-API</strong>
              </span>

              {syncStatus?.ultimaSincronizacion && (
                <span className="text-[11px] text-slate-400">
                  Actualizado: {new Date(syncStatus.ultimaSincronizacion).toLocaleDateString()} {new Date(syncStatus.ultimaSincronizacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {onSync && (
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 ml-1"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Sincronizando...' : 'Actualizar ahora'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-400 font-medium mr-1">Rápidos:</span>
            {[
              { label: 'USD → COP', from: 'USD', to: 'COP' },
              { label: 'EUR → COP', from: 'EUR', to: 'COP' },
              { label: 'USD → EUR', from: 'USD', to: 'EUR' },
              { label: 'BRL → COP', from: 'BRL', to: 'COP' },
            ].map(pair => (
              <button
                key={pair.label}
                onClick={() => setShortcut(pair.from, pair.to)}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                {pair.label}
              </button>
            ))}
          </div>
        </div>

        {/* Converter Form */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Monto */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Monto a convertir
            </label>
            <div className="relative">
              <input
                id="input-monto"
                type="number"
                min="0.01"
                step="any"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConvertir()}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-base"
                placeholder="100"
              />
            </div>
          </div>

          {/* Moneda Origen */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Moneda Origen
            </label>
            <select
              id="select-origen"
              value={origenId}
              onChange={e => setOrigenId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {monedas.map(m => (
                <option key={m.id} value={m.id}>
                  {m.sigla} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pb-1">
            <button
              id="btn-swap"
              onClick={swapCurrencies}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all border border-slate-200 dark:border-slate-600"
              title="Intercambiar divisas"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Moneda Destino */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Moneda Destino
            </label>
            <select
              id="select-destino"
              value={destinoId}
              onChange={e => setDestinoId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {monedas.map(m => (
                <option key={m.id} value={m.id}>
                  {m.sigla} — {m.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date filter & Execute */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Fecha de tasa (opcional):</span>
            <input
              id="input-fecha-conversion"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
            />
            {fecha && (
              <button
                onClick={() => setFecha('')}
                className="text-[11px] text-rose-500 hover:underline"
              >
                Limpiar fecha
              </button>
            )}
          </div>

          <button
            id="btn-convertir"
            onClick={handleConvertir}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Calcular Conversión</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {resultado && (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">
                Resultado de Conversión ({resultado.fecha ? `Fecha: ${resultado.fecha}` : 'Tasa Vigente'})
              </p>
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {resultado.resultado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className="text-xl font-bold text-emerald-100">
                  {resultado.monedaDestino.sigla}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1">
                {resultado.monto.toLocaleString()} {resultado.monedaOrigen.sigla} ({resultado.monedaOrigen.nombre}) ={' '}
                {resultado.resultado.toLocaleString()} {resultado.monedaDestino.sigla} ({resultado.monedaDestino.nombre})
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-xs space-y-1 sm:text-right">
              <p className="text-emerald-100 font-medium">Tasa de cambio aplicada</p>
              <p className="font-bold text-sm">
                1 {resultado.monedaOrigen.sigla} = {resultado.tasa.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {resultado.monedaDestino.sigla}
              </p>
              <p className="text-[11px] text-emerald-200">
                1 {resultado.monedaDestino.sigla} = {(1 / (resultado.tasa || 1)).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {resultado.monedaOrigen.sigla}
              </p>
            </div>
          </div>

          {/* Country context pills */}
          <div className="mt-4 pt-4 border-t border-emerald-500/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-800/40 rounded-lg p-2.5 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-200 font-semibold block">Países con {resultado.monedaOrigen.sigla}:</span>
              <span className="text-white text-xs">{getPaisInfo(resultado.monedaOrigen.id) || 'Información no registrada'}</span>
            </div>
            <div className="bg-emerald-800/40 rounded-lg p-2.5 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-200 font-semibold block">Países con {resultado.monedaDestino.sigla}:</span>
              <span className="text-white text-xs">{getPaisInfo(resultado.monedaDestino.id) || 'Información no registrada'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick reference table of major currencies relative to USD / COP */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Tasas de Referencia Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { sigla: 'USD', name: 'Dólar EEUU' },
            { sigla: 'EUR', name: 'Euro' },
            { sigla: 'GBP', name: 'Libra Esterlina' },
            { sigla: 'JPY', name: 'Yen Japonés' },
            { sigla: 'BRL', name: 'Real Brasileño' },
            { sigla: 'CNY', name: 'Yuan Chino' },
          ].map(item => {
            const m = monedas.find(x => x.sigla === item.sigla);
            return (
              <button
                key={item.sigla}
                onClick={() => {
                  if (m) {
                    const cop = monedas.find(x => x.sigla === 'COP');
                    if (cop) {
                      setOrigenId(m.id);
                      setDestinoId(cop.id);
                    }
                  }
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-500 hover:shadow-xs transition-all"
              >
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">{item.sigla}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">{item.name}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Ver contra COP →</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
