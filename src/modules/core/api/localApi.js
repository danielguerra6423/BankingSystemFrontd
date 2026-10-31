// Modo local: guarda los usuarios en el localStorage del navegador en lugar del backend.
// Expone las mismas funciones que backendApi.js (registrarCuenta, iniciarSesion,
// actualizarContacto, cambiarClave, abrirCuenta, solicitarTarjeta, cancelarTarjeta), con las mismas reglas y mensajes de error,
// para poder volver a la base de datos cambiando solo USE_LOCAL_STORAGE en api.js.

import { ACCOUNT_TYPE_NAMES, withBankAccounts } from '../../accounts/bankAccounts.js'
import { CARD_LIMIT_MAX, CARD_LIMIT_MIN } from '../../credit-card/creditCard.js'

const USERS_KEY = 'miplata-users'
const MAX_INTENTOS = 3

// Lista completa de usuarios guardados (incluye clave e intentos fallidos)
export function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY))
    return Array.isArray(users) ? users.map(withBankAccounts) : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    throw new Error('No se pudieron guardar los datos en este navegador.')
  }
}

// Guarda saldo y movimientos de las cuentas que maneja App.jsx (consignar, retirar,
// transferir) y el estado de la tarjeta (compras, pagos, bloqueo).
// No toca clave, correo ni intentos: esos solo los cambia este archivo.
// Las cuentas y tarjetas que App.jsx aún no conoce (recién abiertas) se dejan como están.
export function saveBalances(accounts) {
  const byNumber = new Map(accounts.flatMap((account) => account.bankAccounts.map((bankAccount) => [bankAccount.accountNumber, bankAccount])))
  const cardByNumber = new Map(accounts.filter((account) => account.creditCard).map((account) => [account.creditCard.cardNumber, account.creditCard]))
  writeUsers(readUsers().map((user) => {
    const card = user.creditCard && cardByNumber.get(user.creditCard.cardNumber)
    return {
      ...user,
      bankAccounts: user.bankAccounts.map((bankAccount) => {
        const current = byNumber.get(bankAccount.accountNumber)
        return current ? { ...bankAccount, balance: current.balance, transactions: current.transactions ?? [] } : bankAccount
      }),
      creditCard: card ? { ...user.creditCard, debt: card.debt, active: card.active, transactions: card.transactions ?? [] } : user.creditCard ?? null,
    }
  }))
}

// Datos que ve el resto de la app: lo mismo que devuelve el backend, sin la clave
export function toPublicAccount(user) {
  return {
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    username: user.username,
    bankAccounts: user.bankAccounts,
    creditCard: user.creditCard ?? null,
  }
}

function findUser(users, username) {
  const user = users.find((candidate) => candidate.username === username)
  if (!user) throw new Error('No encontramos el usuario.')
  return user
}

function generateAccountNumber(users) {
  let number
  do {
    number = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000))
  } while (users.some((user) => user.bankAccounts.some((bankAccount) => bankAccount.accountNumber === number)))
  return number
}

// Igual que SPerson.verificarClave: suma intentos fallidos y bloquea al llegar a 3
function verifyPassword(users, user, password, wrongMessage) {
  if (!user.active) {
    throw new Error('Tu cuenta está bloqueada por intentos fallidos. Comunícate con soporte.')
  }
  if (password !== user.password) {
    user.failedAttempts += 1
    if (user.failedAttempts >= MAX_INTENTOS) user.active = false
    writeUsers(users)
    if (!user.active) {
      throw new Error(`Tu cuenta fue bloqueada por ${MAX_INTENTOS} intentos fallidos. Comunícate con soporte.`)
    }
    throw new Error(wrongMessage)
  }
  if (user.failedAttempts !== 0) {
    user.failedAttempts = 0
    writeUsers(users)
  }
}

// Las funciones son async para que las páginas las usen igual que las del backend.
// Las validaciones de formato ya las hacen RegisterPage y DashboardPage antes de llamar.

export async function registrarCuenta(account) {
  const users = readUsers()
  const username = account.username.trim().toLowerCase()
  const documentNumber = account.documentNumber.trim().toUpperCase()
  const email = account.email.trim().toLowerCase()
  const phone = account.phone.trim()

  if (users.some((user) => user.username === username)) {
    throw new Error('Ese nombre de usuario ya está registrado.')
  }
  if (users.some((user) => user.documentNumber === documentNumber)) {
    throw new Error('Ya existe una cuenta con ese número de documento.')
  }
  if (users.some((user) => user.email === email)) {
    throw new Error('Ese correo electrónico ya está registrado.')
  }
  // el celular identifica la cuenta en las transferencias, por eso no se puede repetir
  if (users.some((user) => user.phone === phone)) {
    throw new Error('Ese número de celular ya está registrado.')
  }

  const user = {
    documentType: account.documentType,
    documentNumber,
    phone,
    email,
    fullName: account.fullName.trim().replace(/\s+/g, ' '),
    username,
    password: account.password,
    bankAccounts: [{
      accountType: account.accountType,
      accountNumber: generateAccountNumber(users),
      balance: account.balance,
      transactions: [],
    }],
    active: true,
    failedAttempts: 0,
    createdAt: new Date().toISOString(),
  }
  writeUsers([...users, user])
  return toPublicAccount(user)
}

export async function iniciarSesion(username, password) {
  const users = readUsers()
  const user = users.find((candidate) => candidate.username === username.trim().toLowerCase())
  if (!user) {
    throw new Error('Usuario o contraseña incorrectos. Verifica los datos o crea una cuenta.')
  }
  verifyPassword(users, user, password, 'Usuario o contraseña incorrectos. Verifica los datos o crea una cuenta.')
  return toPublicAccount(user)
}

export async function actualizarContacto(username, phone, email) {
  const users = readUsers()
  const user = findUser(users, username)
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()

  if (users.some((other) => other.email === normalizedEmail && other.username !== user.username)) {
    throw new Error('Ese correo electrónico ya está registrado por otro usuario.')
  }
  if (users.some((other) => other.phone === normalizedPhone && other.username !== user.username)) {
    throw new Error('Ese número de celular ya está registrado por otro usuario.')
  }

  user.phone = normalizedPhone
  user.email = normalizedEmail
  writeUsers(users)
  return toPublicAccount(user)
}

export async function cambiarClave(username, currentPassword, newPassword) {
  const users = readUsers()
  const user = findUser(users, username)

  verifyPassword(users, user, currentPassword, 'La clave actual es incorrecta.')
  if (newPassword === currentPassword) {
    throw new Error('La nueva clave debe ser diferente a la actual.')
  }

  user.password = newPassword
  writeUsers(users)
  return { message: 'Clave actualizada correctamente.' }
}

// Destino de una transferencia MiPlata (igual que GET /api/cuentas/destino del backend)
export async function buscarCuentaDestino(accountNumber) {
  for (const user of readUsers()) {
    const bankAccount = user.bankAccounts.find((candidate) => candidate.accountNumber === accountNumber)
    if (bankAccount) return { fullName: user.fullName, username: user.username, accountType: bankAccount.accountType, accountNumber }
  }
  throw new Error('No encontramos una cuenta MiPlata con ese número.')
}

// Destino por celular: la primera cuenta del usuario (igual que GET /api/cuentas/destino-celular)
export async function buscarDestinoPorCelular(phone) {
  const user = readUsers().find((candidate) => candidate.phone === phone)
  if (!user) throw new Error('No hay una cuenta MiPlata registrada con ese celular.')
  const [first] = user.bankAccounts
  return { fullName: user.fullName, username: user.username, accountType: first.accountType, accountNumber: first.accountNumber }
}

// Abre una cuenta más para el usuario: máximo una de cada tipo (ahorros y corriente)
export async function abrirCuenta(username, accountType, balance) {
  const users = readUsers()
  const user = findUser(users, username)

  if (user.bankAccounts.some((bankAccount) => bankAccount.accountType === accountType)) {
    throw new Error(`Ya tienes una ${ACCOUNT_TYPE_NAMES[accountType]}.`)
  }

  user.bankAccounts.push({ accountType, accountNumber: generateAccountNumber(users), balance, transactions: [] })
  writeUsers(users)
  return toPublicAccount(user)
}

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

// 16 dígitos que empiezan por 4, sin repetir entre usuarios (igual que la restricción única del backend)
function generateCardNumber(users) {
  let number
  do {
    number = `4${randomDigits(15)}`
  } while (users.some((user) => user.creditCard?.cardNumber === number))
  return number
}

// Igual que STarjetaCredito.adicionarTarjeta: una por usuario, ligada a una de sus cuentas,
// deuda inicial 0 y vencimiento a 5 años
export async function solicitarTarjeta(username, accountNumber, limit) {
  const users = readUsers()
  const user = findUser(users, username)

  if (user.creditCard) {
    throw new Error('Ya tienes una tarjeta de crédito.')
  }
  if (!user.bankAccounts.some((bankAccount) => bankAccount.accountNumber === accountNumber)) {
    throw new Error('Selecciona una de tus cuentas para asociar la tarjeta.')
  }
  if (!Number.isSafeInteger(limit) || limit < CARD_LIMIT_MIN || limit > CARD_LIMIT_MAX) {
    throw new Error('El cupo solicitado está fuera del rango permitido.')
  }

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 5)
  user.creditCard = {
    cardNumber: generateCardNumber(users),
    cvv: randomDigits(3),
    expiresAt: expiresAt.toISOString().slice(0, 10),
    limit,
    debt: 0,
    active: true,
    accountNumber,
    transactions: [],
    createdAt: new Date().toISOString(),
  }
  writeUsers(users)
  return toPublicAccount(user)
}

// Igual que STarjetaCredito.eliminarTarjeta: solo sin deuda pendiente
export async function cancelarTarjeta(username) {
  const users = readUsers()
  const user = findUser(users, username)

  if (!user.creditCard) {
    throw new Error('No tienes una tarjeta de crédito.')
  }
  if (user.creditCard.debt > 0) {
    throw new Error('La tarjeta tiene deuda pendiente: no se puede cancelar.')
  }

  user.creditCard = null
  writeUsers(users)
  return toPublicAccount(user)
}
