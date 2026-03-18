import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { residentsAPI, deliveriesAPI, reportsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiFileText, FiDownload, FiUser, FiTruck } from 'react-icons/fi';

const SUCURSALES = ['Casa 1', 'Casa 2', 'Casa 3'];

const Reports = () => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const [allResidents, setAllResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [sucursalFilter, setSucursalFilter] = useState('');
  const [selectedResidentDelivery, setSelectedResidentDelivery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [selectedResidentReport, setSelectedResidentReport] = useState('');

  useEffect(() => {
    residentsAPI.getAll().then(res => {
      setAllResidents(res.data);
      setFilteredResidents(res.data);
    }).catch(console.error);
  }, []);

  // Filter residents by sucursal
  useEffect(() => {
    if (sucursalFilter) {
      setFilteredResidents(allResidents.filter(r => r.sucursal === sucursalFilter));
    } else {
      setFilteredResidents(allResidents);
    }
    setSelectedResidentDelivery('');
    setSelectedResidentReport('');
    setSelectedDelivery('');
    setDeliveries([]);
  }, [sucursalFilter, allResidents]);

  useEffect(() => {
    if (selectedResidentDelivery) {
      deliveriesAPI.getAll({ residentId: selectedResidentDelivery })
        .then(res => setDeliveries(res.data))
        .catch(console.error);
    } else {
      setDeliveries([]);
    }
  }, [selectedResidentDelivery]);

  const generateDeliveryPDF = async () => {
    if (!selectedDelivery) return;
    try {
      const response = await reportsAPI.deliveryReport(selectedDelivery);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const generateResidentPDF = async () => {
    if (!selectedResidentReport) return;
    try {
      const response = await reportsAPI.residentReport(selectedResidentReport);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('reports.title')}</h1>
      </div>

      {/* Sucursal filter */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              {isEs ? 'Filtrar por Sucursal' : 'Filter by Branch'}
            </label>
            <select
              className="form-control"
              style={{ maxWidth: 250 }}
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
            >
              <option value="">{isEs ? 'Todas las Sucursales' : 'All Branches'}</option>
              {SUCURSALES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Delivery Report */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FiTruck style={{ marginRight: 8 }} /> {t('reports.deliveryReport')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">{t('reports.selectResident')}</label>
              <select className="form-control" value={selectedResidentDelivery} onChange={(e) => { setSelectedResidentDelivery(e.target.value); setSelectedDelivery(''); }}>
                <option value="">{t('reports.selectResident')}</option>
                {filteredResidents.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.firstName} {r.lastName} {r.sucursal ? `(${r.sucursal})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {deliveries.length > 0 && (
              <div className="form-group">
                <label className="form-label">{t('reports.selectDelivery')}</label>
                <select className="form-control" value={selectedDelivery} onChange={(e) => setSelectedDelivery(e.target.value)}>
                  <option value="">{t('reports.selectDelivery')}</option>
                  {deliveries.map(d => (
                    <option key={d._id} value={d._id}>
                      {new Date(d.deliveryDate).toLocaleDateString()} - {d.deliveredBy} ({d.items?.length} {isEs ? 'artículos' : 'items'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button className="btn btn-primary" onClick={generateDeliveryPDF} disabled={!selectedDelivery}>
              <FiDownload /> {t('reports.downloadPDF')}
            </button>
          </div>
        </div>

        {/* Resident Report */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FiUser style={{ marginRight: 8 }} /> {t('reports.residentReport')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">{t('reports.selectResident')}</label>
              <select className="form-control" value={selectedResidentReport} onChange={(e) => setSelectedResidentReport(e.target.value)}>
                <option value="">{t('reports.selectResident')}</option>
                {filteredResidents.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.firstName} {r.lastName} {r.sucursal ? `(${r.sucursal})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={generateResidentPDF} disabled={!selectedResidentReport}>
              <FiDownload /> {t('reports.downloadPDF')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
