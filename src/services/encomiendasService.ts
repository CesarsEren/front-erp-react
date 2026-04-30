import api from './api'
import { ApiResponse, PageEncomienda } from '@/types'

export const encomiendasService = {
  // Angular: GET /encomiendas?page=X&size=X&ID=X
  getEncomiendas: async (
    page: number,
    size: number,
    idManifiesto: number
  ): Promise<ApiResponse<PageEncomienda>> => {
    const response = await api.get<ApiResponse<PageEncomienda>>('/encomiendas', {
      params: { page, size, ID: idManifiesto },
    })
    return response.data
  },
}
