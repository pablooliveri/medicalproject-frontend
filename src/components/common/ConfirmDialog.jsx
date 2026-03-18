import { useTranslation } from 'react-i18next';
import Modal from './Modal';

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {t('app.cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {t('app.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
