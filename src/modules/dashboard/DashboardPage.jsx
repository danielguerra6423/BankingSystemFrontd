import { useState } from 'react'
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom'
import { abrirCuenta, actualizarContacto, cambiarClave } from '../core/api/api.js'
import { ACCOUNT_TYPE_NAMES, accountLabel, shortAccountLabel } from '../accounts/bankAccounts.js'
import { EMAIL_PATTERN, PHONE_PATTERN, formatAccountNumber, formatMoneyInput, noSpaces, onlyDigits, parseMoney } from '../core/utils/inputFilters.js'
import AccountPicker from '../accounts/AccountPicker.jsx'
import PasswordInput from '../core/components/PasswordInput.jsx'
import CreditCardPanel from '../credit-card/CreditCardPanel.jsx'
import TransferPanel from '../transfers/TransferPanel.jsx'

// path: segmento de la URL de cada sección (/dashboard, /dashboard/consignar, ...)
const navigation = [
  { id: 'balance', label: 'Consultar saldo', path: '' },
  { id: 'deposit', label: 'Consignar', path: 'consignar' },
  { id: 'withdraw', label: 'Retirar', path: 'retirar' },
  { id: 'transfer', label: 'Transferir', path: 'transferir' },
  { id: 'movements', label: 'Movimientos', path: 'movimientos' },
  { id: 'card', label: 'Tarjeta de crédito', path: 'tarjeta' },
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

export default function DashboardPage({ account, accounts, onDeposit, onWithdraw, onTransfer, onAccountOpened, cardActions, onProfileUpdate, onLogout }) {
  const { section = '' } = useParams()
  const [panelFeedback, setPanelFeedback] = useState(null)
  // mensajes y estado de envío de los formularios del perfil: 'contact' y 'password'
  const [profileFeedback, setProfileFeedback] = useState({})
  const [savingProfile, setSavingProfile] = useState(null)
  // claves visibles en "Cambiar clave": la actual y la nueva (la nueva incluye su confirmación)
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false })
  const togglePassword = (field) => setShowPasswords((shown) => ({ ...shown, [field]: !shown[field] }))
  // cuenta elegida en Consignar, Retirar o Movimientos; se olvida al cambiar de sección
  const [picked, setPicked] = useState(null)
  const [openingAccount, setOpeningAccount] = useState(false)
  // consignación o retiro esperando la respuesta del backend
  const [sendingAmount, setSendingAmount] = useState(false)
  const navigate = useNavigate()
  const activeItem = navigation.find((item) => item.path === section)
  const activePanel = activeItem?.id
  // el mensaje solo se muestra en la sección donde se hizo la operación
  const feedback = panelFeedback?.panel === activePanel ? panelFeedback : null
  const setFeedback = (value) => setPanelFeedback(value && { ...value, panel: activePanel })
  const { bankAccounts } = account
  const hasManyAccounts = bankAccounts.length > 1
  const pickedNumber = hasManyAccounts ? (picked?.panel === activePanel ? picked.accountNumber : '') : bankAccounts[0].accountNumber
  const pickedAccount = bankAccounts.find((bankAccount) => bankAccount.accountNumber === pickedNumber)
  const pickAccount = (accountNumber) => setPicked({ panel: activePanel, accountNumber })
  const totalBalance = bankAccounts.reduce((sum, bankAccount) => sum + bankAccount.balance, 0)
  // movimientos de todas las cuentas, del más reciente al más antiguo
  const transactions = bankAccounts
    .flatMap((bankAccount) => (bankAccount.transactions ?? []).map((transaction) => ({ ...transaction, account: bankAccount })))
    .sort((a, b) => b.date.localeCompare(a.date))
  // con ahorros y corriente ya abiertas no se puede abrir otra
  const missingType = ['AH', 'CC'].find((type) => !bankAccounts.some((bankAccount) => bankAccount.accountType === type))

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
      setShowPasswords({ current: false, new: false })
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

  function renderCurrentBalance(bankAccount) {
    if (!bankAccount) return null
    return <p className="panel-balance">Saldo disponible: <strong>{currency.format(bankAccount.balance)}</strong></p>
  }

  async function submitOpenAccount(event) {
    event.preventDefault()
    const balance = parseMoney(new FormData(event.currentTarget).get('balance'))

    if (!Number.isSafeInteger(balance) || balance < 0) {
      setFeedback({ type: 'error', text: 'El saldo inicial debe ser un número entero mayor o igual a 0.' })
      return
    }

    setOpeningAccount(true)
    try {
      onAccountOpened(await abrirCuenta(account.username, missingType, balance))
      setFeedback({ type: 'success', text: `${ACCOUNT_TYPE_NAMES[missingType]} abierta.` })
    } catch (requestError) {
      setFeedback({ type: 'error', text: requestError.message })
    } finally {
      setOpeningAccount(false)
    }
  }

  async function submitAmount(event, operation) {
    event.preventDefault()
    const form = event.currentTarget
    const amount = parseMoney(new FormData(form).get('amount'))

    if (!pickedAccount) {
      setFeedback({ type: 'error', text: 'Selecciona la cuenta.' })
      return
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: 'Ingresa un monto entero mayor que cero.' })
      return
    }

    if (operation !== 'deposit' && amount > pickedAccount.balance) {
      setFeedback({ type: 'error', text: 'No tienes saldo suficiente para esta operación.' })
      return
    }

    // el saldo solo cambia en pantalla si el backend guardó la operación
    setSendingAmount(true)
    try {
      if (operation === 'deposit') await onDeposit(pickedAccount.accountNumber, amount)
      if (operation === 'withdraw') await onWithdraw(pickedAccount.accountNumber, amount)
      setFeedback({ type: 'success', text: operation === 'deposit' ? 'Consignación realizada.' : 'Retiro realizado.' })
      form.reset()
    } catch (requestError) {
      setFeedback({ type: 'error', text: requestError.message })
    } finally {
      setSendingAmount(false)
    }
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
              <div className={`mv-icon ${isCredit ? 'credit' : transaction.type === 'card-payment' ? 'tc' : transaction.type.startsWith('transfer') ? 'transfer' : 'debit'}`} aria-hidden="true">
                {isCredit ? '+' : '−'}
              </div>
              <div className="mv-details">
                <div className="mv-desc">{transaction.description}</div>
                <div className="mv-date">{formatDate(transaction.date)}{hasManyAccounts && ` · ${shortAccountLabel(transaction.account)}`}</div>
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
        {renderCurrentBalance(pickedAccount)}
        {feedback && <div className={`info-box ${feedback.type === 'error' ? 'warn' : 'info'}`} role="status">{feedback.text}</div>}
        <form className="op-card" onSubmit={(event) => submitAmount(event, operation)}>
          <h4>{isDeposit ? 'Agregar fondos a tu cuenta' : 'Retirar desde tu cuenta'}</h4>
          <AccountPicker id={`${operation}-account`} label="Cuenta" bankAccounts={bankAccounts} value={pickedNumber} onChange={pickAccount} />
          <div className="form-group">
            <label htmlFor={`${operation}-amount`}>Monto (COP)</label>
            <input
              id={`${operation}-amount`}
              className="form-control"
              name="amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ej: $ 50.000"
              onInput={formatMoneyInput}
              required
            />
          </div>
          <button className="btn-action" type="submit" disabled={sendingAmount}>{sendingAmount ? 'Procesando...' : isDeposit ? 'Consignar' : 'Retirar'}</button>
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
          <TransferPanel account={account} accounts={accounts} onTransfer={onTransfer} formatMoney={currency.format} />
        </section>
      )
    }

    if (activePanel === 'card') {
      return (
        <section className="panel active">
          <h2 className="panel-title">Tarjeta de crédito</h2>
          <CreditCardPanel account={account} formatMoney={currency.format} {...cardActions} />
        </section>
      )
    }

    if (activePanel === 'movements') {
      return (
        <section className="panel active">
          <h2 className="panel-title">Historial de movimientos</h2>
          {hasManyAccounts && (
            <div className="form-group movements-filter">
              <label htmlFor="movements-account">Cuenta</label>
              <select id="movements-account" className="form-control" value={pickedNumber} onChange={(event) => pickAccount(event.target.value)}>
                <option value="">Todas las cuentas</option>
                {bankAccounts.map((bankAccount) => <option key={bankAccount.accountNumber} value={bankAccount.accountNumber}>{accountLabel(bankAccount)}</option>)}
              </select>
            </div>
          )}
          {renderTransactions(pickedNumber ? transactions.filter((transaction) => transaction.account.accountNumber === pickedNumber) : transactions)}
        </section>
      )
    }

    if (activePanel === 'profile') {
      return (
        <section className="panel active">
          <h2 className="panel-title">Perfil</h2>
          <div className="profile-grid">
            <div className="op-card"><h4>Datos personales</h4><p><strong>Nombre:</strong> {account.fullName}</p><p><strong>Documento:</strong> {account.documentType} {account.documentNumber}</p><p><strong>Celular:</strong> {account.phone}</p><p><strong>Correo:</strong> {account.email ?? 'No registrado'}</p></div>
            <div className="op-card"><h4>Datos de cuenta</h4><p><strong>Usuario:</strong> @{account.username}</p>{bankAccounts.map((bankAccount) => <p key={bankAccount.accountNumber}><strong>{ACCOUNT_TYPE_NAMES[bankAccount.accountType]}:</strong> {formatAccountNumber(bankAccount.accountNumber)} · {currency.format(bankAccount.balance)}</p>)}</div>
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
                <PasswordInput id="profile-current-password" name="currentPassword" autoComplete="current-password" maxLength={50} required visible={showPasswords.current} onToggle={() => togglePassword('current')} />
              </div>
              <div className="form-group">
                <label htmlFor="profile-new-password">Nueva clave</label>
                <PasswordInput id="profile-new-password" name="newPassword" autoComplete="new-password" placeholder="Mínimo 4 caracteres" minLength={4} maxLength={50} required visible={showPasswords.new} onToggle={() => togglePassword('new')} />
              </div>
              <div className="form-group">
                <label htmlFor="profile-new-password-confirmation">Confirmar nueva clave</label>
                {/* sin ojo propio: se muestra u oculta junto con la nueva clave */}
                <PasswordInput id="profile-new-password-confirmation" name="newPasswordConfirmation" autoComplete="new-password" placeholder="Repite la nueva clave" minLength={4} maxLength={50} required visible={showPasswords.new} />
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
        <h3 className="saldo-section-title">{hasManyAccounts ? 'Tus cuentas' : 'Estado actual'}</h3>
        {feedback && <div className={`info-box ${feedback.type === 'error' ? 'warn' : 'info'}`} role="status">{feedback.text}</div>}
        <div className="saldo-stats">
          {bankAccounts.map((bankAccount) => (
            <article className="saldo-stat-card" key={bankAccount.accountNumber}>
              <div className={`saldo-stat-icon ${bankAccount.accountType === 'CC' ? 'gold' : ''}`} aria-hidden="true">{bankAccount.accountType === 'CC' ? '◆' : '$'}</div>
              <div className="saldo-stat-body"><div className="saldo-stat-label">{accountLabel(bankAccount)}</div><div className="saldo-stat-value c-green">{currency.format(bankAccount.balance)}</div></div>
            </article>
          ))}
        </div>
        {missingType && (
          <form className="op-card open-account" onSubmit={submitOpenAccount}>
            <h4>Abrir {ACCOUNT_TYPE_NAMES[missingType]}</h4>
            <div className="form-group">
              <label htmlFor="open-account-balance">Saldo inicial (COP)</label>
              <input id="open-account-balance" className="form-control" name="balance" type="text" inputMode="numeric" autoComplete="off" placeholder="$ 0" onInput={formatMoneyInput} />
            </div>
            <button className="btn-action" type="submit" disabled={openingAccount}>{openingAccount ? 'Abriendo cuenta...' : 'Abrir cuenta'}</button>
          </form>
        )}
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
          {navigation.map((item) => (
            <span className="dashboard-nav-group" key={item.id}>
              {item.id === 'profile' && <span className="nav-divider" aria-hidden="true" />}
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
          <div className="balance-label">{hasManyAccounts ? 'Saldo total' : 'Saldo disponible'}</div>
          <div className="balance-amount">{currency.format(totalBalance)}</div>
          <div className="balance-account-num">{hasManyAccounts ? `${bankAccounts.length} cuentas` : `${ACCOUNT_TYPE_NAMES[bankAccounts[0].accountType]} · N.º ${formatAccountNumber(bankAccounts[0].accountNumber)}`} · @{account.username}</div>
          <div className="balance-meta">
            <div className="balance-meta-item"><div className="meta-label">Titular</div><div className="meta-value">{account.fullName}</div></div>
            <div className="balance-meta-item"><div className="meta-label">Movimientos</div><div className="meta-value">{transactions.length}</div></div>
          </div>
        </section>}
        {renderPanel()}
        <p className="dashboard-demo-note">Entorno de demostración: los datos son temporales y no representan dinero real.</p>
      </main>
    </div>
  )
}