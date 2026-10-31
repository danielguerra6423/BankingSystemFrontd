import { useEffect, useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import LandingPage from './modules/landing/LandingPage.jsx';
import LoginPage from './modules/auth/LoginPage.jsx';
import RegisterPage from './modules/auth/RegisterPage.jsx';
import DashboardPage from './modules/dashboard/DashboardPage.jsx';
import { USE_LOCAL_STORAGE, bloquearTarjeta, comprarConTarjeta, consignar, pagarTarjeta, retirar, transferir } from './modules/core/api/api.js';
import { readUsers, saveBalances, toPublicAccount } from './modules/core/api/localApi.js';
import { withBankAccounts } from './modules/accounts/bankAccounts.js';
import { installmentPlan } from './modules/credit-card/creditCard.js';

// Sesión del usuario (para que recargar /dashboard/consignar no lo saque):
//  - modo local: en localStorage, junto con los usuarios; dura hasta cerrar sesión.
//  - modo base de datos: en sessionStorage; se borra al cerrar la pestaña.
const SESSION_KEY = 'miplata-session';
const sessionStore = () => (USE_LOCAL_STORAGE ? localStorage : sessionStorage);

function loadLocalAccounts() {
  return readUsers().map(toPublicAccount);
}

function newMovement(type, description, amount) {
  return { id: `${Date.now()}-${Math.random()}`, type, description, amount, date: new Date().toISOString() };
}

// Suma o resta el movimiento en la cuenta accountNumber del usuario username y lo agrega a su historial
function addMovement(users, username, accountNumber, movement) {
  const isCredit = movement.type === 'deposit' || movement.type === 'transfer-in';
  return users.map((user) => (user.username !== username ? user : {
    ...user,
    bankAccounts: user.bankAccounts.map((bankAccount) => {
      if (bankAccount.accountNumber !== accountNumber) return bankAccount;
      const balance = bankAccount.balance + (isCredit ? movement.amount : -movement.amount);
      return { ...bankAccount, balance, transactions: [...(bankAccount.transactions ?? []), { ...movement, balanceAfter: balance }] };
    }),
  }));
}

// Aplica change(tarjeta) a la tarjeta de crédito del usuario username
function updateCard(users, username, change) {
  return users.map((user) => (user.username === username && user.creditCard ? { ...user, creditCard: change(user.creditCard) } : user));
}

// Una compra suma a la deuda de la tarjeta y un pago la resta. El pago abona al saldo
// pendiente (remaining) de las compras, de la más antigua a la más reciente.
function addCardMovement(card, movement) {
  const isPurchase = movement.type === 'card-purchase';
  const debt = card.debt + (isPurchase ? movement.amount : -movement.amount);
  let transactions = card.transactions ?? [];
  if (!isPurchase) {
    let left = movement.amount;
    transactions = transactions.map((transaction) => {
      if (transaction.type !== 'card-purchase' || !(transaction.remaining > 0) || !left) return transaction;
      const paid = Math.min(transaction.remaining, left);
      left -= paid;
      return { ...transaction, remaining: transaction.remaining - paid };
    });
  }
  return { ...card, debt, transactions: [...transactions, { ...movement, debtAfter: debt }] };
}

function readSession() {
  try {
    const saved = JSON.parse(sessionStore().getItem(SESSION_KEY));
    if (USE_LOCAL_STORAGE) return { accounts: loadLocalAccounts(), currentUsername: saved?.currentUsername ?? null };
    if (Array.isArray(saved?.accounts)) return { ...saved, accounts: saved.accounts.map(withBankAccounts) };
  } catch {
    // almacenamiento no disponible o con datos dañados: se empieza sin sesión
  }
  return { accounts: USE_LOCAL_STORAGE ? loadLocalAccounts() : [], currentUsername: null };
}

export default function App() {
  const [accounts, setAccounts] = useState(() => readSession().accounts);
  const [currentUsername, setCurrentUsername] = useState(() => readSession().currentUsername);
  const currentAccount = accounts.find((account) => account.username === currentUsername);

  useEffect(() => {
    try {
      // modo local: saldo y movimientos quedan guardados en localStorage
      if (USE_LOCAL_STORAGE) saveBalances(accounts);
      if (currentUsername) {
        const session = USE_LOCAL_STORAGE ? { currentUsername } : { accounts, currentUsername };
        sessionStore().setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStore().removeItem(SESSION_KEY);
      }
    } catch {
      // si no se puede guardar, la app sigue funcionando en memoria
    }
  }, [accounts, currentUsername]);

  // Modo base de datos: el backend guarda la operación y devuelve el usuario
  // actualizado, que reemplaza al de memoria (saldos, movimientos y tarjeta).
  // Las operaciones son async: si el backend responde con error, lo lanzan
  // y la sección que las llamó muestra el mensaje sin cambiar nada.
  function replaceAccount(updated) {
    setAccounts((current) => current.map((account) => (account.username === updated.username ? withBankAccounts(updated) : account)));
  }

  async function handleDeposit(username, accountNumber, amount) {
    if (!USE_LOCAL_STORAGE) {
      replaceAccount(await consignar(username, accountNumber, amount));
      return;
    }
    setAccounts((current) => addMovement(current, username, accountNumber, newMovement('deposit', 'Consignación', amount)));
  }

  async function handleWithdraw(username, accountNumber, amount) {
    if (!USE_LOCAL_STORAGE) {
      replaceAccount(await retirar(username, accountNumber, amount));
      return;
    }
    setAccounts((current) => addMovement(current, username, accountNumber, newMovement('withdrawal', 'Retiro', amount)));
  }

  // recipient: { username, accountNumber } si es una cuenta MiPlata (puede ser otra del mismo usuario),
  // o { bank, accountNumber } si es de otra entidad (en ese caso solo se descuenta el saldo de quien envía).
  // Además trae destinationType ('phone', 'AH' o 'CC') y destination, que es lo que recibe el backend.
  async function handleTransfer(fromUsername, fromAccountNumber, recipient, amount) {
    if (!USE_LOCAL_STORAGE) {
      replaceAccount(await transferir(fromUsername, fromAccountNumber, recipient, amount));
      return;
    }
    const isOwn = recipient.username === fromUsername;
    const last4 = (number) => `****${number.slice(-4)}`;
    let outDescription = `Transferencia a ${recipient.bank} ${last4(recipient.accountNumber)}`;
    if (isOwn) outDescription = `Transferencia a tu cuenta ${last4(recipient.accountNumber)}`;
    else if (recipient.username) outDescription = `Transferencia a ${recipient.username}`;
    const inDescription = isOwn ? `Transferencia desde tu cuenta ${last4(fromAccountNumber)}` : `Transferencia de ${fromUsername}`;
    const outMovement = newMovement('transfer-out', outDescription, amount);

    setAccounts((current) => {
      const next = addMovement(current, fromUsername, fromAccountNumber, outMovement);
      if (!recipient.username) return next;
      return addMovement(next, recipient.username, recipient.accountNumber, {
        ...newMovement('transfer-in', inDescription, amount),
        id: `${outMovement.id}-in`,
        date: outMovement.date,
      });
    });
  }

  // Agrega las cuentas recién abiertas sin tocar el saldo ni los movimientos de las que ya estaban
  function handleAccountOpened(updated) {
    setAccounts((current) => current.map((account) => {
      if (account.username !== updated.username) return account;
      const known = new Set(account.bankAccounts.map((bankAccount) => bankAccount.accountNumber));
      return { ...account, bankAccounts: [...account.bankAccounts, ...updated.bankAccounts.filter((bankAccount) => !known.has(bankAccount.accountNumber))] };
    }));
  }

  // Tarjeta de crédito. Modo base de datos: todo lo guarda el backend. Modo local:
  // solicitarla y cancelarla las guarda localApi.js; compras, pagos y bloqueo se
  // aplican aquí y se guardan con saveBalances, igual que los saldos.
  const cardActions = {
    onIssued: (updated) => (USE_LOCAL_STORAGE ? setAccounts((current) => current.map((account) => (
      account.username === updated.username && !account.creditCard ? { ...account, creditCard: updated.creditCard } : account
    ))) : replaceAccount(updated)),
    // la deuda sube por el total con intereses de la compra a cuotas
    onPurchase: async (merchant, capital, installments) => {
      if (!USE_LOCAL_STORAGE) {
        replaceAccount(await comprarConTarjeta(currentUsername, merchant, capital, installments));
        return;
      }
      setAccounts((current) => updateCard(current, currentUsername, (card) => {
        const plan = installmentPlan(capital, installments);
        return addCardMovement(card, {
          ...newMovement('card-purchase', `Compra en ${merchant}`, plan.total),
          capital,
          installments,
          monthlyPayment: plan.payment,
          remaining: plan.total,
        });
      }));
    },
    // el pago se descuenta de la cuenta elegida y se resta de la deuda
    onPayment: async (fromAccountNumber, amount) => {
      if (!USE_LOCAL_STORAGE) {
        replaceAccount(await pagarTarjeta(currentUsername, fromAccountNumber, amount));
        return;
      }
      setAccounts((current) => {
        const card = current.find((account) => account.username === currentUsername).creditCard;
        const payment = newMovement('card-payment', `Pago tarjeta de crédito ****${card.cardNumber.slice(-4)}`, amount);
        const paid = addMovement(current, currentUsername, fromAccountNumber, payment);
        return updateCard(paid, currentUsername, (paidCard) => addCardMovement(paidCard, {
          ...payment,
          id: `${payment.id}-tc`,
          description: `Pago desde cuenta ****${fromAccountNumber.slice(-4)}`,
        }));
      });
    },
    onBlock: async () => {
      if (!USE_LOCAL_STORAGE) {
        replaceAccount(await bloquearTarjeta(currentUsername));
        return;
      }
      setAccounts((current) => updateCard(current, currentUsername, (card) => ({ ...card, active: false })));
    },
    onCanceled: () => setAccounts((current) => current.map((account) => (
      account.username === currentUsername ? { ...account, creditCard: null } : account
    ))),
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={(account) => {
              // modo local: se recargan todas las cuentas (incluye las registradas después de abrir la app).
              // modo BD: la cuenta viene del backend y se agrega a las de memoria.
              setAccounts((current) => (USE_LOCAL_STORAGE
                ? loadLocalAccounts()
                : [...current.filter((existing) => existing.username !== account.username), withBankAccounts(account)]));
              setCurrentUsername(account.username);
            }}
          />
        }
      />
      <Route path="/registro" element={<RegisterPage />} />
      <Route
        path="/dashboard/:section?"
        element={currentAccount ? (
          <DashboardPage
            account={currentAccount}
            accounts={accounts}
            onDeposit={(accountNumber, amount) => handleDeposit(currentUsername, accountNumber, amount)}
            onWithdraw={(accountNumber, amount) => handleWithdraw(currentUsername, accountNumber, amount)}
            onTransfer={(fromAccountNumber, recipient, amount) => handleTransfer(currentUsername, fromAccountNumber, recipient, amount)}
            onAccountOpened={handleAccountOpened}
            cardActions={cardActions}
            onProfileUpdate={(changes) => setAccounts((current) => current.map((account) => (
              // solo celular y correo: saldo y movimientos siguen siendo los de memoria
              account.username === currentUsername ? { ...account, ...changes } : account
            )))}
            onLogout={() => setCurrentUsername(null)}
          />
        ) : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
