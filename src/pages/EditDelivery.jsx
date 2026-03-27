import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { residentsAPI, residentMedicationsAPI, deliveriesAPI, resolveFileUrl } from '../services/api';
import { sid } from '../utils/session';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiUpload, FiSave, FiArrowLeft, FiImage } from 'react-icons/fi';

const EditDelivery = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [residentMeds, setResidentMeds] = useState([]);
  const [residentName, setResidentName] = useState('');
  const [residentId, setResidentId] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState([{ residentMedication: '', medication: '', quantity: '' }]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhoto, setNewPhoto] = useState(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadDelivery();
  }, [id]);

  const loadDelivery = async () => {
    try {
      const res = await deliveriesAPI.getOne(id);
      const delivery = res.data;

      setResidentId(delivery.resident._id);
      setResidentName(`${delivery.resident.firstName} ${delivery.resident.lastName}`);
      setDeliveredBy(delivery.deliveredBy);
      setDeliveryDate(new Date(delivery.deliveryDate).toISOString().split('T')[0]);
      setNotes(delivery.notes || '');
      setExistingPhotos(delivery.photos || []);

      // Load resident medications to populate the dropdowns
      const medsRes = await residentMedicationsAPI.getAll({ residentId: delivery.resident._id, isActive: true });
      setResidentMeds(medsRes.data);

      // Map delivery items - include both active and the ones already in the delivery
      const mappedItems = delivery.items.map(item => ({
        residentMedication: item.residentMedication?._id || '',
        medication: item.medication?._id || '',
        quantity: item.quantity
      }));
      setItems(mappedItems.length > 0 ? mappedItems : [{ residentMedication: '', medication: '', quantity: '' }]);
    } catch (error) {
      toast.error(t('app.error'));
      navigate(sid('/deliveries'));
    } finally {
      setPageLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { residentMedication: '', medication: '', quantity: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'residentMedication') {
      const med = residentMeds.find(rm => rm._id === value);
      if (med) {
        updated[index].medication = med.medication._id;
      }
    }

    setItems(updated);
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotos(existingPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('deliveredBy', deliveredBy);
      formData.append('deliveryDate', deliveryDate);
      formData.append('notes', notes);
      formData.append('items', JSON.stringify(items.filter(i => i.residentMedication && i.quantity)));
      formData.append('existingPhotos', JSON.stringify(existingPhotos));

      if (newPhoto) {
        formData.append('photos', newPhoto);
      }

      await deliveriesAPI.update(id, formData);
      toast.success(t('deliveries.updated'));
      navigate(sid(`/deliveries/${id}`));
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="loading-screen">{t('app.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to={sid(`/deliveries/${id}`)} className="btn btn-secondary btn-sm"><FiArrowLeft /></Link>
          <h1>{t('deliveries.editDelivery')}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title">{t('deliveries.deliveryDetails')}</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('dashboard.residentName')}</label>
                <input className="form-control" value={residentName} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">{t('deliveries.deliveredBy')}</label>
                <input className="form-control" value={deliveredBy} onChange={(e) => setDeliveredBy(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('deliveries.deliveryDate')}</label>
                <input type="date" className="form-control" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">{t('deliveries.items')}</h3>
            <button type="button" className="btn btn-sm btn-primary" onClick={addItem}><FiPlus /> {t('deliveries.addItem')}</button>
          </div>
          <div className="card-body">
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label className="form-label">{t('deliveries.medication')}</label>
                  <select className="form-control" value={item.residentMedication} onChange={(e) => updateItem(index, 'residentMedication', e.target.value)} required>
                    <option value="">{t('residentMedications.selectMedication')}</option>
                    {residentMeds.map(rm => (
                      <option key={rm._id} value={rm._id}>
                        {rm.medication?.genericName} ({rm.dosageMg}{rm.medication?.dosageUnit}) - {t('stock.currentStock')}: {rm.currentStock}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">{t('deliveries.quantity')}</label>
                  <input type="number" min="1" className="form-control" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                </div>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(index)} style={{ marginBottom: 0 }}>
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Photos */}
        {existingPhotos.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3 className="card-title"><FiImage /> {t('deliveries.currentPhotos')}</h3></div>
            <div className="card-body">
              <div className="photo-gallery">
                {existingPhotos.map((photo, i) => (
                  <div className="photo-item" key={i} style={{ position: 'relative' }}>
                    <img src={resolveFileUrl(photo)} alt={`Photo ${i + 1}`} />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeExistingPhoto(i)}
                      style={{ position: 'absolute', top: 4, right: 4 }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Photo */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title"><FiImage style={{ marginRight: 8 }} /> {t('deliveries.addPhotos')}</h3></div>
          <div className="card-body">
            {newPhotoPreview && (
              <div style={{ marginBottom: 16 }}>
                <img src={newPhotoPreview} alt="Preview" style={{ maxHeight: 150, borderRadius: 8, border: '1px solid var(--border)' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                setNewPhoto(file || null);
                setNewPhotoPreview(file ? URL.createObjectURL(file) : null);
              }} />
              {newPhotoPreview && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { setNewPhoto(null); setNewPhotoPreview(null); }}>
                  <FiTrash2 /> {t('app.delete')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('deliveries.notes')}</label>
              <textarea className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          <FiSave /> {loading ? t('app.loading') : t('app.save')}
        </button>
      </form>
    </div>
  );
};

export default EditDelivery;
