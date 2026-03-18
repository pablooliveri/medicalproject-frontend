import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiSave, FiUpload, FiTrash2, FiImage } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://medicalproject-backend-production.up.railway.app';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    companyName: '', address: '', phone: '', email: '', lowStockThresholdDays: 5, language: 'en'
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettings({
        companyName: data.companyName || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        lowStockThresholdDays: data.lowStockThresholdDays || 5,
        language: data.language || 'en'
      });
      if (data.logo) setLogoPreview(`${API_URL}${data.logo}`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await settingsAPI.update(settings);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleLanguageChange = (lng) => {
    setSettings({ ...settings, language: lng });
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    settingsAPI.update({ language: lng }).catch(console.error);
  };

  const handleLogoUpload = async () => {
    if (!logo) return;
    try {
      const formData = new FormData();
      formData.append('logo', logo);
      const { data } = await settingsAPI.uploadLogo(formData);
      setLogoPreview(`${API_URL}${data.logo}`);
      setLogo(null);
      toast.success(t('settings.logoUploaded'));
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await settingsAPI.removeLogo();
      setLogoPreview(null);
      toast.success(t('settings.logoRemoved'));
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
        <button className="btn btn-primary" onClick={handleSave}><FiSave /> {t('app.save')}</button>
      </div>

      {/* General Settings */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title">{t('settings.general')}</h3></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">{t('settings.companyName')}</label>
            <input className="form-control" value={settings.companyName} onChange={(e) => setSettings({...settings, companyName: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('settings.address')}</label>
              <input className="form-control" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.phone')}</label>
              <input className="form-control" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.email')}</label>
              <input type="email" className="form-control" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title"><FiImage style={{ marginRight: 8 }} /> {t('settings.logo')}</h3></div>
        <div className="card-body">
          {logoPreview && (
            <div style={{ marginBottom: 16 }}>
              <img src={logoPreview} alt="Logo" style={{ maxHeight: 100, borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} />
            <button className="btn btn-primary btn-sm" onClick={handleLogoUpload} disabled={!logo}>
              <FiUpload /> {t('settings.uploadLogo')}
            </button>
            {logoPreview && (
              <button className="btn btn-danger btn-sm" onClick={handleRemoveLogo}>
                <FiTrash2 /> {t('settings.removeLogo')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title">{t('settings.alertSettings')}</h3></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">{t('settings.lowStockThreshold')}</label>
            <input type="number" className="form-control" style={{ maxWidth: 200 }} value={settings.lowStockThresholdDays} onChange={(e) => setSettings({...settings, lowStockThresholdDays: Number(e.target.value)})} min="1" />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">{t('settings.language')}</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className={`btn ${settings.language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleLanguageChange('en')}
            >
              {t('settings.english')}
            </button>
            <button
              className={`btn ${settings.language === 'es' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleLanguageChange('es')}
            >
              {t('settings.spanish')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
