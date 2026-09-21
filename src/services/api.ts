import { Moneda, Pais, Usuario, UsuarioLoginDto, CambioMoneda, AnalisisInversionDTO, ConversionResult } from '../types';

export const api = {
  // USUARIOS
  async validarUsuario(nombreUsuario: string, clave: string): Promise<UsuarioLoginDto> {
    const res = await fetch(`/api/usuarios/validar/${encodeURIComponent(nombreUsuario)}/${encodeURIComponent(clave)}`);
    return res.json();
  },

  async listarUsuarios(): Promise<Usuario[]> {
    const res = await fetch('/api/usuarios/listar');
    return res.json();
  },

  async obtenerUsuario(id: number): Promise<Usuario | null> {
    const res = await fetch(`/api/usuarios/obtener/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async buscarUsuarios(nombre: string): Promise<Usuario[]> {
    const res = await fetch(`/api/usuarios/buscar/${encodeURIComponent(nombre)}`);
    return res.json();
  },

  async agregarUsuario(data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch('/api/usuarios/agregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async modificarUsuario(data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch('/api/usuarios/modificar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async eliminarUsuario(id: number): Promise<boolean> {
    const res = await fetch(`/api/usuarios/eliminar/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // MONEDAS
  async listarMonedas(): Promise<Moneda[]> {
    const res = await fetch('/api/monedas/listar');
    return res.json();
  },

  async obtenerMoneda(id: number): Promise<Moneda | null> {
    const res = await fetch(`/api/monedas/obtener/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async buscarMonedas(nombre: string): Promise<Moneda[]> {
    const res = await fetch(`/api/monedas/buscar/${encodeURIComponent(nombre)}`);
    return res.json();
  },

  async buscarMonedaPorPais(pais: string): Promise<Moneda | null> {
    const res = await fetch(`/api/monedas/buscarporpais/${encodeURIComponent(pais)}`);
    if (!res.ok) return null;
    return res.json();
  },

  async agregarMoneda(data: Partial<Moneda>): Promise<Moneda> {
    const res = await fetch('/api/monedas/agregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async modificarMoneda(data: Partial<Moneda>): Promise<Moneda> {
    const res = await fetch('/api/monedas/modificar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async eliminarMoneda(id: number): Promise<boolean> {
    const res = await fetch(`/api/monedas/eliminar/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async listarPorPeriodo(idMoneda: number, desde?: string, hasta?: string): Promise<CambioMoneda[]> {
    const params = new URLSearchParams({ idMoneda: idMoneda.toString() });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const res = await fetch(`/api/monedas/listarporperiodo?${params.toString()}`);
    return res.json();
  },

  async analizarInversion(
    idMoneda?: number,
    sigla?: string,
    desde?: string,
    hasta?: string,
    umbral: number = 1.0
  ): Promise<{
    moneda: Moneda;
    totalPuntos: number;
    umbral: number;
    cambioActual: number;
    fechaActual: string;
    analisis: AnalisisInversionDTO[];
  }> {
    const params = new URLSearchParams({ umbral: umbral.toString() });
    if (idMoneda) params.set('idMoneda', idMoneda.toString());
    if (sigla) params.set('sigla', sigla);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const res = await fetch(`/api/monedas/analizarinversion?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al analizar inversión');
    }
    return res.json();
  },

  async convertir(monto: number, idMonedaOrigen: number, idMonedaDestino: number, fecha?: string): Promise<ConversionResult> {
    const res = await fetch('/api/monedas/convertir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto, idMonedaOrigen, idMonedaDestino, fecha }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error en la conversión');
    }
    return res.json();
  },

  // PAISES
  async listarPaises(): Promise<Pais[]> {
    const res = await fetch('/api/paises/listar');
    return res.json();
  },

  async obtenerPais(id: number): Promise<Pais | null> {
    const res = await fetch(`/api/paises/obtener/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async buscarPaises(nombre: string): Promise<Pais[]> {
    const res = await fetch(`/api/paises/buscar/${encodeURIComponent(nombre)}`);
    return res.json();
  },

  async agregarPais(data: Partial<Pais>): Promise<Pais> {
    const res = await fetch('/api/paises/agregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async modificarPais(data: Partial<Pais>): Promise<Pais> {
    const res = await fetch('/api/paises/modificar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async eliminarPais(id: number): Promise<boolean> {
    const res = await fetch(`/api/paises/eliminar/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // STATS & SYNC
  async obtenerStats(): Promise<{
    totalMonedas: number;
    totalPaises: number;
    totalUsuarios: number;
    totalRegistrosCambio: number;
    monedasConHistorial: number;
    usuarioDemo: { usuario: string; clave: string };
    rangoFechasHistorico: { inicio: string; fin: string };
    sincronizacion?: any;
  }> {
    const res = await fetch('/api/stats');
    return res.json();
  },

  async sincronizarEnVivo(): Promise<any> {
    const res = await fetch('/api/sincronizar-en-vivo', { method: 'POST' });
    return res.json();
  },

  async obtenerEstadoSincronizacion(): Promise<any> {
    const res = await fetch('/api/estado-sincronizacion');
    return res.json();
  },
};
