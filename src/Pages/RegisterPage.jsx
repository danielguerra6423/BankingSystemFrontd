import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterPage({ accounts, onRegister }) {
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const formData = new FormData(event.currentTarget)
    const account = {
      documentType: String(formData.get('documentType')),
      documentNumber: String(formData.get('documentNumber')).trim(),
      phone: String(formData.get('phone')).trim(),
      fullName: String(formData.get('fullName')).trim(),
      username: String(formData.get('username')).trim().toLowerCase(),
      password: String(formData.get('password')),
      accountType: String(formData.get('accountType')),
      balance: Number(formData.get('balance')),
      transactions: [],
    }
    const passwordConfirmation = String(formData.get('passwordConfirmation'))

    if (accounts.some((existing) => existing.username === account.username)) {
      setError('Ese nombre de usuario ya está registrado.')
      return
    }

    if (accounts.some((existing) => existing.documentNumber === account.documentNumber)) {
      setError('Ya existe una cuenta con ese número de documento.')
      return
    }

    if (account.password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    onRegister(account)
    navigate('/login', { state: { registered: true } })
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <section className="auth-brand">
          <h2>Únete a<br />Mi<span>Plata</span></h2>
          <p>Abre tu cuenta de demostración y comienza a explorar la experiencia MiPlata.</p>
          <div className="auth-demo">
            <p>Modo de demostración</p>
            <code>Los datos se borran al recargar la página.</code>
            <code>No uses contraseñas reales.</code>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="register-title">
          <h3 id="register-title">Crear cuenta</h3>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-document-type">Tipo de documento</label>
                <select id="register-document-type" className="form-control" name="documentType" defaultValue="CC">
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="PA">Pasaporte</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="register-document-number">Número de documento</label>
                <input id="register-document-number" className="form-control" name="documentNumber" type="text" autoComplete="off" placeholder="Ej: 1234567890" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-phone">Celular</label>
              <input id="register-phone" className="form-control" name="phone" type="tel" autoComplete="tel" placeholder="Ej: 3001234567" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-full-name">Nombre completo</label>
              <input id="register-full-name" className="form-control" name="fullName" type="text" autoComplete="name" placeholder="Nombre y apellidos" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-username">Usuario</label>
              <input id="register-username" className="form-control" name="username" type="text" autoComplete="username" placeholder="Nombre de usuario" minLength={4} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-password">Contraseña</label>
                <input id="register-password" className="form-control" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 4 caracteres" minLength={4} required />
              </div>
              <div className="form-group">
                <label htmlFor="register-password-confirmation">Confirmar contraseña</label>
                <input id="register-password-confirmation" className="form-control" name="passwordConfirmation" type="password" autoComplete="new-password" placeholder="Repite la contraseña" minLength={4} required />
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
                <input id="register-balance" className="form-control" name="balance" type="number" min="0" step="1" placeholder="0" defaultValue="0" required />
              </div>
            </div>
            <button className="btn-submit" type="submit">Crear mi cuenta</button>
          </form>
          <div className="auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></div>
          <div className="auth-footer"><Link to="/">Volver al inicio</Link></div>
        </section>
      </div>
    </main>
  )
}