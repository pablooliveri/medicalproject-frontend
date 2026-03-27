import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sid } from '../utils/session';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiDollarSign, FiPlus, FiEdit2, FiTrash2,
  FiDownload, FiChevronLeft, FiChevronRight, FiCamera, FiSave, FiSearch,
  FiLock, FiUnlock
} from 'react-icons/fi';
import { billingAPI, residentsAPI, resolveFileUrl } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
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

export default function BillingDetail() {
  const { residentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const MONTHS = isEs ? MONTHS_ES : MONTHS_EN;

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState('statement');

  const [resident, setResident] = useState(null);
  const [statement, setStatement] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allStatements, setAllStatements] = useState([]);
  const [config, setConfig] = useState({ monthlyFee: 0, adjustmentPercentage: 0, adjustmentMonths: [], notes: '' });
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Search state
  const [expenseSearch, setExpenseSearch] = useState('');

  // Addenda
  const [addenda, setAddenda] = useState('');
  const [savingAddenda, setSavingAddenda] = useState(false);

  // Variable adjustment
  const [adjustmentPct, setAdjustmentPct] = useState('');
  const [applyingAdjustment, setApplyingAdjustment] = useState(false);

  // Recurring concepts (for config tab)
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [newRecurring, setNewRecurring] = useState({ concept: '', unitPrice: '', quantity: 1 });
  const [loadingRecurring, setLoadingRecurring] = useState(false);

  // Modals
  const [expenseModal, setExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adjustmentAlert, setAdjustmentAlert] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Forms
  const [expenseForm, setExpenseForm] = useState({ concept: '', unitPrice: '', quantity: 1, notes: '' });
  const [expensePhoto, setExpensePhoto] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], method: 'cash', notes: '' });
  const [configForm, setConfigForm] = useState({ monthlyFee: 0, adjustmentPercentage: 0, adjustmentMonths: [], notes: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [residentRes, configRes, expensesRes, statementsRes] = await Promise.all([
        residentsAPI.getOne(residentId),
        billingAPI.getConfig(residentId),
        billingAPI.getExpenses(residentId, { month: currentMonth, year: currentYear }),
        billingAPI.getStatements(residentId)
      ]);
      setResident(residentRes.data);
      setConfig(configRes.data);
      setConfigForm({
        monthlyFee: configRes.data.monthlyFee || 0,
        adjustmentPercentage: configRes.data.adjustmentPercentage || 0,
        adjustmentMonths: configRes.data.adjustmentMonths || [],
        notes: configRes.data.notes || ''
      });
      setRecurringExpenses(configRes.data.recurringExpenses || []);
      setExpenses(expensesRes.data);
      setAllStatements(statementsRes.data);

      const adjMonths = configRes.data.adjustmentMonths || [];
      setAdjustmentAlert(adjMonths.includes(currentMonth) && configRes.data.adjustmentPercentage > 0);

      try {
        const stmtRes = await billingAPI.getStatement(residentId, currentMonth, currentYear);
        setStatement(stmtRes.data);
        setAddenda(stmtRes.data.addenda || '');
        if (stmtRes.data._id) {
          const paymentsRes = await billingAPI.getPayments(stmtRes.data._id);
          setPayments(paymentsRes.data);
        } else {
          setPayments([]);
        }
      } catch {
        setStatement(null);
        setPayments([]);
        setAddenda('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setLoading(false);
    }
  }, [residentId, currentMonth, currentYear, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navigateMonth = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  // Filtered expenses by search
  const filteredExpenses = useMemo(() => {
    if (!expenseSearch.trim()) return expenses;
    const q = expenseSearch.toLowerCase();
    return expenses.filter(e => e.concept.toLowerCase().includes(q));
  }, [expenses, expenseSearch]);

  // Sort + paginate expenses
  const { sortedData: sortedExpenses, sortConfig: expenseSortConfig, requestSort: expenseRequestSort } = useSortableTable(filteredExpenses);
  const { paginatedData: pagedExpenses, currentPage: expPage, rowsPerPage: expRPP, totalItems: expTotal, handlePageChange: expPageChange, handleRowsPerPageChange: expRPPChange } = usePagination(sortedExpenses, 10);

  // Sort + paginate payments
  const { sortedData: sortedPayments, sortConfig: paymentSortConfig, requestSort: paymentRequestSort } = useSortableTable(payments);
  const { paginatedData: pagedPayments, currentPage: payPage, rowsPerPage: payRPP, totalItems: payTotal, handlePageChange: payPageChange, handleRowsPerPageChange: payRPPChange } = usePagination(sortedPayments, 10);

  // Sort + paginate history
  const { sortedData: sortedStatements, sortConfig: stmtSortConfig, requestSort: stmtRequestSort } = useSortableTable(allStatements);
  const { paginatedData: pagedStatements, currentPage: stmtPage, rowsPerPage: stmtRPP, totalItems: stmtTotal, handlePageChange: stmtPageChange, handleRowsPerPageChange: stmtRPPChange } = usePagination(sortedStatements);

  // Expense handlers
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({ concept: '', unitPrice: '', quantity: 1, notes: '' });
    setExpensePhoto(null);
    setExpenseModal(true);
  };

  const openEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({ concept: exp.concept, unitPrice: exp.unitPrice, quantity: exp.quantity, notes: exp.notes || '' });
    setExpensePhoto(null);
    setExpenseModal(true);
  };

  const saveExpense = async () => {
    if (!expenseForm.concept || !expenseForm.unitPrice) return toast.error(t('app.required'));
    try {
      const formData = new FormData();
      formData.append('concept', expenseForm.concept);
      formData.append('unitPrice', expenseForm.unitPrice);
      formData.append('quantity', expenseForm.quantity);
      formData.append('month', currentMonth);
      formData.append('year', currentYear);
      formData.append('notes', expenseForm.notes);
      if (expensePhoto) formData.append('photo', expensePhoto);

      if (editingExpense) {
        await billingAPI.updateExpense(editingExpense._id, formData);
        toast.success(t('billing.expenseUpdated'));
      } else {
        await billingAPI.createExpense(residentId, formData);
        toast.success(t('billing.expenseCreated'));
      }
      setExpenseModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const deleteExpense = async (id) => {
    try {
      await billingAPI.deleteExpense(id);
      toast.success(t('billing.expenseDeleted'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  // Payment handlers
  const savePayment = async () => {
    if (!paymentForm.amount) return toast.error(t('app.required'));
    try {
      let stmtId = statement?._id;
      if (!stmtId) {
        // Create statement first and use the response directly (avoid stale state)
        const createRes = await billingAPI.createStatement(residentId, { month: currentMonth, year: currentYear });
        stmtId = createRes.data._id;
      }
      await billingAPI.createPayment(stmtId, paymentForm);
      toast.success(t('billing.paymentCreated'));
      setPaymentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const deleteStatement = async (id) => {
    try {
      await billingAPI.deleteStatement(id);
      toast.success(t('billing.statementDeleted'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const deletePayment = async (id) => {
    try {
      await billingAPI.deletePayment(id);
      toast.success(t('billing.paymentDeleted'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  // Toggle lock
  const toggleLock = async () => {
    if (!statement?._id) return toast.error(t('billing.generateStatementFirst'));
    try {
      const res = await billingAPI.toggleLock(statement._id);
      setStatement(prev => ({ ...prev, locked: res.data.locked }));
      toast.success(res.data.locked ? t('billing.monthLocked') : t('billing.monthUnlocked'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  // Config save
  const saveConfig = async () => {
    try {
      await billingAPI.upsertConfig(residentId, configForm);
      toast.success(t('billing.configSaved'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const toggleAdjustmentMonth = (month) => {
    setConfigForm(prev => ({
      ...prev,
      adjustmentMonths: prev.adjustmentMonths.includes(month)
        ? prev.adjustmentMonths.filter(m => m !== month)
        : [...prev.adjustmentMonths, month]
    }));
  };

  // Save addenda
  const saveAddenda = async () => {
    if (!statement?._id) return toast.error(t('billing.generateStatementFirst'));
    setSavingAddenda(true);
    try {
      await billingAPI.updateStatement(statement._id, { addenda });
      toast.success(t('billing.messageSaved'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setSavingAddenda(false);
    }
  };

  // Apply variable adjustment
  const applyAdjustment = async () => {
    if (!adjustmentPct || Number(adjustmentPct) <= 0) return toast.error(t('billing.enterValidPercentage'));
    setApplyingAdjustment(true);
    try {
      await billingAPI.createStatement(residentId, {
        month: currentMonth, year: currentYear,
        applyAdjustment: true,
        adjustmentPercentage: Number(adjustmentPct)
      });
      toast.success(t('billing.adjustmentApplied', { pct: adjustmentPct }));
      setAdjustmentPct('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setApplyingAdjustment(false);
    }
  };

  // Load recurring expenses
  const loadRecurring = async () => {
    setLoadingRecurring(true);
    try {
      const res = await billingAPI.loadRecurring(residentId, { month: currentMonth, year: currentYear });
      if (res.data.created === 0) {
        toast.info(t('billing.allConceptsLoaded'));
      } else {
        toast.success(t('billing.conceptsLoaded', { count: res.data.created }));
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    } finally {
      setLoadingRecurring(false);
    }
  };

  // Recurring concept CRUD (local state, saved with config)
  const addRecurringConcept = () => {
    if (!newRecurring.concept || !newRecurring.unitPrice) return;
    setRecurringExpenses(prev => [...prev, { concept: newRecurring.concept, unitPrice: Number(newRecurring.unitPrice), quantity: Number(newRecurring.quantity) || 1 }]);
    setNewRecurring({ concept: '', unitPrice: '', quantity: 1 });
  };

  const removeRecurringConcept = (index) => {
    setRecurringExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const saveConfigWithRecurring = async () => {
    try {
      await billingAPI.upsertConfig(residentId, { ...configForm, recurringExpenses });
      toast.success(t('billing.configSaved'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  // PDF generation
  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const res = await billingAPI.statementPDF(residentId, currentMonth, currentYear);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch {
      toast.error(t('app.error'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Computed totals
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const monthlyFee = statement?.monthlyFee ?? config?.monthlyFee ?? 0;
  const totalAmount = monthlyFee + totalExpenses;
  const amountPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = totalAmount - amountPaid;
  const status = balance <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

  const isLocked = statement?.locked === true;

  const statusClass = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' };
  const statusLabel = { paid: t('billing.status.paid'), partial: t('billing.status.partial'), pending: t('billing.status.pending') };

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate(sid('/billing'))}>
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="page-title">
              <FiDollarSign style={{ marginRight: 8 }} />
              {resident?.firstName} {resident?.lastName}
            </h1>
            {resident?.sucursal && <span style={{ fontSize: 13, color: '#666' }}>{resident.sucursal}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'statement' ? 'active' : ''}`} onClick={() => setActiveTab('statement')}>
          {t('billing.statementTab')}
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          {t('billing.historyTab')}
        </button>
        <button className={`tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
          {t('billing.configTab')}
        </button>
      </div>

      {/* ── TAB: Statement ── */}
      {activeTab === 'statement' && (
        <div>
          {/* Month navigator */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => navigateMonth(-1)}><FiChevronLeft /></button>
                <h3 style={{ margin: 0, minWidth: 180, textAlign: 'center' }}>
                  {MONTHS[currentMonth - 1]} {currentYear}
                </h3>
                <button className="btn btn-secondary" onClick={() => navigateMonth(1)}><FiChevronRight /></button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${statusClass[status]}`}>{statusLabel[status]}</span>
                {statement?._id && (
                  <button
                    className={`btn btn-sm ${isLocked ? 'btn-warning' : 'btn-secondary'}`}
                    onClick={toggleLock}
                    title={isLocked ? t('billing.unlockMonth') : t('billing.lockMonth')}
                  >
                    {isLocked ? <FiLock style={{ marginRight: 4 }} /> : <FiUnlock style={{ marginRight: 4 }} />}
                    {isLocked ? t('billing.locked') : t('billing.lockMonthLabel')}
                  </button>
                )}
                <button className="btn btn-primary" onClick={generatePDF} disabled={generatingPDF}>
                  <FiDownload style={{ marginRight: 4 }} />
                  {generatingPDF ? t('reports.generating') : t('billing.generatePDF')}
                </button>
              </div>
            </div>
          </div>

          {/* Locked banner */}
          {isLocked && (
            <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiLock style={{ color: '#92400e', fontSize: 18 }} />
                <span style={{ color: '#92400e', fontWeight: 600 }}>
                  {t('billing.monthLockedBanner')}
                </span>
                <button className="btn btn-warning btn-sm" style={{ marginLeft: 'auto' }} onClick={toggleLock}>
                  <FiUnlock style={{ marginRight: 4 }} />{t('billing.unlockLabel')}
                </button>
              </div>
            </div>
          )}

          {/* Adjustment alert */}
          {adjustmentAlert && (
            <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ color: '#92400e', fontWeight: 600 }}>
                  ⚠️ {t('billing.adjustmentAlert')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: 100 }}
                    placeholder={t('billing.adjustmentPercentage')}
                    value={adjustmentPct}
                    min={0}
                    onChange={e => setAdjustmentPct(e.target.value)}
                  />
                  <button className="btn btn-warning" onClick={applyAdjustment} disabled={applyingAdjustment}>
                    {applyingAdjustment ? '...' : t('billing.applyAdjustment')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(monthlyFee)}</div>
              <div className="stat-label">{t('billing.monthlyFee')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(totalExpenses)}</div>
              <div className="stat-label">{t('billing.expenses')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(totalAmount)}</div>
              <div className="stat-label">{t('billing.totalAmount')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(amountPaid)}</div>
              <div className="stat-label">{t('billing.amountPaid')}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: `4px solid ${balance <= 0 ? '#28a745' : '#dc3545'}` }}>
              <div className="stat-value" style={{ color: balance <= 0 ? '#28a745' : '#dc3545' }}>{formatCurrency(balance)}</div>
              <div className="stat-label">{t('billing.balance')}</div>
            </div>
          </div>

          {/* Expenses table */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="card-title">{t('billing.expenses')}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {recurringExpenses.length > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={loadRecurring} disabled={loadingRecurring || isLocked}>
                    {loadingRecurring ? '...' : `↺ ${t('billing.loadRecurring')}`}
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={openAddExpense} disabled={isLocked}>
                  <FiPlus style={{ marginRight: 4 }} />{t('billing.addExpense')}
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Search */}
              <div style={{ marginBottom: 12, position: 'relative', maxWidth: 280 }}>
                <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32 }}
                  placeholder={t('billing.searchConcept')}
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                />
              </div>

              {filteredExpenses.length === 0 ? (
                <p className="empty-state">{expenseSearch ? t('billing.noResults') : t('billing.noExpenses')}</p>
              ) : (
                <>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <SortableHeader label={t('billing.concept')} sortKey="concept" sortConfig={expenseSortConfig} onSort={expenseRequestSort} />
                          <SortableHeader label={t('billing.unitPrice')} sortKey="unitPrice" sortConfig={expenseSortConfig} onSort={expenseRequestSort} style={{ textAlign: 'right' }} />
                          <SortableHeader label={t('billing.quantity')} sortKey="quantity" sortConfig={expenseSortConfig} onSort={expenseRequestSort} style={{ textAlign: 'center' }} />
                          <SortableHeader label={t('billing.amount')} sortKey="amount" sortConfig={expenseSortConfig} onSort={expenseRequestSort} style={{ textAlign: 'right' }} />
                          <th>{t('app.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedExpenses.map(exp => (
                          <tr key={exp._id}>
                            <td>
                              {exp.concept}
                              {exp.photo && (
                                <FiCamera
                                  style={{ marginLeft: 6, color: '#7c3aed', verticalAlign: 'middle', cursor: 'pointer' }}
                                  title="Ver foto"
                                  onClick={e => { e.stopPropagation(); setLightboxUrl(resolveFileUrl(exp.photo)); }}
                                />
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(exp.unitPrice)}</td>
                            <td style={{ textAlign: 'center' }}>{exp.quantity}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEditExpense(exp)} disabled={isLocked}><FiEdit2 /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ type: 'expense', id: exp._id })} disabled={isLocked}><FiTrash2 /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!expenseSearch && (
                          <tr style={{ background: '#2a2a2a', fontWeight: 700, color: '#fff' }}>
                            <td colSpan={3} style={{ textAlign: 'right' }}>{t('billing.subtotalExpenses')}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalExpenses)}</td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination totalItems={expTotal} currentPage={expPage} rowsPerPage={expRPP} onPageChange={expPageChange} onRowsPerPageChange={expRPPChange} />
                </>
              )}
            </div>
          </div>

          {/* Payments table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">{t('billing.payments')}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setPaymentModal(true)}>
                <FiPlus style={{ marginRight: 4 }} />{t('billing.addPayment')}
              </button>
            </div>
            <div className="card-body">
              {payments.length === 0 ? (
                <p className="empty-state">{t('billing.noPayments')}</p>
              ) : (
                <>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <SortableHeader label={t('billing.paymentDate')} sortKey="paymentDate" sortConfig={paymentSortConfig} onSort={paymentRequestSort} />
                          <SortableHeader label={t('billing.paymentMethod')} sortKey="method" sortConfig={paymentSortConfig} onSort={paymentRequestSort} />
                          <SortableHeader label={t('billing.amount')} sortKey="amount" sortConfig={paymentSortConfig} onSort={paymentRequestSort} style={{ textAlign: 'right' }} />
                          <th>{t('app.notes')}</th>
                          <th>{t('app.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPayments.map(p => (
                          <tr key={p._id}>
                            <td>{new Date(p.paymentDate).toLocaleDateString('es-UY')}</td>
                            <td>{t(`billing.methods.${p.method}`)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                            <td>{p.notes}</td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ type: 'payment', id: p._id })}><FiTrash2 /></button>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: '#2a2a2a', fontWeight: 700, color: '#fff' }}>
                          <td colSpan={2} style={{ textAlign: 'right' }}>{t('billing.totalPaid')}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(amountPaid)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Pagination totalItems={payTotal} currentPage={payPage} rowsPerPage={payRPP} onPageChange={payPageChange} onRowsPerPageChange={payRPPChange} />
                </>
              )}
            </div>
          </div>
          {/* Addenda */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h3 className="card-title">{t('billing.messageAddenda')}</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                {t('billing.messageAddendaDesc')}
              </p>
              <textarea
                className="form-control"
                rows={3}
                value={addenda}
                onChange={e => setAddenda(e.target.value)}
                placeholder={t('billing.messageAddendaDesc')}
              />
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={saveAddenda} disabled={savingAddenda}>
                <FiSave style={{ marginRight: 4 }} />{savingAddenda ? '...' : t('billing.saveMessage')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('billing.historyTab')}</h3>
          </div>
          <div className="card-body">
            {allStatements.length === 0 ? (
              <p className="empty-state">{t('billing.noStatements')}</p>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <SortableHeader label={t('billing.period')} sortKey="year" sortConfig={stmtSortConfig} onSort={stmtRequestSort} />
                        <SortableHeader label={t('billing.monthlyFee')} sortKey="monthlyFee" sortConfig={stmtSortConfig} onSort={stmtRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.expenses')} sortKey="totalExpenses" sortConfig={stmtSortConfig} onSort={stmtRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.totalAmount')} sortKey="totalAmount" sortConfig={stmtSortConfig} onSort={stmtRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.amountPaid')} sortKey="amountPaid" sortConfig={stmtSortConfig} onSort={stmtRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('billing.balance')} sortKey="balance" sortConfig={stmtSortConfig} onSort={stmtRequestSort} style={{ textAlign: 'right' }} />
                        <SortableHeader label={t('app.status')} sortKey="status" sortConfig={stmtSortConfig} onSort={stmtRequestSort} />
                        <th>{t('app.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedStatements.map(s => (
                        <tr key={s._id}>
                          <td
                            style={{ cursor: 'pointer', color: '#7c3aed' }}
                            onClick={() => { setCurrentMonth(s.month); setCurrentYear(s.year); setActiveTab('statement'); }}
                          >
                            {MONTHS[s.month - 1]} {s.year}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.monthlyFee)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.totalExpenses)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(s.totalAmount)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.amountPaid)}</td>
                          <td style={{ textAlign: 'right', color: s.balance > 0 ? '#dc3545' : '#28a745', fontWeight: 600 }}>{formatCurrency(s.balance)}</td>
                          <td><span className={`badge ${statusClass[s.status]}`}>{statusLabel[s.status]}</span></td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ type: 'statement', id: s._id })}>
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination totalItems={stmtTotal} currentPage={stmtPage} rowsPerPage={stmtRPP} onPageChange={stmtPageChange} onRowsPerPageChange={stmtRPPChange} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Config ── */}
      {activeTab === 'config' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('billing.configTab')}</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
              <div className="form-group">
                <label className="form-label">{t('billing.monthlyFee')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={configForm.monthlyFee}
                  onChange={e => setConfigForm(p => ({ ...p, monthlyFee: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('billing.adjustmentPercentage')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={configForm.adjustmentPercentage}
                  onChange={e => setConfigForm(p => ({ ...p, adjustmentPercentage: Number(e.target.value) }))}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">{t('billing.adjustmentMonths')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {MONTHS.map((m, i) => (
                  <label key={i + 1} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                    padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd',
                    background: configForm.adjustmentMonths.includes(i + 1) ? '#2e7d32' : '#fff',
                    color: configForm.adjustmentMonths.includes(i + 1) ? '#fff' : '#333' }}>
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={configForm.adjustmentMonths.includes(i + 1)}
                      onChange={() => toggleAdjustmentMonth(i + 1)}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">{t('app.notes')}</label>
              <textarea
                className="form-control"
                value={configForm.notes}
                onChange={e => setConfigForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Recurring expenses */}
            <hr style={{ margin: '24px 0', borderColor: '#333' }} />
            <h4 style={{ marginBottom: 12 }}>{t('billing.recurringConcepts')}</h4>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              {t('billing.recurringConceptsDesc')}
            </p>

            {/* Add new recurring concept */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 12, alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('billing.concept')}</label>
                <input className="form-control" value={newRecurring.concept}
                  onChange={e => setNewRecurring(p => ({ ...p, concept: e.target.value }))}
                  placeholder={t('billing.concept')} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('billing.unitPrice')}</label>
                <input type="number" className="form-control" value={newRecurring.unitPrice} min={0}
                  onChange={e => setNewRecurring(p => ({ ...p, unitPrice: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('billing.quantity')}</label>
                <input type="number" className="form-control" value={newRecurring.quantity} min={1}
                  onChange={e => setNewRecurring(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={addRecurringConcept} style={{ marginBottom: 1 }}>
                <FiPlus />
              </button>
            </div>

            {recurringExpenses.length > 0 && (
              <div className="table-container" style={{ marginBottom: 12 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('billing.concept')}</th>
                      <th style={{ textAlign: 'right' }}>{t('billing.unitPrice')}</th>
                      <th style={{ textAlign: 'center' }}>{t('billing.quantity')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringExpenses.map((r, i) => (
                      <tr key={i}>
                        <td>{r.concept}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(r.unitPrice)}</td>
                        <td style={{ textAlign: 'center' }}>{r.quantity}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeRecurringConcept(i)}><FiTrash2 /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="btn btn-success" onClick={saveConfigWithRecurring}>
              <FiSave style={{ marginRight: 4 }} />{t('billing.saveRecurringConcepts')}
            </button>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {expenseModal && (
        <Modal
          title={editingExpense ? t('billing.editExpense') : t('billing.addExpense')}
          onClose={() => setExpenseModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setExpenseModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-primary" onClick={saveExpense}>{t('app.save')}</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">{t('billing.concept')} *</label>
            <input className="form-control" value={expenseForm.concept}
              onChange={e => setExpenseForm(p => ({ ...p, concept: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">{t('billing.unitPrice')} *</label>
              <input type="number" className="form-control" value={expenseForm.unitPrice}
                onChange={e => setExpenseForm(p => ({ ...p, unitPrice: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('billing.quantity')}</label>
              <input type="number" className="form-control" value={expenseForm.quantity} min={1}
                onChange={e => setExpenseForm(p => ({ ...p, quantity: e.target.value }))} />
            </div>
          </div>
          {expenseForm.unitPrice && expenseForm.quantity && (
            <div style={{ textAlign: 'right', fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Total: {formatCurrency(Number(expenseForm.unitPrice) * Number(expenseForm.quantity))}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('billing.photo')}</label>
            <input type="file" accept="image/*" className="form-control"
              onChange={e => setExpensePhoto(e.target.files[0])} />
            {/* Preview: new file selected */}
            {expensePhoto && (
              <img
                src={URL.createObjectURL(expensePhoto)}
                alt="preview"
                style={{ marginTop: 10, maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain', border: '1px solid #444' }}
              />
            )}
            {/* Preview: existing photo when editing */}
            {!expensePhoto && editingExpense?.photo && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={resolveFileUrl(editingExpense.photo)}
                  alt="foto actual"
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain', border: '1px solid #444' }}
                />
                <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {t('billing.photo')}
                </p>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">{t('app.notes')}</label>
            <input className="form-control" value={expenseForm.notes}
              onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <Modal
          title={t('billing.addPayment')}
          onClose={() => setPaymentModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPaymentModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-primary" onClick={savePayment}>{t('app.save')}</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">{t('billing.amount')} *</label>
            <input type="number" className="form-control" value={paymentForm.amount} min={0}
              onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('billing.paymentDate')}</label>
            <input type="date" className="form-control" value={paymentForm.paymentDate}
              onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('billing.paymentMethod')}</label>
            <select className="form-control" value={paymentForm.method}
              onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}>
              <option value="cash">{t('billing.methods.cash')}</option>
              <option value="transfer">{t('billing.methods.transfer')}</option>
              <option value="other">{t('billing.methods.other')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('app.notes')}</label>
            <input className="form-control" value={paymentForm.notes}
              onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </Modal>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out'
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 20, right: 24, background: 'none',
              border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1
            }}
          >×</button>
          <img
            src={lightboxUrl}
            alt="foto"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              borderRadius: 10, objectFit: 'contain',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
            }}
          />
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <ConfirmDialog
          message={t('app.confirmDelete')}
          onConfirm={() => {
            if (confirmDelete.type === 'expense') deleteExpense(confirmDelete.id);
            if (confirmDelete.type === 'payment') deletePayment(confirmDelete.id);
            if (confirmDelete.type === 'statement') deleteStatement(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
