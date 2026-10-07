import React from 'react';
import { SINGAPORE_TOWNS, FLAT_TYPES } from '../data/towns';
import { MapPin, Home, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface FilterControlsProps {
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  selectedFlatType: string;
  setSelectedFlatType: (flatType: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  selectedTown,
  setSelectedTown,
  selectedFlatType,
  setSelectedFlatType,
  limit,
  setLimit,
  isLoading,
  onRefresh,
}) => {
  // Group towns by region
  const regions = ['Central', 'East', 'North-East', 'North', 'West'] as const;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Town & Flat Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 sm:gap-4 flex-1">
          {/* Town Selector */}
          <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>HDB Town</span>
            </label>
            <div className="relative">
              <select
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-white appearance-none cursor-pointer focus:outline-none focus:border-rose-500/50 transition-colors"
              >
                <option value="ALL">All Towns (Island-wide)</option>
                {regions.map((reg) => (
                  <optgroup key={reg} label={`${reg} Region`}>
                    {SINGAPORE_TOWNS.filter((t) => t.region === reg).map((town) => (
                      <option key={town.id} value={town.id}>
                        {town.displayName} ({town.estateType})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Flat Type Selector */}
          <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>Flat Type</span>
            </label>
            <div className="relative">
              <select
                value={selectedFlatType}
                onChange={(e) => setSelectedFlatType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-white appearance-none cursor-pointer focus:outline-none focus:border-sky-500/50 transition-colors"
              >
                {FLAT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Flat Types' : type}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sample Size / Record Limit */}
          <div className="flex flex-col gap-1.5 sm:w-36">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Record Fetch</span>
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 cursor-pointer focus:outline-none"
            >
              <option value={300}>300 records</option>
              <option value={500}>500 records</option>
              <option value={1000}>1,000 records</option>
              <option value={2000}>2,000 records</option>
            </select>
          </div>
        </div>

        {/* Right Side: Quick Town Shortcuts & Refresh */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          {/* Quick Town Pill Shortcuts */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto text-xs py-1">
            <span className="text-[11px] text-slate-500 mr-1">Popular:</span>
            {['BEDOK', 'BISHAN', 'TAMPINES', 'QUEENSTOWN', 'PUNGGOL'].map((townId) => (
              <button
                key={townId}
                onClick={() => setSelectedTown(townId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedTown === townId
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {townId === 'QUEENSTOWN' ? 'Queenstown' : townId.charAt(0) + townId.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0 ml-auto lg:ml-0 disabled:opacity-50"
            title="Refetch data from data.gov.sg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
