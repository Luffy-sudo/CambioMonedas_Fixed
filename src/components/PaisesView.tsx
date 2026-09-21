import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Globe2, X, AlertCircle } from 'lucide-react';
import { Pais, Moneda } from '../types';
import { api } from '../services/api';

interface PaisesViewProps {
  paises: Pais[];
  monedas: Moneda[];
  onPaisesChange: () => void;
}

// Helper to convert 2-letter country code into flag emoji
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export const PaisesView: React.FC<PaisesViewProps> = ({ paises, monedas, onPaisesChange }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPais, setEditingPais] = useState<Pais | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formAlfa2, setFormAlfa2] = useState<string>('');
  const [formAlfa3, setFormAlfa3] = useState<string>('');
  const [formIdMoneda, setFormIdMoneda] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPaises = useMemo(() => {
    if (!searchTerm.trim()) return paises;
    const term = searchTerm.toLowerCase();
    return paises.filter(
      p =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigoAlfa2.toLowerCase().includes(term) ||
        p.codigoAlfa3.toLowerCase().includes(term) ||
        p.moneda?.sigla.toLowerCase().includes(term)
    );
  }, [paises, searchTerm]);

  const openAddModal = () => {
    setEditingPais(null);
    setFormNombre('');
    setFormAlfa2('');
    setFormAlfa3('');
    setFormIdMoneda(monedas[0]?.id || 1);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Pais) => {
    setEditingPais(p);
    setFormNombre(p.nombre);
    setFormAlfa2(p.codigoAlfa2);
    setFormAlfa3(p.codigoAlfa3);
    setFormIdMoneda(p.idMoneda);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formAlfa2.trim() || !formAlfa3.trim()) {
      setError('Todos los campos marcados con * son requeridos.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editingPais) {
        await api.modificarPais({
          id: editingPais.id,
          nombre: formNombre,
          codigoAlfa2: formAlfa2.toUpperCase(),
          codigoAlfa3: formAlfa3.toUpperCase(),
          idMoneda: formIdMoneda,
        });
      } else {
        await api.agregarPais({
          nombre: formNombre,
          codigoAlfa2: formAlfa2.toUpperCase(),
          codigoAlfa3: formAlfa3.toUpperCase(),
          idMoneda: formIdMoneda,
        });
      }
      setModalOpen(false);
      onPaisesChange();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el país.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este país?')) return;
    try {
      await api.eliminarPais(id);
      onPaisesChange();
    } catch (err) {
      console.error('Error al eliminar país:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-emerald-500" />
              Gestión de Países ({paises.length} registrados)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Catálogo internacional de naciones, códigos ISO Alfa-2, Alfa-3 y vinculación a moneda legal.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo País</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-buscar-pais"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de país, código alfa (ej. CO, COL, US, ES) o sigla de moneda..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Countries grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPaises.map(pais => {
          const moneda = pais.moneda || monedas.find(m => m.id === pais.idMoneda);

          return (
            <div
              key={pais.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none" title={pais.codigoAlfa2}>
                      {getFlagEmoji(pais.codigoAlfa2)}
                    </span>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {pais.codigoAlfa2} / {pais.codigoAlfa3}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">ID #{pais.id}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2.5 line-clamp-1">
                  {pais.nombre}
                </h3>

                {/* Moneda vinculada */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Moneda Oficial:
                  </p>
                  {moneda ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-800">
                        {moneda.sigla}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        {moneda.nombre}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Moneda ID #{pais.idMoneda}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(pais)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                  title="Editar País"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(pais.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  title="Eliminar País"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPaises.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            No se encontraron países con el criterio de búsqueda.
          </p>
        </div>
      )}

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {editingPais ? `Editar País #${editingPais.id}` : 'Agregar Nuevo País'}
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
                  Nombre del País *
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="ej. Colombia"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Alfa-2 *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formAlfa2}
                    onChange={e => setFormAlfa2(e.target.value.toUpperCase())}
                    placeholder="CO"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Alfa-3 *
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formAlfa3}
                    onChange={e => setFormAlfa3(e.target.value.toUpperCase())}
                    placeholder="COL"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Moneda Oficial *
                </label>
                <select
                  value={formIdMoneda}
                  onChange={e => setFormIdMoneda(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {monedas.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.sigla} — {m.nombre}
                    </option>
                  ))}
                </select>
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
