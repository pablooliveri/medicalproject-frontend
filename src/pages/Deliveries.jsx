import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { deliveriesAPI, residentsAPI, reportsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEye, FiFileText, FiTruck, FiSearch } from 'react-icons/fi';
import Pagination from '../components/common/Pagination';
import usePagination from '../hooks/usePagination';

const Deliveries = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [residents, setResidents] = useState([]);
  const [filterResident, setFilterResident] = useState('');
  const [loading, setLoading] = useState(true);
  const { paginatedData: paginatedDeliveries, currentPage, rowsPerPage, totalItems, handlePageChange, handleRowsPerPageChange } = usePagination(deliveries);

  useEffect(() => { fetchData(); }, [filterResident]);

  const fetchData = async () => {
    try {
      const [delRes, resRes] = await Promise.all([
        deliveriesAPI.getAll(filterResident ? { residentId: filterResident } : {}),
        residentsAPI.getAll({ isActive: true })
      ]);
      setDeliveries(delRes.data);
      setResidents(resRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (deliveryId) => {
    try {
      const response = await reportsAPI.deliveryReport(deliveryId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('deliveries.title')}</h1>
        <Link to="/deliveries/new" className="btn btn-primary"><FiPlus /> {t('deliveries.newDelivery')}</Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="form-group">
          <select className="form-control" value={filterResident} onChange={(e) => setFilterResident(e.target.value)} style={{ maxWidth: 400 }}>
            <option value="">{t('app.all')} {t('nav.residents')}</option>
            {residents.map(r => <option key={r._id} value={r._id}>{r.firstName} {r.lastName}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {deliveries.length === 0 ? (
            <div className="empty-state"><FiTruck className="empty-state-icon" /><h3>{t('deliveries.noDeliveries')}</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('deliveries.deliveryDate')}</th>
                    <th>{t('dashboard.residentName')}</th>
                    <th>{t('deliveries.deliveredBy')}</th>
                    <th>{t('deliveries.totalItems')}</th>
                    <th>{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.map(d => (
                    <tr key={d._id}>
                      <td>{new Date(d.deliveryDate).toLocaleDateString()}</td>
                      <td>{d.resident ? `${d.resident.firstName} ${d.resident.lastName}` : 'N/A'}</td>
                      <td>{d.deliveredBy}</td>
                      <td>{d.items?.length || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/deliveries/${d._id}`)}><FiEye /></button>
                          <button className="btn btn-sm btn-secondary" onClick={() => generatePDF(d._id)}><FiFileText /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                totalItems={totalItems}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deliveries;
