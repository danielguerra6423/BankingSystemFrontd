import { useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage.jsx';
import LoginPage from './Pages/LoginPage.jsx';
import RegisterPage from './Pages/RegisterPage.jsx';
import DashboardPage from './Pages/DashboardPage.jsx';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [currentUsername, setCurrentUsername] = useState(null);
  const currentAccount = accounts.find((account) => account.username === currentUsername);

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
            accounts={accounts}
            onLogin={setCurrentUsername}
          />
        }
      />
      <Route
        path="/registro"
        element={
          <RegisterPage
            accounts={accounts}
            onRegister={(account) => setAccounts((current) => [...current, account])}
          />
        }
      />
      <Route
        path="/dashboard"
        element={currentAccount ? (
          <DashboardPage
            account={currentAccount}
            accounts={accounts}
            onDeposit={(amount) => handleDeposit(currentUsername, amount)}
            onWithdraw={(amount) => handleWithdraw(currentUsername, amount)}
            onTransfer={(toUsername, amount) => handleTransfer(currentUsername, toUsername, amount)}
            onLogout={() => setCurrentUsername(null)}
          />
        ) : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
