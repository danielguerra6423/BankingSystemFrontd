import { useState } from 'react'
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom'
import { actualizarContacto, cambiarClave } from '../api.js'
import { EMAIL_PATTERN, PHONE_PATTERN, noSpaces, onlyDigits } from '../inputFilters.js'

// path: segmento de la URL de cada sección (/dashboard, /dashboard/consignar, ...)
const navigation = [
  { id: 'balance', label: 'Consultar saldo', path: '' },
  { id: 'deposit', label: 'Consignar', path: 'consignar' },
  { id: 'withdraw', label: 'Retirar', path: 'retirar' },
  { id: 'transfer', label: 'Transferir', path: 'transferir' },
  { id: 'movements', label: 'Movimientos', path: 'movimientos' },
  { id: 'profile', label: 'Perfil', path: 'perfil' },
]

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatDate(value) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function DashboardPage({ account, accounts, onDeposit, onWithdraw, onTransfer, onProfileUpdate, onLogout }) {
  const { section = '' } = useParams()
  const [panelFeedback, setPanelFeedback] = useState(null)
  // mensajes y estado de envío de los formularios del perfil: 'contact' y 'password'
  const [profileFeedback, setProfileFeedback] = useState({})
  const [savingProfile, setSavingProfile] = useState(null)
  const navigate = useNavigate()
  const activeItem = navigation.find((item) => item.path === section)
  const activePanel = activeItem?.id
  // el mensaje solo se muestra en la sección donde se hizo la operación
  const feedback = panelFeedback?.panel === activePanel ? panelFeedback : null
  const setFeedback = (value) => setPanelFeedback(value && { ...value, panel: activePanel })
  const transactions = [...(account.transactions ?? [])].reverse()
  const accountType = account.accountType === 'CC' ? 'Cuenta Corriente' : 'Cuenta de Ahorros'
  const recipients = accounts.filter((candidate) => candidate.username !== account.username)

  if (!activeItem) {
    return <Navigate to="/dashboard" replace />
  }

  function showProfileMessage(form, type, text) {
    setProfileFeedback((current) => ({ ...current, [form]: { type, text } }))
  }

  async function submitContact(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const phone = String(formData.get('phone')).trim()
    const email = String(formData.get('email')).trim().toLowerCase()

    if (!PHONE_PATTERN.test(phone)) {
      showProfileMessage('contact', 'error', 'El celular debe tener 10 dígitos y empezar por 3.')
      return
    }

    if (email.length > 50 || !EMAIL_PATTERN.test(email)) {
      showProfileMessage('contact', 'error', 'Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.')
      return
    }

    if (phone === account.phone && email === account.email) {
      showProfileMessage('contact', 'error', 'No hay cambios para guardar.')
      return
    }

    setSavingProfile('contact')
    try {
      const updated = await actualizarContacto(account.username, phone, email)
      onProfileUpdate({ phone: updated.phone, email: updated.email })
      showProfileMessage('contact', 'success', 'Datos de contacto actualizados.')
    } catch (requestError) {
      showProfileMessage('contact', 'error', requestError.message)
    } finally {
      setSavingProfile(null)
    }
  }

  async function submitPassword(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const currentPassword = String(formData.get('currentPassword'))
    const newPassword = String(formData.get('newPassword'))
    const confirmation = String(formData.get('newPasswordConfirmation'))

    if (!currentPassword) {
      showProfileMessage('password', 'error', 'Ingresa tu clave actual.')
      return
    }

    if (newPassword.length < 4 || newPassword.length > 50) {
      showProfileMessage('password', 'error', 'La nueva clave debe tener entre 4 y 50 caracteres.')
      return
    }

    if (newPassword !== confirmation) {
      showProfileMessage('password', 'error', 'La nueva clave y su confirmación no coinciden.')
      return
    }

    if (newPassword === currentPassword) {
      showProfileMessage('password', 'error', 'La nueva clave debe ser diferente a la actual.')
      return
    }

    setSavingProfile('password')
    try {
      await cambiarClave(account.username, currentPassword, newPassword)
      form.reset()
      showProfileMessage('password', 'success', 'Clave actualizada. Úsala la próxima vez que inicies sesión.')
    } catch (requestError) {
      showProfileMessage('password', 'error', requestError.message)
    } finally {
      setSavingProfile(null)
    }
  }

  function renderProfileMessage(form) {
    const message = profileFeedback[form]
    if (!message) return null
    return <div className={`info-box ${message.type === 'error' ? 'warn' : 'info'}`} role="status">{message.text}</div>
  }

  function renderCurrentBalance() {
    return <p className="panel-balance">Saldo disponible: <strong>{currency.format(account.balance)}</strong></p>
  }

  function submitAmount(event, operation) {
    event.preventDefault()
    const form = event.currentTarget
    const amount = Number(new FormData(form).get('amount'))

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: 'Ingresa un monto entero mayor que cero.' })
      return
    }

    if (operation !== 'deposit' && amount > account.balance) {
      setFeedback({ type: 'error', text: 'No tienes saldo suficiente para esta operación.' })
      return
    }

    if (operation === 'deposit') onDeposit(amount)
    if (operation === 'withdraw') onWithdraw(amount)
    setFeedback({ type: 'success', text: operation === 'deposit' ? 'Consignación realizada.' : 'Retiro realizado.' })
    form.reset()
  }

  function submitTransfer(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const recipient = String(formData.get('recipient'))
    const amount = Number(formData.get('amount'))

    if (!recipients.some((candidate) => candidate.username === recipient)) {
      setFeedback({ type: 'error', text: 'Selecciona una cuenta de destino válida.' })
      return
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: 'Ingresa un monto entero mayor que cero.' })
      return
    }

    if (amount > account.balance) {
      setFeedback({ type: 'error', text: 'No tienes saldo suficiente para esta transferencia.' })
      return
    }

    onTransfer(recipient, amount)
    setFeedback({ type: 'success', text: 'Transferencia realizada.' })
    form.reset()
  }

  function handleLogout() {
    onLogout()
    navigate('/')
  }

  function renderTransactions(items) {
    if (!items.length) {
      return <p className="dashboard-empty">Aún no tienes movimientos en esta cuenta.</p>
    }

    return (
      <div className="movements-list">
        {items.map((transaction) => {
          const isCredit = transaction.type === 'deposit' || transaction.type === 'transfer-in'
          return (
            <article className="mv-item" key={transaction.id}>
              <div className={`mv-icon ${isCredit ? 'credit' : transaction.type.startsWith('transfer') ? 'transfer' : 'debit'}`} aria-hidden="true">
                {isCredit ? '+' : '−'}
              </div>
              <div className="mv-details">
                <div className="mv-desc">{transaction.description}</div>
                <div className="mv-date">{formatDate(transaction.date)}</div>
              </div>
              <div className="mv-amount">
                <div className={`mv-val ${isCredit ? 'credit' : 'debit'}`}>
                  {isCredit ? '+' : '−'}{currency.format(transaction.amount)}
                </div>
                <div className="mv-saldo">Saldo: {currency.format(transaction.balanceAfter)}</div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  function renderAmountForm(operation) {
    const isDeposit = operation === 'deposit'
    const title = isDeposit ? 'Consignar dinero' : 'Retirar dinero'
    return (
      <section className="panel active">
        <h2 className="panel-title">{title}</h2>
        {renderCurrentBalance()}
        {feedback && <div className={`info-box ${feedback.type === 'error' ? 'warn' : 'info'}`} role="status">{feedback.text}</div>}
        <form className="op-card" onSubmit={(event) => submitAmount(event, operation)}>
          <h4>{isDeposit ? 'Agregar fondos a tu cuenta' : 'Retirar desde tu cuenta'}</h4>
          <div className="form-group">
            <label htmlFor={`${operation}-amount`}>Monto (COP)</label>
            <input
              id={`${operation}-amount`}
              className="form-control"
              name="amount"
              type="number"
              min="1"
              step="1"
              max={isDeposit ? undefined : account.balance}
              placeholder="Ej: 50000"
              required
            />
          </div>
          <button className="btn-action" type="submit">{isDeposit ? 'Consignar' : 'Retirar'}</button>
        </form>
      </section>
    )
  }

  function renderPanel() {
    if (activePanel === 'deposit' || activePanel === 'withdraw') {
      return renderAmountForm(activePanel)
    }

    if (activePanel === 'transfer') {
      return (
        <section className="panel active">
          <h2 className="panel-title">Transferir</h2>
          {renderCurrentBalance()}
          {feedback && <div className={`info-box ${feedback.type === 'error' ? 'warn' : 'info'}`} role="status">{feedback.text}</div>}
          <form className="op-card" onSubmit={submitTransfer}>
            <h4>Enviar dinero a otra cuenta MiPlata</h4>
            {recipients.length ? (
              <>
                <div className="form-group">
                  <label htmlFor="transfer-recipient">Cuenta de destino</label>
                  <select className="form-control" id="transfer-recipient" name="recipient" defaultValue="" required>
                    <option value="" disabled>Selecciona un usuario</option>
                    {recipients.map((recipient) => (
                      <option key={recipient.username} value={recipient.username}>
                        {recipient.fullName} (@{recipient.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="transfer-amount">Monto (COP)</label>
                  <input className="form-control" id="transfer-amount" name="amount" type="number" min="1" max={account.balance} step="1" placeholder="Ej: 50000" required />
                </div>
                <button className="btn-action" type="submit">Transferir dinero</button>
              </>
            ) : (
              <p className="dashboard-empty">Necesitas otra cuenta registrada en esta sesión para probar una transferencia.</p>
            )}
          </form>
        </section>
      )
    }

    if (activePanel === 'movements') {
      return (
        <section className="panel active">
          <h2 className="panel-title">Historial de movimientos</h2>
          {renderTransactions(transactions)}
        </section>
      )
    }

    if (activePanel === 'profile') {
      return (
        <section className="panel active">
          <h2 className="panel-title">Perfil</h2>
          <div className="profile-grid">
            <div className="op-card"><h4>Datos personales</h4><p><strong>Nombre:</strong> {account.fullName}</p><p><strong>Documento:</strong> {account.documentType} {account.documentNumber}</p><p><strong>Celular:</strong> {account.phone}</p><p><strong>Correo:</strong> {account.email ?? 'No registrado'}</p></div>
            <div className="op-card"><h4>Datos de cuenta</h4><p><strong>Usuario:</strong> @{account.username}</p><p><strong>Tipo:</strong> {accountType}</p><p><strong>Saldo:</strong> {currency.format(account.balance)}</p></div>
          </div>
          <div className="profile-grid">
            {/* key: al guardar, el formulario se reinicia con los datos nuevos */}
            <form className="op-card" onSubmit={submitContact} key={`${account.phone}-${account.email}`}>
              <h4>Datos de contacto</h4>
              {renderProfileMessage('contact')}
              <div className="form-group">
                <label htmlFor="profile-phone">Celular</label>
                <input id="profile-phone" className="form-control" name="phone" type="tel" inputMode="numeric" autoComplete="tel" defaultValue={account.phone} minLength={10} maxLength={10} onInput={onlyDigits} required />
              </div>
              <div className="form-group">
                <label htmlFor="profile-email">Correo electrónico</label>
                <input id="profile-email" className="form-control" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={account.email ?? ''} maxLength={50} onInput={noSpaces} required />
              </div>
              <button className="btn-action" type="submit" disabled={savingProfile === 'contact'}>{savingProfile === 'contact' ? 'Guardando...' : 'Guardar cambios'}</button>
            </form>
            <form className="op-card" onSubmit={submitPassword}>
              <h4>Cambiar clave</h4>
              {renderProfileMessage('password')}
              <div className="form-group">
                <label htmlFor="profile-current-password">Clave actual</label>
                <input id="profile-current-password" className="form-control" name="currentPassword" type="password" autoComplete="current-password" maxLength={50} required />
              </div>
              <div className="form-group">
                <label htmlFor="profile-new-password">Nueva clave</label>
                <input id="profile-new-password" className="form-control" name="newPassword" type="password" autoComplete="new-password" placeholder="Mínimo 4 caracteres" minLength={4} maxLength={50} required />
              </div>
              <div className="form-group">
                <label htmlFor="profile-new-password-confirmation">Confirmar nueva clave</label>
                <input id="profile-new-password-confirmation" className="form-control" name="newPasswordConfirmation" type="password" autoComplete="new-password" placeholder="Repite la nueva clave" minLength={4} maxLength={50} required />
              </div>
              <button className="btn-action" type="submit" disabled={savingProfile === 'password'}>{savingProfile === 'password' ? 'Guardando...' : 'Cambiar clave'}</button>
            </form>
          </div>
        </section>
      )
    }

    return (
      <section className="panel active saldo-section">
        <h2 className="panel-title">Resumen de cuenta</h2>
        <h3 className="saldo-section-title">Estado actual</h3>
        <div className="saldo-stats">
          <article className="saldo-stat-card">
            <div className="saldo-stat-icon" aria-hidden="true">$</div>
            <div className="saldo-stat-body"><div className="saldo-stat-label">Saldo disponible</div><div className="saldo-stat-value c-green">{currency.format(account.balance)}</div></div>
          </article>
          <article className="saldo-stat-card">
            <div className="saldo-stat-icon gold" aria-hidden="true">◆</div>
            <div className="saldo-stat-body"><div className="saldo-stat-label">Producto</div><div className="saldo-stat-value">{accountType}</div></div>
          </article>
        </div>
        <h3 className="saldo-section-title">Actividad reciente</h3>
        {renderTransactions(transactions.slice(0, 4))}
      </section>
    )
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(account.fullName)}</div>
          <div className="sidebar-name">{account.fullName}</div>
          <div className="sidebar-id">@{account.username}</div>
        </div>
        <nav className="sidebar-nav" aria-label="Secciones de cuenta">
          {navigation.map((item, index) => (
            <span className="dashboard-nav-group" key={item.id}>
              {(index === 5) && <span className="nav-divider" aria-hidden="true" />}
              <NavLink
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                to={item.path ? `/dashboard/${item.path}` : '/dashboard'}
                end
              >
                {item.label}
              </NavLink>
            </span>
          ))}
          <span className="nav-divider" aria-hidden="true" />
          <button className="nav-item danger" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="dashboard-heading">
          <div><p className="dashboard-eyebrow">MiPlata · Banca digital</p><h1>Hola, {account.fullName.split(' ')[0]}</h1></div>
          <time dateTime={new Date().toISOString()}>{new Intl.DateTimeFormat('es-CO', { dateStyle: 'full' }).format(new Date())}</time>
        </header>
        {activePanel === 'balance' && <section className="balance-card" aria-label="Saldo de la cuenta">
          <div className="balance-label">Saldo disponible</div>
          <div className="balance-amount">{currency.format(account.balance)}</div>
          <div className="balance-account-num">{accountType} · @{account.username}</div>
          <div className="balance-meta">
            <div className="balance-meta-item"><div className="meta-label">Titular</div><div className="meta-value">{account.fullName}</div></div>
            <div className="balance-meta-item"><div className="meta-label">Movimientos</div><div className="meta-value">{(account.transactions ?? []).length}</div></div>
          </div>
        </section>}
        {renderPanel()}
        <p className="dashboard-demo-note">Entorno de demostración: los datos son temporales y no representan dinero real.</p>
      </main>
    </div>
  )
}