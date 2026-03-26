import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsAPI, resolveFileUrl } from '../services/api';
import { toast } from 'react-toastify';
import { FiSave, FiUpload, FiTrash2, FiImage, FiPlus, FiEdit, FiMapPin } from 'react-icons/fi';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const [settings, setSettings] = useState({
    companyName: '', address: '', phone: '', email: '', lowStockThresholdDays: 5, language: 'en'
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [editingBranch, setEditingBranch] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');

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
      setBranches(data.branches || []);
      if (data.logo) setLogoPreview(resolveFileUrl(data.logo));
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
      setLogoPreview(resolveFileUrl(data.logo));
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

  const handleAddBranch = async () => {
    if (!newBranch.trim()) return;
    try {
      const { data } = await settingsAPI.addBranch(newBranch.trim());
      setBranches(data.branches);
      setNewBranch('');
      toast.success(isEs ? 'Sucursal agregada' : 'Branch added');
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleUpdateBranch = async (oldName) => {
    if (!editBranchName.trim() || editBranchName.trim() === oldName) {
      setEditingBranch(null);
      return;
    }
    try {
      const { data } = await settingsAPI.updateBranch(oldName, editBranchName.trim());
      setBranches(data.branches);
      setEditingBranch(null);
      toast.success(isEs ? 'Sucursal actualizada' : 'Branch updated');
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDeleteBranch = async (name) => {
    if (!window.confirm(isEs ? `¿Eliminar sucursal "${name}"?` : `Delete branch "${name}"?`)) return;
    try {
      const { data } = await settingsAPI.deleteBranch(name);
      setBranches(data.branches);
      toast.success(isEs ? 'Sucursal eliminada' : 'Branch deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
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

      {/* Branches */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title"><FiMapPin style={{ marginRight: 8 }} /> {isEs ? 'Sucursales' : 'Branches'}</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="form-control"
              placeholder={isEs ? 'Nombre de nueva sucursal' : 'New branch name'}
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBranch()}
              style={{ maxWidth: 300 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAddBranch} disabled={!newBranch.trim()}>
              <FiPlus /> {isEs ? 'Agregar' : 'Add'}
            </button>
          </div>
          {branches.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>{isEs ? 'No hay sucursales' : 'No branches'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {branches.map((branch, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  {editingBranch === branch ? (
                    <>
                      <input
                        className="form-control"
                        value={editBranchName}
                        onChange={(e) => setEditBranchName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateBranch(branch);
                          if (e.key === 'Escape') setEditingBranch(null);
                        }}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleUpdateBranch(branch)}>
                        <FiSave />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingBranch(null)}>
                        {isEs ? 'Cancelar' : 'Cancel'}
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontWeight: 500 }}>{branch}</span>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setEditingBranch(branch); setEditBranchName(branch); }}>
                        <FiEdit />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBranch(branch)}>
                        <FiTrash2 />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
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
