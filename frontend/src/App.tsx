import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import './App.css';
import srhLogo from './assets/SRH_Bildung.svg.webp';
import { strapiClient } from './tools/strapiClient';
import { UserContext } from './context/UserContext';
import type { CurrentUser } from './types';
import { LoginPage } from './pages/LoginPage';
import { ClubsPage } from './pages/ClubsPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { EventsPage } from './pages/EventsPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { SubmitEventPage } from './pages/SubmitEventPage';
import { SubmitClubPage } from './pages/SubmitClubPage';
import { SubmitArticlePage } from './pages/SubmitArticlePage';

const NAV: { label: string; to: string }[] = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Clubs', to: '/clubs' },
  { label: 'Articles', to: '/articles' },
];

function App() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const location = useLocation();
  const onLoginPage = location.pathname === '/login';
  const loggedIn = !!user;

  useEffect(() => {
    if (!strapiClient.isAuthenticated) {
      setCheckingSession(false);
      return;
    }
    strapiClient.me()
      .then(setUser)
      .catch(() => strapiClient.logout())
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <header className="header">
        <div className="header-logo">
          <img src={srhLogo} alt="SRH" className="header-logo-mark" />
          <span className="header-title">SRH Ambassadors</span>
        </div>

        <div className="header-right">
          <nav className="header-nav">
            {NAV.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {(loggedIn || !onLoginPage) && <span className="header-divider" />}

          {loggedIn ? (
            <NavLink to="/profile" className="profile-btn" aria-label="Profile">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <use href="/icons.svg#profile-icon" />
              </svg>
            </NavLink>
          ) : !onLoginPage ? (
            <NavLink to="/login" className="btn btn-primary">Sign in</NavLink>
          ) : null}
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/login" element={
            loggedIn
              ? <Navigate to="/" replace />
              : <LoginPage onLogin={setUser} />
          } />
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage loggedIn={loggedIn} />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/profile" element={
            loggedIn
              ? <ProfilePage />
              : <Navigate to="/login" replace />
          } />
          <Route path="/submit/event" element={
            loggedIn
              ? <SubmitEventPage />
              : <Navigate to="/login" replace />
          } />
          <Route path="/submit/club" element={
            loggedIn
              ? <SubmitClubPage />
              : <Navigate to="/login" replace />
          } />
          <Route path="/submit/article" element={
            loggedIn
              ? <SubmitArticlePage />
              : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </UserContext.Provider>
  );
}

export default App;
