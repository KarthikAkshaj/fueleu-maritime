import { useState } from 'react';
import type { ComplianceBalance, BankingResult, ApplyBankedResult } from '../../../core/domain/types';
import { apiClient } from '../../infrastructure/ApiClient';

const SHIP_OPTIONS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEAR_OPTIONS = [2024, 2025];

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );
}

function fmt(n: number) {
  return (n / 1e9).toFixed(4) + ' GgCO₂e';
}

export default function BankingTab() {
  const [shipId, setShipId] = useState(SHIP_OPTIONS[0]);
  const [year, setYear] = useState(YEAR_OPTIONS[0]);
  const [applyAmount, setApplyAmount] = useState('');

  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [totalBanked, setTotalBanked] = useState<number | null>(null);
  const [bankResult, setBankResult] = useState<BankingResult | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyBankedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearResults = () => { setBankResult(null); setApplyResult(null); setError(null); };

  const fetchCB = async () => {
    clearResults();
    setLoading(true);
    try {
      const data = await apiClient.getComplianceBalance(shipId, year);
      setCb(data);
      const rec = await apiClient.getBankingRecords(shipId, year);
      setTotalBanked(rec.totalBanked);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBank = async () => {
    clearResults();
    setLoading(true);
    try {
      const result = await apiClient.bankSurplus(shipId, year);
      setBankResult(result);
      setCb((prev) => prev ? { ...prev, cbGco2eq: 0 } : null);
      setTotalBanked((prev) => (prev ?? 0) + result.banked);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const amount = Number(applyAmount);
    if (!amount || amount <= 0) { setError('Enter a valid positive amount.'); return; }
    clearResults();
    setLoading(true);
    try {
      const result = await apiClient.applyBanked(shipId, year, amount);
      setApplyResult(result);
      setCb((prev) => prev ? { ...prev, cbGco2eq: result.cbAfter } : null);
      setTotalBanked(result.remainingBanked);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isSurplus = cb && cb.cbGco2eq > 0;
  const isDeficit = cb && cb.cbGco2eq < 0;

  return (
    <div className="space-y-6">
      {/* Ship / year selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ship ID</label>
          <select className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white" value={shipId} onChange={(e) => setShipId(e.target.value)}>
            {SHIP_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
          <select className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={fetchCB}
          disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Spinner />Loading...</span>
          ) : 'Fetch CB'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">{error}</div>
      )}

      {/* KPI cards */}
      {cb && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Compliance Balance"
            value={fmt(cb.cbGco2eq)}
            sub={cb.cbGco2eq >= 0 ? 'Surplus' : 'Deficit'}
          />
          <KpiCard label="Total Banked" value={totalBanked !== null ? fmt(totalBanked) : '—'} sub="Available to apply" />
          <KpiCard label="GHG Intensity" value={`${cb.ghgIntensityActual.toFixed(4)} gCO₂e/MJ`} sub={`Target: ${cb.ghgIntensityTarget} gCO₂e/MJ`} />
        </div>
      )}

      {/* CB status badge */}
      {cb && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          isSurplus
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : isDeficit
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {isSurplus && `Surplus of ${fmt(cb.cbGco2eq)} — you can bank this.`}
          {isDeficit && `Deficit of ${fmt(Math.abs(cb.cbGco2eq))} — apply banked surplus to reduce it.`}
          {cb.cbGco2eq === 0 && 'Compliance balance is exactly zero.'}
        </div>
      )}

      {/* Actions */}
      {cb && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bank */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Bank Surplus (Art. 20)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Transfer your current surplus CB into the bank for future use.</p>
            <button
              onClick={handleBank}
              disabled={!isSurplus || loading}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Bank Surplus'}
            </button>
            {bankResult && (
              <div className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                Banked {fmt(bankResult.banked)} — CB is now {fmt(bankResult.cbAfter)}
              </div>
            )}
          </div>

          {/* Apply */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Apply Banked (Art. 20)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Apply previously banked surplus to offset a deficit.</p>
            <input
              type="number"
              placeholder="Amount (gCO₂e)"
              value={applyAmount}
              onChange={(e) => setApplyAmount(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleApply}
              disabled={!totalBanked || (totalBanked ?? 0) <= 0 || loading}
              className="w-full px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Apply Banked'}
            </button>
            {applyResult && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                Applied {fmt(applyResult.applied)} — CB is now {fmt(applyResult.cbAfter)} — Remaining banked: {fmt(applyResult.remainingBanked)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
