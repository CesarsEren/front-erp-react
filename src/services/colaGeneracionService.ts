import api from './api'
import { ApiResponse, RequestFileInvoice, SolicitudGeneracionDto } from '@/types'

export const colaGeneracionService = {
  // GET /cola-generacion: solicitudes de generación de XML que siguen abiertas
  listar: async (): Promise<ApiResponse<SolicitudGeneracionDto[]>> => {
    const response = await api.get<ApiResponse<SolicitudGeneracionDto[]>>('/cola-generacion')
    return response.data
  },

  // POST /cola-generacion/regenerar: vuelve a generar el XML de un comprobante no aceptado
  // y lo deja "Por enviar". Datos de Búsqueda de Comprobantes (tipoServicio E/C).
  regenerar: async (rqFile: RequestFileInvoice): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/cola-generacion/regenerar', rqFile)
    return response.data
  },

  // POST /cola-generacion/quitar: el scheduler deja de regenerarla (no toca el XML ya generado)
  quitar: async (tipoDocumento: string, nro: number): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/cola-generacion/quitar', {
      nroInvoice: nro,
      tipoDocumento,
    })
    return response.data
  },
}
