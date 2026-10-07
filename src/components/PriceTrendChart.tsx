import React, { useState, useMemo } from 'react';
import { MonthlyTrendPoint } from '../types/flat';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  BarChart2, 
  ArrowUpRight, 
  Building,
  Info
} from 'lucide-react';

interface PriceTrendChartProps {
  trendData: MonthlyTrendPoint[];
  selectedTown: string;
  selectedFlatType: string;
  isLoading: boolean;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  trendData,
  selectedTown,
  selectedFlatType,
  isLoading,
}) => {
  const [metric, setMetric] = useState<'avgPrice' | 'medianPrice' | 'avgPsm'>('avgPrice');
  const [timeRange, setTimeRange] = useState<'all' | '24m' | '12m' | '6m'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showRangeBand, setShowRangeBand] = useState<boolean>(true);

  // Filter trend data according to selected time range
  const filteredData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    if (timeRange === '6m') return trendData.slice(-6);
    if (timeRange === '12m') return trendData.slice(-12);
    if (timeRange === '24m') return trendData.slice(-24);
    return trendData;
  }, [trendData, timeRange]);

  // High-level statistics
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return null;
    }

    const totalTransacted = filteredData.reduce((acc, curr) => acc + curr.count, 0);
    const overallAvg =
      filteredData.reduce((acc, curr) => acc + curr.avgPrice * curr.count, 0) /
      (totalTransacted || 1);
    const overallAvgPsm =
      filteredData.reduce((acc, curr) => acc + curr.avgPsm * curr.count, 0) /
      (totalTransacted || 1);

    const firstPt = filteredData[0];
    const lastPt = filteredData[filteredData.length - 1];
    const priceChange =
      firstPt && lastPt && firstPt.avgPrice > 0
        ? ((lastPt.avgPrice - firstPt.avgPrice) / firstPt.avgPrice) * 100
        : 0;

    // Find highest & lowest individual transacted record in the current filtered period
    let highestRecord: any = null;
    let lowestRecord: any = null;
    let highestPrice = -Infinity;
    let lowestPrice = Infinity;

    for (const pt of filteredData) {
      for (const rec of pt.records) {
        const price = typeof rec.resale_price === 'number' ? rec.resale_price : parseFloat(rec.resale_price as string);
        if (price > highestPrice) {
          highestPrice = price;
          highestRecord = rec;
        }
        if (price < lowestPrice) {
          lowestPrice = price;
          lowestRecord = rec;
        }
      }
    }

    return {
      totalTransacted,
      overallAvg: Math.round(overallAvg),
      overallAvgPsm: Math.round(overallAvgPsm),
      priceChange,
      latestPrice: Math.round(lastPt?.avgPrice || 0),
      latestMedian: Math.round(lastPt?.medianPrice || 0),
      highestPrice: highestPrice > 0 ? highestPrice : 0,
      highestRecord,
      lowestPrice: lowestPrice < Infinity ? lowestPrice : 0,
      lowestRecord,
    };
  }, [filteredData]);

  // Chart coordinates calculation
  const chartHeight = 280;
  const chartWidth = 800; // SVG viewBox coordinate system
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Min and max for scaling
  const { minVal, maxVal, maxVolume } = useMemo(() => {
    if (filteredData.length === 0) return { minVal: 0, maxVal: 1, maxVolume: 1 };

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const d of filteredData) {
      const val = d[metric];
      if (val < min) min = val;
      if (val > max) max = val;

      if (showRangeBand && metric === 'avgPrice') {
        if (d.minPrice < min) min = d.minPrice;
        if (d.maxPrice > max) max = d.maxPrice;
      }

      if (d.count > maxVol) maxVol = d.count;
    }

    // Add 8% buffer so lines don't clip at top/bottom
    const buffer = (max - min) * 0.08 || 10000;
    return {
      minVal: Math.max(0, Math.floor((min - buffer) / 10000) * 10000),
      maxVal: Math.ceil((max + buffer) / 10000) * 10000,
      maxVolume: maxVol || 1,
    };
  }, [filteredData, metric, showRangeBand]);

  // Compute points
  const points = useMemo(() => {
    if (filteredData.length === 0) return [];
    const step = innerWidth / Math.max(filteredData.length - 1, 1);

    return filteredData.map((d, i) => {
      const x = paddingLeft + i * step;
      const yVal = d[metric];
      const yNorm = (yVal - minVal) / (maxVal - minVal || 1);
      const y = paddingTop + innerHeight - yNorm * innerHeight;

      const yMedianNorm = (d.medianPrice - minVal) / (maxVal - minVal || 1);
      const yMedian = paddingTop + innerHeight - yMedianNorm * innerHeight;

      const yMinNorm = (d.minPrice - minVal) / (maxVal - minVal || 1);
      const yMin = paddingTop + innerHeight - yMinNorm * innerHeight;

      const yMaxNorm = (d.maxPrice - minVal) / (maxVal - minVal || 1);
      const yMax = paddingTop + innerHeight - yMaxNorm * innerHeight;

      // Volume bar height (allocated to bottom 25% of chart)
      const volHeight = (d.count / maxVolume) * (innerHeight * 0.28);
      const volY = paddingTop + innerHeight - volHeight;

      return {
        x,
        y,
        yMedian,
        yMin,
        yMax,
        volY,
        volHeight,
        data: d,
      };
    });
  }, [filteredData, metric, minVal, maxVal, maxVolume, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Build SVG path strings
  const mainLinePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  }, [points]);

  const medianLinePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yMedian.toFixed(1)}`, '');
  }, [points]);

  const areaGradientPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = paddingTop + innerHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${mainLinePath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [points, mainLinePath, paddingTop, innerHeight]);

  const rangeBandPath = useMemo(() => {
    if (!showRangeBand || points.length === 0 || metric !== 'avgPrice') return '';
    const topPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yMax.toFixed(1)}`).join(' ');
    const bottomPath = [...points].reverse().map(p => `L ${p.x.toFixed(1)} ${p.yMin.toFixed(1)}`).join(' ');
    return `${topPath} ${bottomPath} Z`;
  }, [points, showRangeBand, metric]);

  // Generate 4 horizontal gridlines
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      const val = minVal + ((maxVal - minVal) / count) * i;
      const y = paddingTop + innerHeight - (i / count) * innerHeight;
      ticks.push({ val: Math.round(val), y });
    }
    return ticks;
  }, [minVal, maxVal, innerHeight, paddingTop]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[points.length - 1];

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${Math.round(val / 1000)}k`;
    return `$${val.toLocaleString()}`;
  };

  const formatMonthLabel = (m: string) => {
    if (!m) return '';
    const [yyyy, mm] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(mm, 10) - 1] || mm;
    return `${monthName} '${yyyy.slice(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Metric High-Level Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Average Resale Price */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Avg Resale Price</span>
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              ${stats.overallAvg.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {stats.priceChange >= 0 ? (
                <span className="text-emerald-400 flex items-center font-medium">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{stats.priceChange.toFixed(1)}%
                </span>
              ) : (
                <span className="text-rose-400 flex items-center font-medium">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {stats.priceChange.toFixed(1)}%
                </span>
              )}
              <span className="text-slate-500">over selected period</span>
            </div>
          </div>

          {/* Card 2: Latest Median Price */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Latest Median Price</span>
              <Layers className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400 tabular-nums">
              ${stats.latestMedian.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Avg $/m²:{' '}
              <span className="font-mono text-slate-200">
                ${stats.overallAvgPsm.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Card 3: Total Transactions Volume */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Period Volume</span>
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {stats.totalTransacted.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Across <span className="font-mono text-slate-200">{filteredData.length}</span> months
            </div>
          </div>

          {/* Card 4: Highest Transacted Unit */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Peak Sale in Period</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
              ${stats.highestPrice.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">
              {stats.highestRecord ? (
                <span>
                  Blk {stats.highestRecord.block} {stats.highestRecord.street_name}
                </span>
              ) : (
                'Filtered selection'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Monthly Price Trend
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {selectedTown === 'ALL' ? 'Singapore Island-wide' : selectedTown} · {selectedFlatType}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive timeline with average and median resale transacted values.
            </p>
          </div>

          {/* Metric & Range Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Metric Segmented Control */}
            <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-lg">
              <button
                onClick={() => setMetric('avgPrice')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  metric === 'avgPrice'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Avg Price
              </button>
              <button
                onClick={() => setMetric('medianPrice')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  metric === 'medianPrice'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Median Price
              </button>
              <button
                onClick={() => setMetric('avgPsm')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  metric === 'avgPsm'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                $/m²
              </button>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-lg">
              <button
                onClick={() => setTimeRange('6m')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeRange === '6m' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6M
              </button>
              <button
                onClick={() => setTimeRange('12m')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeRange === '12m' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                12M
              </button>
              <button
                onClick={() => setTimeRange('24m')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeRange === '24m' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                24M
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  timeRange === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* View toggles & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-400 rounded-full inline-block" />
              <span className="text-slate-300 font-medium">Average Price</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-sky-400 inline-block" />
              <span className="text-slate-300 font-medium">Median Price</span>
            </div>
            {metric === 'avgPrice' && (
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={showRangeBand}
                  onChange={(e) => setShowRangeBand(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 w-3.5 h-3.5"
                />
                <span>Min-Max Range Band</span>
              </label>
            )}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-slate-500 focus:ring-slate-500 w-3.5 h-3.5"
              />
              <span>Volume Bars</span>
            </label>
          </div>

          {activePoint && (
            <div className="font-mono text-slate-300 text-[11px] flex items-center gap-2">
              <span>{activePoint.data.month}:</span>
              <span className="text-rose-400 font-semibold">
                ${activePoint.data.avgPrice.toLocaleString()} avg
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-sky-400">
                ${activePoint.data.medianPrice.toLocaleString()} median
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-mono">
                {activePoint.data.count} units
              </span>
            </div>
          )}
        </div>

        {/* SVG Chart Canvas */}
        <div className="relative mt-4 w-full overflow-hidden select-none">
          {isLoading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                <span className="text-xs text-slate-400 font-mono">Syncing dataset from data.gov.sg...</span>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-72 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
              <div className="text-center p-6">
                <Building className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-300">No resale records in selected period</h4>
                <p className="text-xs text-slate-500 mt-1">Try selecting another flat type or town filter above.</p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible"
              >
                <defs>
                  {/* Main Line Area Gradient */}
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Range Envelope Gradient */}
                  <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {yTicks.map((tick, idx) => (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={tick.y}
                      x2={chartWidth - paddingRight}
                      y2={tick.y}
                      stroke="rgba(51, 65, 85, 0.4)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={tick.y + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {formatCurrency(tick.val)}
                    </text>
                  </g>
                ))}

                {/* Volume Bars (at bottom) */}
                {showVolume &&
                  points.map((p, idx) => {
                    const barWidth = Math.max(innerWidth / points.length - 3, 3);
                    return (
                      <rect
                        key={`vol-${idx}`}
                        x={p.x - barWidth / 2}
                        y={p.volY}
                        width={barWidth}
                        height={p.volHeight}
                        fill="rgba(56, 189, 248, 0.22)"
                        rx="1"
                        className="transition-opacity hover:opacity-100 opacity-60"
                      />
                    );
                  })}

                {/* Min-Max Range Envelope Band */}
                {rangeBandPath && (
                  <path d={rangeBandPath} fill="url(#rangeGradient)" />
                )}

                {/* Area Gradient Fill under Main Curve */}
                <path d={areaGradientPath} fill="url(#areaGradient)" />

                {/* Median Price Curve (Dashed Sky Line) */}
                <path
                  d={medianLinePath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Average Price Curve (Solid Rose Line) */}
                <path
                  d={mainLinePath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points on Hover */}
                {points.map((p, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <g key={`pt-${idx}`}>
                      {/* Interactive Target for Pointer */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="12"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                      />
                      {/* Visible Point Dot */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 5 : 2.5}
                        fill="#f43f5e"
                        stroke="#0f172a"
                        strokeWidth="2"
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}

                {/* Vertical Cursor Crosshair on Hover */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <line
                    x1={points[hoveredIndex].x}
                    y1={paddingTop}
                    x2={points[hoveredIndex].x}
                    y2={paddingTop + innerHeight}
                    stroke="#f43f5e"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                    className="pointer-events-none"
                  />
                )}

                {/* X-Axis Month Labels */}
                {points.map((p, idx) => {
                  // Only show labels every N ticks to avoid clutter
                  const total = points.length;
                  const interval = total > 20 ? 4 : total > 12 ? 2 : 1;
                  if (idx % interval !== 0 && idx !== total - 1) return null;

                  return (
                    <text
                      key={`lbl-${idx}`}
                      x={p.x}
                      y={chartHeight - 12}
                      fill={hoveredIndex === idx ? '#f43f5e' : '#64748b'}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="transition-colors font-medium"
                    >
                      {formatMonthLabel(p.data.month)}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Hovered Month Detail Inspector Bar */}
        {activePoint && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 font-mono font-bold text-xs">
                {activePoint.data.month}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Transactions: </span>
                <span className="font-mono font-semibold text-white">
                  {activePoint.data.count} units
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-300 font-mono text-[11px]">
              <div>
                <span className="text-slate-500">Avg: </span>
                <span className="font-bold text-rose-400">
                  ${activePoint.data.avgPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Median: </span>
                <span className="font-bold text-sky-400">
                  ${activePoint.data.medianPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Min: </span>
                <span className="text-slate-300">
                  ${activePoint.data.minPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Max: </span>
                <span className="text-slate-300">
                  ${activePoint.data.maxPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">$/m²: </span>
                <span className="text-emerald-400 font-bold">
                  ${activePoint.data.avgPsm.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
