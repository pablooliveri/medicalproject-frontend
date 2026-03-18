import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../context/NotificationContext';
import { FiX, FiAlertTriangle, FiAlertCircle, FiTruck, FiInfo, FiTrash2 } from 'react-icons/fi';
import Pagination from '../common/Pagination';
import usePagination from '../../hooks/usePagination';

const NotificationModal = ({ onClose }) => {
  const { t } = useTranslation();
  const { notifications, deleteNotification } = useNotifications();
  const { paginatedData: paginatedNotifications, currentPage, rowsPerPage, totalItems, handlePageChange, handleRowsPerPageChange } = usePagination(notifications);

  const getIcon = (type) => {
    switch (type) {
      case 'low_stock': return <FiAlertTriangle />;
      case 'out_of_stock': return <FiAlertCircle />;
      case 'delivery': return <FiTruck />;
      default: return <FiInfo />;
    }
  };

  const getIconClass = (type) => {
    switch (type) {
      case 'low_stock': return 'low-stock';
      case 'out_of_stock': return 'out-of-stock';
      case 'delivery': return 'delivery';
      default: return 'general';
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{t('notifications.title')}</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <FiInfo size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            <div className="notification-list">
              {paginatedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className={`notification-icon ${getIconClass(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.createdAt)}</div>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={() => deleteNotification(notification._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
              <Pagination totalItems={totalItems} currentPage={currentPage} rowsPerPage={rowsPerPage} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
