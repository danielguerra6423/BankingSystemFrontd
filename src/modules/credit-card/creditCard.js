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

// Compras a cuotas: el usuario elige 1, 3, 6, 12, 24 o 36 cuotas. 1 cuota sin interés;
// las demás con interés del 1,8 % mensual y cuota fija (amortización francesa), igual
// que STarjetaCredito.planDeCuotas del backend. La deuda sube por el total con intereses.
// Ejemplo con $1.000.000: 3 cuotas +3,6 %, 6 +6,4 %, 12 +12,1 %, 24 +24 %, 36 +36,7 %.
export const INSTALLMENT_OPTIONS = [1, 3, 6, 12, 24, 36]
export const MONTHLY_RATE = 0.018

export const isValidInstallments = (installments) => INSTALLMENT_OPTIONS.includes(installments)

// { capital, installments, rate, payment, total, interest }
export function installmentPlan(capital, installments) {
  if (installments === 1) {
    return { capital, installments, rate: 0, payment: capital, total: capital, interest: 0 }
  }
  const rate = MONTHLY_RATE
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
