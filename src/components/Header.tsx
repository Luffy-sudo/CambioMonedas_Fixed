import React from 'react';
import { ArrowLeftRight, TrendingUp, DollarSign, Globe2, Users, Terminal, LogIn, LogOut, RefreshCw, Zap } from 'lucide-react';
import { Usuario, SyncStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Usuario | null;
  onLoginClick: () => void;
  onLogout: () => void;
  stats: {
    totalMonedas: number;
    totalPaises: number;
    totalRegistrosCambio: number;
  } | null;
  syncStatus: SyncStatus | null;
  onSync: () => void;
  syncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginClick,
  onLogout,
  stats,
  syncStatus,
  onSync,
  syncing,
}) => {
  const tabs = [
    { id: 'conversor', label: 'Conversor', icon: ArrowLeftRight },
    { id: 'historial', label: 'Historial', icon: TrendingUp },
    { id: 'inversion', label: 'Análisis Inversión', icon: DollarSign },
    { id: 'monedas', label: 'Monedas', icon: DollarSign, badge: stats?.totalMonedas },
    { id: 'paises', label: 'Países', icon: Globe2, badge: stats?.totalPaises },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'api', label: 'Consola REST', icon: Terminal },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">ITM Cambio de Monedas</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MDS Spring Boot
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Modelos de Desarrollo de Software • Prof. Fray León Osorio
              </p>
            </div>
          </div>

          {/* User controls & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Real-Time Sync Button */}
            <button
              id="header-sync-btn"
              onClick={onSync}
              disabled={syncing}
              title={
                syncStatus?.ultimaSincronizacion
                  ? `Sincronizado con ExchangeRate-API (${new Date(syncStatus.ultimaSincronizacion).toLocaleTimeString()})`
                  : 'Sincronizar tasas de cambio en tiempo real'
              }
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {syncing ? 'Sincronizando...' : 'Tasas en Vivo'}
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {stats && (
              <div className="hidden xl:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span><strong>{stats.totalMonedas}</strong> monedas</span>
                <span className="text-slate-500">•</span>
                <span><strong>{stats.totalPaises}</strong> países</span>
                <span className="text-slate-500">•</span>
                <span><strong>{stats.totalRegistrosCambio.toLocaleString()}</strong> tasas</span>
              </div>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-semibold">
                  {currentUser.nombre.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-medium text-slate-200 leading-tight">{currentUser.nombre}</p>
                  <p className="text-[10px] text-slate-400">@{currentUser.usuario}</p>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onLoginClick}
                className="flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar (frayosorio)</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
