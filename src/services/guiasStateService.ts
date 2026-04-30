import api from './api'
import { ApiResponse, PageGrtSunat, RequestFile, RequestAllGuia } from '@/types'

export const guiasStateService = {
  // Angular: GET /sunat-administrativos/state/grts?page=X&size=X&fecha=X&estado=X
  getGuiasRemisionEnlazadas: async (
    page: number,
    size: number,
    fecha: string,
    estado: number
  ): Promise<ApiResponse<PageGrtSunat>> => {
    const response = await api.get<ApiResponse<PageGrtSunat>>('/sunat-administrativos/state/grts', {
      params: { page, size, fecha, estado },
    })
    return response.data
  },

  // Angular: POST /sunat-administrativos/send/grt con body RequestFile
  sendGuia: async (rqFile: RequestFile): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-administrativos/send/grt', rqFile)
    return response.data
  },

  // Angular: POST /sunat-administrativos/send/grt/all con body RequestAllGuia
  sendAllGuia: async (request: RequestAllGuia): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-administrativos/send/grt/all', request)
    return response.data
  },

  // Angular: POST /sunat-administrativos/state/grt/back con body RequestAllGuia
  volverAEstadoPorEnviar: async (request: RequestAllGuia): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/sunat-administrativos/state/grt/back', request)
    return response.data
  },
}
