import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const navigation = [
  { id: 'balance', label: 'Consultar saldo' },
  { id: 'deposit', label: 'Consignar' },
  { id: 'withdraw', label: 'Retirar' },
  { id: 'transfer', label: 'Transferir' },
  { id: 'movements', label: 'Movimientos' },
  { id: 'profile', label: 'Perfil' },
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

export default function DashboardPage({ account, accounts, onDeposit, onWithdraw, onTransfer, onLogout }) {
  const [activePanel, setActivePanel] = useState('balance')
  const [feedback, setFeedback] = useState(null)
  const navigate = useNavigate()
  const transactions = [...(account.transactions ?? [])].reverse()
  const accountType = account.accountType === 'CC' ? 'Cuenta Corriente' : 'Cuenta de Ahorros'
  const recipients = accounts.filter((candidate) => candidate.username !== account.username)

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
            <div className="op-card"><h4>Datos personales</h4><p><strong>Nombre:</strong> {account.fullName}</p><p><strong>Documento:</strong> {account.documentType} {account.documentNumber}</p><p><strong>Celular:</strong> {account.phone}</p></div>
            <div className="op-card"><h4>Datos de cuenta</h4><p><strong>Usuario:</strong> @{account.username}</p><p><strong>Tipo:</strong> {accountType}</p><p><strong>Saldo:</strong> {currency.format(account.balance)}</p></div>
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
              <button
                className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
                type="button"
                onClick={() => { setActivePanel(item.id); setFeedback(null) }}
                aria-current={activePanel === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
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
        <section className="balance-card" aria-label="Saldo de la cuenta">
          <div className="balance-label">Saldo disponible</div>
          <div className="balance-amount">{currency.format(account.balance)}</div>
          <div className="balance-account-num">{accountType} · @{account.username}</div>
          <div className="balance-meta">
            <div className="balance-meta-item"><div className="meta-label">Titular</div><div className="meta-value">{account.fullName}</div></div>
            <div className="balance-meta-item"><div className="meta-label">Movimientos</div><div className="meta-value">{(account.transactions ?? []).length}</div></div>
          </div>
        </section>
        {renderPanel()}
        <p className="dashboard-demo-note">Entorno de demostración: los datos son temporales y no representan dinero real.</p>
      </main>
    </div>
  )
}