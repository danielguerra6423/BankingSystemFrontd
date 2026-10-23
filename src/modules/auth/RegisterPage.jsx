import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { USE_LOCAL_STORAGE, registrarCuenta } from '../core/api/api.js'
import { EMAIL_PATTERN, PHONE_PATTERN, formatMoneyInput, noSpaces, onlyAlphanumeric, onlyDigits, onlyLetters, onlyUsernameChars, parseMoney } from '../core/utils/inputFilters.js'

// Formulario de registro de cuenta de demostración. Valida los datos en el frontend y luego crea la cuenta con api.js (localStorage o backend, según USE_LOCAL_STORAGE).
export default function RegisterPage() {
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [documentType, setDocumentType] = useState('CC')
  const navigate = useNavigate()
// Variables de estado para controlar el formulario y mostrar mensajes de error o éxito. Se usan expresiones regulares para validar el formato de los datos ingresados por el usuario.
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const formData = new FormData(event.currentTarget)
    const account = {
      documentType: String(formData.get('documentType')),
      documentNumber: String(formData.get('documentNumber')).trim(),
      phone: String(formData.get('phone')).trim(),
      email: String(formData.get('email')).trim().toLowerCase(),
      fullName: String(formData.get('fullName')).trim(),
      username: String(formData.get('username')).trim().toLowerCase(),
      password: String(formData.get('password')),
      accountType: String(formData.get('accountType')),
      balance: parseMoney(formData.get('balance')),
    }
    const passwordConfirmation = String(formData.get('passwordConfirmation'))
// Validaciones de los datos ingresados por el usuario antes de guardarlos. Se verifica el tipo de documento, el formato del celular, correo electrónico, nombre completo, usuario, contraseña y saldo inicial.
    if (account.documentType === 'CC' && !/^\d{6,10}$/.test(account.documentNumber)) {
      setError('La cédula debe tener solo números, entre 6 y 10 dígitos.')
      return
    }

    if (account.documentType === 'PA' && !/^[A-Z0-9]{6,9}$/.test(account.documentNumber)) {
      setError('El pasaporte debe tener entre 6 y 9 caracteres, solo letras y números.')
      return
    }

    if (!PHONE_PATTERN.test(account.phone)) {
      setError('El celular debe tener 10 dígitos y empezar por 3.')
      return
    }

    if (account.email.length > 50 || !EMAIL_PATTERN.test(account.email)) {
      setError('Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.')
      return
    }
// Validación del nombre completo para que solo contenga letras y espacios, y que tenga al menos un nombre y un apellido.
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(\s[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)+$/.test(account.fullName)) {
      setError('Ingresa tu nombre y apellido, solo con letras.')
      return
    }
// Validación del nombre de usuario para que tenga entre 4 y 20 caracteres, y que solo contenga letras, números o guion bajo.
    if (!/^[a-z0-9_]{4,20}$/.test(account.username)) {
      setError('El usuario debe tener entre 4 y 20 caracteres: letras, números o guion bajo.')
      return
    }
// Validación de la contraseña para que tenga entre 4 y 50 caracteres.
    if (account.password.length < 4 || account.password.length > 50) {
      setError('La contraseña debe tener entre 4 y 50 caracteres.')
      return
    }
// Validación del saldo inicial para que sea un número entero mayor o igual a 0.
    if (!Number.isInteger(account.balance) || account.balance < 0) {
      setError('El saldo inicial debe ser un número entero mayor o igual a 0.')
      return
    }
// Validación de la confirmación de la contraseña para que coincida con la contraseña ingresada.
    if (account.password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    // usuario, documento y correo repetidos los valida api.js (localStorage o backend)
    setSending(true)
    try {
      await registrarCuenta(account)
      navigate('/login', { state: { registered: true } })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }
// Renderizado del formulario de registro con los campos necesarios y los mensajes de error o éxito. Se utiliza un diseño responsivo y accesible para que el usuario pueda crear su cuenta de demostración de manera sencilla.
  return (
    <main className="auth-page">
      <div className="auth-container">
        <section className="auth-brand">
          <h2>Únete a<br />Mi<span>Plata</span></h2>
          <p>Abre tu cuenta de demostración y comienza a explorar la experiencia MiPlata.</p>
          <div className="auth-demo">
            <p>Modo de demostración</p>
            <code>{USE_LOCAL_STORAGE ? 'Tus datos se guardan en este navegador.' : 'Tus datos se guardan en la base de datos del banco.'}</code>
            <code>No uses contraseñas reales.</code>
          </div>
        </section>
        {/* Formulario de registro con campos para tipo y número de documento, celular, correo electrónico, nombre completo, usuario, contraseña, tipo de cuenta y saldo inicial. Se incluyen validaciones en el frontend y se guardan los datos según el modo de api.js (localStorage o backend). */}
        <section className="auth-card" aria-labelledby="register-title">
          <h3 id="register-title">Crear cuenta</h3>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-document-type">Tipo de documento</label>
                <select
                  id="register-document-type"
                  className="form-control"
                  name="documentType"
                  value={documentType}
                  onChange={(event) => {
                    setDocumentType(event.target.value)
                    event.currentTarget.form.elements.documentNumber.value = ''
                  }}
                >
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="PA">Pasaporte</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="register-document-number">Número de documento</label>
                <input
                  id="register-document-number"
                  className="form-control"
                  name="documentNumber"
                  type="text"
                  inputMode={documentType === 'CC' ? 'numeric' : 'text'}
                  autoComplete="off"
                  placeholder={documentType === 'CC' ? 'Ej: 1234567890' : 'Ej: AB123456'}
                  minLength={6}
                  maxLength={documentType === 'CC' ? 10 : 9}
                  onInput={documentType === 'CC' ? onlyDigits : onlyAlphanumeric}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-phone">Celular</label>
                <input id="register-phone" className="form-control" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="Ej: 3001234567" minLength={10} maxLength={10} onInput={onlyDigits} required />
              </div>
              <div className="form-group">
                <label htmlFor="register-email">Correo electrónico</label>
                <input id="register-email" className="form-control" name="email" type="email" inputMode="email" autoComplete="email" placeholder="Ej: nombre@correo.com" maxLength={50} onInput={noSpaces} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-full-name">Nombre completo</label>
              <input id="register-full-name" className="form-control" name="fullName" type="text" autoComplete="name" placeholder="Nombre y apellidos" maxLength={60} onInput={onlyLetters} required />
            </div>
            <div className="form-group">
              <label htmlFor="register-username">Usuario</label>
              <input id="register-username" className="form-control" name="username" type="text" autoComplete="username" placeholder="Nombre de usuario" minLength={4} maxLength={20} onInput={onlyUsernameChars} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-password">Contraseña</label>
                <input id="register-password" className="form-control" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 4 caracteres" minLength={4} maxLength={50} required />
              </div>
              <div className="form-group">
                <label htmlFor="register-password-confirmation">Confirmar contraseña</label>
                <input id="register-password-confirmation" className="form-control" name="passwordConfirmation" type="password" autoComplete="new-password" placeholder="Repite la contraseña" minLength={4} maxLength={50} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-account-type">Tipo de cuenta</label>
                <select id="register-account-type" className="form-control" name="accountType" defaultValue="AH">
                  <option value="AH">Cuenta de Ahorros</option>
                  <option value="CC">Cuenta Corriente</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="register-balance">Saldo inicial (COP)</label>
                <input id="register-balance" className="form-control" name="balance" type="text" inputMode="numeric" autoComplete="off" placeholder="$ 0" onInput={formatMoneyInput} />
              </div>
            </div>
            <button className="btn-submit" type="submit" disabled={sending}>{sending ? 'Creando cuenta...' : 'Crear mi cuenta'}</button>
          </form>
          <div className="auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></div>
          <div className="auth-footer"><Link to="/">Volver al inicio</Link></div>
        </section>
      </div>
    </main>
  )
}