import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { superAdminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft, FiCopy } from 'react-icons/fi';

const AddInstitution = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) {
      toast.error(t('admin.usernameRequired', 'Username is required'));
      return;
    }
    if (!form.password.trim()) {
      toast.error(t('admin.passwordRequired', 'Password is required'));
      return;
    }
    setLoading(true);
    try {
      const res = await superAdminAPI.createInstitution(form);
      setCredentials(res.data.credentials);
      toast.success(t('admin.institutionCreated', 'Institution created successfully'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating institution');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    toast.success(t('admin.copiedToClipboard', 'Copied to clipboard'));
  };

  if (credentials) {
    return (
      <div>
        <div className="page-header">
          <h1>{t('admin.institutionCreated', 'Institution Created')}</h1>
        </div>
        <div className="card" style={{ maxWidth: 500 }}>
          <div className="card-header">
            <h3 className="card-title">{t('admin.adminCredentials', 'Admin Credentials')}</h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: 16, opacity: 0.7 }}>
              {t('admin.saveCredentials', 'Save these credentials. The password cannot be retrieved later.')}
            </p>
            <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 8, marginBottom: 16, fontFamily: 'monospace' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{t('auth.username', 'Username')}:</strong> {credentials.username}
              </div>
              <div>
                <strong>{t('auth.password', 'Password')}:</strong> {credentials.password}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={copyCredentials}>
                <FiCopy /> {t('admin.copyCredentials', 'Copy')}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/institutions')}>
                {t('admin.goToInstitutions', 'Go to Institutions')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('admin.addInstitution', 'Add Institution')}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/institutions')}>
          <FiArrowLeft /> {t('app.back', 'Back')}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('auth.username', 'Username')} *</label>
              <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.password', 'Password')} *</label>
              <input type="text" className="form-control" name="password" value={form.password} onChange={handleChange} required />
            </div>
            <div style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FiSave /> {loading ? t('app.loading', 'Loading...') : t('admin.createInstitution', 'Create Institution')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddInstitution;
