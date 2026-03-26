import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { deliveriesAPI, reportsAPI, resolveFileUrl } from '../services/api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiFileText, FiImage, FiEdit2, FiTrash2 } from 'react-icons/fi';
import SortableHeader from '../components/common/SortableHeader';
import useSortableTable from '../hooks/useSortableTable';

const DeliveryDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const { sortedData: sortedItems, sortConfig, requestSort } = useSortableTable(delivery?.items || []);

  useEffect(() => {
    deliveriesAPI.getOne(id)
      .then(res => setDelivery(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const generatePDF = async () => {
    try {
      const response = await reportsAPI.deliveryReport(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('app.confirmDelete'))) return;
    try {
      await deliveriesAPI.delete(id);
      toast.success(t('deliveries.deleted'));
      navigate('/deliveries');
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;
  if (!delivery) return <div className="empty-state"><h3>{t('app.error')}</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/deliveries" className="btn btn-secondary btn-sm"><FiArrowLeft /></Link>
          <h1>{t('deliveries.deliveryDetails')}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={generatePDF}><FiFileText /> {t('deliveries.generatePDF')}</button>
          <Link to={`/deliveries/${id}/edit`} className="btn btn-secondary"><FiEdit2 /> {t('app.edit')}</Link>
          <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> {t('app.delete')}</button>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="form-row">
            <div><strong>{t('deliveries.deliveryDate')}:</strong> {new Date(delivery.deliveryDate).toLocaleDateString()}</div>
            <div><strong>{t('deliveries.deliveredBy')}:</strong> {delivery.deliveredBy}</div>
            <div><strong>{t('dashboard.residentName')}:</strong> {delivery.resident ? `${delivery.resident.firstName} ${delivery.resident.lastName}` : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title">{t('deliveries.items')}</h3></div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <SortableHeader label={t('deliveries.medication')} sortKey="medication.genericName" sortConfig={sortConfig} onSort={requestSort} />
                  <SortableHeader label={t('deliveries.quantity')} sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.medication?.genericName || 'N/A'}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Photos */}
      {delivery.photos && delivery.photos.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title"><FiImage /> {t('deliveries.photos')}</h3></div>
          <div className="card-body">
            <div className="photo-gallery">
              {delivery.photos.map((photo, i) => (
                <div className="photo-item" key={i}>
                  <img src={resolveFileUrl(photo)} alt={`Photo ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {delivery.notes && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">{t('deliveries.notes')}</h3></div>
          <div className="card-body"><p>{delivery.notes}</p></div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetail;
