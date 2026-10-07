import React from 'react';
import { Activity, Download, Building2, MapPin } from 'lucide-react';

interface TopBarProps {
  activeTab: 'overview' | 'trends' | 'town-features' | 'transactions';
  setActiveTab: (tab: 'overview' | 'trends' | 'town-features' | 'transactions') => void;
  selectedTown: string;
  selectedFlatType: string;
  apiHealthy: boolean | null;
  onOpenHealthModal: () => void;
  onExportCsv: () => void;
  totalRecordsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  selectedTown,
  selectedFlatType,
  apiHealthy,
  onOpenHealthModal,
  onExportCsv,
  totalRecordsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <div className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-rose-400 transition-colors">
              SG Flat Price Explorer
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>HDB Resale Intelligence</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">data.gov.sg</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Price Trends
          </button>
          <button
            onClick={() => setActiveTab('town-features')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'town-features'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Town Features</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Transactions
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* API Health Monitor Trigger */}
          <button
            onClick={onOpenHealthModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 transition-all cursor-pointer shadow-sm group"
            title="Monitor data.gov.sg & /api/health/js status"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  apiHealthy === true
                    ? 'bg-emerald-400'
                    : apiHealthy === false
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  apiHealthy === true
                    ? 'bg-emerald-500'
                    : apiHealthy === false
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
            </span>
            <Activity className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {apiHealthy === true ? 'API: Operational' : apiHealthy === false ? 'API: Offline' : 'API: Checking...'}
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              API
            </span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            disabled={totalRecordsCount === 0}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
