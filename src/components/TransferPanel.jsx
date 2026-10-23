import { useState } from 'react'
import AccountPicker from './AccountPicker.jsx'
import { accountLabel } from '../bankAccounts.js'
import { PHONE_PATTERN, accountInputLength, formatAccountInput, formatAccountNumber, formatMoneyInput, onlyDigits, parseMoney } from '../inputFilters.js'

// Transferencias en dos pasos: formulario según el tipo de destino y luego confirmación.
// Si el usuario tiene varias cuentas, primero elige la cuenta de origen.
//  - celular en MiPlata: se busca el usuario por su celular; recibe en su primera cuenta.
//  - celular en Nequi o Daviplata: no se puede validar; solo se descuenta del saldo.
//  - ahorros / corriente en MiPlata: se busca por número de cuenta y debe coincidir el tipo
//    (puede ser otra cuenta del mismo usuario).
//  - ahorros / corriente en otro banco: no se puede validar; solo se descuenta del saldo.

const MIPLATA = 'MiPlata'
const OTHER_BANKS = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Scotiabank Colpatria',
  'Banco Caja Social',
  'Banco AV Villas',
  'Banco Agrario',
]

const WALLETS = ['Nequi', 'Daviplata']

const transferTypes = [
  { id: 'phone', label: 'Celular' },
  { id: 'AH', label: 'Cuenta de ahorros' },
  { id: 'CC', label: 'Cuenta corriente' },
]

const accountTypeNames = { AH: 'de ahorros', CC: 'corriente' }

export default function TransferPanel({ account, accounts, onTransfer, formatMoney }) {
  const { bankAccounts } = account
  const [sourceNumber, setSourceNumber] = useState(bankAccounts.length === 1 ? bankAccounts[0].accountNumber : '')
  const source = bankAccounts.find((bankAccount) => bankAccount.accountNumber === sourceNumber)
  const [type, setType] = useState(null)
  const [bank, setBank] = useState(MIPLATA)
  // transferencia validada que espera confirmación
  const [draft, setDraft] = useState(null)
  const [feedback, setFeedback] = useState(null)
  // al cambiarla se reinicia el formulario después de una transferencia
  const [formKey, setFormKey] = useState(0)
  const isExternal = bank !== MIPLATA

  function chooseType(id) {
    setType(id)
    setBank(MIPLATA)
    setFeedback(null)
    setFormKey((key) => key + 1)
  }

  // Devuelve { recipient, rows } para la confirmación, o un texto de error
  function buildRecipient(formData) {
    if (type === 'phone') {
      const phone = String(formData.get('phone')).trim()
      if (!PHONE_PATTERN.test(phone)) return 'El celular debe tener 10 dígitos y empezar por 3.'
      if (isExternal) {
        return {
          recipient: { bank, accountNumber: phone },
          rows: [['Celular', phone], ['Destino', bank]],
        }
      }
      if (phone === account.phone) return 'No puedes transferirte a tu propio celular. Para mover dinero entre tus cuentas usa el número de cuenta.'
      const target = accounts.find((candidate) => candidate.phone === phone && candidate.username !== account.username)
      if (!target) return 'No hay una cuenta MiPlata registrada con ese celular.'
      return {
        recipient: { username: target.username, accountNumber: target.bankAccounts[0].accountNumber },
        rows: [['Destinatario', target.fullName], ['Celular', phone], ['Banco', MIPLATA]],
      }
    }

    const accountNumber = String(formData.get('accountNumber')).replace(/\D/g, '')

    if (!isExternal) {
      if (!/^\d{10}$/.test(accountNumber)) return 'El número de cuenta MiPlata debe tener 10 dígitos.'
      if (accountNumber === source.accountNumber) return 'La cuenta de destino debe ser diferente a la de origen.'
      const target = accounts.find((candidate) => candidate.bankAccounts.some((bankAccount) => bankAccount.accountNumber === accountNumber))
      if (!target) return 'No encontramos una cuenta MiPlata con ese número.'
      const targetAccount = target.bankAccounts.find((bankAccount) => bankAccount.accountNumber === accountNumber)
      if (targetAccount.accountType !== type) return `El número no corresponde a una cuenta ${accountTypeNames[type]}.`
      return {
        recipient: { username: target.username, accountNumber },
        rows: [['Destinatario', target.username === account.username ? 'Tu cuenta' : target.fullName], [`Cuenta ${accountTypeNames[type]}`, formatAccountNumber(accountNumber)], ['Banco', MIPLATA]],
      }
    }

    if (!/^\d{6,20}$/.test(accountNumber)) return 'El número de cuenta debe tener entre 6 y 20 dígitos.'
    return {
      recipient: { bank, accountNumber },
      rows: [[`Cuenta ${accountTypeNames[type]}`, formatAccountNumber(accountNumber)], ['Banco', bank]],
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const amount = parseMoney(formData.get('amount'))

    if (!source) {
      setFeedback({ type: 'error', text: 'Selecciona la cuenta de origen.' })
      return
    }

    const result = buildRecipient(formData)
    if (typeof result === 'string') {
      setFeedback({ type: 'error', text: result })
      return
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: 'Ingresa un monto entero mayor que cero.' })
      return
    }

    if (amount > source.balance) {
      setFeedback({ type: 'error', text: 'No tienes saldo suficiente para esta transferencia.' })
      return
    }

    const fromRow = bankAccounts.length > 1 ? [['Desde', accountLabel(source)]] : []
    setFeedback(null)
    setDraft({ ...result, rows: [...fromRow, ...result.rows], amount, fromAccountNumber: source.accountNumber })
  }

  function confirmTransfer() {
    // el saldo pudo cambiar mientras se confirmaba
    const from = bankAccounts.find((bankAccount) => bankAccount.accountNumber === draft.fromAccountNumber)
    if (draft.amount > from.balance) {
      setDraft(null)
      setFeedback({ type: 'error', text: 'No tienes saldo suficiente para esta transferencia.' })
      return
    }

    onTransfer(draft.fromAccountNumber, draft.recipient, draft.amount)
    setDraft(null)
    setFormKey((key) => key + 1)
    setFeedback({ type: 'success', text: `Transferencia de ${formatMoney(draft.amount)} realizada.` })
  }

  return (
    <>
      {source && <p className="panel-balance">Saldo disponible: <strong>{formatMoney(source.balance)}</strong></p>}
      {feedback && <div className={`info-box ${feedback.type === 'error' ? 'warn' : 'info'}`} role="status">{feedback.text}</div>}

      {draft && (
        <div className="op-card">
          <h4>Confirma la transferencia</h4>
          <dl className="transfer-summary">
            {draft.rows.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
            <div className="transfer-summary-total"><dt>Monto</dt><dd>{formatMoney(draft.amount)}</dd></div>
          </dl>
          {draft.recipient.bank && <p className="transfer-note">El dinero se descuenta de tu saldo. MiPlata no puede verificar cuentas de otras entidades.</p>}
          <button className="btn-action" type="button" onClick={confirmTransfer}>Confirmar transferencia</button>
          <button className="btn-action secondary" type="button" onClick={() => setDraft(null)}>Volver</button>
        </div>
      )}

      {/* hidden mientras se confirma: así "Volver" conserva lo que se escribió */}
      <div className="op-card" hidden={Boolean(draft)}>
        <h4>Enviar dinero</h4>
        <AccountPicker id="transfer-source" label="Cuenta de origen" bankAccounts={bankAccounts} value={sourceNumber} onChange={setSourceNumber} />
        <div className="form-group">
          <span className="form-label" id="transfer-type-label">¿A qué tipo de cuenta envías?</span>
          <div className="transfer-types" role="group" aria-labelledby="transfer-type-label">
            {transferTypes.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`transfer-type ${type === option.id ? 'active' : ''}`}
                aria-pressed={type === option.id}
                onClick={() => chooseType(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {type && (
          <form key={formKey} onSubmit={handleSubmit}>
            {type === 'phone' ? (
              <>
                <div className="form-group">
                  <label htmlFor="transfer-wallet">Destino</label>
                  <select id="transfer-wallet" className="form-control" name="bank" value={bank} onChange={(event) => setBank(event.target.value)}>
                    <option value={MIPLATA}>{MIPLATA}</option>
                    {WALLETS.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="transfer-phone">Número de celular</label>
                  <input id="transfer-phone" className="form-control" name="phone" type="tel" inputMode="numeric" placeholder="Ej: 3001234567" minLength={10} maxLength={10} onInput={onlyDigits} required />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="transfer-bank">Banco</label>
                  <select id="transfer-bank" className="form-control" name="bank" value={bank} onChange={(event) => setBank(event.target.value)}>
                    <option value={MIPLATA}>{MIPLATA}</option>
                    {OTHER_BANKS.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="transfer-account-number">Número de cuenta</label>
                  <input
                    id="transfer-account-number"
                    className="form-control"
                    name="accountNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={isExternal ? 'Ej: 1234-5678-9012' : '0000-0000-00'}
                    minLength={accountInputLength(isExternal ? 6 : 10)}
                    maxLength={accountInputLength(isExternal ? 20 : 10)}
                    onInput={formatAccountInput}
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label htmlFor="transfer-amount">Monto a transferir (COP)</label>
              <input id="transfer-amount" className="form-control" name="amount" type="text" inputMode="numeric" autoComplete="off" placeholder="Ej: $ 50.000" onInput={formatMoneyInput} required />
            </div>
            <button className="btn-action" type="submit">Continuar</button>
          </form>
        )}
      </div>
    </>
  )
}
