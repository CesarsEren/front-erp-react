import api from './api'
import { ApiResponse, ProgramacionDto } from '@/types'

export const programacionService = {
  // Angular: GET /programacion?ID=X
  getConductores: async (idManifiesto: number): Promise<ApiResponse<ProgramacionDto>> => {
    const response = await api.get<ApiResponse<ProgramacionDto>>('/programacion', {
      params: { ID: idManifiesto },
    })
    return response.data
  },
}
