import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { residentsAPI, medicationsAPI, residentMedicationsAPI, deliveriesAPI, settingsAPI } from '../services/api';
import { sid } from '../utils/session';
import { FiUsers, FiPackage, FiAlertTriangle, FiAlertCircle, FiPlus, FiFileText, FiTruck } from 'react-icons/fi';
import Pagination from '../components/common/Pagination';
import SortableHeader from '../components/common/SortableHeader';
import usePagination from '../hooks/usePagination';
import useSortableTable from '../hooks/useSortableTable';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ residents: 0, activeResidents: 0, medications: 0, lowStock: 0, outOfStock: 0 });
  const [shortages, setShortages] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { sortedData: sortedShortages, sortConfig: shortagesSortConfig, requestSort: shortagesRequestSort } = useSortableTable(shortages);
  const { sortedData: sortedDeliveries, sortConfig: deliveriesSortConfig, requestSort: deliveriesRequestSort } = useSortableTable(recentDeliveries);
  const { paginatedData: paginatedShortages, currentPage: shortagesPage, rowsPerPage: shortagesRowsPerPage, totalItems: shortagesTotal, handlePageChange: shortagesPageChange, handleRowsPerPageChange: shortagesRowsChange } = usePagination(sortedShortages);
  const { paginatedData: paginatedDeliveries, currentPage: deliveriesPage, rowsPerPage: deliveriesRowsPerPage, totalItems: deliveriesTotal, handlePageChange: deliveriesPageChange, handleRowsPerPageChange: deliveriesRowsChange } = usePagination(sortedDeliveries);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [residentsRes, medsRes, resMedsRes, deliveriesRes, settingsRes] = await Promise.all([
        residentsAPI.getAll(),
        medicationsAPI.getAll(),
        residentMedicationsAPI.getAll({ isActive: true }),
        deliveriesAPI.getAll(),
        settingsAPI.get()
      ]);

      const threshold = settingsRes.data?.lowStockThresholdDays ?? 5;

      const residents = residentsRes.data;
      const activeResidents = residents.filter(r => r.isActive);

      // Calculate shortages from actual medication data
      const allMedsWithDays = resMedsRes.data
        .map(rm => {
          const daily = (rm.schedule?.breakfast || 0) + (rm.schedule?.lunch || 0) +
                        (rm.schedule?.snack || 0) + (rm.schedule?.dinner || 0);
          const daysRemaining = daily > 0 ? Math.floor(rm.currentStock / daily) : null;
          const coverageDate = daily > 0 ? new Date(Date.now() + daysRemaining * 86400000) : null;
          return {
            _id: rm._id,
            residentName: rm.resident ? `${rm.resident.firstName} ${rm.resident.lastName}` : 'N/A',
            medicationName: rm.medication?.genericName || 'N/A',
            daysRemaining,
            coverageDate,
            currentStock: rm.currentStock
          };
        });

      const shortageList = allMedsWithDays
        .filter(item => item.daysRemaining !== null && item.daysRemaining <= threshold)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      const outOfStockCount = allMedsWithDays.filter(item => item.currentStock === 0 && item.daysRemaining !== null).length;
      const lowStockCount = allMedsWithDays.filter(item => item.daysRemaining !== null && item.currentStock > 0 && item.daysRemaining <= threshold).length;

      setStats({
        residents: residents.length,
        activeResidents: activeResidents.length,
        medications: medsRes.data.length,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      });

      setShortages(shortageList);
      setRecentDeliveries(deliveriesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">{t('app.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary"><FiUsers /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeResidents}</div>
            <div className="stat-label">{t('dashboard.activeResidents')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><FiPackage /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.medications}</div>
            <div className="stat-label">{t('dashboard.totalMedications')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiAlertTriangle /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">{t('dashboard.lowStockAlerts')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger"><FiAlertCircle /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.outOfStock}</div>
            <div className="stat-label">{t('dashboard.outOfStock')}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">{t('dashboard.quickActions')}</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to={sid("/residents")} className="btn btn-primary"><FiPlus /> {t('dashboard.addResident')}</Link>
          <Link to={sid("/medications")} className="btn btn-primary"><FiPlus /> {t('dashboard.addMedication')}</Link>
          <Link to={sid("/deliveries/new")} className="btn btn-success"><FiTruck /> {t('dashboard.newDelivery')}</Link>
          <Link to={sid("/reports")} className="btn btn-secondary"><FiFileText /> {t('dashboard.viewReports')}</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upcoming Shortages */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.upcomingShortages')}</h3>
          </div>
          <div className="card-body">
            {shortages.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <p>{t('dashboard.noAlerts')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <SortableHeader label={t('dashboard.residentName')} sortKey="residentName" sortConfig={shortagesSortConfig} onSort={shortagesRequestSort} />
                      <SortableHeader label={t('dashboard.medication')} sortKey="medicationName" sortConfig={shortagesSortConfig} onSort={shortagesRequestSort} />
                      <SortableHeader label={t('dashboard.daysRemaining')} sortKey="daysRemaining" sortConfig={shortagesSortConfig} onSort={shortagesRequestSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedShortages.map(item => (
                      <tr key={item._id}>
                        <td>{item.residentName}</td>
                        <td>{item.medicationName}</td>
                        <td>
                          <span className={`badge ${item.daysRemaining <= 2 ? 'badge-danger' : 'badge-warning'}`}>
                            {item.daysRemaining} {t('dashboard.daysRemaining').toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination totalItems={shortagesTotal} currentPage={shortagesPage} rowsPerPage={shortagesRowsPerPage} onPageChange={shortagesPageChange} onRowsPerPageChange={shortagesRowsChange} />
              </div>
            )}
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.recentDeliveries')}</h3>
          </div>
          <div className="card-body">
            {recentDeliveries.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <p>{t('dashboard.noDeliveries')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <SortableHeader label={t('app.date')} sortKey="deliveryDate" sortConfig={deliveriesSortConfig} onSort={deliveriesRequestSort} />
                      <SortableHeader label={t('dashboard.residentName')} sortKey="resident.firstName" sortConfig={deliveriesSortConfig} onSort={deliveriesRequestSort} />
                      <SortableHeader label={t('deliveries.deliveredBy')} sortKey="deliveredBy" sortConfig={deliveriesSortConfig} onSort={deliveriesRequestSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDeliveries.map(d => (
                      <tr key={d._id}>
                        <td>{new Date(d.deliveryDate).toLocaleDateString()}</td>
                        <td>{d.resident ? `${d.resident.firstName} ${d.resident.lastName}` : 'N/A'}</td>
                        <td>{d.deliveredBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination totalItems={deliveriesTotal} currentPage={deliveriesPage} rowsPerPage={deliveriesRowsPerPage} onPageChange={deliveriesPageChange} onRowsPerPageChange={deliveriesRowsChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
