import api from './api'
import { ApiResponse, SolicitudInvoiceIndividual, SolicitudAllInvoicesDto } from '@/types'

export const solicitudInvoiceService = {
  // Angular: POST /generar-invoice-individual con body SolicitudInvoiceIndividual
  postGenerarInvoiceIndividual: async (solicitud: SolicitudInvoiceIndividual): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/generar-invoice-individual', solicitud)
    return response.data
  },

  // Angular: POST /generar-invoices con body SolicitudAllInvoicesDto
  postGenerarInvoiceMasiva: async (solicitud: SolicitudAllInvoicesDto): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/generar-invoices', solicitud)
    return response.data
  },
}
