import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { residentsAPI, residentMedicationsAPI, medicationsAPI, reportsAPI, medicationHistoryAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/common/Modal';
import { FiArrowLeft, FiPlus, FiEdit, FiXCircle, FiCheckCircle, FiFileText, FiPackage, FiClock, FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import SortableHeader from '../components/common/SortableHeader';
import useSortableTable from '../hooks/useSortableTable';

const FORM_LABELS = {
  tablet: 'COMP',
  capsule: 'CÁP',
  liquid: 'ml',
  drops: 'GOTAS',
  injection: 'INY',
  cream: 'CREMA',
  inhaler: 'INH',
  sachet: 'SOBRE',
  other: ''
};

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const ACTION_LABELS = {
  assigned: { es: 'Asignado', en: 'Assigned', color: '#28a745' },
  updated: { es: 'Actualizado', en: 'Updated', color: '#ffc107' },
  deactivated: { es: 'Desactivado', en: 'Deactivated', color: '#dc3545' },
  reactivated: { es: 'Reactivado', en: 'Reactivated', color: '#17a2b8' }
};

const getFormLabel = (medication) => {
  if (!medication) return 'COMP';
  return FORM_LABELS[medication.form] || 'COMP';
};

const ResidentDetail = () => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [activeMeds, setActiveMeds] = useState([]);
  const [inactiveMeds, setInactiveMeds] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [activeTab, setActiveTab] = useState('medication-card');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivateDate, setDeactivateDate] = useState('');
  const [form, setForm] = useState({
    medication: '', dosageMg: '', currentStock: 0, notes: '',
    schedule: { breakfast: 0, lunch: 0, snack: 0, dinner: 0 }
  });

  // Sortable table for medications
  const { sortedData: sortedActiveMeds, sortConfig, requestSort } = useSortableTable(activeMeds);
  const { sortedData: sortedInactiveMeds } = useSortableTable(inactiveMeds);

  // Report month selector state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  // History state
  const [historyMonths, setHistoryMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [historyChanges, setHistoryChanges] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [resRes, activeRes, inactiveRes, medsRes] = await Promise.all([
        residentsAPI.getOne(id),
        residentMedicationsAPI.getAll({ residentId: id, isActive: true }),
        residentMedicationsAPI.getAll({ residentId: id, isActive: false }),
        medicationsAPI.getAll({ isActive: true })
      ]);
      setResident(resRes.data);
      setActiveMeds(activeRes.data);
      setInactiveMeds(inactiveRes.data);
      setAllMedications(medsRes.data);

      // Load history months
      try {
        const monthsRes = await medicationHistoryAPI.getMonths(id);
        setHistoryMonths(monthsRes.data);
        if (monthsRes.data.length > 0 && !selectedMonth) {
          setSelectedMonth(monthsRes.data[0]);
        }
      } catch (e) {
        // History may not exist yet
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load history when month changes
  useEffect(() => {
    if (selectedMonth && activeTab === 'history') {
      fetchHistory();
    }
  }, [selectedMonth, activeTab]);

  const fetchHistory = async () => {
    if (!selectedMonth) return;
    setHistoryLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const res = await medicationHistoryAPI.getHistory(id, { month, year });
      setHistoryChanges(res.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openAssign = () => {
    setSelectedMed(null);
    setForm({ medication: '', dosageMg: '', currentStock: 0, notes: '', schedule: { breakfast: 0, lunch: 0, snack: 0, dinner: 0 } });
    setShowAssignModal(true);
  };

  const openEdit = (med) => {
    setSelectedMed(med);
    setForm({
      medication: med.medication?._id || '',
      dosageMg: med.dosageMg,
      currentStock: med.currentStock,
      notes: med.notes || '',
      schedule: {
        breakfast: med.schedule?.breakfast || 0,
        lunch: med.schedule?.lunch || 0,
        snack: med.schedule?.snack || 0,
        dinner: med.schedule?.dinner || 0
      }
    });
    setShowAssignModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedMed) {
        await residentMedicationsAPI.update(selectedMed._id, {
          dosageMg: Number(form.dosageMg),
          schedule: {
            breakfast: Number(form.schedule.breakfast),
            lunch: Number(form.schedule.lunch),
            snack: Number(form.schedule.snack),
            dinner: Number(form.schedule.dinner)
          },
          notes: form.notes
        });
        toast.success(t('residentMedications.updated'));
      } else {
        await residentMedicationsAPI.assign({
          resident: id,
          medication: form.medication,
          dosageMg: Number(form.dosageMg),
          currentStock: Number(form.currentStock),
          schedule: {
            breakfast: Number(form.schedule.breakfast),
            lunch: Number(form.schedule.lunch),
            snack: Number(form.schedule.snack),
            dinner: Number(form.schedule.dinner)
          },
          notes: form.notes
        });
        toast.success(t('residentMedications.assigned'));
      }
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const openDeactivate = (med) => {
    setSelectedMed(med);
    setDeactivateDate(new Date().toISOString().split('T')[0]);
    setShowDeactivateModal(true);
  };

  const handleDeactivate = async () => {
    try {
      await residentMedicationsAPI.deactivate(selectedMed._id, {
        endDate: deactivateDate || new Date().toISOString()
      });
      toast.success(t('residentMedications.deactivated'));
      setShowDeactivateModal(false);
      fetchData();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleReactivate = async (med) => {
    try {
      await residentMedicationsAPI.reactivate(med._id);
      toast.success(t('residentMedications.reactivated'));
      fetchData();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openReportModal = () => {
    setReportMonth(new Date().getMonth() + 1);
    setReportYear(new Date().getFullYear());
    setShowReportModal(true);
  };

  const generateReport = async () => {
    try {
      const response = await reportsAPI.residentReport(id, { month: reportMonth, year: reportYear });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setShowReportModal(false);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const getCoverageClass = (daysRemaining) => {
    if (daysRemaining === null) return '';
    if (daysRemaining > 10) return 'coverage-good';
    if (daysRemaining >= 5) return 'coverage-warning';
    return 'coverage-danger';
  };

  const calcDays = (med) => {
    const daily = (med.schedule?.breakfast || 0) + (med.schedule?.lunch || 0) +
                  (med.schedule?.snack || 0) + (med.schedule?.dinner || 0);
    return daily > 0 ? Math.floor(med.currentStock / daily) : null;
  };

  const navigateMonth = (direction) => {
    const idx = historyMonths.indexOf(selectedMonth);
    if (direction === 'prev' && idx < historyMonths.length - 1) {
      setSelectedMonth(historyMonths[idx + 1]);
    } else if (direction === 'next' && idx > 0) {
      setSelectedMonth(historyMonths[idx - 1]);
    }
  };

  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthName = isEs ? MONTH_NAMES_ES[parseInt(month) - 1] : new Date(year, month - 1).toLocaleString('en', { month: 'long' });
    return `${monthName} ${year}`;
  };

  const now = new Date();
  const currentMonthYear = isEs
    ? `${MONTH_SHORT_ES[now.getMonth()]}-${String(now.getFullYear()).slice(-2)}`
    : `${now.toLocaleString('en', { month: 'short' })}-${String(now.getFullYear()).slice(-2)}`;

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;
  if (!resident) return <div className="empty-state"><h3>{t('app.error')}</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/residents" className="btn btn-secondary btn-sm"><FiArrowLeft /></Link>
          <h1>{resident.firstName} {resident.lastName}</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={openReportModal}><FiFileText /> {t('reports.generateResident')}</button>
          <button className="btn btn-primary" onClick={openAssign}><FiPlus /> {t('residentMedications.assignMedication')}</button>
        </div>
      </div>

      {/* Resident Info Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="form-row">
            <div><strong>{t('residents.cedula')}:</strong> {resident.cedula}</div>
            <div><strong>{t('residents.admissionDate')}:</strong> {new Date(resident.admissionDate).toLocaleDateString()}</div>
            <div><strong>{isEs ? 'Sucursal' : 'Branch'}:</strong> {resident.sucursal || '-'}</div>
            <div><strong>{t('app.status')}:</strong> <span className={`badge ${resident.isActive ? 'badge-success' : 'badge-danger'}`}>{resident.isActive ? t('app.active') : t('app.inactive')}</span></div>
          </div>
          {resident.notes && <div style={{ marginTop: 12 }}><strong>{t('app.notes')}:</strong> {resident.notes}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'medication-card' ? 'active' : ''}`} onClick={() => setActiveTab('medication-card')}>
          <FiFileText style={{ marginRight: 4 }} /> {isEs ? 'Medicación' : 'Medication'} ({activeMeds.length})
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <FiClock style={{ marginRight: 4 }} /> {isEs ? 'Historial' : 'History'}
        </button>
        <button className={`tab ${activeTab === 'inactive' ? 'active' : ''}`} onClick={() => setActiveTab('inactive')}>
          {t('residents.inactiveMedications')} ({inactiveMeds.length})
        </button>
        <button className={`tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          <FiPackage style={{ marginRight: 4 }} /> Stock ({activeMeds.length})
        </button>
      </div>

      {/* MEDICATION CARD TAB - ACHIRAS Format */}
      {activeTab === 'medication-card' && (
        <div className="card">
          <div className="card-body">
            {activeMeds.length === 0 ? (
              <div className="empty-state">
                <FiPackage className="empty-state-icon" />
                <h3>{t('residentMedications.noMedications')}</h3>
              </div>
            ) : (
              <div>
                {/* ACHIRAS-style header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <strong>{isEs ? 'Residente' : 'Resident'}:</strong> {resident.firstName} {resident.lastName}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <strong>CI:</strong> {resident.cedula}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <strong>{isEs ? 'FECHA' : 'DATE'}:</strong> <span style={{ fontSize: 15, fontWeight: 'bold' }}>{currentMonthYear}</span>
                    </div>
                    {resident.sucursal && (
                      <div style={{ fontSize: 13, color: '#666' }}>
                        <strong>{isEs ? 'Sucursal' : 'Branch'}:</strong> {resident.sucursal}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACHIRAS-style medication table */}
                <div className="table-container">
                  <table className="medication-card-table">
                    <thead>
                      <tr>
                        <SortableHeader label={isEs ? 'Medicación' : 'Medication'} sortKey="medication.genericName" sortConfig={sortConfig} onSort={requestSort} style={{ textAlign: 'left', minWidth: 220 }} />
                        <th style={{ textAlign: 'center', width: 120 }}>{isEs ? 'Desayuno' : 'Breakfast'}</th>
                        <th style={{ textAlign: 'center', width: 120 }}>{isEs ? 'Almuerzo' : 'Lunch'}</th>
                        <th style={{ textAlign: 'center', width: 120 }}>{isEs ? 'Merienda' : 'Snack'}</th>
                        <th style={{ textAlign: 'center', width: 120 }}>{isEs ? 'Cena' : 'Dinner'}</th>
                        <th style={{ textAlign: 'center', width: 80 }}>{t('app.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedActiveMeds.map(med => {
                        const formLabel = getFormLabel(med.medication);
                        return (
                          <tr key={med._id}>
                            <td style={{ fontWeight: 500 }}>
                              {(med.medication?.genericName || 'N/A').toUpperCase()}
                              {med.medication?.commercialName && (
                                <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>({med.medication.commercialName})</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {med.schedule?.breakfast > 0 ? `${med.schedule.breakfast} ${formLabel}` : ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {med.schedule?.lunch > 0 ? `${med.schedule.lunch} ${formLabel}` : ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {med.schedule?.snack > 0 ? `${med.schedule.snack} ${formLabel}` : ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {med.schedule?.dinner > 0 ? `${med.schedule.dinner} ${formLabel}` : ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(med)} title={t('app.edit')}><FiEdit /></button>
                                <button className="btn btn-sm btn-danger" onClick={() => openDeactivate(med)} title={t('residentMedications.deactivate')}><FiXCircle /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STOCK TAB - Detailed stock/coverage info */}
      {activeTab === 'stock' && (
        <div className="card">
          <div className="card-body">
            {activeMeds.length === 0 ? (
              <div className="empty-state">
                <FiPackage className="empty-state-icon" />
                <h3>{t('residentMedications.noMedications')}</h3>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <SortableHeader label={isEs ? 'Medicación' : 'Medication'} sortKey="medication.genericName" sortConfig={sortConfig} onSort={requestSort} />
                      <th>{isEs ? 'Dosis' : 'Dose'}</th>
                      <th>{isEs ? 'Consumo Diario' : 'Daily Use'}</th>
                      <th>{t('residentMedications.currentStock')}</th>
                      <th>{t('residentMedications.daysRemaining')}</th>
                      <th>{t('residentMedications.coverageDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActiveMeds.map(med => {
                      const days = calcDays(med);
                      const daily = (med.schedule?.breakfast || 0) + (med.schedule?.lunch || 0) + (med.schedule?.snack || 0) + (med.schedule?.dinner || 0);
                      const coverDate = days !== null ? (() => { const d = new Date(); d.setDate(d.getDate() + days); return d.toLocaleDateString(); })() : 'N/A';
                      return (
                        <tr key={med._id}>
                          <td>{(med.medication?.genericName || 'N/A').toUpperCase()}</td>
                          <td>{med.dosageMg} {med.medication?.dosageUnit}</td>
                          <td>{daily}</td>
                          <td>{med.currentStock}</td>
                          <td><span className={getCoverageClass(days)}>{days !== null ? days : '-'}</span></td>
                          <td><span className={getCoverageClass(days)}>{coverDate}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB - Month by month medication history */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-body">
            {/* Month navigator */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigateMonth('prev')}
                disabled={historyMonths.indexOf(selectedMonth) >= historyMonths.length - 1}
              >
                <FiChevronLeft />
              </button>
              <div style={{ minWidth: 180, textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>
                  {formatMonthLabel(selectedMonth)}
                </h3>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigateMonth('next')}
                disabled={historyMonths.indexOf(selectedMonth) <= 0}
              >
                <FiChevronRight />
              </button>
            </div>

            {/* Month selector dropdown */}
            {historyMonths.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <select
                  className="form-control"
                  style={{ maxWidth: 250 }}
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {historyMonths.map(m => (
                    <option key={m} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>
              </div>
            )}

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>{t('app.loading')}</div>
            ) : historyChanges.length === 0 ? (
              <div className="empty-state">
                <FiClock className="empty-state-icon" />
                <h3>{isEs ? 'No hay cambios registrados en este mes' : 'No changes recorded this month'}</h3>
              </div>
            ) : (
              <div className="history-timeline">
                {historyChanges.map((change, idx) => {
                  const actionInfo = ACTION_LABELS[change.action] || { es: change.action, en: change.action, color: '#666' };
                  return (
                    <div key={change._id || idx} className="history-item" style={{ borderLeft: `3px solid ${actionInfo.color}`, paddingLeft: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ background: actionInfo.color, color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                            {isEs ? actionInfo.es : actionInfo.en}
                          </span>
                          <strong style={{ fontSize: 14 }}>
                            {change.medication?.genericName?.toUpperCase() || 'N/A'}
                          </strong>
                        </div>
                        <span style={{ color: '#888', fontSize: 12 }}>
                          {new Date(change.date).toLocaleDateString()} {new Date(change.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {change.details && (
                        <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                          <span>{isEs ? 'Dosis' : 'Dose'}: {change.details.dosageMg} {change.medication?.dosageUnit}</span>
                          {change.details.schedule && (
                            <span style={{ marginLeft: 12 }}>
                              {isEs ? 'Horario' : 'Schedule'}: {' '}
                              {change.details.schedule.breakfast > 0 && `${isEs ? 'Des' : 'Bkf'}:${change.details.schedule.breakfast} `}
                              {change.details.schedule.lunch > 0 && `${isEs ? 'Alm' : 'Lun'}:${change.details.schedule.lunch} `}
                              {change.details.schedule.snack > 0 && `${isEs ? 'Mer' : 'Snk'}:${change.details.schedule.snack} `}
                              {change.details.schedule.dinner > 0 && `${isEs ? 'Cen' : 'Din'}:${change.details.schedule.dinner}`}
                            </span>
                          )}
                          {change.details.notes && (
                            <div style={{ marginTop: 4, fontStyle: 'italic' }}>{change.details.notes}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INACTIVE TAB */}
      {activeTab === 'inactive' && (
        <div className="card">
          <div className="card-body">
            {inactiveMeds.length === 0 ? (
              <div className="empty-state">
                <FiPackage className="empty-state-icon" />
                <h3>{isEs ? 'No hay medicamentos inactivos' : 'No inactive medications'}</h3>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <SortableHeader label={isEs ? 'Medicación' : 'Medication'} sortKey="medication.genericName" sortConfig={sortConfig} onSort={requestSort} />
                      <th>{isEs ? 'Dosis' : 'Dose'}</th>
                      <th>{isEs ? 'Desayuno' : 'Breakfast'}</th>
                      <th>{isEs ? 'Almuerzo' : 'Lunch'}</th>
                      <th>{isEs ? 'Merienda' : 'Snack'}</th>
                      <th>{isEs ? 'Cena' : 'Dinner'}</th>
                      <th>{isEs ? 'Fecha Inicio' : 'Start Date'}</th>
                      <th>{isEs ? 'Fecha Baja' : 'End Date'}</th>
                      <th>{t('app.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInactiveMeds.map(med => (
                      <tr key={med._id}>
                        <td>{(med.medication?.genericName || 'N/A').toUpperCase()}</td>
                        <td>{med.dosageMg} {med.medication?.dosageUnit}</td>
                        <td style={{ textAlign: 'center' }}>{med.schedule?.breakfast || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{med.schedule?.lunch || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{med.schedule?.snack || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{med.schedule?.dinner || '-'}</td>
                        <td>{med.startDate ? new Date(med.startDate).toLocaleDateString() : '-'}</td>
                        <td style={{ color: '#dc3545', fontWeight: 500 }}>
                          {med.endDate ? new Date(med.endDate).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-success" onClick={() => handleReactivate(med)} title={t('residentMedications.reactivate')}>
                            <FiCheckCircle />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign/Edit Modal */}
      {showAssignModal && (
        <Modal
          title={selectedMed ? t('residentMedications.editAssignment') : t('residentMedications.assignMedication')}
          onClose={() => setShowAssignModal(false)}
          large
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{t('app.save')}</button>
            </>
          }
        >
          {!selectedMed && (
            <div className="form-group">
              <label className="form-label">{t('residentMedications.medication')}</label>
              <select className="form-control" value={form.medication} onChange={(e) => setForm({...form, medication: e.target.value})} required>
                <option value="">{t('residentMedications.selectMedication')}</option>
                {allMedications.map(m => (
                  <option key={m._id} value={m._id}>{m.genericName} {m.commercialName ? `(${m.commercialName})` : ''}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isEs ? 'Dosis' : 'Dose'}</label>
              <input type="number" className="form-control" value={form.dosageMg} onChange={(e) => setForm({...form, dosageMg: e.target.value})} required />
            </div>
            {!selectedMed && (
              <div className="form-group">
                <label className="form-label">{t('residentMedications.initialStock')}</label>
                <input type="number" className="form-control" value={form.currentStock} onChange={(e) => setForm({...form, currentStock: e.target.value})} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">{t('residentMedications.schedule')}</label>
            <div className="schedule-grid">
              {['breakfast', 'lunch', 'snack', 'dinner'].map(slot => (
                <div className="schedule-item" key={slot}>
                  <label>{t(`residentMedications.${slot}`)}</label>
                  <input
                    type="number"
                    min="0"
                    value={form.schedule[slot]}
                    onChange={(e) => setForm({...form, schedule: {...form.schedule, [slot]: e.target.value}})}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('app.notes')}</label>
            <textarea className="form-control" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
          </div>
        </Modal>
      )}

      {/* Report Month Selector Modal */}
      {showReportModal && (
        <Modal
          title={isEs ? 'Generar Reporte de Medicación' : 'Generate Medication Report'}
          onClose={() => setShowReportModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-primary" onClick={generateReport}><FiFileText style={{ marginRight: 4 }} /> {isEs ? 'Generar PDF' : 'Generate PDF'}</button>
            </>
          }
        >
          <p style={{ color: '#666', marginBottom: 16 }}>
            {isEs
              ? 'Seleccione el mes y año para el reporte. Se incluirán los medicamentos activos e inactivos del período seleccionado.'
              : 'Select month and year for the report. Active and inactive medications for the selected period will be included.'}
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><FiCalendar style={{ marginRight: 4 }} />{isEs ? 'Mes' : 'Month'}</label>
              <select
                className="form-control"
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
              >
                {MONTH_NAMES_ES.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{isEs ? name : new Date(2000, idx).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isEs ? 'Año' : 'Year'}</label>
              <select
                className="form-control"
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate Modal with Date Picker */}
      {showDeactivateModal && (
        <Modal
          title={isEs ? 'Desactivar Medicamento' : 'Deactivate Medication'}
          onClose={() => setShowDeactivateModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowDeactivateModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDeactivate}>{t('app.confirm')}</button>
            </>
          }
        >
          <p>
            {isEs
              ? `¿Está seguro de que desea desactivar ${selectedMed?.medication?.genericName?.toUpperCase() || ''}?`
              : `Are you sure you want to deactivate ${selectedMed?.medication?.genericName?.toUpperCase() || ''}?`
            }
          </p>
          <div className="form-group">
            <label className="form-label">
              {isEs ? 'Fecha de baja' : 'Deactivation date'}
            </label>
            <input
              type="date"
              className="form-control"
              value={deactivateDate}
              onChange={(e) => setDeactivateDate(e.target.value)}
            />
            <small style={{ color: '#888' }}>
              {isEs
                ? 'Seleccione la fecha en que se realizó la baja del medicamento'
                : 'Select the date when the medication was discontinued'
              }
            </small>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResidentDetail;
