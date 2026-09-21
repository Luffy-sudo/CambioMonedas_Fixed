import React, { useState } from 'react';
import { Terminal, Play, Copy, Check, Clock, AlertCircle } from 'lucide-react';

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  defaultParams?: Record<string, string>;
  defaultBody?: string;
  description: string;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: 'Listar Monedas',
    method: 'GET',
    path: '/api/monedas/listar',
    description: 'Retorna todas las monedas registradas en el catálogo (177).',
  },
  {
    name: 'Obtener Moneda por ID',
    method: 'GET',
    path: '/api/monedas/obtener/35',
    description: 'Retorna los datos de una moneda por ID (ej. 35 = Peso colombiano).',
  },
  {
    name: 'Buscar Monedas por Nombre',
    method: 'GET',
    path: '/api/monedas/buscar/dolar',
    description: 'Búsqueda por texto en nombre o sigla de la moneda.',
  },
  {
    name: 'Buscar Moneda por País',
    method: 'GET',
    path: '/api/monedas/buscarporpais/Colombia',
    description: 'Devuelve la moneda legal asociada al país consultado.',
  },
  {
    name: 'Historial por Período',
    method: 'GET',
    path: '/api/monedas/listarporperiodo?idMoneda=35&desde=2024-01-01&hasta=2024-01-31',
    description: 'Consulta de tasas de cambio históricas por rango de fechas.',
  },
  {
    name: 'Análisis de Inversión USD',
    method: 'GET',
    path: '/api/monedas/analizarinversion?sigla=COP&desde=2024-01-01&hasta=2024-12-31&umbral=1.5',
    description: 'Algoritmo de recomendación de compra/venta de dólares.',
  },
  {
    name: 'Conversor de Divisas',
    method: 'POST',
    path: '/api/monedas/convertir',
    defaultBody: JSON.stringify({ monto: 500, idMonedaOrigen: 168, idMonedaDestino: 35 }, null, 2),
    description: 'Calcula conversión entre dos monedas según tasa vigente o histórica.',
  },
  {
    name: 'Listar Países',
    method: 'GET',
    path: '/api/paises/listar',
    description: 'Retorna la lista de países (249) con sus monedas vinculadas.',
  },
  {
    name: 'Buscar País por Nombre',
    method: 'GET',
    path: '/api/paises/buscar/japon',
    description: 'Filtra países por coincidencia de nombre o código alfa.',
  },
  {
    name: 'Validar Usuario (Login)',
    method: 'GET',
    path: '/api/usuarios/validar/frayosorio/123',
    description: 'Verifica credenciales y emite token de seguridad JWT.',
  },
  {
    name: 'Listar Usuarios',
    method: 'GET',
    path: '/api/usuarios/listar',
    description: 'Retorna la lista de usuarios del sistema sin exponer claves.',
  },
  {
    name: 'Estadísticas del Sistema',
    method: 'GET',
    path: '/api/stats',
    description: 'Métricas generales de la base de datos de cambio de monedas.',
  },
  {
    name: 'Sincronizar Tasas en Vivo',
    method: 'POST',
    path: '/api/sincronizar-en-vivo',
    description: 'Conecta con ExchangeRate-API pública para obtener tasas vigentes del día.',
  },
  {
    name: 'Estado de Sincronización',
    method: 'GET',
    path: '/api/estado-sincronizacion',
    description: 'Consulta última fecha, proveedor y tasas de muestra sincronizadas.',
  },
];

export const ApiTesterView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [requestUrl, setRequestUrl] = useState<string>(ENDPOINTS[0].path);
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(ENDPOINTS[0].method);
  const [requestBody, setRequestBody] = useState<string>(ENDPOINTS[0].defaultBody || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setRequestUrl(ep.path);
    setRequestMethod(ep.method);
    setRequestBody(ep.defaultBody || '');
  };

  const handleSend = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    setExecutionTime(null);

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if ((requestMethod === 'POST' || requestMethod === 'PUT') && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(requestUrl, options);
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(json);
    } catch (err: any) {
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Error en la petición' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Intro */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Consola y Probador de Endpoints REST
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ejecute peticiones directamente contra los controladores Spring Boot implementados para verificar respuestas, tiempos y estructura JSON.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Endpoints Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Endpoints Disponibles
          </h2>
          <div className="space-y-1 max-h-[540px] overflow-y-auto">
            {ENDPOINTS.map(ep => {
              const isSelected = selectedEndpoint.name === ep.name;
              return (
                <button
                  key={ep.name}
                  onClick={() => selectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : ep.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ep.method === 'PUT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ep.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 truncate">{ep.path}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Request & Response area */}
        <div className="lg:col-span-8 space-y-4">
          {/* Request Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {selectedEndpoint.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={requestMethod}
                  onChange={e => setRequestMethod(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none shrink-0"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <input
                  id="input-api-url"
                  type="text"
                  value={requestUrl}
                  onChange={e => setRequestUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <button
                  id="btn-enviar-api"
                  onClick={handleSend}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </div>

            {/* Request Body if POST/PUT */}
            {(requestMethod === 'POST' || requestMethod === 'PUT') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuerpo de la Petición (JSON Body)
                </label>
                <textarea
                  rows={4}
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-900 text-emerald-400 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Response Box */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Respuesta del Servidor
                </h3>
                {responseStatus !== null && (
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {executionTime !== null && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    {executionTime} ms
                  </span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              )}
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 max-h-[380px] overflow-auto font-mono text-xs text-emerald-400">
              {loading ? (
                <span className="text-slate-400 italic">Ejecutando petición...</span>
              ) : responseData ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(responseData, null, 2)}</pre>
              ) : (
                <span className="text-slate-500 italic">Haga clic en "Enviar" para ejecutar este endpoint.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
