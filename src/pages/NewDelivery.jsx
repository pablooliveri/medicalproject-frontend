import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { residentsAPI, residentMedicationsAPI, deliveriesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiUpload, FiSave, FiArrowLeft, FiImage } from 'react-icons/fi';

const NewDelivery = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [residentMeds, setResidentMeds] = useState([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ residentMedication: '', medication: '', quantity: '' }]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    residentsAPI.getAll({ isActive: true }).then(res => setResidents(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedResident) {
      residentMedicationsAPI.getAll({ residentId: selectedResident, isActive: true })
        .then(res => setResidentMeds(res.data))
        .catch(console.error);
    } else {
      setResidentMeds([]);
    }
  }, [selectedResident]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resident', selectedResident);
      formData.append('deliveredBy', deliveredBy);
      formData.append('deliveryDate', deliveryDate);
      formData.append('notes', notes);
      formData.append('items', JSON.stringify(items.filter(i => i.residentMedication && i.quantity)));

      if (photo) {
        formData.append('photos', photo);
      }

      await deliveriesAPI.create(formData);
      toast.success(t('deliveries.created'));
      navigate('/deliveries');
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/deliveries" className="btn btn-secondary btn-sm"><FiArrowLeft /></Link>
          <h1>{t('deliveries.newDelivery')}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title">{t('deliveries.deliveryDetails')}</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('dashboard.residentName')}</label>
                <select className="form-control" value={selectedResident} onChange={(e) => setSelectedResident(e.target.value)} required>
                  <option value="">{t('stock.selectResident')}</option>
                  {residents.map(r => <option key={r._id} value={r._id}>{r.firstName} {r.lastName}</option>)}
                </select>
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

        {/* Photo */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title"><FiImage style={{ marginRight: 8 }} /> {t('deliveries.photos')}</h3></div>
          <div className="card-body">
            {photoPreview && (
              <div style={{ marginBottom: 16 }}>
                <img src={photoPreview} alt="Preview" style={{ maxHeight: 150, borderRadius: 8, border: '1px solid var(--border)' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                setPhoto(file || null);
                setPhotoPreview(file ? URL.createObjectURL(file) : null);
              }} />
              {photoPreview && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
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

export default NewDelivery;
