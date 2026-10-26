import api from './api'
import { ApiResponse, PageInvoiceSunat, RequestFileInvoice, RequestAllGuia } from '@/types'

export const invoicesStateService = {
  // Angular: GET /sunat-tributarios/state/invoices?page=X&size=X&fecha=X&estado=X
  getInvoicesState: async (
    page: number,
    size: number,
    fecha: string,
    estado: number
  ): Promise<ApiResponse<PageInvoiceSunat>> => {
    const response = await api.get<ApiResponse<PageInvoiceSunat>>('/sunat-tributarios/state/invoices', {
      params: { page, size, fecha, estado },
    })
    return response.data
  },

  // Angular: POST /sunat-tributarios/send/invoice con body RequestFileInvoice
  sendInvoice: async (rqFile: RequestFileInvoice): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-tributarios/send/invoice', rqFile)
    return response.data
  },

  // Angular: POST /sunat-tributarios/send/invoice/all con body RequestAllGuia
  sendAllCpes: async (request: RequestAllGuia): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-tributarios/send/invoice/all', request)
    return response.data
  },

  // POST /sunat-tributarios/quitar-cola: deja el comprobante "Por verificar" (sin respuesta clara de SUNAT)
  quitarDeCola: async (rqFile: RequestFileInvoice): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-tributarios/quitar-cola', rqFile)
    return response.data
  },

  // Angular: POST /sunat-tributarios/state/grt/back con body RequestAllGuia
  volverAEstadoPorEnviar: async (request: RequestAllGuia): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-tributarios/state/grt/back', request)
    return response.data
  },
}
