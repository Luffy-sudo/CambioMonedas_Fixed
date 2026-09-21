export interface Moneda {
  id: number;
  sigla: string;
  nombre: string;
  simbolo?: string;
  emisor?: string;
  imagen?: string;
}

export interface Pais {
  id: number;
  nombre: string;
  codigoAlfa2: string;
  codigoAlfa3: string;
  idMoneda: number;
  moneda?: Moneda;
  mapa?: string;
  bandera?: string;
}

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  clave: string;
  activo: boolean;
  foto?: string;
  roles?: string;
}

export interface UsuarioLoginDto {
  usuario: Usuario | null;
  token: string;
}

export interface CambioMoneda {
  id: number;
  idMoneda: number;
  fecha: string; // YYYY-MM-DD
  cambio: number;
}

export interface PeriodoDto {
  idMoneda: number;
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

export interface AnalisisInversionDTO {
  siglaMonedaA: string;
  siglaMonedaB: string;
  fechaInicio: string;
  fechaFin: string;
  cambioMonedaAInicio: number;
  cambioMonedaAFin: number;
  recomendacion: string; // 'Comprar USD' | 'Vender USD' | 'Sin cambio' | 'Mantener'
  variacionPorcentaje: number;
}

export interface ConversionDto {
  monto: number;
  idMonedaOrigen: number;
  idMonedaDestino: number;
  fecha?: string;
}

export interface ConversionResult {
  monto: number;
  monedaOrigen: Moneda;
  monedaDestino: Moneda;
  resultado: number;
  tasa: number;
  fecha: string;
}

export interface SyncStatus {
  ultimaSincronizacion: string | null;
  proveedor: string;
  registrosActualizados: number;
  fechaTasaUtc: string | null;
  tasasMuestra: Record<string, number>;
  exito: boolean;
  mensaje: string;
}

