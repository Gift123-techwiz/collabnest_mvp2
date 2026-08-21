import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../ui/Logo';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import './AppShell.scss';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/discover', label: 'Discover', icon: 'compass' },
  { to: '/my-projects', label: 'My Projects', icon: 'briefcase' },
  { to: '/applications', label: 'Applications', icon: 'file' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/signin', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="app-sidebar-top">
          <Logo to="/dashboard" size={26} />
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <Icon name="x" size={20} />
          </button>
        </div>

        <button className="btn btn-primary btn-block create-project-btn" onClick={() => navigate('/projects/new')}>
          <Icon name="plus" size={16} />
          New project
        </button>

        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-bottom">
          <NavLink to="/settings" className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}>
            <Icon name="settings" size={18} />
            Settings
          </NavLink>
          <button className="app-nav-link app-nav-logout" onClick={handleLogout}>
            <Icon name="logout" size={18} />
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="app-main">
        <header className="app-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>

          <div className="app-topbar-spacer" />

          <NotificationBell />

          <div className="user-menu-wrap">
            <button className="user-menu-trigger" onClick={() => setUserMenuOpen((o) => !o)}>
              <Avatar src={user?.profilePictureUrl} name={user?.fullName} size="sm" />
              <span className="user-menu-name">{user?.fullName?.split(' ')[0]}</span>
              <Icon name="chevronDown" size={14} />
            </button>
            {userMenuOpen && (
              <>
                <div className="user-menu-backdrop" onClick={() => setUserMenuOpen(false)} />
                <div className="user-menu-dropdown">
                  <button onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}>
                    <Icon name="user" size={16} /> View profile
                  </button>
                  <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}>
                    <Icon name="settings" size={16} /> Settings
                  </button>
                  <button onClick={handleLogout} className="danger">
                    <Icon name="logout" size={16} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
