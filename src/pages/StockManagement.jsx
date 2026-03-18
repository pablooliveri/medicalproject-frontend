import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { residentsAPI, stockAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { FiBarChart2, FiEdit, FiRefreshCw, FiClock } from 'react-icons/fi';
import Pagination from '../components/common/Pagination';
import usePagination from '../hooks/usePagination';

const StockManagement = () => {
  const { t } = useTranslation();
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [stockStatus, setStockStatus] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDeductConfirm, setShowDeductConfirm] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ residentMedicationId: '', medName: '', currentStock: 0, newStock: '', reason: '' });
  const [activeTab, setActiveTab] = useState('status');
  const { paginatedData: paginatedStatus, currentPage: statusPage, rowsPerPage: statusRowsPerPage, totalItems: statusTotal, handlePageChange: statusPageChange, handleRowsPerPageChange: statusRowsChange } = usePagination(stockStatus);
  const { paginatedData: paginatedMovements, currentPage: movementsPage, rowsPerPage: movementsRowsPerPage, totalItems: movementsTotal, handlePageChange: movementsPageChange, handleRowsPerPageChange: movementsRowsChange } = usePagination(movements);

  useEffect(() => {
    residentsAPI.getAll({ isActive: true }).then(res => setResidents(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedResident) {
      fetchStockData();
    }
  }, [selectedResident]);

  const fetchStockData = async () => {
    try {
      const [statusRes, movementsRes] = await Promise.all([
        stockAPI.getStatus(selectedResident),
        stockAPI.getMovements({ residentId: selectedResident, limit: 100 })
      ]);
      setStockStatus(statusRes.data);
      setMovements(movementsRes.data.movements || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openAdjust = (item) => {
    // Find the last adjustment movement for this medication to show previous reason
    const lastAdjustment = movements.find(
      m => {
        const rmId = typeof m.residentMedication === 'object' ? m.residentMedication?._id : m.residentMedication;
        return rmId === item._id && m.type === 'adjustment';
      }
    );
    setAdjustForm({
      residentMedicationId: item._id,
      medName: item.medication?.genericName || '',
      currentStock: item.currentStock,
      newStock: item.currentStock,
      reason: '',
      lastReason: lastAdjustment?.notes || null
    });
    setShowAdjust(true);
  };

  const handleAdjust = async () => {
    try {
      await stockAPI.adjust({
        residentMedicationId: adjustForm.residentMedicationId,
        newStock: Number(adjustForm.newStock),
        reason: adjustForm.reason
      });
      toast.success(t('stock.adjustmentSuccess'));
      setShowAdjust(false);
      fetchStockData();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleManualDeduction = async () => {
    try {
      await stockAPI.manualDeduction();
      toast.success(t('stock.deductionSuccess'));
      setShowDeductConfirm(false);
      if (selectedResident) fetchStockData();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const getCoverageClass = (days) => {
    if (days === null) return '';
    if (days > 10) return 'coverage-good';
    if (days >= 5) return 'coverage-warning';
    return 'coverage-danger';
  };

  const getTypeBadge = (type) => {
    const classes = { delivery: 'badge-success', daily_deduction: 'badge-info', adjustment: 'badge-warning', initial: 'badge-secondary' };
    return classes[type] || 'badge-secondary';
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('stock.title')}</h1>
        <button className="btn btn-warning" onClick={() => setShowDeductConfirm(true)}>
          <FiRefreshCw /> {t('stock.manualDeduction')}
        </button>
      </div>

      <div className="form-group" style={{ maxWidth: 400, marginBottom: 24 }}>
        <select className="form-control" value={selectedResident} onChange={(e) => setSelectedResident(e.target.value)}>
          <option value="">{t('stock.selectResident')}</option>
          {residents.map(r => <option key={r._id} value={r._id}>{r.firstName} {r.lastName}</option>)}
        </select>
      </div>

      {selectedResident && (
        <>
          <div className="tabs">
            <button className={`tab ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
              <FiBarChart2 style={{ marginRight: 6 }} /> {t('stock.status')}
            </button>
            <button className={`tab ${activeTab === 'movements' ? 'active' : ''}`} onClick={() => setActiveTab('movements')}>
              <FiClock style={{ marginRight: 6 }} /> {t('stock.movements')}
            </button>
          </div>

          {activeTab === 'status' && (
            <div className="card">
              <div className="card-body">
                {stockStatus.length === 0 ? (
                  <div className="empty-state"><p>{t('residentMedications.noMedications')}</p></div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('residentMedications.medication')}</th>
                          <th>{t('residentMedications.dosageMg')}</th>
                          <th>{t('stock.dailyConsumption')}</th>
                          <th>{t('stock.currentStock')}</th>
                          <th>{t('stock.daysRemaining')}</th>
                          <th>{t('stock.coverageDate')}</th>
                          <th>{t('app.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedStatus.map(item => (
                          <tr key={item._id}>
                            <td>{item.medication?.genericName}</td>
                            <td>{item.dosageMg} {item.medication?.dosageUnit}</td>
                            <td>{item.dailyConsumption}</td>
                            <td>{item.currentStock}</td>
                            <td><span className={getCoverageClass(item.daysRemaining)}>{item.daysRemaining ?? '-'}</span></td>
                            <td><span className={getCoverageClass(item.daysRemaining)}>{item.coverageDate ? new Date(item.coverageDate).toLocaleDateString() : 'N/A'}</span></td>
                            <td>
                              <button className="btn btn-sm btn-secondary" onClick={() => openAdjust(item)}><FiEdit /> {t('stock.adjust')}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Pagination totalItems={statusTotal} currentPage={statusPage} rowsPerPage={statusRowsPerPage} onPageChange={statusPageChange} onRowsPerPageChange={statusRowsChange} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'movements' && (
            <div className="card">
              <div className="card-body">
                {movements.length === 0 ? (
                  <div className="empty-state"><p>{t('stock.noMovements')}</p></div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('stock.movementDate')}</th>
                          <th>{t('residentMedications.medication')}</th>
                          <th>{t('stock.movementType')}</th>
                          <th>{t('stock.movementQuantity')}</th>
                          <th>{t('stock.previousStock')}</th>
                          <th>{t('stock.newStock')}</th>
                          <th>{t('app.notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMovements.map(m => (
                          <tr key={m._id}>
                            <td>{new Date(m.date).toLocaleDateString()}</td>
                            <td>{m.medication?.genericName || 'N/A'}</td>
                            <td><span className={`badge ${getTypeBadge(m.type)}`}>{t(`stock.types.${m.type}`)}</span></td>
                            <td style={{ color: m.quantity >= 0 ? 'var(--success)' : 'var(--danger)' }}>{m.quantity >= 0 ? '+' : ''}{m.quantity}</td>
                            <td>{m.previousStock}</td>
                            <td>{m.newStock}</td>
                            <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <Pagination totalItems={movementsTotal} currentPage={movementsPage} rowsPerPage={movementsRowsPerPage} onPageChange={movementsPageChange} onRowsPerPageChange={movementsRowsChange} />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showAdjust && (
        <Modal
          title={`${t('stock.adjustStock')} - ${adjustForm.medName}`}
          onClose={() => setShowAdjust(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowAdjust(false)}>{t('app.cancel')}</button><button className="btn btn-primary" onClick={handleAdjust}>{t('app.save')}</button></>}
        >
          {adjustForm.lastReason && (
            <div className="form-group" style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--primary)', marginBottom: 18 }}>
              <label className="form-label" style={{ marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('stock.lastAdjustmentReason')}</label>
              <p style={{ fontSize: 14, color: 'var(--text)' }}>{adjustForm.lastReason}</p>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('stock.currentStock')}: <strong style={{ color: 'var(--text-heading)', fontSize: 16 }}>{adjustForm.currentStock}</strong></label>
          </div>
          <div className="form-group">
            <label className="form-label">{t('stock.newStock')}</label>
            <input type="number" className="form-control" value={adjustForm.newStock} onChange={(e) => setAdjustForm({...adjustForm, newStock: e.target.value})} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('stock.reason')}</label>
            <textarea className="form-control" value={adjustForm.reason} onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})} placeholder={t('stock.reasonPlaceholder')} />
          </div>
        </Modal>
      )}

      {showDeductConfirm && (
        <ConfirmDialog title={t('app.confirm')} message={t('stock.deductionConfirm')} onConfirm={handleManualDeduction} onCancel={() => setShowDeductConfirm(false)} />
      )}
    </div>
  );
};

export default StockManagement;
