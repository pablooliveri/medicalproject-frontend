import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationModal from '../notifications/NotificationModal';
import { FiBell, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { unreadCount, openModal, isModalOpen, closeModal } = useNotifications();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      logout();
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <span className="page-title">{t('dashboard.welcome')}, {user?.name || 'User'}</span>
        </div>
        <div className="navbar-right">
          <div className="language-switcher">
            <button
              className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              className={`lang-btn ${i18n.language === 'es' ? 'active' : ''}`}
              onClick={() => changeLanguage('es')}
            >
              ES
            </button>
          </div>

          <div className="notification-bell" onClick={openModal}>
            <FiBell className="bell-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <FiLogOut /> {t('auth.logout')}
          </button>
        </div>
      </header>

      {isModalOpen && <NotificationModal onClose={closeModal} />}
    </>
  );
};

export default Navbar;
