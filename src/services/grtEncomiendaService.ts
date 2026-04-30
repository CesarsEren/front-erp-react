import api from './api'
import { ApiResponse, GrtEncomiendaDto } from '@/types'

export const grtEncomiendaService = {
  // Angular: GET /report?fechaInicio=X&fechaFin=X&encomienda=X&grt=X&agencia=X
  getGrtEncomiendas: async (
    fechaInicio: string,
    fechaFin: string,
    nroEncomienda?: string | null,
    nroGuia?: string | null,
    agencia?: string | null
  ): Promise<ApiResponse<GrtEncomiendaDto[]>> => {
    const params: Record<string, string> = {
      fechaInicio,
      fechaFin,
    }
    // Angular usa 'encomienda' no 'nroEncomienda'
    if (nroEncomienda !== null && nroEncomienda !== undefined) {
      params['encomienda'] = nroEncomienda.toString()
    }
    // Angular usa 'grt' no 'nroGuia'
    if (nroGuia !== null && nroGuia !== undefined && nroGuia.trim() !== '') {
      params['grt'] = nroGuia
    }
    if (agencia !== null && agencia !== undefined && agencia.trim() !== '') {
      params['agencia'] = agencia
    }

    const response = await api.get<ApiResponse<GrtEncomiendaDto[]>>('/report', { params })
    return response.data
  },

  anularGrt: async (nroGuia: number, motivoAnulado: string): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/sunat-administrativos/anular/grt', {
      nroGuia,
      motivoAnulado,
    })
    return response.data
  },
}
