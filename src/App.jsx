import { useEffect, useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage.jsx';
import LoginPage from './Pages/LoginPage.jsx';
import RegisterPage from './Pages/RegisterPage.jsx';
import DashboardPage from './Pages/DashboardPage.jsx';

// La sesión se guarda en sessionStorage para que recargar /dashboard/consignar
// no saque al usuario; se borra sola al cerrar la pestaña.
const SESSION_KEY = 'miplata-session';

function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (Array.isArray(saved?.accounts)) return saved;
  } catch {
    // sessionStorage no disponible o con datos dañados: se empieza sin sesión
  }
  return { accounts: [], currentUsername: null };
}

export default function App() {
  const [accounts, setAccounts] = useState(() => readSession().accounts);
  const [currentUsername, setCurrentUsername] = useState(() => readSession().currentUsername);
  const currentAccount = accounts.find((account) => account.username === currentUsername);

  useEffect(() => {
    try {
      if (currentUsername) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ accounts, currentUsername }));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // si no se puede guardar, la app sigue funcionando en memoria
    }
  }, [accounts, currentUsername]);

  function handleDeposit(username, amount) {
    const date = new Date().toISOString();
    const id = `${Date.now()}-${Math.random()}`;

    setAccounts((current) => current.map((account) => {
      if (account.username !== username) return account;
      const balance = account.balance + amount;
      return {
        ...account,
        balance,
        transactions: [...(account.transactions ?? []), {
          id,
          type: 'deposit',
          description: 'Consignación',
          amount,
          balanceAfter: balance,
          date,
        }],
      };
    }));
  }

  function handleWithdraw(username, amount) {
    const date = new Date().toISOString();
    const id = `${Date.now()}-${Math.random()}`;

    setAccounts((current) => current.map((account) => {
      if (account.username !== username) return account;
      const balance = account.balance - amount;
      return {
        ...account,
        balance,
        transactions: [...(account.transactions ?? []), {
          id,
          type: 'withdrawal',
          description: 'Retiro',
          amount,
          balanceAfter: balance,
          date,
        }],
      };
    }));
  }

  function handleTransfer(fromUsername, toUsername, amount) {
    const date = new Date().toISOString();
    const id = `${Date.now()}-${Math.random()}`;

    setAccounts((current) => current.map((account) => {
      if (account.username === fromUsername) {
        const balance = account.balance - amount;
        return {
          ...account,
          balance,
          transactions: [...(account.transactions ?? []), {
            id: `${id}-out`,
            type: 'transfer-out',
            description: `Transferencia a ${toUsername}`,
            amount,
            balanceAfter: balance,
            date,
          }],
        };
      }

      if (account.username === toUsername) {
        const balance = account.balance + amount;
        return {
          ...account,
          balance,
          transactions: [...(account.transactions ?? []), {
            id: `${id}-in`,
            type: 'transfer-in',
            description: `Transferencia de ${fromUsername}`,
            amount,
            balanceAfter: balance,
            date,
          }],
        };
      }

      return account;
    }));
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={(account) => {
              // la cuenta viene de la BD; se guarda en memoria para que el dashboard la use
              setAccounts((current) => [...current.filter((existing) => existing.username !== account.username), account]);
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
            onDeposit={(amount) => handleDeposit(currentUsername, amount)}
            onWithdraw={(amount) => handleWithdraw(currentUsername, amount)}
            onTransfer={(toUsername, amount) => handleTransfer(currentUsername, toUsername, amount)}
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
