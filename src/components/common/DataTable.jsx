import React, { useMemo, useState } from 'react';

export default function DataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  rowActions,
  pagination,
  selectedRowKeys,
  onSelectionChange,
}) {
  const [internalSelected, setInternalSelected] = useState([]);
  const selected = selectedRowKeys ?? internalSelected;
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? data.length;
  const total = pagination?.total ?? data.length;

  const pageData = useMemo(() => {
    if (pagination?.manual) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, pagination?.manual]);

  const keysOnPage = pageData.map((row) => row[rowKey]);
  const allChecked = keysOnPage.length > 0 && keysOnPage.every((key) => selected.includes(key));

  const updateSelected = (next) => {
    if (selectedRowKeys === undefined) setInternalSelected(next);
    onSelectionChange?.(next);
  };

  const toggleAll = () => {
    const pageKeySet = new Set(keysOnPage);
    const rest = selected.filter((key) => !pageKeySet.has(key));
    updateSelected(allChecked ? rest : [...rest, ...keysOnPage]);
  };

  const toggleRow = (key) => {
    updateSelected(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key]);
  };

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E3E9F3] bg-white shadow-[var(--shadow-card)]">
      <table className="w-full border-collapse text-left">
        <thead className="bg-[#FAFBFD]">
          <tr>
            <th className="h-[52px] w-12 px-4 py-0">
              <input checked={allChecked} onChange={toggleAll} type="checkbox" />
            </th>
            {columns.map((column) => (
              <th key={column.key} className="h-[52px] px-4 py-0 text-sm font-semibold text-[#6F7F98]">
                {column.title}
              </th>
            ))}
            {rowActions ? <th className="h-[52px] px-4 py-0 text-sm font-semibold text-[#6F7F98]">操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {pageData.map((row) => {
            const key = row[rowKey];
            const checked = selected.includes(key);
            return (
              <tr
                key={key}
                className={`border-t border-[#E3E9F3] transition hover:bg-[#F7FAFF] ${
                  checked ? 'bg-[#EAF2FF]' : 'bg-white'
                }`}
              >
                <td className="h-[60px] px-4 py-0">
                  <input checked={checked} onChange={() => toggleRow(key)} type="checkbox" />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="h-[60px] px-4 py-0 text-[15px] text-[#263246]">
                    {column.render ? column.render(row[column.dataIndex], row) : row[column.dataIndex]}
                  </td>
                ))}
                {rowActions ? (
                  <td className="h-[60px] px-4 py-0 text-[15px]">
                    <div className="flex items-center gap-3 text-[#2F7BFF]">{rowActions(row)}</div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex h-14 items-center justify-between border-t border-[#E3E9F3] px-5 text-sm text-[#7889A8]">
        <span>
          共 {total} 条，当前第 {page} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            className="h-8 rounded-[8px] border border-[#D7DEE9] bg-white px-3 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={page <= 1}
            onClick={() => pagination?.onPageChange?.(page - 1)}
            type="button"
          >
            上一页
          </button>
          <button
            className="h-8 rounded-[8px] border border-[#D7DEE9] bg-white px-3 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={page * pageSize >= total}
            onClick={() => pagination?.onPageChange?.(page + 1)}
            type="button"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
