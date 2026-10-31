import { formatAccountNumber } from '../core/utils/inputFilters.js'

// Un usuario puede tener hasta una cuenta de cada tipo, guardadas en user.bankAccounts:
// [{ accountType, accountNumber, balance, overdraft, transactions }]

export const ACCOUNT_TYPE_NAMES = { AH: 'Cuenta de Ahorros', CC: 'Cuenta Corriente' }

// La cuenta corriente puede quedar en negativo hasta el 20% del saldo con que se abrió
// (cupo fijo; mismo cálculo de CuentaMapper.PORCENTAJE_SOBREGIRO en el backend).
export const OVERDRAFT_RATE = 0.2
export const overdraftFor = (accountType, openingBalance) => (accountType === 'CC' ? Math.floor(openingBalance * OVERDRAFT_RATE) : 0)

// Lo que se puede usar en retiros, transferencias y pagos: saldo + sobregiro
export const availableBalance = (bankAccount) => bankAccount.balance + (bankAccount.overdraft ?? 0)

// Los usuarios guardados antes de tener varias cuentas (y los que devuelve el backend)
// traen una sola cuenta en accountType / accountNumber / balance / transactions.
export function withBankAccounts(user) {
  if (Array.isArray(user.bankAccounts)) return user
  const { accountType, accountNumber, balance, overdraft, transactions, ...rest } = user
  return { ...rest, bankAccounts: [{ accountType, accountNumber, balance, overdraft: overdraft ?? 0, transactions: transactions ?? [] }] }
}

// Cuenta de Ahorros · 1234-5678-90
export const accountLabel = (bankAccount) => `${ACCOUNT_TYPE_NAMES[bankAccount.accountType]} · ${formatAccountNumber(bankAccount.accountNumber)}`

// Cuenta de Ahorros ****7890
export const shortAccountLabel = (bankAccount) => `${ACCOUNT_TYPE_NAMES[bankAccount.accountType]} ****${bankAccount.accountNumber.slice(-4)}`
