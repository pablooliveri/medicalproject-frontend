import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { residentsAPI, settingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiUser, FiCheckCircle } from 'react-icons/fi';
import Pagination from '../components/common/Pagination';
import SortableHeader from '../components/common/SortableHeader';
import usePagination from '../hooks/usePagination';
import useSortableTable from '../hooks/useSortableTable';

const Residents = () => {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sucursalFilter, setSucursalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', cedula: '', admissionDate: '', notes: '', sucursal: '' });
  const { sortedData: sortedResidents, sortConfig, requestSort } = useSortableTable(residents);
  const { paginatedData: paginatedResidents, currentPage, rowsPerPage, totalItems, handlePageChange, handleRowsPerPageChange } = usePagination(sortedResidents);

  useEffect(() => {
    settingsAPI.get().then(res => {
      const b = res.data.branches || [];
      setBranches(b);
      setForm(f => ({ ...f, sucursal: f.sucursal || b[0] || '' }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [search, filter, sucursalFilter]);

  const fetchResidents = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'all') params.isActive = filter === 'active';
      if (sucursalFilter) params.sucursal = sucursalFilter;
      const { data } = await residentsAPI.getAll(params);
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setSelectedResident(null);
    setForm({ firstName: '', lastName: '', cedula: '', admissionDate: '', notes: '', sucursal: branches[0] || '' });
    setShowModal(true);
  };

  const openEdit = (resident) => {
    setSelectedResident(resident);
    setForm({
      firstName: resident.firstName,
      lastName: resident.lastName,
      cedula: resident.cedula,
      admissionDate: resident.admissionDate ? resident.admissionDate.split('T')[0] : '',
      notes: resident.notes || '',
      sucursal: resident.sucursal || branches[0] || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedResident) {
        await residentsAPI.update(selectedResident._id, form);
        toast.success(t('residents.updated'));
      } else {
        await residentsAPI.create(form);
        toast.success(t('residents.created'));
      }
      setShowModal(false);
      fetchResidents();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await residentsAPI.delete(selectedResident._id);
      toast.success(t('residents.deleted'));
      setShowConfirm(false);
      setSelectedResident(null);
      fetchResidents();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleActivate = async () => {
    try {
      await residentsAPI.update(selectedResident._id, { isActive: true });
      toast.success(t('residents.activated'));
      setShowActivateConfirm(false);
      setSelectedResident(null);
      fetchResidents();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('residents.title')}</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> {t('residents.addResident')}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('residents.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sucursal filter */}
        <select
          className="form-control"
          style={{ maxWidth: 160 }}
          value={sucursalFilter}
          onChange={(e) => setSucursalFilter(e.target.value)}
        >
          <option value="">{isEs ? 'Todas las Sucursales' : 'All Branches'}</option>
          {branches.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {t(`app.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {residents.length === 0 ? (
            <div className="empty-state">
              <FiUser className="empty-state-icon" />
              <h3>{t('residents.noResidents')}</h3>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <SortableHeader label={t('residents.firstName')} sortKey="firstName" sortConfig={sortConfig} onSort={requestSort} />
                    <SortableHeader label={t('residents.lastName')} sortKey="lastName" sortConfig={sortConfig} onSort={requestSort} />
                    <th>{t('residents.cedula')}</th>
                    <SortableHeader label={isEs ? 'Sucursal' : 'Branch'} sortKey="sucursal" sortConfig={sortConfig} onSort={requestSort} />
                    <th>{t('residents.admissionDate')}</th>
                    <th>{t('app.status')}</th>
                    <th>{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResidents.map(r => (
                    <tr key={r._id}>
                      <td>{r.firstName}</td>
                      <td>{r.lastName}</td>
                      <td>{r.cedula}</td>
                      <td>
                        <span className="badge badge-info" style={{ background: '#6c757d', color: '#fff' }}>
                          {r.sucursal || branches[0] || '-'}
                        </span>
                      </td>
                      <td>{new Date(r.admissionDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {r.isActive ? t('app.active') : t('app.inactive')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/residents/${r._id}`)}>
                            <FiEye />
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(r)}>
                            <FiEdit />
                          </button>
                          {r.isActive ? (
                            <button className="btn btn-sm btn-danger" onClick={() => { setSelectedResident(r); setShowConfirm(true); }}>
                              <FiTrash2 />
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-success" onClick={() => { setSelectedResident(r); setShowActivateConfirm(true); }}>
                              <FiCheckCircle />
                            </button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={selectedResident ? t('residents.editResident') : t('residents.addResident')}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{t('app.save')}</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('residents.firstName')}</label>
                <input className="form-control" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('residents.lastName')}</label>
                <input className="form-control" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('residents.cedula')}</label>
                <input className="form-control" value={form.cedula} onChange={(e) => setForm({...form, cedula: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('residents.admissionDate')}</label>
                <input type="date" className="form-control" value={form.admissionDate} onChange={(e) => setForm({...form, admissionDate: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{isEs ? 'Sucursal' : 'Branch'}</label>
              <select
                className="form-control"
                value={form.sucursal}
                onChange={(e) => setForm({...form, sucursal: e.target.value})}
              >
                {branches.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('residents.notes')}</label>
              <textarea className="form-control" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete */}
      {showConfirm && (
        <ConfirmDialog
          title={t('app.confirm')}
          message={t('residents.deleteConfirm')}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Confirm Activate */}
      {showActivateConfirm && (
        <ConfirmDialog
          title={t('app.confirm')}
          message={t('residents.activateConfirm')}
          onConfirm={handleActivate}
          onCancel={() => setShowActivateConfirm(false)}
        />
      )}
    </div>
  );
};

export default Residents;
