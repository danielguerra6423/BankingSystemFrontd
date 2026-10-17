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

// mismas reglas que valida el backend (SPerson)
export const PHONE_PATTERN = /^3\d{9}$/
export const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
