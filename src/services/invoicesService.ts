import api from './api'
import { ApiResponse, PageInvoices, RequestFileInvoice } from '@/types'

export const invoicesService = {
  getInvoices: async (
    page: number,
    size: number,
    tipo: string[],
    fecha: string,
    generado: boolean
  ): Promise<ApiResponse<PageInvoices>> => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('size', size.toString())
    params.append('generado', generado.toString())
    params.append('fecha', fecha)
    tipo.forEach((t) => params.append('tipo', t))

    const response = await api.get<ApiResponse<PageInvoices>>('/invoices', { params })
    return response.data
  },

  // PDF a demanda (A4 o Ticket) armado por back-erp con su plantilla: GET /api/pdf/generar/v2
  generarPdf: async (params: {
    fecha: string
    empresa: string
    serie: string
    numero: number
    tipoDocumento: string
    tipoServicio: string
    formato: 'A4' | 'TICKET'
  }): Promise<Blob> => {
    const response = await api.get('/api/pdf/generar/v2', { params, responseType: 'blob' })
    return response.data
  },

  downloadLink: async (rqFile: RequestFileInvoice, ruta: string): Promise<Blob> => {
    const response = await api.post(`/download-invoice/${ruta}`, rqFile, {
      responseType: 'blob',
    })
    return response.data
  },
}
