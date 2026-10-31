// Modo base de datos: llama al backend Spring Boot (BankingSystem), que guarda en MySQL (dbbankingsystem).
// Se puede cambiar la URL con VITE_API_URL en un archivo .env
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

// Todas las operaciones devuelven el usuario completo actualizado
// (bankAccounts con saldos y movimientos, y creditCard o null).

// Abre otra cuenta: máximo una de ahorros (AH) y una corriente (CC)
export function abrirCuenta(username, accountType, balance) {
  return request('POST', '/cuentas', { username, accountType, balance })
}

// Titular de una cuenta MiPlata: { fullName, username, accountType, accountNumber }
export function buscarCuentaDestino(accountNumber) {
  return request('GET', `/cuentas/destino?numero=${encodeURIComponent(accountNumber)}`)
}

export function buscarDestinoPorCelular(phone) {
  return request('GET', `/cuentas/destino-celular?celular=${encodeURIComponent(phone)}`)
}

export function consignar(username, accountNumber, amount) {
  return request('POST', '/movimientos/consignar', { username, accountNumber, amount })
}

export function retirar(username, accountNumber, amount) {
  return request('POST', '/movimientos/retirar', { username, accountNumber, amount })
}

// recipient: { destinationType: 'phone' | 'AH' | 'CC', bank (MiPlata, otro banco o billetera), destination }
export function transferir(username, fromAccountNumber, recipient, amount) {
  return request('POST', '/movimientos/transferir', {
    username,
    fromAccountNumber,
    amount,
    destinationType: recipient.destinationType,
    bank: recipient.bank ?? 'MiPlata',
    destination: recipient.destination,
  })
}

export function solicitarTarjeta(username, accountNumber, limit) {
  return request('POST', '/tarjeta/solicitar', { username, accountNumber, limit })
}

export function comprarConTarjeta(username, merchant, amount, installments) {
  return request('POST', '/tarjeta/compra', { username, merchant, amount, installments })
}

export function pagarTarjeta(username, fromAccountNumber, amount) {
  return request('POST', '/tarjeta/pago', { username, fromAccountNumber, amount })
}

export function bloquearTarjeta(username) {
  return request('PUT', '/tarjeta/bloquear', { username })
}

export function cancelarTarjeta(username) {
  return request('POST', '/tarjeta/cancelar', { username })
}
