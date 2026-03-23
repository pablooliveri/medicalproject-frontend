import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiUsers, FiPackage, FiTruck, FiBarChart2, FiFileText, FiDollarSign, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: <FiHome />, label: t('nav.dashboard'), end: true },
    { path: '/residents', icon: <FiUsers />, label: t('nav.residents') },
    { path: '/medications', icon: <FiPackage />, label: t('nav.medications') },
    { path: '/deliveries', icon: <FiTruck />, label: t('nav.deliveries') },
    { path: '/stock', icon: <FiBarChart2 />, label: t('nav.stock') },
    { path: '/reports', icon: <FiFileText />, label: t('nav.reports') },
    { path: '/billing', icon: <FiDollarSign />, label: t('nav.billing') },
    { path: '/settings', icon: <FiSettings />, label: t('nav.settings') },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">M</div>
        <div>
          <div className="sidebar-title">{t('app.title')}</div>
          <div className="sidebar-subtitle">{t('app.subtitle')}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
