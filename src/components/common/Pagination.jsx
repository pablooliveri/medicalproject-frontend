import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ totalItems, currentPage, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  return (
    <div className="pagination-controls">
      <div className="pagination-rows">
        <label>{t('app.rowsPerPage')}:</label>
        <input
          type="number"
          min="1"
          value={rowsPerPage}
          onChange={(e) => {
            const val = Math.max(1, parseInt(e.target.value) || 1);
            onRowsPerPageChange(val);
          }}
          className="pagination-input"
        />
      </div>
      <div className="pagination-nav">
        <span className="pagination-info">
          {t('app.page')} {currentPage} {t('app.of')} {totalPages}
        </span>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <FiChevronLeft />
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
