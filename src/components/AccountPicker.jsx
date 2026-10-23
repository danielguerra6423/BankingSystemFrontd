import { accountLabel } from '../bankAccounts.js'

// Selector de la cuenta con la que se hace la operación. Solo aparece si el usuario
// tiene más de una cuenta; con una sola, esa se usa directamente.
export default function AccountPicker({ id, label, bankAccounts, value, onChange }) {
  if (bankAccounts.length < 2) return null

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="form-control" value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="" disabled>Selecciona una cuenta</option>
        {bankAccounts.map((bankAccount) => (
          <option key={bankAccount.accountNumber} value={bankAccount.accountNumber}>{accountLabel(bankAccount)}</option>
        ))}
      </select>
    </div>
  )
}
