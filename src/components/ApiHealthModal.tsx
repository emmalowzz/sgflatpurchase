import React, { useState, useEffect } from 'react';
import { ApiHealthResponse } from '../types/flat';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Server, 
  Database,
  Clock,
  Cpu
} from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<ApiHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      // Specifically query /api/health/js as requested by user!
      const res = await fetch('/api/health/js');
      const data = await res.json();
      setHealthData(data);
    } catch (err: any) {
      setHealthData({
        status: 'DOWN',
        healthy: false,
        latencyMs: 0,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        error: err?.message || 'Failed to connect to /api/health/js',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyEndpointUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              healthData?.healthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>API Health & Telemetry Monitor</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-rose-400 font-normal">
                  /api/health/js
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Live connectivity monitor for data.gov.sg keyless datastore API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh health check"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Indicator Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            healthData?.healthy
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              {healthData?.healthy ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="text-sm font-bold">
                  {healthData?.healthy ? 'All Systems Operational' : 'API Connection Degraded / Offline'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {healthData?.healthy
                    ? 'Both internal /api/health/js and data.gov.sg upstream are responding normally.'
                    : healthData?.error || 'Unable to reach API.'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                healthData?.healthy
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                STATUS: {healthData?.status || 'UNKNOWN'}
              </span>
            </div>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-500 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" />
                <span>Roundtrip Latency</span>
              </div>
              <div className="text-base font-bold font-mono text-white tabular-nums">
                {healthData?.latencyMs ?? 0} ms
              </div>
              <div className="text-[10px] text-slate-500">Live ping</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-500 flex items-center gap-1 mb-1">
                <Database className="w-3 h-3" />
                <span>Total Dataset Rows</span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                {healthData?.upstream?.totalRecords?.toLocaleString() ?? '242,144+'}
              </div>
              <div className="text-[10px] text-slate-500">HDB Resale Records</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-500 flex items-center gap-1 mb-1">
                <Server className="w-3 h-3" />
                <span>HTTP Response</span>
              </div>
              <div className="text-base font-bold font-mono text-sky-400 tabular-nums">
                {healthData?.statusCode ?? 200} OK
              </div>
              <div className="text-[10px] text-slate-500">JSON response</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-500 flex items-center gap-1 mb-1">
                <Cpu className="w-3 h-3" />
                <span>Server Uptime</span>
              </div>
              <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
                {healthData?.server?.uptimeSeconds ? `${healthData.server.uptimeSeconds}s` : 'Active'}
              </div>
              <div className="text-[10px] text-slate-500">Node runtime</div>
            </div>
          </div>

          {/* Monitored Endpoints List */}
          <div className="space-y-2 text-xs">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Monitored API Routes
            </div>

            {/* Route 1: /api/health/js */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold">
                    GET
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">/api/health/js</span>
                </div>
                <div className="text-slate-400 text-[11px] truncate mt-0.5">
                  Internal monitoring endpoint returning real-time upstream & server diagnostic status
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="/api/health/js"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Open /api/health/js directly"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Route 2: data.gov.sg */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 font-semibold">
                    UPSTREAM
                  </span>
                  <span className="font-mono text-slate-200 text-[11px] truncate">
                    https://data.gov.sg/api/action/datastore_search
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] truncate mt-0.5">
                  Resource ID: <span className="font-mono text-slate-300">d_8b84c4ee58e3cfc0ece0d773c8ca6abc</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() =>
                    copyEndpointUrl(
                      'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=10'
                    )
                  }
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Copy full data.gov.sg endpoint"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Raw JSON Payload Inspector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Diagnostic JSON Payload (/api/health/js)</span>
              <span className="font-mono text-slate-500 font-normal">
                {healthData?.timestamp}
              </span>
            </div>
            <pre className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div>Keyless Open Government Data API</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
