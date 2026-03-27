import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { superAdminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { sid } from '../../utils/session';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';

const InstitutionDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState(null);
  const [subForm, setSubForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [editUsernames, setEditUsernames] = useState({});
  const [editPasswords, setEditPasswords] = useState({});

  const fetchInstitution = async () => {
    try {
      const res = await superAdminAPI.getInstitution(id);
      setInstitution(res.data);
      setSubForm({
        subscriptionStatus: res.data.subscriptionStatus || 'active',
        subscriptionStartDate: res.data.subscriptionStartDate ? res.data.subscriptionStartDate.split('T')[0] : '',
        subscriptionEndDate: res.data.subscriptionEndDate ? res.data.subscriptionEndDate.split('T')[0] : ''
      });
    } catch (error) {
      toast.error('Error loading institution');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstitution(); }, [id]);

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.updateSubscription(id, subForm);
      toast.success(t('admin.saved', 'Saved'));
      fetchInstitution();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = institution.subscriptionStatus === 'blocked' ? 'active' : 'blocked';
      await superAdminAPI.updateStatus(id, { subscriptionStatus: newStatus, isActive: newStatus !== 'blocked' });
      toast.success(t('admin.statusUpdated', 'Status updated'));
      fetchInstitution();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleUpdateUser = async (userId, originalUsername) => {
    const newUsername = editUsernames[userId];
    const newPassword = editPasswords[userId];
    const usernameChanged = newUsername && newUsername.trim() !== '' && newUsername !== originalUsername;
    const passwordEntered = newPassword && newPassword.trim() !== '';
    if (!usernameChanged && !passwordEntered) return;
    try {
      const payload = { userId };
      if (usernameChanged) payload.username = newUsername.trim();
      if (passwordEntered) payload.newPassword = newPassword.trim();
      await superAdminAPI.updateUser(id, payload);
      setEditPasswords(prev => ({ ...prev, [userId]: '' }));
      toast.success(t('admin.userUpdated', 'User updated successfully'));
      fetchInstitution();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('admin.confirmDelete', 'Are you sure? This will delete ALL data for this institution. This action cannot be undone.'))) return;
    try {
      await superAdminAPI.deleteInstitution(id);
      toast.success(t('admin.deleted', 'Institution deleted'));
      navigate(sid('/admin/institutions'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  if (loading) return <div className="loading-screen">{t('app.loading', 'Loading...')}</div>;
  if (!institution) return <div className="empty-state"><p>{t('admin.notFound', 'Institution not found')}</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{institution.settings?.companyName || institution.name}</h1>
        <button className="btn btn-secondary" onClick={() => navigate(sid('/admin/institutions'))}>
          <FiArrowLeft /> {t('app.back', 'Back')}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{institution.stats?.residentsCount || 0}</div>
            <div className="stat-label">{t('admin.residents', 'Residents')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{institution.stats?.medicationsCount || 0}</div>
            <div className="stat-label">{t('admin.medications', 'Medications')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{institution.stats?.usersCount || 0}</div>
            <div className="stat-label">{t('admin.users', 'Users')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">
              <span className={`badge ${institution.subscriptionStatus === 'active' ? 'badge-success' : institution.subscriptionStatus === 'expired' ? 'badge-warning' : 'badge-danger'}`}>
                {institution.subscriptionStatus}
              </span>
            </div>
            <div className="stat-label">{t('admin.status', 'Status')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Institution Info (read-only, managed by institution admin via Settings) */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">{t('admin.institutionInfo', 'Institution Info')}</h3></div>
          <div className="card-body">
            {[
              { label: t('admin.name', 'Name'), value: institution.settings?.companyName || institution.name },
              { label: t('admin.contactEmail', 'Email'), value: institution.settings?.email || institution.contactEmail },
              { label: t('admin.contactPhone', 'Phone'), value: institution.settings?.phone || institution.contactPhone },
              { label: t('admin.address', 'Address'), value: institution.settings?.address || institution.address },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{label}</div>
                <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, minHeight: 20 }}>
                  {value || <span style={{ opacity: 0.3 }}>-</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription + Users + Danger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Subscription */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">{t('admin.subscription', 'Subscription')}</h3></div>
            <div className="card-body">
              <form onSubmit={handleSaveSubscription}>
                <div className="form-group">
                  <label className="form-label">{t('admin.status', 'Status')}</label>
                  <select className="form-control" value={subForm.subscriptionStatus} onChange={e => setSubForm({ ...subForm, subscriptionStatus: e.target.value })}>
                    <option value="active">{t('admin.active', 'Active')}</option>
                    <option value="expired">{t('admin.expired', 'Expired')}</option>
                    <option value="blocked">{t('admin.blocked', 'Blocked')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.startDate', 'Start Date')}</label>
                  <input type="date" className="form-control" value={subForm.subscriptionStartDate} onChange={e => setSubForm({ ...subForm, subscriptionStartDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.endDate', 'End Date')}</label>
                  <input type="date" className="form-control" value={subForm.subscriptionEndDate} min={new Date().toISOString().split('T')[0]} onChange={e => setSubForm({ ...subForm, subscriptionEndDate: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary"><FiSave /> {t('admin.save', 'Save')}</button>
              </form>
            </div>
          </div>

          {/* Users */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">{t('admin.users', 'Users')}</h3></div>
            <div className="card-body">
              {institution.users?.map(user => {
                const usernameChanged = editUsernames[user._id] !== undefined && editUsernames[user._id] !== user.username;
                const passwordEntered = editPasswords[user._id] && editPasswords[user._id].trim() !== '';
                const showSave = usernameChanged || passwordEntered;
                return (
                  <div key={user._id} style={{ marginBottom: 12, padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>{user.role} - {user.name}</div>
                    <div style={{ marginBottom: 8 }}>
                      <input
                        type="text"
                        className="form-control"
                        value={editUsernames[user._id] !== undefined ? editUsernames[user._id] : user.username}
                        onChange={e => setEditUsernames({ ...editUsernames, [user._id]: e.target.value })}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div style={{ marginBottom: showSave ? 8 : 0 }}>
                      <input type="text" className="form-control" placeholder={t('admin.newPassword', 'New password')} value={editPasswords[user._id] || ''} onChange={e => setEditPasswords({ ...editPasswords, [user._id]: e.target.value })} style={{ fontSize: 13 }} />
                    </div>
                    {showSave && (
                      <button className="btn btn-primary" onClick={() => handleUpdateUser(user._id, user.username)} style={{ padding: '6px 12px', fontSize: 13 }}>
                        <FiSave /> {t('admin.save', 'Save')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ borderColor: 'var(--danger)' }}>
            <div className="card-header"><h3 className="card-title" style={{ color: 'var(--danger)' }}>{t('admin.dangerZone', 'Danger Zone')}</h3></div>
            <div className="card-body" style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={handleToggleStatus}>
                {institution.subscriptionStatus === 'blocked'
                  ? t('admin.enable', 'Enable Institution')
                  : t('admin.block', 'Block Institution')}
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <FiTrash2 /> {t('admin.deleteInstitution', 'Delete Institution')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDetail;
