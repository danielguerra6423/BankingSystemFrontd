import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function LoginPage({ accounts, onLogin }) {
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const [registered, setRegistered] = useState(Boolean(location.state?.registered))

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setRegistered(false)

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username')).trim().toLowerCase()
    const password = String(formData.get('password'))
    const account = accounts.find(
      (candidate) => candidate.username === username && candidate.password === password,
    )

    if (!account) {
      setError('Usuario o contraseña incorrectos. Verifica los datos o crea una cuenta.')
      return
    }

    onLogin(account.username)
    navigate('/dashboard')
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <section className="auth-brand">
          <h2>Bienvenido a<br />Mi<span>Plata</span></h2>
          <p>Accede a tu banca digital y gestiona tus finanzas desde un solo lugar.</p>
          <div className="auth-demo">
            <p>Modo de demostración</p>
            <code>Las cuentas duran mientras esta pestaña esté abierta.</code>
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
              <input id="login-username" className="form-control" name="username" type="text" autoComplete="username" placeholder="Nombre de usuario" required />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <input id="login-password" className="form-control" name="password" type="password" autoComplete="current-password" placeholder="Contraseña" required />
            </div>
            <button className="btn-submit" type="submit">Iniciar sesión</button>
          </form>
          <div className="auth-footer">¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></div>
          <div className="auth-footer"><Link to="/">Volver al inicio</Link></div>
        </section>
      </div>
    </main>
  )
}