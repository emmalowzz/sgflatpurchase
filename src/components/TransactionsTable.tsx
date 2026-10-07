import React, { useState, useMemo } from 'react';
import { FlatRecord } from '../types/flat';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';

interface TransactionsTableProps {
  records: FlatRecord[];
  isLoading: boolean;
  selectedTown: string;
  selectedFlatType: string;
  onExportCsv: () => void;
}

type SortField = 'month' | 'resale_price' | 'floor_area_sqm' | 'price_psm';
type SortOrder = 'asc' | 'desc';

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  records,
  isLoading,
  selectedTown,
  selectedFlatType,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('month');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter records by search term
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!searchTerm.trim()) return records;

    const term = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        r.street_name.toLowerCase().includes(term) ||
        r.block.toLowerCase().includes(term) ||
        r.flat_model.toLowerCase().includes(term) ||
        r.town.toLowerCase().includes(term)
    );
  }, [records, searchTerm]);

  // Sort filtered records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      const aPrice = typeof a.resale_price === 'number' ? a.resale_price : parseFloat(a.resale_price as string) || 0;
      const bPrice = typeof b.resale_price === 'number' ? b.resale_price : parseFloat(b.resale_price as string) || 0;
      const aArea = typeof a.floor_area_sqm === 'number' ? a.floor_area_sqm : parseFloat(a.floor_area_sqm as string) || 1;
      const bArea = typeof b.floor_area_sqm === 'number' ? b.floor_area_sqm : parseFloat(b.floor_area_sqm as string) || 1;

      if (sortField === 'month') {
        aVal = a.month;
        bVal = b.month;
      } else if (sortField === 'resale_price') {
        aVal = aPrice;
        bVal = bPrice;
      } else if (sortField === 'floor_area_sqm') {
        aVal = aArea;
        bVal = bArea;
      } else if (sortField === 'price_psm') {
        aVal = aPrice / aArea;
        bVal = bPrice / bArea;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const parseNumber = (val: string | number) => {
    return typeof val === 'number' ? val : parseFloat(val) || 0;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Transacted Resale Flat Records
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {sortedRecords.length.toLocaleString()} matching records from data.gov.sg
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search within filtered results */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search street, blk, model..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <button
            onClick={onExportCsv}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => handleSort('month')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Month</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Address & Block</th>
              <th className="py-3 px-4">Town</th>
              <th className="py-3 px-4">Flat Type & Model</th>
              <th className="py-3 px-4">Storey</th>
              <th
                onClick={() => handleSort('floor_area_sqm')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Area (m²)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('resale_price')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Resale Price</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('price_psm')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Unit $/m²</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Remaining Lease</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                  Loading records...
                </td>
              </tr>
            ) : paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No records match your criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec) => {
                const price = parseNumber(rec.resale_price);
                const area = parseNumber(rec.floor_area_sqm);
                const psm = area > 0 ? Math.round(price / area) : 0;
                const psf = area > 0 ? Math.round(price / (area * 10.7639)) : 0;

                return (
                  <tr
                    key={rec._id}
                    className="hover:bg-slate-800/30 transition-colors font-mono"
                  >
                    <td className="py-2.5 px-4 text-rose-300 font-medium">
                      {rec.month}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-200">
                      <span className="font-semibold text-white">Blk {rec.block}</span> {rec.street_name}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">
                      {rec.town}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-300">
                      <div>{rec.flat_type}</div>
                      <div className="text-[10px] text-slate-500">{rec.flat_model}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {rec.storey_range}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-300">
                      <div>{area.toFixed(1)} m²</div>
                      <div className="text-[10px] text-slate-500">{(area * 10.7639).toFixed(0)} sqft</div>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-white">
                      ${price.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-emerald-400 font-medium">
                      <div>${psm.toLocaleString()}/m²</div>
                      <div className="text-[10px] text-slate-500 font-normal">${psf.toLocaleString()}/sqft</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {rec.remaining_lease || `Commenced ${rec.lease_commence_date}`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-mono text-slate-200">
            {sortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-mono text-slate-200">
            {Math.min(currentPage * pageSize, sortedRecords.length)}
          </span>{' '}
          of <span className="font-mono text-slate-200">{sortedRecords.length}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] px-2 text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
