import api from './api'
import { ApiResponse, Agencia } from '@/types'

export const agenciasService = {
  getAgencias: async (): Promise<ApiResponse<Agencia[]>> => {
    const response = await api.get<ApiResponse<Agencia[]>>('/agencias')
    return response.data
  },
}
