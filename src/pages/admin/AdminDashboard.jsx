import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { superAdminAPI } from '../../services/api';
import { FiGrid, FiCheck, FiXCircle, FiClock, FiPlus } from 'react-icons/fi';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">{t('app.loading', 'Loading...')}</div>;

  const { stats, recentInstitutions, expiringInstitutions } = data || { stats: {}, recentInstitutions: [], expiringInstitutions: [] };

  return (
    <div>
      <div className="page-header">
        <h1>{t('admin.dashboard', 'Super Admin Dashboard')}</h1>
        <Link to="/admin/institutions/new" className="btn btn-primary"><FiPlus /> {t('admin.addInstitution', 'Add Institution')}</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><FiGrid /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">{t('admin.totalInstitutions', 'Total Institutions')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiCheck /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.active || 0}</div>
            <div className="stat-label">{t('admin.activeInstitutions', 'Active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><FiXCircle /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.blocked || 0}</div>
            <div className="stat-label">{t('admin.blockedInstitutions', 'Blocked')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiClock /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.expired || 0}</div>
            <div className="stat-label">{t('admin.expiredInstitutions', 'Expired')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('admin.recentInstitutions', 'Recently Created')}</h3>
          </div>
          <div className="card-body">
            {recentInstitutions.length === 0 ? (
              <p style={{ padding: 20, opacity: 0.6 }}>{t('admin.noInstitutions', 'No institutions yet')}</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('admin.name', 'Name')}</th>
                      <th>{t('admin.status', 'Status')}</th>
                      <th>{t('admin.createdAt', 'Created')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInstitutions.map(inst => (
                      <tr key={inst._id}>
                        <td><Link to={`/admin/institutions/${inst._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{inst.name}</Link></td>
                        <td><span className={`badge ${inst.subscriptionStatus === 'active' ? 'badge-success' : inst.subscriptionStatus === 'expired' ? 'badge-warning' : 'badge-danger'}`}>{inst.subscriptionStatus}</span></td>
                        <td>{new Date(inst.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('admin.expiringSoon', 'Expiring Soon')}</h3>
          </div>
          <div className="card-body">
            {expiringInstitutions.length === 0 ? (
              <p style={{ padding: 20, opacity: 0.6 }}>{t('admin.noExpiring', 'No upcoming expirations')}</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('admin.name', 'Name')}</th>
                      <th>{t('admin.expiresOn', 'Expires')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringInstitutions.map(inst => (
                      <tr key={inst._id}>
                        <td><Link to={`/admin/institutions/${inst._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{inst.name}</Link></td>
                        <td>{new Date(inst.subscriptionEndDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
