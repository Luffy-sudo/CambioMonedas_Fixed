import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Paths
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const MONEDAS_PATH = path.join(DATA_DIR, 'monedas.json');
const PAISES_PATH = path.join(DATA_DIR, 'paises.json');
const USUARIOS_PATH = path.join(DATA_DIR, 'usuarios.json');
const CAMBIOS_PATH = path.join(DATA_DIR, 'cambios.json');

// In-memory state
interface MonedaItem {
  id: number;
  sigla: string;
  nombre: string;
  simbolo?: string;
  emisor?: string;
  imagen?: string;
}

interface PaisItem {
  id: number;
  nombre: string;
  codigoAlfa2: string;
  codigoAlfa3: string;
  idMoneda: number;
  mapa?: string;
  bandera?: string;
}

interface UsuarioItem {
  id: number;
  usuario: string;
  nombre: string;
  clave: string;
  activo: boolean;
  foto?: string;
  roles?: string;
}

interface CambioItem {
  id: number;
  idMoneda: number;
  fecha: string;
  cambio: number;
}

let monedas: MonedaItem[] = [];
let paises: PaisItem[] = [];
let usuarios: UsuarioItem[] = [];
let cambios: CambioItem[] = [];

// Load data
try {
  if (fs.existsSync(MONEDAS_PATH)) {
    monedas = JSON.parse(fs.readFileSync(MONEDAS_PATH, 'utf-8'));
  }
  if (fs.existsSync(PAISES_PATH)) {
    paises = JSON.parse(fs.readFileSync(PAISES_PATH, 'utf-8'));
  }
  if (fs.existsSync(USUARIOS_PATH)) {
    usuarios = JSON.parse(fs.readFileSync(USUARIOS_PATH, 'utf-8'));
  }
  if (fs.existsSync(CAMBIOS_PATH)) {
    cambios = JSON.parse(fs.readFileSync(CAMBIOS_PATH, 'utf-8'));
  }
  console.log(`[Data Init] Loaded ${monedas.length} monedas, ${paises.length} países, ${usuarios.length} usuarios, ${cambios.length} cambios.`);
} catch (err) {
  console.error('[Data Init Error]', err);
}

// Helpers
const JWT_SECRET = '5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437';

function generateJwt(username: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1800, // 30 mins
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function parseDateVal(dStr: string): number {
  if (!dStr) return 0;
  const parts = dStr.split('-').map(p => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  }
  return new Date(dStr).getTime() || 0;
}

function saveStore(type: 'monedas' | 'paises' | 'usuarios' | 'cambios') {
  try {
    if (type === 'monedas') fs.writeFileSync(MONEDAS_PATH, JSON.stringify(monedas, null, 2));
    if (type === 'paises') fs.writeFileSync(PAISES_PATH, JSON.stringify(paises, null, 2));
    if (type === 'usuarios') fs.writeFileSync(USUARIOS_PATH, JSON.stringify(usuarios, null, 2));
    if (type === 'cambios') fs.writeFileSync(CAMBIOS_PATH, JSON.stringify(cambios));
  } catch (err) {
    console.error(`Failed to persist ${type}:`, err);
  }
}

// -------------------------------------------------------------
// REST API ROUTES (Spring Boot parity)
// -------------------------------------------------------------

// USUARIOS
app.get('/api/usuarios/validar/:nombreUsuario/:clave', (req, res) => {
  const { nombreUsuario, clave } = req.params;
  const user = usuarios.find(
    u => u.usuario.toLowerCase() === nombreUsuario.toLowerCase() && u.clave === clave && u.activo !== false
  );

  if (!user) {
    return res.json({ usuario: null, token: '' });
  }

  const token = generateJwt(user.usuario);
  const userCopy = { ...user };
  delete (userCopy as Partial<UsuarioItem>).clave;
  res.json({ usuario: userCopy, token });
});

app.post('/api/usuarios/validar', (req, res) => {
  const { usuario, nombreUsuario, clave } = req.body;
  const uName = usuario || nombreUsuario;
  const user = usuarios.find(
    u => u.usuario.toLowerCase() === (uName || '').toLowerCase() && u.clave === clave && u.activo !== false
  );

  if (!user) {
    return res.json({ usuario: null, token: '' });
  }

  const token = generateJwt(user.usuario);
  const userCopy = { ...user };
  delete (userCopy as Partial<UsuarioItem>).clave;
  res.json({ usuario: userCopy, token });
});

app.get('/api/usuarios/listar', (_req, res) => {
  const sanitized = usuarios.map(u => {
    const copy = { ...u };
    delete (copy as Partial<UsuarioItem>).clave;
    return copy;
  });
  res.json(sanitized);
});

app.get('/api/usuarios/obtener/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = usuarios.find(u => u.id === id);
  if (!user) return res.status(404).json(null);
  const copy = { ...user };
  delete (copy as Partial<UsuarioItem>).clave;
  res.json(copy);
});

app.get('/api/usuarios/buscar/:nombre', (req, res) => {
  const query = (req.params.nombre || '').toLowerCase();
  const matched = usuarios
    .filter(u => u.nombre.toLowerCase().includes(query) || u.usuario.toLowerCase().includes(query))
    .map(u => {
      const copy = { ...u };
      delete (copy as Partial<UsuarioItem>).clave;
      return copy;
    });
  res.json(matched);
});

app.post('/api/usuarios/agregar', (req, res) => {
  const body = req.body;
  const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
  const newUser: UsuarioItem = {
    id: newId,
    usuario: body.usuario || `user_${newId}`,
    nombre: body.nombre || 'Nuevo Usuario',
    clave: body.clave || '123',
    activo: body.activo !== undefined ? Boolean(body.activo) : true,
    roles: body.roles || 'USER',
    foto: body.foto || '',
  };
  usuarios.push(newUser);
  saveStore('usuarios');
  const copy = { ...newUser };
  delete (copy as Partial<UsuarioItem>).clave;
  res.json(copy);
});

app.put('/api/usuarios/modificar', (req, res) => {
  const body = req.body;
  const id = parseInt(body.id, 10);
  const index = usuarios.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json(null);

  usuarios[index] = {
    ...usuarios[index],
    usuario: body.usuario ?? usuarios[index].usuario,
    nombre: body.nombre ?? usuarios[index].nombre,
    clave: body.clave ? body.clave : usuarios[index].clave,
    activo: body.activo !== undefined ? Boolean(body.activo) : usuarios[index].activo,
    roles: body.roles ?? usuarios[index].roles,
    foto: body.foto ?? usuarios[index].foto,
  };
  saveStore('usuarios');
  const copy = { ...usuarios[index] };
  delete (copy as Partial<UsuarioItem>).clave;
  res.json(copy);
});

app.delete('/api/usuarios/eliminar/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const initialLen = usuarios.length;
  usuarios = usuarios.filter(u => u.id !== id);
  if (usuarios.length < initialLen) {
    saveStore('usuarios');
    return res.json(true);
  }
  res.json(false);
});

// MONEDAS
app.get('/api/monedas/listar', (_req, res) => {
  res.json(monedas);
});

app.get('/api/monedas/obtener/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const moneda = monedas.find(m => m.id === id);
  if (!moneda) return res.status(404).json(null);
  res.json(moneda);
});

app.get('/api/monedas/buscar/:nombre', (req, res) => {
  const term = (req.params.nombre || '').toLowerCase();
  const matched = monedas.filter(
    m => m.nombre.toLowerCase().includes(term) || m.sigla.toLowerCase().includes(term)
  );
  res.json(matched);
});

app.get('/api/monedas/buscarporpais/:nombre', (req, res) => {
  const term = (req.params.nombre || '').toLowerCase();
  const foundCountry = paises.find(p => p.nombre.toLowerCase().includes(term));
  if (!foundCountry) return res.status(404).json(null);
  const moneda = monedas.find(m => m.id === foundCountry.idMoneda);
  res.json(moneda || null);
});

app.post('/api/monedas/agregar', (req, res) => {
  const body = req.body;
  const newId = monedas.length > 0 ? Math.max(...monedas.map(m => m.id)) + 1 : 1;
  const newMoneda: MonedaItem = {
    id: newId,
    sigla: (body.sigla || 'NUE').toUpperCase(),
    nombre: body.nombre || 'Nueva Moneda',
    simbolo: body.simbolo || '',
    emisor: body.emisor || '',
    imagen: body.imagen || '',
  };
  monedas.push(newMoneda);
  saveStore('monedas');
  res.json(newMoneda);
});

app.put('/api/monedas/modificar', (req, res) => {
  const body = req.body;
  const id = parseInt(body.id, 10);
  const index = monedas.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json(null);

  monedas[index] = {
    ...monedas[index],
    sigla: body.sigla ? body.sigla.toUpperCase() : monedas[index].sigla,
    nombre: body.nombre ?? monedas[index].nombre,
    simbolo: body.simbolo ?? monedas[index].simbolo,
    emisor: body.emisor ?? monedas[index].emisor,
    imagen: body.imagen ?? monedas[index].imagen,
  };
  saveStore('monedas');
  res.json(monedas[index]);
});

app.delete('/api/monedas/eliminar/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const initialLen = monedas.length;
  monedas = monedas.filter(m => m.id !== id);
  if (monedas.length < initialLen) {
    saveStore('monedas');
    return res.json(true);
  }
  res.json(false);
});

// LISTAR POR PERIODO (Supports GET with query/body and POST with body)
function handleListarPorPeriodo(req: express.Request, res: express.Response) {
  const idMoneda = parseInt(
    (req.query.idMoneda as string) || (req.body?.idMoneda as string) || (req.query.id as string) || '0',
    10
  );
  const desdeStr = (req.query.desde as string) || req.body?.desde || '';
  const hastaStr = (req.query.hasta as string) || req.body?.hasta || '';

  if (!idMoneda) {
    return res.status(400).json({ error: 'idMoneda es requerido' });
  }

  const desdeTimestamp = desdeStr ? parseDateVal(desdeStr) : 0;
  const hastaTimestamp = hastaStr ? parseDateVal(hastaStr) : Number.MAX_SAFE_INTEGER;

  const results = cambios
    .filter(c => {
      if (c.idMoneda !== idMoneda) return false;
      const cTime = parseDateVal(c.fecha);
      if (desdeTimestamp && cTime < desdeTimestamp) return false;
      if (hastaTimestamp && cTime > hastaTimestamp) return false;
      return true;
    })
    .sort((a, b) => parseDateVal(a.fecha) - parseDateVal(b.fecha));

  res.json(results);
}

app.get('/api/monedas/listarporperiodo', handleListarPorPeriodo);
app.post('/api/monedas/listarporperiodo', handleListarPorPeriodo);

// ANALIZAR INVERSION DOLAR (Ported directly from MonedaServicio.java)
function handleAnalisisInversion(req: express.Request, res: express.Response) {
  const sigla = ((req.query.sigla as string) || req.body?.sigla || req.body?.siglaMoneda || '').toUpperCase();
  const idMoneda = parseInt(
    (req.query.idMoneda as string) || (req.body?.idMoneda as string) || '0',
    10
  );
  const desdeStr = (req.query.desde as string) || req.body?.desde || '';
  const hastaStr = (req.query.hasta as string) || req.body?.hasta || '';
  const umbral = parseFloat((req.query.umbral as string) || req.body?.umbral || '1.0');

  let targetMoneda: MonedaItem | undefined;
  if (idMoneda) {
    targetMoneda = monedas.find(m => m.id === idMoneda);
  } else if (sigla) {
    targetMoneda = monedas.find(m => m.sigla.toUpperCase() === sigla);
  } else {
    targetMoneda = monedas.find(m => m.id === 35); // Default to COP
  }

  if (!targetMoneda) {
    return res.status(404).json({ error: `Moneda con sigla '${sigla}' no encontrada.` });
  }

  const desdeTimestamp = desdeStr ? parseDateVal(desdeStr) : 0;
  const hastaTimestamp = hastaStr ? parseDateVal(hastaStr) : Number.MAX_SAFE_INTEGER;

  const hist = cambios
    .filter(c => {
      if (c.idMoneda !== targetMoneda!.id) return false;
      const cTime = parseDateVal(c.fecha);
      if (desdeTimestamp && cTime < desdeTimestamp) return false;
      if (hastaTimestamp && cTime > hastaTimestamp) return false;
      return true;
    })
    .sort((a, b) => parseDateVal(a.fecha) - parseDateVal(b.fecha));

  if (hist.length === 0) {
    return res.status(400).json({ error: 'No hay datos de cambio disponibles para ese período.' });
  }

  const resultados: Array<{
    siglaMonedaA: string;
    siglaMonedaB: string;
    fechaInicio: string;
    fechaFin: string;
    cambioMonedaAInicio: number;
    cambioMonedaAFin: number;
    recomendacion: string;
    variacionPorcentaje: number;
  }> = [];

  let tendenciaActual: string | null = null;
  let fechaInicio: string | null = null;
  let cambioInicio = 0;

  for (let i = 1; i < hist.length; i++) {
    const anterior = hist[i - 1];
    const actual = hist[i];
    const variacionPorcentaje = Math.abs(((actual.cambio - anterior.cambio) / anterior.cambio) * 100);

    const nuevaTendencia: string = variacionPorcentaje >= umbral
      ? (actual.cambio > anterior.cambio ? 'Vender USD' : 'Comprar USD')
      : (tendenciaActual ?? 'Mantener');

    if (nuevaTendencia !== tendenciaActual) {
      if (tendenciaActual !== null && fechaInicio !== null) {
        resultados.push({
          siglaMonedaA: targetMoneda.sigla,
          siglaMonedaB: 'USD',
          fechaInicio: fechaInicio,
          fechaFin: anterior.fecha,
          cambioMonedaAInicio: cambioInicio,
          cambioMonedaAFin: anterior.cambio,
          recomendacion: tendenciaActual,
          variacionPorcentaje: Math.round(Math.abs(((anterior.cambio - cambioInicio) / cambioInicio) * 100) * 100) / 100,
        });
      }
      fechaInicio = anterior.fecha;
      cambioInicio = anterior.cambio;
      tendenciaActual = nuevaTendencia;
    }
  }

  const ultimo = hist[hist.length - 1];
  if (fechaInicio !== null) {
    resultados.push({
      siglaMonedaA: targetMoneda.sigla,
      siglaMonedaB: 'USD',
      fechaInicio: fechaInicio,
      fechaFin: ultimo.fecha,
      cambioMonedaAInicio: cambioInicio,
      cambioMonedaAFin: ultimo.cambio,
      recomendacion: tendenciaActual || 'Mantener',
      variacionPorcentaje: Math.round(Math.abs(((ultimo.cambio - cambioInicio) / cambioInicio) * 100) * 100) / 100,
    });
  }

  res.json({
    moneda: targetMoneda,
    totalPuntos: hist.length,
    umbral,
    cambioActual: ultimo.cambio,
    fechaActual: ultimo.fecha,
    analisis: resultados,
  });
}

app.get('/api/monedas/analizarinversion', handleAnalisisInversion);
app.post('/api/monedas/analizarinversion', handleAnalisisInversion);

// CONVERSOR DE MONEDAS
app.post('/api/monedas/convertir', (req, res) => {
  const { monto, idMonedaOrigen, idMonedaDestino, fecha } = req.body;
  const val = parseFloat(monto) || 0;
  const mOrigen = monedas.find(m => m.id === parseInt(idMonedaOrigen, 10));
  const mDestino = monedas.find(m => m.id === parseInt(idMonedaDestino, 10));

  if (!mOrigen || !mDestino) {
    return res.status(400).json({ error: 'Monedas de origen o destino no válidas.' });
  }

  // Tasa respecto a USD (todas las tasas en CambioMoneda son relativas a USD)
  // Si moneda es USD (sigla USD), su tasa es 1.
  const getRate = (idM: number): { rate: number; date: string } => {
    const m = monedas.find(x => x.id === idM);
    if (m?.sigla === 'USD') return { rate: 1, date: 'Actual' };
    const rates = cambios.filter(c => c.idMoneda === idM);
    if (rates.length === 0) return { rate: 1, date: 'N/A' };
    if (fecha) {
      const match = rates.find(c => c.fecha === fecha);
      if (match) return { rate: match.cambio, date: match.fecha };
    }
    // Return latest rate
    const latest = rates[rates.length - 1];
    return { rate: latest.cambio, date: latest.fecha };
  };

  const origenRate = getRate(mOrigen.id);
  const destinoRate = getRate(mDestino.id);

  // Conversion: (monto in Origen / origenRate) * destinoRate
  // e.g. 100 COP -> USD: 100 / 2000 = 0.05 USD
  // 100 USD -> COP: (100 / 1) * 2000 = 200,000 COP
  // 100 EUR -> COP: (100 / 0.85) * 2000 = ~235,294 COP
  const inUSD = origenRate.rate !== 0 ? val / origenRate.rate : 0;
  const resultado = inUSD * destinoRate.rate;
  const tasaDirecta = origenRate.rate !== 0 ? destinoRate.rate / origenRate.rate : 1;

  res.json({
    monto: val,
    monedaOrigen: mOrigen,
    monedaDestino: mDestino,
    resultado: Math.round(resultado * 10000) / 10000,
    tasa: Math.round(tasaDirecta * 100000) / 100000,
    fecha: destinoRate.date !== 'N/A' ? destinoRate.date : origenRate.date,
  });
});

// PAISES
app.get('/api/paises/listar', (_req, res) => {
  const result = paises.map(p => ({
    ...p,
    moneda: monedas.find(m => m.id === p.idMoneda) || null,
  }));
  res.json(result);
});

app.get('/api/paises/obtener/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const pais = paises.find(p => p.id === id);
  if (!pais) return res.status(404).json(null);
  res.json({
    ...pais,
    moneda: monedas.find(m => m.id === pais.idMoneda) || null,
  });
});

app.get('/api/paises/buscar/:nombre', (req, res) => {
  const term = (req.params.nombre || '').toLowerCase();
  const matched = paises
    .filter(
      p =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigoAlfa2.toLowerCase().includes(term) ||
        p.codigoAlfa3.toLowerCase().includes(term)
    )
    .map(p => ({
      ...p,
      moneda: monedas.find(m => m.id === p.idMoneda) || null,
    }));
  res.json(matched);
});

app.post('/api/paises/agregar', (req, res) => {
  const body = req.body;
  const newId = paises.length > 0 ? Math.max(...paises.map(p => p.id)) + 1 : 1;
  const newPais: PaisItem = {
    id: newId,
    nombre: body.nombre || 'Nuevo País',
    codigoAlfa2: (body.codigoAlfa2 || 'XX').toUpperCase(),
    codigoAlfa3: (body.codigoAlfa3 || 'XXX').toUpperCase(),
    idMoneda: parseInt(body.idMoneda, 10) || 1,
    mapa: body.mapa || '',
    bandera: body.bandera || '',
  };
  paises.push(newPais);
  saveStore('paises');
  res.json({
    ...newPais,
    moneda: monedas.find(m => m.id === newPais.idMoneda) || null,
  });
});

app.put('/api/paises/modificar', (req, res) => {
  const body = req.body;
  const id = parseInt(body.id, 10);
  const index = paises.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json(null);

  paises[index] = {
    ...paises[index],
    nombre: body.nombre ?? paises[index].nombre,
    codigoAlfa2: body.codigoAlfa2 ? body.codigoAlfa2.toUpperCase() : paises[index].codigoAlfa2,
    codigoAlfa3: body.codigoAlfa3 ? body.codigoAlfa3.toUpperCase() : paises[index].codigoAlfa3,
    idMoneda: body.idMoneda ? parseInt(body.idMoneda, 10) : paises[index].idMoneda,
    mapa: body.mapa ?? paises[index].mapa,
    bandera: body.bandera ?? paises[index].bandera,
  };
  saveStore('paises');
  res.json({
    ...paises[index],
    moneda: monedas.find(m => m.id === paises[index].idMoneda) || null,
  });
});

app.delete('/api/paises/eliminar/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const initialLen = paises.length;
  paises = paises.filter(p => p.id !== id);
  if (paises.length < initialLen) {
    saveStore('paises');
    return res.json(true);
  }
  res.json(false);
});

// -------------------------------------------------------------
// LIVE REAL-TIME EXCHANGE RATE SYNCHRONIZATION
// -------------------------------------------------------------
interface SyncStatus {
  ultimaSincronizacion: string | null;
  proveedor: string;
  registrosActualizados: number;
  fechaTasaUtc: string | null;
  tasasMuestra: Record<string, number>;
  exito: boolean;
  mensaje: string;
}

let syncStatus: SyncStatus = {
  ultimaSincronizacion: null,
  proveedor: 'ExchangeRate-API (open.er-api.com)',
  registrosActualizados: 0,
  fechaTasaUtc: null,
  tasasMuestra: {},
  exito: false,
  mensaje: 'Aún no se ha ejecutado sincronización en vivo',
};

async function sincronizarTasasEnVivo(): Promise<SyncStatus> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) {
      throw new Error(`Error en API externa: HTTP ${res.status}`);
    }
    const data: any = await res.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Respuesta no válida del proveedor de tasas');
    }

    // Determine target date in YYYY-MM-DD format
    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    let updatedCount = 0;
    let nextId = cambios.length > 0 ? Math.max(...cambios.map(c => c.id)) + 1 : 1;
    const sample: Record<string, number> = {};

    for (const moneda of monedas) {
      const rate = data.rates[moneda.sigla];
      if (typeof rate === 'number' && rate > 0) {
        const existing = cambios.find(c => c.idMoneda === moneda.id && c.fecha === todayStr);
        if (existing) {
          existing.cambio = rate;
        } else {
          cambios.push({
            id: nextId++,
            idMoneda: moneda.id,
            fecha: todayStr,
            cambio: rate,
          });
        }
        updatedCount++;
        if (['COP', 'EUR', 'BRL', 'CNY', 'GBP', 'JPY', 'CAD', 'MXN'].includes(moneda.sigla)) {
          sample[moneda.sigla] = rate;
        }
      }
    }

    saveStore('cambios');

    syncStatus = {
      ultimaSincronizacion: new Date().toISOString(),
      proveedor: 'ExchangeRate-API (open.er-api.com)',
      registrosActualizados: updatedCount,
      fechaTasaUtc: data.time_last_update_utc || todayStr,
      tasasMuestra: sample,
      exito: true,
      mensaje: `Sincronización exitosa: ${updatedCount} monedas actualizadas al día ${todayStr}`,
    };

    console.log(`[Sync Real-Time] Updated ${updatedCount} currencies for ${todayStr}. COP=${sample.COP}, EUR=${sample.EUR}`);
    return syncStatus;
  } catch (err: any) {
    console.error('[Sync Error]:', err);
    syncStatus = {
      ...syncStatus,
      exito: false,
      mensaje: `Error al sincronizar: ${err.message}`,
    };
    return syncStatus;
  }
}

app.post('/api/sincronizar-en-vivo', async (_req, res) => {
  const status = await sincronizarTasasEnVivo();
  res.json(status);
});

app.get('/api/estado-sincronizacion', (_req, res) => {
  res.json(syncStatus);
});

// STATS / SYSTEM INFO
app.get('/api/stats', (_req, res) => {
  const currencyWithRates = [...new Set(cambios.map(c => c.idMoneda))].length;
  res.json({
    totalMonedas: monedas.length,
    totalPaises: paises.length,
    totalUsuarios: usuarios.length,
    totalRegistrosCambio: cambios.length,
    monedasConHistorial: currencyWithRates,
    usuarioDemo: {
      usuario: 'frayosorio',
      clave: '123',
    },
    rangoFechasHistorico: {
      inicio: '2010-01-01',
      fin: '2026-09-21',
    },
    sincronizacion: syncStatus,
  });
});

// START SERVER
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    // Auto-sync initial real-time exchange rates on startup
    sincronizarTasasEnVivo().catch(err => console.error('Initial auto-sync error:', err));
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
