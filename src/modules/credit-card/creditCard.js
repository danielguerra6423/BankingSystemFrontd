// Tarjeta de crédito: una por usuario, en user.creditCard (o null si no tiene)
// { cardNumber, cvv, expiresAt, limit, debt, active, accountNumber, transactions }
// Mismas reglas que STarjetaCredito del backend: cupo disponible = límite - deuda.

export const CARD_LIMIT_MIN = 500_000
export const CARD_LIMIT_MAX = 20_000_000

export const availableCredit = (card) => card.limit - card.debt

export const isCardExpired = (card) => new Date(`${card.expiresAt}T23:59:59`) < new Date()

// •••• •••• •••• 3456
export const maskedCardNumber = (card) => `•••• •••• •••• ${card.cardNumber.slice(-4)}`

// MM/AA
export const cardExpiry = (card) => `${card.expiresAt.slice(5, 7)}/${card.expiresAt.slice(2, 4)}`

// Compras a cuotas: de 1 a 36. Hasta 3 cuotas sin interés; desde 4, interés mensual
// con cuota fija (amortización francesa). La deuda sube por el total con intereses.
export const MAX_INSTALLMENTS = 36
export const INTEREST_FREE_INSTALLMENTS = 3
export const MONTHLY_RATE = 0.019

export const isValidInstallments = (installments) => Number.isInteger(installments) && installments >= 1 && installments <= MAX_INSTALLMENTS

// { capital, installments, rate, payment, total, interest }
export function installmentPlan(capital, installments) {
  const rate = installments > INTEREST_FREE_INSTALLMENTS ? MONTHLY_RATE : 0
  if (!rate) {
    return { capital, installments, rate, payment: Math.ceil(capital / installments), total: capital, interest: 0 }
  }
  const payment = Math.ceil((capital * rate) / (1 - (1 + rate) ** -installments))
  const total = payment * installments
  return { capital, installments, rate, payment, total, interest: total - capital }
}

// 1,9%
export const formatRate = (rate) => `${(rate * 100).toLocaleString('es-CO')}%`

// Suma de las cuotas mensuales de las compras que aún tienen saldo pendiente
export function monthlyDue(card) {
  const due = (card.transactions ?? [])
    .filter((transaction) => transaction.type === 'card-purchase' && transaction.remaining > 0)
    .reduce((sum, purchase) => sum + Math.min(purchase.monthlyPayment, purchase.remaining), 0)
  return Math.min(due, card.debt)
}
