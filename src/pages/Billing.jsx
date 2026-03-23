import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FiDollarSign, FiAlertCircle, FiUsers, FiTrendingUp, FiEdit2, FiDownload, FiEye, FiSearch
} from 'react-icons/fi';
import { billingAPI, settingsAPI } from '../services/api';
import Modal from '../components/common/Modal';
import useSortableTable from '../hooks/useSortableTable';
import usePagination from '../hooks/usePagination';
import SortableHeader from '../components/common/SortableHeader';
import Pagination from '../components/common/Pagination';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$U 0';
  return `$U ${Math.round(Number(amount)).toLocaleString('es-UY')}`;
};

export default function Billing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const MONTHS = isEs ? MONTHS_ES : MONTHS_EN;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sucursal, setSucursal] = useState('');
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');

  const [summary, setSummary] = useState(null);
  const [debtors, setDebtors] = useState([]);
  const [allConfigs, setAllConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Search state
  const [debtorSearch, setDebtorSearch] = useState('');
  const [configSearch, setConfigSearch] = useState('');

  // Config edit modal
  const [configModal, setConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({ monthlyFee: 0, adjustmentPercentage: 0, adjustmentMonths: [], notes: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { month, year, ...(sucursal ? { sucursal } : {}) };
      const [summaryRes, debtorsRes, configsRes, settingsRes] = await Promise.all([
        billingAPI.getSummary(params),
        billingAPI.getDebtors(params),
        billingAPI.getAllConfigs(),
        settingsAPI.get()
      ]);
      setSummary(summaryRes.data);
      setDebtors(debtorsRes.data);
      setAllConfigs(configsRes.data);
      setBranches(settingsRes.data.branches || []);
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setLoading(false);
    }
  }, [month, year, sucursal, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered data
  const filteredDebtors = useMemo(() => {
    if (!debtorSearch.trim()) return debtors;
    const q = debtorSearch.toLowerCase();
    return debtors.filter(s =>
      `${s.resident.firstName} ${s.resident.lastName}`.toLowerCase().includes(q) ||
      (s.resident.sucursal || '').toLowerCase().includes(q)
    );
  }, [debtors, debtorSearch]);

  const filteredConfigs = useMemo(() => {
    if (!configSearch.trim()) return allConfigs;
    const q = configSearch.toLowerCase();
    return allConfigs.filter(e =>
      `${e.resident.firstName} ${e.resident.lastName}`.toLowerCase().includes(q) ||
      (e.resident.sucursal || '').toLowerCase().includes(q)
    );
  }, [allConfigs, configSearch]);

  // Sort hooks
  const { sortedData: sortedDebtors, sortConfig: debtorSortConfig, requestSort: debtorRequestSort } = useSortableTable(filteredDebtors);
  const { sortedData: sortedConfigs, sortConfig: configSortConfig, requestSort: configRequestSort } = useSortableTable(filteredConfigs);

  // Pagination hooks
  const { paginatedData: pagedDebtors, currentPage: debtorPage, rowsPerPage: debtorRPP, totalItems: debtorTotal, handlePageChange: debtorPageChange, handleRowsPerPageChange: debtorRPPChange } = usePagination(sortedDebtors);
  const { paginatedData: pagedConfigs, currentPage: configPage, rowsPerPage: configRPP, totalItems: configTotal, handlePageChange: configPageChange, handleRowsPerPageChange: configRPPChange } = usePagination(sortedConfigs);

  const openConfigModal = (entry) => {
    setEditingConfig(entry);
    setConfigForm({
      monthlyFee: entry.config?.monthlyFee || 0,
      adjustmentPercentage: entry.config?.adjustmentPercentage || 0,
      adjustmentMonths: entry.config?.adjustmentMonths || [],
      notes: entry.config?.notes || ''
    });
    setConfigModal(true);
  };

  const saveConfig = async () => {
    try {
      await billingAPI.upsertConfig(editingConfig.resident._id, configForm);
      toast.success(t('billing.configSaved'));
      setConfigModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const toggleAdjustmentMonth = (m) => {
    setConfigForm(prev => ({
      ...prev,
      adjustmentMonths: prev.adjustmentMonths.includes(m)
        ? prev.adjustmentMonths.filter(x => x !== m)
        : [...prev.adjustmentMonths, m]
    }));
  };

  const generateAllPDF = async () => {
    setGeneratingPDF(true);
    try {
      const params = sucursal ? { sucursal } : {};
      const res = await billingAPI.allStatementsPDF(month, year, params);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `estados-cuenta-${MONTHS[month - 1]}-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('app.error'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const statusClass = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' };
  const statusLabel = { paid: t('billing.status.paid'), partial: t('billing.status.partial'), pending: t('billing.status.pending') };

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FiDollarSign style={{ marginRight: 8 }} />{t('billing.title')}</h1>
        <button className="btn btn-primary" onClick={generateAllPDF} disabled={generatingPDF}>
          <FiDownload style={{ marginRight: 4 }} />
          {generatingPDF ? t('reports.generating') : t('billing.generateAllPDF')}
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('billing.selectMonth')}</label>
            <select className="form-control" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('billing.selectYear')}</label>
            <select className="form-control" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {branches.length > 0 && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('billing.filterBranch')}</label>
              <select className="form-control" value={sucursal} onChange={e => setSucursal(e.target.value)}>
                <option value="">{t('billing.allBranches')}</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          {t('billing.summary')}
        </button>
        <button className={`tab ${activeTab === 'debtors' ? 'active' : ''}`} onClick={() => setActiveTab('debtors')}>
          {t('billing.debtors')}
          {debtors.length > 0 && <span className="badge badge-danger" style={{ marginLeft: 6 }}>{debtors.length}</span>}
        </button>
        <button className={`tab ${activeTab === 'configs' ? 'active' : ''}`} onClick={() => setActiveTab('configs')}>
          {t('billing.config')}
        </button>
      </div>

      {/* ── TAB: Summary ── */}
      {activeTab === 'summary' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <FiTrendingUp className="stat-icon" />
              <div className="stat-value">{formatCurrency(summary?.totalBilled)}</div>
              <div className="stat-label">{t('billing.totalBilled')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(summary?.totalFees)}</div>
              <div className="stat-label">{t('billing.monthlyFee')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(summary?.totalExpenses)}</div>
              <div className="stat-label">{t('billing.totalExpenses')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#28a745' }}>{formatCurrency(summary?.totalPaid)}</div>
              <div className="stat-label">{t('billing.amountPaid')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: summary?.totalPending > 0 ? '#dc3545' : '#28a745' }}>
                {formatCurrency(summary?.totalPending)}
              </div>
              <div className="stat-label">{t('billing.totalPending')}</div>
            </div>
            <div className="stat-card">
              <FiUsers className="stat-icon" />
              <div className="stat-value">{summary?.residentCount || 0}</div>
              <div className="stat-label">{t('billing.residentCount')}</div>
            </div>
          </div>

          {debtors.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title"><FiAlertCircle style={{ marginRight: 6, color: '#dc3545' }} />{t('billing.debtors')}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('debtors')}>{t('app.view')}</button>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('residents.title')}</th>
                        {branches.length > 0 && <th>{t('residents.sucursal')}</th>}
                        <th style={{ textAlign: 'right' }}>{t('billing.totalAmount')}</th>
                        <th style={{ textAlign: 'right' }}>{t('billing.amountPaid')}</th>
                        <th style={{ textAlign: 'right' }}>{t('billing.balance')}</th>
                        <th>{t('app.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtors.slice(0, 5).map(s => (
                        <tr key={s._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/billing/${s.resident._id}`)}>
                          <td>{s.resident.firstName} {s.resident.lastName}</td>
                          {branches.length > 0 && <td>{s.resident.sucursal}</td>}
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.totalAmount)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.amountPaid)}</td>
                          <td style={{ textAlign: 'right', color: '#dc3545', fontWeight: 600 }}>{formatCurrency(s.balance)}</td>
                          <td><span className={`badge ${statusClass[s.status]}`}>{statusLabel[s.status]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Debtors ── */}
      {activeTab === 'debtors' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('billing.debtors')} — {MONTHS[month - 1]} {year}</h3>
          </div>
          <div className="card-body">
            {/* Search */}
            <div style={{ marginBottom: 12, position: 'relative', maxWidth: 300 }}>
              <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32 }}
                placeholder={isEs ? 'Buscar residente...' : 'Search resident...'}
                value={debtorSearch}
                onChange={e => setDebtorSearch(e.target.value)}
              />
            </div>

            {filteredDebtors.length === 0 ? (
              <div className="empty-state">
                <FiDollarSign style={{ fontSize: 40, marginBottom: 8, color: '#28a745' }} />
                <p>{debtorSearch ? (isEs ? 'Sin resultados' : 'No results') : t('billing.noDebtors')}</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <SortableHeader label={t('residents.title')} sortKey="resident.firstName" sortConfig={debtorSortConfig} onSort={debtorRequestSort} />
                        {branches.length > 0 && <SortableHeader label={t('residents.sucursal')} sortKey="resident.sucursal" sortConfig={debtorSortConfig} onSort={debtorRequestSort} />}
                        <SortableHeader label={t('billing.totalAmount')} sortKey="totalAmount" sortConfig={debtorSortConfig} onSort={debtorRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.amountPaid')} sortKey="amountPaid" sortConfig={debtorSortConfig} onSort={debtorRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.balance')} sortKey="balance" sortConfig={debtorSortConfig} onSort={debtorRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('app.status')} sortKey="status" sortConfig={debtorSortConfig} onSort={debtorRequestSort} />
                        <th>{t('app.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedDebtors.map(s => (
                        <tr key={s._id}>
                          <td>{s.resident.firstName} {s.resident.lastName}</td>
                          {branches.length > 0 && <td>{s.resident.sucursal}</td>}
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.totalAmount)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.amountPaid)}</td>
                          <td style={{ textAlign: 'right', color: '#dc3545', fontWeight: 600 }}>{formatCurrency(s.balance)}</td>
                          <td><span className={`badge ${statusClass[s.status]}`}>{statusLabel[s.status]}</span></td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/billing/${s.resident._id}`)}>
                              <FiEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination totalItems={debtorTotal} currentPage={debtorPage} rowsPerPage={debtorRPP} onPageChange={debtorPageChange} onRowsPerPageChange={debtorRPPChange} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Configs ── */}
      {activeTab === 'configs' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('billing.config')}</h3>
          </div>
          <div className="card-body">
            {/* Search */}
            <div style={{ marginBottom: 12, position: 'relative', maxWidth: 300 }}>
              <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32 }}
                placeholder={isEs ? 'Buscar residente...' : 'Search resident...'}
                value={configSearch}
                onChange={e => setConfigSearch(e.target.value)}
              />
            </div>

            {filteredConfigs.length === 0 ? (
              <div className="empty-state">
                <p>{configSearch ? (isEs ? 'Sin resultados' : 'No results') : (isEs ? 'No hay configuraciones' : 'No configurations')}</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <SortableHeader label={t('residents.title')} sortKey="resident.firstName" sortConfig={configSortConfig} onSort={configRequestSort} />
                        {branches.length > 0 && <SortableHeader label={t('residents.sucursal')} sortKey="resident.sucursal" sortConfig={configSortConfig} onSort={configRequestSort} />}
                        <SortableHeader label={t('billing.monthlyFee')} sortKey="config.monthlyFee" sortConfig={configSortConfig} onSort={configRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.adjustmentPercentage')} sortKey="config.adjustmentPercentage" sortConfig={configSortConfig} onSort={configRequestSort} style={{ textAlign: 'right' }} />
                        <th>{t('billing.adjustmentMonths')}</th>
                        <th>{t('app.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedConfigs.map(entry => (
                        <tr key={entry.resident._id}>
                          <td
                            style={{ cursor: 'pointer', color: '#2e7d32', fontWeight: 500 }}
                            onClick={() => navigate(`/billing/${entry.resident._id}`)}
                          >
                            {entry.resident.firstName} {entry.resident.lastName}
                          </td>
                          {branches.length > 0 && <td>{entry.resident.sucursal}</td>}
                          <td style={{ textAlign: 'right' }}>{formatCurrency(entry.config?.monthlyFee)}</td>
                          <td style={{ textAlign: 'right' }}>{entry.config?.adjustmentPercentage || 0}%</td>
                          <td>
                            {(entry.config?.adjustmentMonths || []).map(m => (
                              <span key={m} className="badge badge-info" style={{ marginRight: 3 }}>{MONTHS[m - 1]}</span>
                            ))}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => openConfigModal(entry)}><FiEdit2 /></button>
                              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/billing/${entry.resident._id}`)}><FiEye /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination totalItems={configTotal} currentPage={configPage} rowsPerPage={configRPP} onPageChange={configPageChange} onRowsPerPageChange={configRPPChange} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Config Edit Modal */}
      {configModal && editingConfig && (
        <Modal
          title={`${t('billing.configTab')} — ${editingConfig.resident.firstName} ${editingConfig.resident.lastName}`}
          onClose={() => setConfigModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfigModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-primary" onClick={saveConfig}>{t('app.save')}</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">{t('billing.monthlyFee')}</label>
              <input type="number" className="form-control" value={configForm.monthlyFee} min={0}
                onChange={e => setConfigForm(p => ({ ...p, monthlyFee: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('billing.adjustmentPercentage')}</label>
              <input type="number" className="form-control" value={configForm.adjustmentPercentage} min={0} max={100}
                onChange={e => setConfigForm(p => ({ ...p, adjustmentPercentage: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('billing.adjustmentMonths')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {MONTHS.map((m, i) => (
                <label key={i + 1} style={{
                  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                  padding: '3px 8px', borderRadius: 4, border: '1px solid #ddd',
                  background: configForm.adjustmentMonths.includes(i + 1) ? '#2e7d32' : '#fff',
                  color: configForm.adjustmentMonths.includes(i + 1) ? '#fff' : '#333', fontSize: 12
                }}>
                  <input type="checkbox" style={{ display: 'none' }}
                    checked={configForm.adjustmentMonths.includes(i + 1)}
                    onChange={() => toggleAdjustmentMonth(i + 1)} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('app.notes')}</label>
            <input className="form-control" value={configForm.notes}
              onChange={e => setConfigForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}
