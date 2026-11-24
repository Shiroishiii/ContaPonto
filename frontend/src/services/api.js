const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3333/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (handler) => { onUnauthorized = handler }

export async function request(path, { method = 'GET', body, token, signal } = {}) {
  let response
  try {
    response = await fetch(`${baseURL}${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      signal,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend está disponível.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const messages = {
      400: 'Dados inválidos.', 401: 'Sua sessão expirou ou suas credenciais são inválidas.',
      403: 'Você não tem permissão para esta ação.', 404: 'O recurso solicitado não foi encontrado.',
      409: 'Há um conflito com os dados existentes.', 500: 'Erro interno do servidor.',
    }
    const error = new ApiError(response.status, payload.message || messages[response.status] || 'Não foi possível concluir a solicitação.', payload.errors)
    if (response.status === 401 && token) onUnauthorized(error)
    throw error
  }
  return payload.data ?? payload
}

export const get = (path, token, options) => request(path, { ...options, token })
export const post = (path, body, token) => request(path, { method: 'POST', body, token })
export const put = (path, body, token) => request(path, { method: 'PUT', body, token })
export const patch = (path, body, token) => request(path, { method: 'PATCH', body, token })
