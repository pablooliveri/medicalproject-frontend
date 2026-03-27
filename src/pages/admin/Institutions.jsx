import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { superAdminAPI } from '../../services/api';
import { sid } from '../../utils/session';
import { FiPlus, FiSearch } from 'react-icons/fi';

const Institutions = () => {
  const { t } = useTranslation();
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchInstitutions = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await superAdminAPI.getInstitutions(params);
      setInstitutions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [search, statusFilter]);

  if (loading) return <div className="loading-screen">{t('app.loading', 'Loading...')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('admin.institutions', 'Institutions')}</h1>
        <Link to={sid("/admin/institutions/new")} className="btn btn-primary"><FiPlus /> {t('admin.addInstitution', 'Add Institution')}</Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input
                type="text"
                className="form-control"
                placeholder={t('admin.searchInstitutions', 'Search institutions...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180 }}>
              <option value="all">{t('admin.allStatuses', 'All Statuses')}</option>
              <option value="active">{t('admin.active', 'Active')}</option>
              <option value="expired">{t('admin.expired', 'Expired')}</option>
              <option value="blocked">{t('admin.blocked', 'Blocked')}</option>
            </select>
          </div>

          {institutions.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>{t('admin.noInstitutions', 'No institutions found')}</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('admin.name', 'Name')}</th>
                    <th>{t('admin.contactPhone', 'Phone')}</th>
                    <th>{t('admin.residents', 'Residents')}</th>
                    <th>{t('admin.status', 'Status')}</th>
                    <th>{t('admin.subscription', 'Subscription')}</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map(inst => (
                    <tr key={inst._id}>
                      <td>
                        <Link to={sid(`/admin/institutions/${inst._id}`)} style={{ fontWeight: 500, color: 'inherit', textDecoration: 'none' }}>
                          {inst.name}
                        </Link>
                      </td>
                      <td>{inst.contactPhone || '-'}</td>
                      <td>{inst.residentsCount || 0}</td>
                      <td>
                        <span className={`badge ${inst.subscriptionStatus === 'active' ? 'badge-success' : inst.subscriptionStatus === 'expired' ? 'badge-warning' : 'badge-danger'}`}>
                          {inst.subscriptionStatus}
                        </span>
                      </td>
                      <td>
                        {inst.subscriptionEndDate
                          ? new Date(inst.subscriptionEndDate).toLocaleDateString()
                          : t('admin.unlimited', 'Unlimited')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Institutions;
