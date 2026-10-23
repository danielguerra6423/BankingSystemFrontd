import { formatAccountNumber } from '../core/utils/inputFilters.js'

// Un usuario puede tener hasta una cuenta de cada tipo, guardadas en user.bankAccounts:
// [{ accountType, accountNumber, balance, transactions }]

export const ACCOUNT_TYPE_NAMES = { AH: 'Cuenta de Ahorros', CC: 'Cuenta Corriente' }

// Los usuarios guardados antes de tener varias cuentas (y los que devuelve el backend)
// traen una sola cuenta en accountType / accountNumber / balance / transactions.
export function withBankAccounts(user) {
  if (Array.isArray(user.bankAccounts)) return user
  const { accountType, accountNumber, balance, transactions, ...rest } = user
  return { ...rest, bankAccounts: [{ accountType, accountNumber, balance, transactions: transactions ?? [] }] }
}

// Cuenta de Ahorros · 1234-5678-90
export const accountLabel = (bankAccount) => `${ACCOUNT_TYPE_NAMES[bankAccount.accountType]} · ${formatAccountNumber(bankAccount.accountNumber)}`

// Cuenta de Ahorros ****7890
export const shortAccountLabel = (bankAccount) => `${ACCOUNT_TYPE_NAMES[bankAccount.accountType]} ****${bankAccount.accountNumber.slice(-4)}`
