import axios from 'axios'

// Em produção, usar a URL do backend
// Em desenvolvimento, usar proxy local
// URL do backend atual (produção) - Railway
const BACKEND_URL = 'https://amusing-flexibility-production.up.railway.app/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? BACKEND_URL
    : '/api/v1')

// Log para debug (apenas em produção para verificar qual URL está sendo usada)
if (import.meta.env.PROD) {
  console.log('[API] Backend URL configurada:', API_URL)
  console.log('[API] VITE_API_URL:', import.meta.env.VITE_API_URL || 'não configurada')
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

