// URL del backend Spring Boot (BankingSystem). Se puede cambiar con VITE_API_URL en un archivo .env
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

async function request(method, path, body) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.')
  }
  return data
}

export function registrarCuenta(account) {
  return request('POST', '/registro', account)
}

export function iniciarSesion(username, password) {
  return request('POST', '/login', { username, password })
}

// devuelve la cuenta con el celular y el correo actualizados
export function actualizarContacto(username, phone, email) {
  return request('PUT', '/perfil/contacto', { username, phone, email })
}

export function cambiarClave(username, currentPassword, newPassword) {
  return request('PUT', '/perfil/clave', { username, currentPassword, newPassword })
}
