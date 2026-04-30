import api from './api'
import { ApiResponse, SolicitudGrt, SolicitudGrtIndividual, ResponseGrt } from '@/types'

export const solicitudGrtService = {
  // Angular: POST /solicitudgrt con body Solicitudgrt { idManifiesto: number }
  postSolicitud: async (solicitud: SolicitudGrt): Promise<ApiResponse<ResponseGrt>> => {
    const response = await api.post<ApiResponse<ResponseGrt>>('/solicitudgrt', solicitud)
    return response.data
  },

  // Angular: POST /generar-grt-individual con body SolicitudgrtIndividual
  postGenerarGrtIndividual: async (solicitud: SolicitudGrtIndividual): Promise<ApiResponse<ResponseGrt>> => {
    const response = await api.post<ApiResponse<ResponseGrt>>('/generar-grt-individual', solicitud)
    return response.data
  },
}
