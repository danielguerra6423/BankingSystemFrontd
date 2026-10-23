import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../core/api/api.js'

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [registered, setRegistered] = useState(Boolean(location.state?.registered))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setRegistered(false)

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username')).trim().toLowerCase()
    const password = String(formData.get('password'))

    if (!username || !password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }

    if (username.length < 4 || password.length < 4) {
      setError('El usuario y la contraseña deben tener mínimo 4 caracteres.')
      return
    }

    // api.js (localStorage o backend) valida la contraseña y bloquea la cuenta tras 3 intentos fallidos
    setSending(true)
    try {
      const account = await iniciarSesion(username, password)
      onLogin(account)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <section className="auth-brand">
          <h2>Bienvenido a<br />Mi<span>Plata</span></h2>
          <p>Accede a tu banca digital y gestiona tus finanzas desde un solo lugar.</p>
          <div className="auth-demo">
            <p>Modo de demostración</p>
            <code>Tras 3 intentos fallidos la cuenta se bloquea.</code>
            <code>No uses contraseñas reales.</code>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="login-title">
          <h3 id="login-title">Iniciar sesión</h3>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {registered && <div className="alert alert-success" role="status">Cuenta creada. Ya puedes iniciar sesión.</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-username">Usuario</label>
              <input id="login-username" className="form-control" name="username" type="text" autoComplete="username" placeholder="Nombre de usuario" minLength={4} required />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <input id="login-password" className="form-control" name="password" type="password" autoComplete="current-password" placeholder="Contraseña" minLength={4} required />
            </div>
            <button className="btn-submit" type="submit" disabled={sending}>{sending ? 'Ingresando...' : 'Iniciar sesión'}</button>
          </form>
          <div className="auth-footer">¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></div>
          <div className="auth-footer"><Link to="/">Volver al inicio</Link></div>
        </section>
      </div>
    </main>
  )
}