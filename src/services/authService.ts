import api from './api'
import { ApiResponse, Token } from '@/types'

export const authService = {
  login: async (username: string, password: string): Promise<ApiResponse<Token>> => {
    const response = await api.post<ApiResponse<Token>>('/credenciales', {
      in_usuario: username,
      in_clave: password,
    })
    
    if (response.data.out_estado === 200) {
      const token = response.data.out_data as Token
      localStorage.setItem('loginData', JSON.stringify(response.data.out_data))
      localStorage.setItem('bearer', token.out_token)
    }
    
    return response.data
  },

  logout: () => {
    localStorage.clear()
  },

  getToken: (): string | null => {
    return localStorage.getItem('bearer')
  },

  getLoginData: (): Token | null => {
    const data = localStorage.getItem('loginData')
    return data ? JSON.parse(data) : null
  },

  isLoggedIn: (): boolean => {
    const token = localStorage.getItem('bearer')
    if (!token) return false
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000
      return Date.now() < exp
    } catch {
      return false
    }
  },
}
