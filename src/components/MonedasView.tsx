import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Globe, DollarSign, X, Check, AlertCircle } from 'lucide-react';
import { Moneda, Pais } from '../types';
import { api } from '../services/api';

interface MonedasViewProps {
  monedas: Moneda[];
  paises: Pais[];
  onMonedasChange: () => void;
}

export const MonedasView: React.FC<MonedasViewProps> = ({ monedas, paises, onMonedasChange }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMoneda, setEditingMoneda] = useState<Moneda | null>(null);
  const [formSigla, setFormSigla] = useState<string>('');
  const [formNombre, setFormNombre] = useState<string>('');
  const [formSimbolo, setFormSimbolo] = useState<string>('');
  const [formEmisor, setFormEmisor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search by country result state
  const [countrySearchResult, setCountrySearchResult] = useState<Moneda | null>(null);
  const [countrySearchLoading, setCountrySearchLoading] = useState<boolean>(false);

  const filteredMonedas = useMemo(() => {
    if (!searchTerm.trim()) return monedas;
    const term = searchTerm.toLowerCase();
    return monedas.filter(
      m =>
        m.nombre.toLowerCase().includes(term) ||
        m.sigla.toLowerCase().includes(term) ||
        m.id.toString() === term
    );
  }, [monedas, searchTerm]);

  const handleSearchByCountry = async () => {
    if (!countrySearchTerm.trim()) {
      setCountrySearchResult(null);
      return;
    }
    setCountrySearchLoading(true);
    try {
      const res = await api.buscarMonedaPorPais(countrySearchTerm);
      setCountrySearchResult(res);
    } catch {
      setCountrySearchResult(null);
    } finally {
      setCountrySearchLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMoneda(null);
    setFormSigla('');
    setFormNombre('');
    setFormSimbolo('');
    setFormEmisor('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (m: Moneda) => {
    setEditingMoneda(m);
    setFormSigla(m.sigla);
    setFormNombre(m.nombre);
    setFormSimbolo(m.simbolo || '');
    setFormEmisor(m.emisor || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSigla.trim() || !formNombre.trim()) {
      setError('Sigla y Nombre son campos requeridos.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editingMoneda) {
        await api.modificarMoneda({
          id: editingMoneda.id,
          sigla: formSigla.toUpperCase(),
          nombre: formNombre,
          simbolo: formSimbolo,
          emisor: formEmisor,
        });
      } else {
        await api.agregarMoneda({
          sigla: formSigla.toUpperCase(),
          nombre: formNombre,
          simbolo: formSimbolo,
          emisor: formEmisor,
        });
      }
      setModalOpen(false);
      onMonedasChange();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la moneda.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta moneda?')) return;
    try {
      await api.eliminarMoneda(id);
      onMonedasChange();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const getPaisesForMoneda = (monedaId: number) => {
    return paises.filter(p => p.idMoneda === monedaId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Gestión de Monedas ({monedas.length} registradas)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Catálogo oficial de divisas, siglas ISO 4217 y entidades emisoras.
            </p>
          </div>

          <button
            id="btn-agregar-moneda"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Moneda</span>
          </button>
        </div>

        {/* Search toolbars */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* General Search */}
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="input-buscar-moneda"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por sigla (USD, COP, EUR...) o por nombre..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Search by Country Endpoint */}
          <div className="md:col-span-5 flex gap-2">
            <input
              type="text"
              value={countrySearchTerm}
              onChange={e => setCountrySearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchByCountry()}
              placeholder="Buscar moneda por país (ej. Colombia, Japón)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSearchByCountry}
              disabled={countrySearchLoading}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Result of search by country */}
        {countrySearchResult && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>
                Moneda encontrada para <strong>"{countrySearchTerm}"</strong>:{' '}
                <strong>{countrySearchResult.sigla}</strong> — {countrySearchResult.nombre} (ID: {countrySearchResult.id})
              </span>
            </div>
            <button
              onClick={() => {
                setCountrySearchResult(null);
                setCountrySearchTerm('');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Grid of currencies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMonedas.map(moneda => {
          const paisesAsociados = getPaisesForMoneda(moneda.id);

          return (
            <div
              key={moneda.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                      {moneda.sigla}
                    </span>
                    {moneda.simbolo && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold font-mono">
                        {moneda.simbolo}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">ID #{moneda.id}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2.5 line-clamp-1">
                  {moneda.nombre}
                </h3>
                {moneda.emisor && (
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Emisor: {moneda.emisor}</p>
                )}

                {/* Associated countries */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Países ({paisesAsociados.length}):
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {paisesAsociados.slice(0, 3).map(p => (
                      <span
                        key={p.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {p.nombre}
                      </span>
                    ))}
                    {paisesAsociados.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{paisesAsociados.length - 3} más
                      </span>
                    )}
                    {paisesAsociados.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">Sin país mapeado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(moneda)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                  title="Editar Moneda"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(moneda.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  title="Eliminar Moneda"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMonedas.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            No se encontraron monedas con el criterio de búsqueda.
          </p>
        </div>
      )}

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {editingMoneda ? `Editar Moneda #${editingMoneda.id}` : 'Agregar Nueva Moneda'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sigla (ISO 4217) *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formSigla}
                  onChange={e => setFormSigla(e.target.value.toUpperCase())}
                  placeholder="ej. USD, COP, EUR"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Moneda *
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="ej. Peso colombiano"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Símbolo (opcional)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formSimbolo}
                  onChange={e => setFormSimbolo(e.target.value)}
                  placeholder="ej. $, €, ¥"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emisor / Banco Central (opcional)
                </label>
                <input
                  type="text"
                  value={formEmisor}
                  onChange={e => setFormEmisor(e.target.value)}
                  placeholder="ej. Banco de la República"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
