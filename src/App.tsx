/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConversorView } from './components/ConversorView';
import { HistorialView } from './components/HistorialView';
import { InversionView } from './components/InversionView';
import { MonedasView } from './components/MonedasView';
import { PaisesView } from './components/PaisesView';
import { UsuariosView } from './components/UsuariosView';
import { ApiTesterView } from './components/ApiTesterView';
import { LoginModal } from './components/LoginModal';
import { Moneda, Pais, Usuario, SyncStatus } from './types';
import { api } from './services/api';
import { Github, Database, CheckCircle2, RefreshCw, Zap, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('conversor');
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [stats, setStats] = useState<{
    totalMonedas: number;
    totalPaises: number;
    totalUsuarios: number;
    totalRegistrosCambio: number;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const [mList, pList, statsRes, syncRes] = await Promise.all([
        api.listarMonedas(),
        api.listarPaises(),
        api.obtenerStats(),
        api.obtenerEstadoSincronizacion().catch(() => null),
      ]);
      setMonedas(mList);
      setPaises(pList);
      setStats(statsRes);
      if (syncRes) setSyncStatus(syncRes);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSyncRealTime = async () => {
    setSyncing(true);
    try {
      const res = await api.sincronizarEnVivo();
      setSyncStatus(res);
      setSyncToast(res.mensaje || 'Tasas actualizadas en tiempo real');
      setTimeout(() => setSyncToast(null), 5000);
      await loadInitialData();
    } catch (err: any) {
      setSyncToast('Error en la sincronización en vivo');
      setTimeout(() => setSyncToast(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  // Attempt auto-login with default demo user frayosorio / 123
  useEffect(() => {
    loadInitialData();

    // Auto login demo user
    api.validarUsuario('frayosorio', '123')
      .then(res => {
        if (res.usuario && res.token) {
          setCurrentUser(res.usuario);
          setToken(res.token);
        }
      })
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (user: Usuario, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* App Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        stats={stats}
        syncStatus={syncStatus}
        onSync={handleSyncRealTime}
        syncing={syncing}
      />

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full">
          <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-medium flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{syncToast}</span>
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="text-white/80 hover:text-white text-xs px-2 py-0.5"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {initialLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-sm font-medium">Cargando base de datos de cambio de monedas...</p>
          </div>
        ) : (
          <>
            {activeTab === 'conversor' && (
              <ConversorView
                monedas={monedas}
                paises={paises}
                syncStatus={syncStatus}
                onSync={handleSyncRealTime}
                syncing={syncing}
              />
            )}
            {activeTab === 'historial' && (
              <HistorialView monedas={monedas} />
            )}
            {activeTab === 'inversion' && (
              <InversionView monedas={monedas} />
            )}
            {activeTab === 'monedas' && (
              <MonedasView
                monedas={monedas}
                paises={paises}
                onMonedasChange={loadInitialData}
              />
            )}
            {activeTab === 'paises' && (
              <PaisesView
                paises={paises}
                monedas={monedas}
                onPaisesChange={loadInitialData}
              />
            )}
            {activeTab === 'usuarios' && (
              <UsuariosView
                currentUser={currentUser}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
            {activeTab === 'api' && (
              <ApiTesterView />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>
              <strong>ITM MDS Cambio de Monedas</strong> — Migrado de Java Spring Boot a arquitectura Full-Stack.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/frayosorio/ITM_MDS_CambioMonedas.git"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Repositorio Original</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>API Operativa</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

