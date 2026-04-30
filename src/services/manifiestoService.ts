import api from './api'
import { ApiResponse, PageManifiesto } from '@/types'

export const manifiestoService = {
  getManifiestos: async (
    page: number,
    size: number,
    agencia: string,
    fecha: string
  ): Promise<ApiResponse<PageManifiesto>> => {
    const response = await api.get<ApiResponse<PageManifiesto>>('/manifiestos', {
      params: { page, size, agencia, fecha },
    })
    return response.data
  },
}
