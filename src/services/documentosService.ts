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
  razonSocial: string
  estado: string
  direccion?: string
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

export interface EmpresaOption {
  codigo: string
  nombre: string
}

export interface TipoDocumentoOption {
  codigo: string
  descripcion: string
}

export const documentosService = {
  // Consultar documento electrónico (público)
  consultarDocumento: async (request: ConsultaDocumentoRequest): Promise<ApiResponse<DocumentoElectronico[]>> => {
    const response = await publicApi.post<ApiResponse<DocumentoElectronico[]>>('/consulta-documento', request)
    return response.data
  },

  // Consultar contribuyente por RUC (público)
  consultarContribuyente: async (ruc: string): Promise<ApiResponse<ContribuyenteResponse>> => {
    const response = await publicApi.get<ApiResponse<ContribuyenteResponse>>(`/contribuyente/${ruc}`)
    return response.data
  },

  // Obtener empresas disponibles (público)
  getEmpresas: async (): Promise<ApiResponse<EmpresaOption[]>> => {
    const response = await publicApi.get<ApiResponse<EmpresaOption[]>>('/empresas')
    return response.data
  },

  // Obtener tipos de documento (público)
  getTiposDocumento: async (): Promise<ApiResponse<TipoDocumentoOption[]>> => {
    const response = await publicApi.get<ApiResponse<TipoDocumentoOption[]>>('/tipos-documento')
    return response.data
  },
}
