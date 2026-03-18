import { useState, useMemo } from 'react';

/**
 * Hook for sortable table columns.
 *
 * Usage:
 *   const { sortedData, sortConfig, requestSort } = useSortableTable(data);
 *   // In thead: <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
 *   // In tbody: sortedData.map(...)
 *
 * @param {Array} data - The array of items to sort
 * @returns {Object} { sortedData, sortConfig, requestSort }
 */
const useSortableTable = (data) => {
  // sortConfig: { key, direction } or null (default order)
  const [sortConfig, setSortConfig] = useState(null);

  const requestSort = (key) => {
    setSortConfig(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null; // back to default
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const { key, direction } = sortConfig;

      // Support nested keys like "medication.genericName" and also function keys
      const getValue = (obj, k) => {
        if (typeof k === 'function') return k(obj);
        return k.split('.').reduce((o, part) => o?.[part], obj);
      };

      let valA = getValue(a, key);
      let valB = getValue(b, key);

      // Handle nulls/undefined
      if (valA == null) valA = '';
      if (valB == null) valB = '';

      // String comparison with locale
      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
        return direction === 'asc' ? cmp : -cmp;
      }

      // Numeric / date comparison
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return { sortedData, sortConfig, requestSort };
};

export default useSortableTable;
