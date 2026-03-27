import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { superAdminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiSave, FiKey, FiUser } from 'react-icons/fi';

const SuperAdminSettings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error(t('admin.passwordMismatch', 'Passwords do not match'));
      return;
    }
    if (newPassword && !currentPassword) {
      toast.error(t('admin.currentPasswordRequired', 'Current password is required'));
      return;
    }
    try {
      const data = {};
      if (username !== user?.username) data.username = username;
      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }
      if (Object.keys(data).length === 0) return;
      const res = await superAdminAPI.updateAccount(data);
      // Update localStorage with new username if changed
      if (data.username) {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        savedUser.username = data.username;
        localStorage.setItem('user', JSON.stringify(savedUser));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(res.data.message || t('admin.accountUpdated', 'Account updated'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('settings.title', 'Settings')}</h1>
      </div>

      {/* Language */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title">{t('settings.language', 'Language')}</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className={`btn ${i18n.language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleLanguageChange('en')}
            >
              {t('settings.english', 'English')}
            </button>
            <button
              className={`btn ${i18n.language === 'es' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleLanguageChange('es')}
            >
              {t('settings.spanish', 'Spanish')}
            </button>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="card">
        <div className="card-header"><h3 className="card-title"><FiUser style={{ marginRight: 8 }} /> {t('admin.account', 'Account')}</h3></div>
        <div className="card-body">
          <form onSubmit={handleUpdateAccount}>
            <div className="form-group">
              <label className="form-label">{t('auth.username', 'Username')}</label>
              <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} style={{ maxWidth: 400 }} />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />
            <div className="form-group">
              <label className="form-label">{t('admin.currentPassword', 'Current Password')}</label>
              <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ maxWidth: 400 }} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('admin.newPassword', 'New Password')}</label>
              <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ maxWidth: 400 }} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('admin.confirmPassword', 'Confirm New Password')}</label>
              <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ maxWidth: 400 }} />
            </div>
            <button type="submit" className="btn btn-primary"><FiSave /> {t('admin.save', 'Save')}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
