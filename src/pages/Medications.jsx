import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { medicationsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiPackage, FiCheckCircle } from 'react-icons/fi';
import Pagination from '../components/common/Pagination';
import SortableHeader from '../components/common/SortableHeader';
import usePagination from '../hooks/usePagination';
import useSortableTable from '../hooks/useSortableTable';

const Medications = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ genericName: '', commercialName: '', dosageUnit: 'mg', form: 'tablet', description: '' });
  const { sortedData: sortedMedications, sortConfig, requestSort } = useSortableTable(medications);
  const { paginatedData: paginatedMedications, currentPage, rowsPerPage, totalItems, handlePageChange, handleRowsPerPageChange } = usePagination(sortedMedications);

  const units = ['mg', 'ml', 'g', 'mcg', 'UI', 'drops', 'sachets', 'tablets', 'capsules', 'other'];
  const forms = ['tablet', 'capsule', 'liquid', 'drops', 'injection', 'cream', 'inhaler', 'sachet', 'other'];

  useEffect(() => { fetchMedications(); }, [search, filter]);

  const fetchMedications = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'all') params.isActive = filter === 'active';
      const { data } = await medicationsAPI.getAll(params);
      setMedications(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ genericName: '', commercialName: '', dosageUnit: 'mg', form: 'tablet', description: '' });
    setShowModal(true);
  };

  const openEdit = (med) => {
    setSelected(med);
    setForm({
      genericName: med.genericName,
      commercialName: med.commercialName || '',
      dosageUnit: med.dosageUnit,
      form: med.form,
      description: med.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (selected) {
        await medicationsAPI.update(selected._id, form);
        toast.success(t('medications.updated'));
      } else {
        await medicationsAPI.create(form);
        toast.success(t('medications.created'));
      }
      setShowModal(false);
      fetchMedications();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await medicationsAPI.delete(selected._id);
      toast.success(t('medications.deleted'));
      setShowConfirm(false);
      fetchMedications();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleActivate = async () => {
    try {
      await medicationsAPI.update(selected._id, { isActive: true });
      toast.success(t('medications.activated'));
      setShowActivateConfirm(false);
      fetchMedications();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('medications.title')}</h1>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> {t('medications.addMedication')}</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <FiSearch className="search-icon" />
          <input placeholder={t('medications.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {t(`app.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {medications.length === 0 ? (
            <div className="empty-state"><FiPackage className="empty-state-icon" /><h3>{t('medications.noMedications')}</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <SortableHeader label={t('medications.genericName')} sortKey="genericName" sortConfig={sortConfig} onSort={requestSort} />
                    <SortableHeader label={t('medications.commercialName')} sortKey="commercialName" sortConfig={sortConfig} onSort={requestSort} />
                    <th>{t('medications.dosageUnit')}</th>
                    <th>{t('medications.form')}</th>
                    <th>{t('app.status')}</th>
                    <th>{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMedications.map(med => (
                    <tr key={med._id}>
                      <td>{med.genericName}</td>
                      <td>{med.commercialName || '-'}</td>
                      <td>{t(`medications.units.${med.dosageUnit}`)}</td>
                      <td>{t(`medications.forms.${med.form}`)}</td>
                      <td><span className={`badge ${med.isActive ? 'badge-success' : 'badge-danger'}`}>{med.isActive ? t('app.active') : t('app.inactive')}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(med)}><FiEdit /></button>
                          {med.isActive ? (
                            <button className="btn btn-sm btn-danger" onClick={() => { setSelected(med); setShowConfirm(true); }}><FiTrash2 /></button>
                          ) : (
                            <button className="btn btn-sm btn-success" onClick={() => { setSelected(med); setShowActivateConfirm(true); }}><FiCheckCircle /></button>
                          )}
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

      {showModal && (
        <Modal
          title={selected ? t('medications.editMedication') : t('medications.addMedication')}
          onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button><button className="btn btn-primary" onClick={handleSubmit}>{t('app.save')}</button></>}
        >
          <div className="form-group">
            <label className="form-label">{t('medications.genericName')}</label>
            <input className="form-control" value={form.genericName} onChange={(e) => setForm({...form, genericName: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('medications.commercialName')}</label>
            <input className="form-control" value={form.commercialName} onChange={(e) => setForm({...form, commercialName: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('medications.dosageUnit')}</label>
              <select className="form-control" value={form.dosageUnit} onChange={(e) => setForm({...form, dosageUnit: e.target.value})}>
                {units.map(u => <option key={u} value={u}>{t(`medications.units.${u}`)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('medications.form')}</label>
              <select className="form-control" value={form.form} onChange={(e) => setForm({...form, form: e.target.value})}>
                {forms.map(f => <option key={f} value={f}>{t(`medications.forms.${f}`)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('medications.description')}</label>
            <textarea className="form-control" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>
        </Modal>
      )}

      {showConfirm && (
        <ConfirmDialog title={t('app.confirm')} message={t('medications.deleteConfirm')} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} />
      )}

      {showActivateConfirm && (
        <ConfirmDialog title={t('app.confirm')} message={t('medications.activateConfirm')} onConfirm={handleActivate} onCancel={() => setShowActivateConfirm(false)} />
      )}
    </div>
  );
};

export default Medications;
