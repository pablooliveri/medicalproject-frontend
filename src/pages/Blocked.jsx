import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiAlertCircle } from 'react-icons/fi';

const Blocked = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <FiAlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />
        <h2>{t('admin.accessDenied', 'Access Denied')}</h2>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>
          {t('admin.institutionBlocked', 'Your institution\'s access has been suspended. Please contact the administrator.')}
        </p>
        <button className="btn btn-primary" onClick={handleLogout}>
          {t('auth.logout', 'Logout')}
        </button>
      </div>
    </div>
  );
};

export default Blocked;
