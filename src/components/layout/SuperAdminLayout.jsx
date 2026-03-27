import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiSettings, FiLogOut } from 'react-icons/fi';
import { sid } from '../../utils/session';

const SuperAdminLayout = ({ children }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin', icon: <FiHome />, label: t('admin.dashboard', 'Dashboard'), end: true },
    { path: '/admin/institutions', icon: <FiGrid />, label: t('admin.institutions', 'Institutions') },
    { path: '/admin/settings', icon: <FiSettings />, label: t('admin.settings', 'Settings') },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ background: 'var(--danger)' }}>S</div>
          <div>
            <div className="sidebar-title">Super Admin</div>
            <div className="sidebar-subtitle">{t('admin.panel', 'Admin Panel')}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={sid(item.path)}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button
            className="nav-item"
            onClick={logout}
            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'inherit', font: 'inherit', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span className="nav-icon"><FiLogOut /></span>
            {t('auth.logout', 'Logout')}
          </button>
        </nav>
      </aside>
      <div className="main-content">
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
