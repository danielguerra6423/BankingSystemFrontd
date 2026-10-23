import { useState } from 'react'
import AccountPicker from './AccountPicker.jsx'
import { cancelarTarjeta, solicitarTarjeta } from '../api.js'
import { accountLabel } from '../bankAccounts.js'
import {
  CARD_LIMIT_MAX,
  CARD_LIMIT_MIN,
  INTEREST_FREE_INSTALLMENTS,
  MAX_INSTALLMENTS,
  MONTHLY_RATE,
  availableCredit,
  cardExpiry,
  formatRate,
  installmentPlan,
  isCardExpired,
  isValidInstallments,
  maskedCardNumber,
  monthlyDue,
} from '../creditCard.js'
import { formatMoneyInput, onlyDigits, parseMoney } from '../inputFilters.js'

// Sección Tarjeta de crédito: solicitarla y, ya con tarjeta, comprar, pagar desde una cuenta,
// bloquearla o cancelarla. Mismas reglas que STarjetaCredito del backend.
export default function CreditCardPanel({ account, formatMoney, onIssued, onPurchase, onPayment, onBlock, onCanceled }) {
  const card = account.creditCard
  const { bankAccounts } = account
  const onlyAccount = bankAccounts.length === 1 ? bankAccounts[0].accountNumber : ''
  const [linkedNumber, setLinkedNumber] = useState(onlyAccount)
  const [payFromNumber, setPayFromNumber] = useState(onlyAccount)
  const payFrom = bankAccounts.find((bankAccount) => bankAccount.accountNumber === payFromNumber)
  // mensaje de cada formulario: 'request', 'purchase', 'payment', 'manage'
  const [feedback, setFeedback] = useState({})
  const [sending, setSending] = useState(false)
  // 'block' o 'cancel' mientras se pide confirmación
  const [confirming, setConfirming] = useState(null)
  // plan de cuotas de la compra que se está escribiendo
  const [purchasePlan, setPurchasePlan] = useState(null)

  function showMessage(form, type, text) {
    setFeedback({ [form]: { type, text } })
  }

  function renderMessage(form) {
    const message = feedback[form]
    if (!message) return null
    return <div className={`info-box ${message.type === 'error' ? 'warn' : 'info'}`} role="status">{message.text}</div>
  }

  function readAmount(form, field = 'amount') {
    return parseMoney(new FormData(form).get(field))
  }

  function isValidLimit(limit) {
    return Number.isSafeInteger(limit) && limit >= CARD_LIMIT_MIN && limit <= CARD_LIMIT_MAX
  }

  const limitRangeText = `El cupo debe estar entre ${formatMoney(CARD_LIMIT_MIN)} y ${formatMoney(CARD_LIMIT_MAX)}.`

  async function submitRequest(event) {
    event.preventDefault()
    const limit = readAmount(event.currentTarget, 'limit')

    if (!linkedNumber) {
      showMessage('request', 'error', 'Selecciona la cuenta asociada.')
      return
    }

    if (!isValidLimit(limit)) {
      showMessage('request', 'error', limitRangeText)
      return
    }

    setSending(true)
    try {
      onIssued(await solicitarTarjeta(account.username, linkedNumber, limit))
      showMessage('purchase', 'success', 'Tarjeta aprobada. Ya puedes usarla.')
    } catch (requestError) {
      showMessage('request', 'error', requestError.message)
    } finally {
      setSending(false)
    }
  }

  function updatePurchasePlan(event) {
    const { amount, installments } = event.currentTarget.elements
    const capital = parseMoney(amount.value)
    const count = Number(installments.value)
    setPurchasePlan(capital > 0 && isValidInstallments(count) ? installmentPlan(capital, count) : null)
  }

  function submitPurchase(event) {
    event.preventDefault()
    const form = event.currentTarget
    const merchant = String(new FormData(form).get('merchant')).trim().replace(/\s+/g, ' ')
    const amount = readAmount(form)
    const installments = Number(new FormData(form).get('installments'))

    if (merchant.length < 2) {
      showMessage('purchase', 'error', 'Ingresa el nombre del comercio.')
      return
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      showMessage('purchase', 'error', 'Ingresa un monto entero mayor que cero.')
      return
    }

    if (!isValidInstallments(installments)) {
      showMessage('purchase', 'error', `El número de cuotas debe estar entre 1 y ${MAX_INSTALLMENTS}.`)
      return
    }

    const plan = installmentPlan(amount, installments)
    if (plan.total > availableCredit(card)) {
      showMessage('purchase', 'error', `Cupo insuficiente. Disponible: ${formatMoney(availableCredit(card))}; esta compra con intereses suma ${formatMoney(plan.total)}.`)
      return
    }

    onPurchase(merchant, amount, installments)
    showMessage('purchase', 'success', `Compra en ${merchant}: ${installments} ${installments === 1 ? 'cuota' : 'cuotas'} de ${formatMoney(plan.payment)} (total ${formatMoney(plan.total)}).`)
    form.reset()
    setPurchasePlan(null)
  }

  function submitPayment(event) {
    event.preventDefault()
    const form = event.currentTarget
    const amount = readAmount(form)

    if (!payFrom) {
      showMessage('payment', 'error', 'Selecciona la cuenta desde la que pagas.')
      return
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      showMessage('payment', 'error', 'Ingresa un monto entero mayor que cero.')
      return
    }

    if (amount > card.debt) {
      showMessage('payment', 'error', `El pago no puede ser mayor a la deuda (${formatMoney(card.debt)}).`)
      return
    }

    if (amount > payFrom.balance) {
      showMessage('payment', 'error', 'No tienes saldo suficiente en esa cuenta.')
      return
    }

    onPayment(payFrom.accountNumber, amount)
    showMessage('payment', 'success', `Pago de ${formatMoney(amount)} realizado.`)
    form.reset()
  }

  function confirmBlock() {
    onBlock()
    setConfirming(null)
    showMessage('manage', 'success', 'Tarjeta bloqueada. Ya no permite compras.')
  }

  async function confirmCancel() {
    setSending(true)
    try {
      await cancelarTarjeta(account.username)
      onCanceled()
      showMessage('request', 'success', 'Tarjeta cancelada. Puedes solicitar una nueva cuando quieras.')
    } catch (requestError) {
      showMessage('manage', 'error', requestError.message)
    } finally {
      setSending(false)
      setConfirming(null)
    }
  }

  if (!card) {
    return (
      <form className="op-card" onSubmit={submitRequest}>
        <h4>Solicitar tarjeta de crédito</h4>
        {renderMessage('request')}
        <AccountPicker id="card-account" label="Cuenta asociada" bankAccounts={bankAccounts} value={linkedNumber} onChange={setLinkedNumber} />
        <div className="form-group">
          <label htmlFor="card-limit">Cupo solicitado (COP)</label>
          <input id="card-limit" className="form-control" name="limit" type="text" inputMode="numeric" autoComplete="off" placeholder={`Entre ${formatMoney(CARD_LIMIT_MIN)} y ${formatMoney(CARD_LIMIT_MAX)}`} onInput={formatMoneyInput} required />
        </div>
        <button className="btn-action" type="submit" disabled={sending}>{sending ? 'Solicitando...' : 'Solicitar tarjeta'}</button>
      </form>
    )
  }

  const expired = isCardExpired(card)
  const status = !card.active ? 'Bloqueada' : expired ? 'Vencida' : 'Activa'
  const linkedAccount = bankAccounts.find((bankAccount) => bankAccount.accountNumber === card.accountNumber)
  const transactions = [...(card.transactions ?? [])].reverse()
  const due = monthlyDue(card)

  return (
    <>
      <div className={`bank-card credit-card-visual ${status !== 'Activa' ? 'inactive' : ''}`}>
        <div className="card-chip" />
        <div className="card-number">{maskedCardNumber(card)}</div>
        <div className="card-footer">
          <div>
            <div className="card-holder-label">Titular · Vence {cardExpiry(card)}</div>
            <div className="card-holder-name">{account.fullName}</div>
          </div>
          <div>
            <div className="card-brand-name">Mi<span>Plata</span></div>
            <div className="card-brand-sub">Tarjeta de crédito</div>
          </div>
        </div>
      </div>
      {linkedAccount && <p className="panel-balance">Cuenta asociada: <strong>{accountLabel(linkedAccount)}</strong></p>}

      <div className="saldo-stats">
        <article className="saldo-stat-card">
          <div className="saldo-stat-icon" aria-hidden="true">$</div>
          <div className="saldo-stat-body"><div className="saldo-stat-label">Cupo disponible</div><div className="saldo-stat-value c-green">{formatMoney(availableCredit(card))}</div></div>
        </article>
        <article className="saldo-stat-card">
          <div className="saldo-stat-icon gold" aria-hidden="true">◆</div>
          <div className="saldo-stat-body"><div className="saldo-stat-label">Deuda actual</div><div className="saldo-stat-value">{formatMoney(card.debt)}</div></div>
        </article>
        <article className="saldo-stat-card">
          <div className="saldo-stat-icon" aria-hidden="true">≡</div>
          <div className="saldo-stat-body"><div className="saldo-stat-label">Cupo total</div><div className="saldo-stat-value">{formatMoney(card.limit)}</div></div>
        </article>
        <article className="saldo-stat-card">
          <div className={`saldo-stat-icon ${status === 'Activa' ? '' : 'gold'}`} aria-hidden="true">●</div>
          <div className="saldo-stat-body"><div className="saldo-stat-label">Estado</div><div className={`saldo-stat-value ${status === 'Activa' ? 'c-green' : 'c-warn'}`}>{status}</div></div>
        </article>
      </div>

      <div className="profile-grid">
        <form className="op-card" onSubmit={submitPurchase} onChange={updatePurchasePlan}>
          <h4>Registrar compra</h4>
          {renderMessage('purchase')}
          {status === 'Activa' ? (
            <>
              <div className="form-group">
                <label htmlFor="card-merchant">Comercio</label>
                <input id="card-merchant" className="form-control" name="merchant" type="text" autoComplete="off" placeholder="Ej: Supermercado" maxLength={40} required />
              </div>
              <div className="form-group">
                <label htmlFor="card-purchase-amount">Monto (COP)</label>
                <input id="card-purchase-amount" className="form-control" name="amount" type="text" inputMode="numeric" autoComplete="off" placeholder="Ej: $ 50.000" onInput={formatMoneyInput} required />
              </div>
              <div className="form-group">
                <label htmlFor="card-installments">Número de cuotas</label>
                <input id="card-installments" className="form-control" name="installments" type="text" inputMode="numeric" autoComplete="off" placeholder={`De 1 a ${MAX_INSTALLMENTS}`} defaultValue="1" maxLength={2} onInput={onlyDigits} required />
              </div>
              <p className="transfer-note">Hasta {INTEREST_FREE_INSTALLMENTS} cuotas sin interés. Desde {INTEREST_FREE_INSTALLMENTS + 1} cuotas, interés del {formatRate(MONTHLY_RATE)} mensual.</p>
              {purchasePlan && (
                <div className="cuota-preview">
                  <div className="cp-label">Cuota mensual</div>
                  <div className="cp-value">{formatMoney(purchasePlan.payment)}</div>
                  <div className="cp-detail">
                    {purchasePlan.installments} {purchasePlan.installments === 1 ? 'cuota' : 'cuotas'} · {purchasePlan.rate ? `interés ${formatRate(purchasePlan.rate)} mensual` : 'sin interés'}
                  </div>
                  <div className="cp-detail">Intereses: {formatMoney(purchasePlan.interest)} · Total a pagar: {formatMoney(purchasePlan.total)}</div>
                </div>
              )}
              <button className="btn-action" type="submit">Registrar compra</button>
            </>
          ) : (
            <p className="dashboard-empty">La tarjeta está {status.toLowerCase()}: no permite compras.</p>
          )}
        </form>

        <form className="op-card" onSubmit={submitPayment}>
          <h4>Pagar tarjeta</h4>
          {renderMessage('payment')}
          {card.debt > 0 ? (
            <>
              <AccountPicker id="card-pay-from" label="Pagar desde" bankAccounts={bankAccounts} value={payFromNumber} onChange={setPayFromNumber} />
              {payFrom && <p className="panel-balance">Saldo disponible: <strong>{formatMoney(payFrom.balance)}</strong></p>}
              <div className="form-group">
                <label htmlFor="card-payment-amount">Monto a pagar (COP)</label>
                <input id="card-payment-amount" className="form-control" name="amount" type="text" inputMode="numeric" autoComplete="off" placeholder={`Deuda: ${formatMoney(card.debt)}`} onInput={formatMoneyInput} required />
              </div>
              {due > 0 && (
                <button
                  className="btn-action secondary"
                  type="button"
                  onClick={(event) => { event.currentTarget.form.elements.amount.value = formatMoney(due) }}
                >
                  Pagar cuota del mes ({formatMoney(due)})
                </button>
              )}
              <button className="btn-action" type="submit">Pagar</button>
            </>
          ) : (
            <p className="dashboard-empty">No tienes deuda pendiente.</p>
          )}
        </form>
      </div>

      <div className="profile-grid">
        <div className="op-card">
          <h4>Administrar tarjeta</h4>
          {renderMessage('manage')}
          {confirming === 'block' && (
            <>
              <p className="transfer-note">Una tarjeta bloqueada no se puede desbloquear. Podrás seguir pagando la deuda.</p>
              <button className="btn-action danger" type="button" onClick={confirmBlock}>Sí, bloquear tarjeta</button>
              <button className="btn-action secondary" type="button" onClick={() => setConfirming(null)}>Volver</button>
            </>
          )}
          {confirming === 'cancel' && (
            <>
              <p className="transfer-note">La tarjeta se elimina definitivamente. Después podrás solicitar una nueva.</p>
              <button className="btn-action danger" type="button" onClick={confirmCancel} disabled={sending}>{sending ? 'Cancelando...' : 'Sí, cancelar tarjeta'}</button>
              <button className="btn-action secondary" type="button" onClick={() => setConfirming(null)}>Volver</button>
            </>
          )}
          {!confirming && (
            <>
              {card.active && <button className="btn-action secondary" type="button" onClick={() => setConfirming('block')}>Bloquear tarjeta</button>}
              <button className="btn-action danger" type="button" onClick={() => setConfirming('cancel')} disabled={card.debt > 0}>Cancelar tarjeta</button>
              {card.debt > 0 && <p className="transfer-note card-manage-note">Para cancelar la tarjeta primero paga toda la deuda.</p>}
            </>
          )}
        </div>
      </div>

      <h3 className="saldo-section-title card-movements-title">Movimientos de la tarjeta</h3>
      {transactions.length ? (
        <div className="movements-list">
          {transactions.map((transaction) => {
            const isPayment = transaction.type === 'card-payment'
            return (
              <article className="mv-item" key={transaction.id}>
                <div className={`mv-icon ${isPayment ? 'credit' : 'tc'}`} aria-hidden="true">{isPayment ? '+' : '−'}</div>
                <div className="mv-details">
                  <div className="mv-desc">{transaction.description}</div>
                  <div className="mv-date">
                    {new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(transaction.date))}
                    {transaction.installments && ` · ${transaction.installments} × ${formatMoney(transaction.monthlyPayment)}`}
                  </div>
                </div>
                <div className="mv-amount">
                  <div className={`mv-val ${isPayment ? 'credit' : 'debit'}`}>{isPayment ? '+' : '−'}{formatMoney(transaction.amount)}</div>
                  <div className="mv-saldo">Deuda: {formatMoney(transaction.debtAfter)}</div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="dashboard-empty">Aún no tienes movimientos en la tarjeta.</p>
      )}
    </>
  )
}
