/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { FilterControls } from './components/FilterControls';
import { TownFeaturesBackground } from './components/TownFeaturesBackground';
import { PriceTrendChart } from './components/PriceTrendChart';
import { TransactionsTable } from './components/TransactionsTable';
import { ApiHealthModal } from './components/ApiHealthModal';
import { FlatRecord, MonthlyTrendPoint } from './types/flat';
import { getTownProfile, SINGAPORE_TOWNS } from './data/towns';
import heroBackgroundImg from './assets/images/sg_skyline_hdb_hero_1791357603341.jpg';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [selectedTown, setSelectedTown] = useState<string>('BEDOK');
  const [selectedFlatType, setSelectedFlatType] = useState<string>('4 ROOM');
  const [limit, setLimit] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'town-features' | 'transactions'>('overview');

  const [records, setRecords] = useState<FlatRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // API Health status state
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);

  // Get active town profile
  const townProfile = useMemo(() => {
    return getTownProfile(selectedTown);
  }, [selectedTown]);

  // Check health on initial load
  const checkInitialHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health/js');
      const data = await res.json();
      setApiHealthy(data?.healthy === true);
    } catch {
      setApiHealthy(false);
    }
  }, []);

  useEffect(() => {
    checkInitialHealth();
  }, [checkInitialHealth]);

  // Fetch flats from proxy /api/flats or direct fallback to data.gov.sg
  const fetchFlatData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      if (selectedTown && selectedTown !== 'ALL') {
        params.set('town', selectedTown);
      }
      if (selectedFlatType && selectedFlatType !== 'ALL') {
        params.set('flat_type', selectedFlatType);
      }
      params.set('limit', limit.toString());
      params.set('sort', 'month desc');

      // Fetch via backend proxy route first
      let response = await fetch(`/api/flats?${params.toString()}`);
      
      // Fallback directly to data.gov.sg if proxy route ever fails
      if (!response.ok) {
        console.warn('Backend proxy failed, attempting direct data.gov.sg fallback...');
        const upstreamUrl = new URL('https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc');
        upstreamUrl.searchParams.set('limit', limit.toString());
        upstreamUrl.searchParams.set('sort', 'month desc');
        const filters: Record<string, string> = {};
        if (selectedTown && selectedTown !== 'ALL') filters.town = selectedTown;
        if (selectedFlatType && selectedFlatType !== 'ALL') filters.flat_type = selectedFlatType;
        if (Object.keys(filters).length > 0) {
          upstreamUrl.searchParams.set('filters', JSON.stringify(filters));
        }
        response = await fetch(upstreamUrl.toString());
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const json = await response.json();
      const rawRecords: FlatRecord[] = json?.result?.records || [];
      setRecords(rawRecords);
      setApiHealthy(true);
    } catch (err: any) {
      console.error('Error fetching flat data:', err);
      setFetchError(err?.message || 'Unable to fetch data from data.gov.sg');
      setApiHealthy(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTown, selectedFlatType, limit]);

  useEffect(() => {
    fetchFlatData();
  }, [fetchFlatData]);

  // Aggregate raw records into monthly trend data
  const monthlyTrendData = useMemo<MonthlyTrendPoint[]>(() => {
    if (!records || records.length === 0) return [];

    const monthMap = new Map<string, FlatRecord[]>();

    for (const rec of records) {
      if (!rec.month) continue;
      const existing = monthMap.get(rec.month) || [];
      existing.push(rec);
      monthMap.set(rec.month, existing);
    }

    // Sort months chronologically ascending (e.g. 2024-01 to 2026-10)
    const sortedMonths = Array.from(monthMap.keys()).sort();

    return sortedMonths.map((month) => {
      const monthRecs = monthMap.get(month)!;
      const count = monthRecs.length;

      const prices = monthRecs
        .map((r) => (typeof r.resale_price === 'number' ? r.resale_price : parseFloat(r.resale_price as string) || 0))
        .filter((p) => p > 0);

      const totalPrice = prices.reduce((acc, p) => acc + p, 0);
      const avgPrice = count > 0 ? Math.round(totalPrice / count) : 0;

      // Median calculation
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const mid = Math.floor(sortedPrices.length / 2);
      const medianPrice =
        sortedPrices.length % 2 !== 0
          ? sortedPrices[mid]
          : Math.round(((sortedPrices[mid - 1] || 0) + (sortedPrices[mid] || 0)) / 2);

      const minPrice = sortedPrices[0] || avgPrice;
      const maxPrice = sortedPrices[sortedPrices.length - 1] || avgPrice;

      // Price per sqm & sqft
      let totalPsm = 0;
      let psmCount = 0;
      for (const r of monthRecs) {
        const area = typeof r.floor_area_sqm === 'number' ? r.floor_area_sqm : parseFloat(r.floor_area_sqm as string) || 0;
        const price = typeof r.resale_price === 'number' ? r.resale_price : parseFloat(r.resale_price as string) || 0;
        if (area > 0 && price > 0) {
          totalPsm += price / area;
          psmCount++;
        }
      }
      const avgPsm = psmCount > 0 ? Math.round(totalPsm / psmCount) : 0;
      const avgPsf = Math.round(avgPsm / 10.7639);

      return {
        month,
        count,
        avgPrice,
        medianPrice,
        minPrice,
        maxPrice,
        avgPsm,
        avgPsf,
        records: monthRecs,
      };
    });
  }, [records]);

  // Export CSV handler
  const handleExportCsv = useCallback(() => {
    if (!records || records.length === 0) return;

    const headers = [
      'Month',
      'Town',
      'Flat Type',
      'Block',
      'Street Name',
      'Storey Range',
      'Floor Area (sqm)',
      'Flat Model',
      'Lease Commence Date',
      'Remaining Lease',
      'Resale Price (SGD)',
      'Price Per Sqm (SGD)',
    ];

    const rows = records.map((r) => {
      const price = typeof r.resale_price === 'number' ? r.resale_price : parseFloat(r.resale_price as string) || 0;
      const area = typeof r.floor_area_sqm === 'number' ? r.floor_area_sqm : parseFloat(r.floor_area_sqm as string) || 1;
      const psm = area > 0 ? Math.round(price / area) : 0;

      return [
        `"${r.month}"`,
        `"${r.town}"`,
        `"${r.flat_type}"`,
        `"${r.block}"`,
        `"${r.street_name}"`,
        `"${r.storey_range}"`,
        `"${r.floor_area_sqm}"`,
        `"${r.flat_model}"`,
        `"${r.lease_commence_date}"`,
        `"${r.remaining_lease}"`,
        `"${price}"`,
        `"${psm}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `sg_hdb_${selectedTown.toLowerCase()}_${selectedFlatType.toLowerCase().replace(/\s+/g, '_')}_resale_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [records, selectedTown, selectedFlatType]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-200">
      {/* Background Architectural Canvas Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={heroBackgroundImg}
          alt="Singapore HDB skyline architecture"
          className="w-full h-full object-cover object-center opacity-15 filter blur-[2px] scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Deep Dark Gradient Scrim to guarantee WCAG AA contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/95 to-slate-950" />
      </div>

      {/* Top Navigation Bar */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTown={selectedTown}
        selectedFlatType={selectedFlatType}
        apiHealthy={apiHealthy}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onExportCsv={handleExportCsv}
        totalRecordsCount={records.length}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Interactive Filter Control Header */}
        <FilterControls
          selectedTown={selectedTown}
          setSelectedTown={setSelectedTown}
          selectedFlatType={selectedFlatType}
          setSelectedFlatType={setSelectedFlatType}
          limit={limit}
          setLimit={setLimit}
          isLoading={isLoading}
          onRefresh={fetchFlatData}
        />

        {/* Error notification banner if API has issues */}
        {fetchError && (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200 flex items-center justify-between">
            <div>
              <span className="font-semibold">Notice:</span> {fetchError}
            </div>
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="underline hover:text-white cursor-pointer ml-3 font-medium"
            >
              Open API Diagnostics
            </button>
          </div>
        )}

        {/* View Mode: Overview (Default) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Background Town Key Features Spotlight */}
            <TownFeaturesBackground
              townProfile={townProfile}
              selectedTown={selectedTown}
              onSelectTown={setSelectedTown}
            />

            {/* Monthly Trend Chart */}
            <PriceTrendChart
              trendData={monthlyTrendData}
              selectedTown={selectedTown}
              selectedFlatType={selectedFlatType}
              isLoading={isLoading}
            />

            {/* Recent Flat Transactions Ledger */}
            <TransactionsTable
              records={records}
              isLoading={isLoading}
              selectedTown={selectedTown}
              selectedFlatType={selectedFlatType}
              onExportCsv={handleExportCsv}
            />
          </div>
        )}

        {/* View Mode: Price Trends Dedicated Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <PriceTrendChart
              trendData={monthlyTrendData}
              selectedTown={selectedTown}
              selectedFlatType={selectedFlatType}
              isLoading={isLoading}
            />
            {/* Contextual Town Snapshot below chart */}
            <TownFeaturesBackground
              townProfile={townProfile}
              selectedTown={selectedTown}
              onSelectTown={setSelectedTown}
            />
          </div>
        )}

        {/* View Mode: Town Features Tab (Full 26 Towns Explorer) */}
        {activeTab === 'town-features' && (
          <div className="space-y-6">
            <TownFeaturesBackground
              townProfile={townProfile}
              selectedTown={selectedTown}
              onSelectTown={setSelectedTown}
              isDetailedView={true}
            />

            {/* All 26 Towns Grid for Fast Exploration */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    All 26 Singapore HDB Towns
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any town to inspect its key features, transport links, and resale price trends
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {SINGAPORE_TOWNS.map((town) => {
                  const isSelected = selectedTown === town.id;
                  return (
                    <button
                      key={town.id}
                      onClick={() => setSelectedTown(town.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500/40 text-white ring-1 ring-rose-500/30'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{town.displayName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>{town.region}</span>
                        <span className={town.estateType === 'Mature' ? 'text-amber-400' : 'text-emerald-400'}>
                          {town.estateType === 'Mature' ? 'Mature' : 'Non-M'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View Mode: Transactions Dedicated Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <TransactionsTable
              records={records}
              isLoading={isLoading}
              selectedTown={selectedTown}
              selectedFlatType={selectedFlatType}
              onExportCsv={handleExportCsv}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-slate-300">Singapore Flat Price Explorer</span>
            <span aria-hidden="true">·</span>
            <span>Keyless Open Data via data.gov.sg</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>/api/health/js</span>
            </button>
            <a
              href="https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=10"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <span>Upstream Dataset</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* API Health Monitor Modal */}
      <ApiHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />
    </div>
  );
}
