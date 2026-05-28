import axios from 'axios'
import { environment } from '@/config/environment'
import { ApiResponse } from '@/types'

// API pública sin autenticación
const publicApi = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ConsultaDocumentoRequest {
  fecha: string
  empresa: string
  serie: string
  numero: string
  tipoDocumento: string
  ruc?: string
  monto?: number
}

export interface ContribuyenteResponse {
  ruc: string
  razon: string
}

export interface DocumentoItem {
  numeroOrden: number
  cantidad: number
  descripcion: string
  unidadMedida: string
  precioUnitario: number
  valorVenta: number
  igv: number
  total: number
}

export interface DocumentoDatos {
  tipoDocumento: string
  tipoDocumentoD: string
  serie: string
  numero: string
  documentoElectronico: string
  fechaEmision: string
  fechaEmisionD: string
  rucCliente: string
  razonCliente: string
  total: number
  totalSinIGV: number
  igv: number
  montoLetras: string
  moneda: string
  simboloMoneda: string
  items: DocumentoItem[]
  codigoHash: string
  tipoDocumentoCliente: string
  numeroDocumentoCliente: string
}

export interface DocumentoElectronico {
  fechaEmision: string
  documento: string
  agencia: string
  ruc: string
  razon: string
  monto: number
  linkXml: string
  linkCdr: string
  linkPdf: string
}

export interface GenerarPdfRequest {
  fecha: string
  empresa: string
  serie: string
  numero: string
  tipoDocumento: string
  ruc?: string
  razon?: string
  monto?: number
  formato?: 'A4' | 'TICKET'
}

export const documentosService = {
  // Consultar contribuyente por RUC (público)
  consultarContribuyente: async (ruc: string): Promise<ContribuyenteResponse> => {
    const response = await publicApi.get<ContribuyenteResponse>(`/consulta-documento/contribuyente`, {
      params: { ruc }
    })
    return response.data
  },

  // Obtener datos del documento (público)
  obtenerDatosDocumento: async (params: ConsultaDocumentoRequest): Promise<DocumentoDatos> => {
    const response = await publicApi.get<DocumentoDatos>('/consulta-documento/datos', {
      params
    })
    return response.data
  },

  // Generar PDF usando GET
  generarPdfGet: async (params: GenerarPdfRequest): Promise<Blob> => {
    const response = await publicApi.get('/consulta-documento/generar-pdf', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Generar PDF usando POST
  generarPdfPost: async (request: GenerarPdfRequest): Promise<Blob> => {
    const response = await publicApi.post('/consulta-documento/generar-pdf', request, {
      responseType: 'blob'
    })
    return response.data
  },

  // Consultar documento electrónico (mantener compatibilidad con código existente)
  consultarDocumento: async (request: ConsultaDocumentoRequest): Promise<ApiResponse<DocumentoElectronico[]>> => {
    const response = await publicApi.post<ApiResponse<DocumentoElectronico[]>>('/consulta-documento', request)
    return response.data
  },
}
