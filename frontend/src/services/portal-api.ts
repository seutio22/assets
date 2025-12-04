import axios from 'axios'

const portalApi = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token do portal
portalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('portal_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação
portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não fazer logout automático no endpoint /me durante a verificação inicial
    // O PortalAuthContext já trata isso
    if (error.response?.status === 401 && !error.config?.url?.includes('/me')) {
      localStorage.removeItem('portal_token')
      // Só redirecionar se não estiver já na página de login
      if (window.location.pathname !== '/portal/login') {
        window.location.href = '/portal/login'
      }
    }
    return Promise.reject(error)
  }
)

export { portalApi }

