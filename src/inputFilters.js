// Filtros para onInput: quitan lo que el campo no admite mientras el usuario escribe.
// Se usan en el registro y en el perfil.

export const onlyDigits = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '')
}

export const onlyAlphanumeric = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export const onlyLetters = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').replace(/\s{2,}/g, ' ')
}

export const noSpaces = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/\s/g, '')
}

export const onlyUsernameChars = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-Z0-9_]/g, '')
}

const moneyFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Reemplaza el valor del campo por format(dígitos) y deja el cursor después
// del mismo dígito en el que estaba, aunque se agreguen puntos o guiones.
function reformatDigits(input, format) {
  const digitsBeforeCursor = input.value.slice(0, input.selectionStart).replace(/\D/g, '').length
  input.value = format(input.value.replace(/\D/g, ''))

  let cursor = 0
  for (let seen = 0; cursor < input.value.length && seen < digitsBeforeCursor; cursor += 1) {
    if (/\d/.test(input.value[cursor])) seen += 1
  }
  input.setSelectionRange(cursor, cursor)
}

// Muestra el monto como dinero mientras se escribe ($ 1.250.000).
// Máximo 15 dígitos para que siga siendo un entero seguro.
export const formatMoneyInput = (event) => {
  reformatDigits(event.currentTarget, (digits) => {
    const amount = digits.slice(0, 15).replace(/^0+(?=\d)/, '')
    return amount ? moneyFormat.format(Number(amount)) : ''
  })
}

// Número de cuenta en grupos de 4 dígitos: 1234-5678-90
export const formatAccountNumber = (value) => String(value ?? '').replace(/\D/g, '').match(/\d{1,4}/g)?.join('-') ?? ''

export const formatAccountInput = (event) => {
  reformatDigits(event.currentTarget, formatAccountNumber)
}

// Largo del campo con guiones para una cuenta de n dígitos (10 dígitos -> 12 caracteres)
export const accountInputLength = (digits) => digits + Math.ceil(digits / 4) - 1

// Convierte el texto del campo ($ 1.250.000) en número (1250000)
export const parseMoney = (value) => Number(String(value).replace(/\D/g, ''))

// mismas reglas que valida el backend (SPerson)
export const PHONE_PATTERN = /^3\d{9}$/
export const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
