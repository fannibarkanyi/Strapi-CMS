import { useState } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import './App.css';
import { LoginPage } from './pages/LoginPage';
import { ClubsPage } from './pages/ClubsPage';
import { ArticlesPage } from './pages/ArticlesPage';

const NAV: { label: string; to: string }[] = [
  { label: 'Clubs', to: '/clubs' },
  { label: 'Articles', to: '/articles' },
];

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-mark" />
          <span className="header-title">SRH Ambassadors</span>
        </div>
        {loggedIn && (
          <nav className="header-nav">
            {NAV.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        {loggedIn ? (
          <span className="header-user">Logged in</span>
        ) : (
          <NavLink to="/login" className="btn btn-primary">Sign in</NavLink>
        )}
      </header>

      <main className="main">
        <Routes>
          <Route path="/login" element={
            loggedIn
              ? <Navigate to="/clubs" replace />
              : <LoginPage onLogin={() => setLoggedIn(true)} />
          } />
          <Route path="/clubs" element={
            loggedIn
              ? <ClubsPage loggedIn={loggedIn} />
              : <Navigate to="/login" replace />
          } />
          <Route path="/articles" element={
            loggedIn
              ? <ArticlesPage loggedIn={loggedIn} />
              : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to={loggedIn ? '/clubs' : '/login'} replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
