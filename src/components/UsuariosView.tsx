import React, { useState, useEffect } from 'react';
import { Users, UserPlus, KeyRound, CheckCircle, XCircle, Trash2, Edit2, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { Usuario } from '../types';
import { api } from '../services/api';

interface UsuariosViewProps {
  currentUser: Usuario | null;
  onLoginSuccess: (user: Usuario, token: string) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({ currentUser, onLoginSuccess }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Form state
  const [formUsuario, setFormUsuario] = useState<string>('');
  const [formNombre, setFormNombre] = useState<string>('');
  const [formClave, setFormClave] = useState<string>('');
  const [formRoles, setFormRoles] = useState<string>('USER');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick login test state
  const [testUser, setTestUser] = useState<string>('frayosorio');
  const [testClave, setTestClave] = useState<string>('123');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const list = await api.listarUsuarios();
      setUsuarios(list);
    } catch (err) {
      console.error('Error loading usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await api.validarUsuario(testUser, testClave);
      setTestResult(res);
      if (res.usuario && res.token) {
        onLoginSuccess(res.usuario, res.token);
      }
    } catch (err: any) {
      setTestResult({ error: err.message || 'Error en validación' });
    } finally {
      setTestLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormUsuario('');
    setFormNombre('');
    setFormClave('');
    setFormRoles('USER');
    setFormActivo(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (u: Usuario) => {
    setEditingUser(u);
    setFormUsuario(u.usuario);
    setFormNombre(u.nombre);
    setFormClave('');
    setFormRoles(u.roles || 'USER');
    setFormActivo(u.activo !== false);
    setError(null);
    setModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.trim() || !formNombre.trim()) {
      setError('Nombre de usuario y nombre completo son requeridos.');
      return;
    }
    setError(null);

    try {
      if (editingUser) {
        await api.modificarUsuario({
          id: editingUser.id,
          usuario: formUsuario,
          nombre: formNombre,
          clave: formClave || undefined,
          roles: formRoles,
          activo: formActivo,
        });
      } else {
        if (!formClave.trim()) {
          setError('La contraseña es requerida para nuevos usuarios.');
          return;
        }
        await api.agregarUsuario({
          usuario: formUsuario,
          nombre: formNombre,
          clave: formClave,
          roles: formRoles,
          activo: formActivo,
        });
      }
      setModalOpen(false);
      loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      await api.eliminarUsuario(id);
      loadUsuarios();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Login Tester Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Prueba de Autenticación Spring Boot (<code>/api/usuarios/validar</code>)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Valida credenciales contra la base de datos y genera un token JWT firmado según la especificación de seguridad del proyecto.
        </p>

        <form onSubmit={handleTestLogin} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Usuario
            </label>
            <input
              id="input-login-test-user"
              type="text"
              value={testUser}
              onChange={e => setTestUser(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono outline-none"
              placeholder="frayosorio"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              id="input-login-test-pass"
              type="password"
              value={testClave}
              onChange={e => setTestClave(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
              placeholder="123"
            />
          </div>

          <div className="sm:col-span-4">
            <button
              id="btn-validar-login"
              type="submit"
              disabled={testLoading}
              className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors"
            >
              {testLoading ? 'Validando...' : 'Probar Login (Validar)'}
            </button>
          </div>
        </form>

        {testResult && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs">
            {testResult.usuario ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Autenticación Exitosa: {testResult.usuario.nombre} (@{testResult.usuario.usuario})</span>
                </div>
                <div className="font-mono text-[11px] bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 break-all">
                  <span className="text-slate-400 block font-sans text-[10px] mb-1">Token JWT Generado:</span>
                  {testResult.token}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-600 font-semibold">
                <XCircle className="w-4 h-4" />
                <span>Credenciales inválidas o usuario inactivo. Verifique usuario y clave.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users Directory */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Gestión de Usuarios ({usuarios.length})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Control de acceso y roles de usuario para el sistema de cambio de monedas.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>

        {/* Users list table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-4">Usuario</th>
                <th className="py-2.5 px-4">Nombre Completo</th>
                <th className="py-2.5 px-4">Rol</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                    @{u.usuario}
                  </td>
                  <td className="py-3 px-4">{u.nombre}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {u.roles || 'USER'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        u.activo !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.activo !== false ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Editar usuario"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {editingUser ? `Editar Usuario @${editingUser.usuario}` : 'Crear Nuevo Usuario'}
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

            <form onSubmit={handleSaveUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  value={formUsuario}
                  onChange={e => setFormUsuario(e.target.value)}
                  placeholder="ej. frayosorio"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="ej. Fray León Osorio"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña {editingUser ? '(dejar en blanco para mantener la actual)' : '*'}
                </label>
                <input
                  type="password"
                  value={formClave}
                  onChange={e => setFormClave(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={formRoles}
                    onChange={e => setFormRoles(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={formActivo ? 'true' : 'false'}
                    onChange={e => setFormActivo(e.target.value === 'true')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
