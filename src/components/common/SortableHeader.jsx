import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

/**
 * Clickable table header cell with sort direction indicator.
 *
 * Props:
 *   label      - Display text
 *   sortKey    - Key to sort by (string path like "medication.genericName" or function)
 *   sortConfig - Current sort state from useSortableTable: { key, direction } | null
 *   onSort     - requestSort function from useSortableTable
 *   style      - Optional extra styles on the <th>
 */
const SortableHeader = ({ label, sortKey, sortConfig, onSort, style = {} }) => {
  const isActive = sortConfig?.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <th
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => onSort(sortKey)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {direction === 'asc' && <FiArrowUp size={12} />}
        {direction === 'desc' && <FiArrowDown size={12} />}
        {!direction && <span style={{ color: '#bbb', fontSize: 10 }}>&#8693;</span>}
      </span>
    </th>
  );
};

export default SortableHeader;
