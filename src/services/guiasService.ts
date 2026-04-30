import api from './api'
import { ApiResponse, PageGrtGeneradas, RequestFile } from '@/types'

export const guiasService = {
  // Angular: GET /manifiestos/guiagenerado?page=X&size=X&nrocierremanifiesto=X
  getGuiasRemisionEnlazadas: async (
    page: number,
    size: number,
    idmanifiesto: number
  ): Promise<ApiResponse<PageGrtGeneradas>> => {
    const response = await api.get<ApiResponse<PageGrtGeneradas>>('/manifiestos/guiagenerado', {
      params: { page, size, nrocierremanifiesto: idmanifiesto },
    })
    return response.data
  },

  // Angular: POST /download-grt/{ruta} con body RequestFile
  downloadLink: async (rqFile: RequestFile, ruta: string): Promise<Blob> => {
    const response = await api.post(`/download-grt/${ruta}`, rqFile, {
      responseType: 'blob',
    })
    return response.data
  },

  // Angular: POST /download-grt/all-pdfs con body { idManifiesto: number }
  getGuiaRemisionEnlazadasPdf: async (idmanifiesto: number): Promise<Blob> => {
    const response = await api.post(
      '/download-grt/all-pdfs',
      { idManifiesto: idmanifiesto },
      { responseType: 'blob' }
    )
    return response.data
  },
}
