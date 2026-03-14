import { useState } from 'react';
import type { ComplianceBalance, Pool } from '../../../core/domain/types';
import { apiClient } from '../../infrastructure/ApiClient';

const SHIP_OPTIONS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEAR_OPTIONS = [2024, 2025];

function fmt(n: number) {
  return (n / 1e9).toFixed(4) + ' GgCO₂e';
}

interface MemberData {
  shipId: string;
  cb: ComplianceBalance | null;
  loading: boolean;
  error: string | null;
}

export default function PoolingTab() {
  const [year, setYear] = useState(YEAR_OPTIONS[0]);
  const [selectedShips, setSelectedShips] = useState<string[]>(['R001', 'R002']);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [pool, setPool] = useState<Pool | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShip = (ship: string) => {
    setSelectedShips((prev) =>
      prev.includes(ship) ? prev.filter((s) => s !== ship) : [...prev, ship]
    );
    setMembers([]);
    setPool(null);
    setError(null);
  };

  const fetchMemberCBs = async () => {
    setError(null);
    setPool(null);
    const results: MemberData[] = await Promise.all(
      selectedShips.map(async (shipId) => {
        try {
          const cb = await apiClient.getAdjustedCB(shipId, year);
          return { shipId, cb, loading: false, error: null };
        } catch (e) {
          return { shipId, cb: null, loading: false, error: (e as Error).message };
        }
      })
    );
    setMembers(results);
  };

  const poolSum = members.reduce((sum, m) => sum + (m.cb?.cbGco2eq ?? 0), 0);
  const isPoolValid = members.length >= 2 && members.every((m) => m.cb !== null) && poolSum >= 0;

  const handleCreatePool = async () => {
    setCreating(true);
    setError(null);
    try {
      const result = await apiClient.createPool(year, selectedShips);
      setPool(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
            <select
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white"
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setMembers([]); setPool(null); }}
            >
              {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Pool Members (select ≥ 2)</label>
            <div className="flex flex-wrap gap-2">
              {SHIP_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleShip(s)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    selectedShips.includes(s)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={fetchMemberCBs}
            disabled={selectedShips.length < 2}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Load CBs
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">{error}</div>
      )}

      {/* Members table */}
      {members.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pool Members — Adjusted CB</h3>
            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${poolSum >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
              Pool Sum: {fmt(poolSum)} {poolSum >= 0 ? '✅' : '❌'}
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Ship ID', 'GHG Intensity (gCO₂e/MJ)', 'Adjusted CB', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {members.map((m) => (
                <tr key={m.shipId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-mono font-medium text-blue-700 dark:text-blue-400">{m.shipId}</td>
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{m.cb ? m.cb.ghgIntensityActual.toFixed(4) : '—'}</td>
                  <td className={`px-4 py-3 font-mono font-medium ${m.cb && m.cb.cbGco2eq >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {m.cb ? fmt(m.cb.cbGco2eq) : <span className="text-red-500 text-xs">{m.error}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {m.cb && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.cb.cbGco2eq >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                        {m.cb.cbGco2eq >= 0 ? 'Surplus' : 'Deficit'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            {!isPoolValid && poolSum < 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">Pool aggregate is negative. Add more surplus ships or remove deficit ships.</p>
            )}
            <button
              onClick={handleCreatePool}
              disabled={!isPoolValid || creating}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating Pool...' : 'Create Pool (Art. 21)'}
            </button>
          </div>
        </div>
      )}

      {/* Pool result */}
      {pool && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-green-700 dark:text-green-300 font-semibold text-sm">Pool Created Successfully</span>
            <span className="text-xs text-green-600 dark:text-green-400 font-mono">ID: {pool.id}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-200 dark:divide-green-800 text-sm">
              <thead>
                <tr>
                  {['Ship ID', 'CB Before', 'CB After', 'Transfer'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-green-700 dark:text-green-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100 dark:divide-green-900">
                {pool.members.map((m) => (
                  <tr key={m.shipId}>
                    <td className="px-4 py-2 font-mono font-medium text-gray-800 dark:text-gray-200">{m.shipId}</td>
                    <td className={`px-4 py-2 font-mono ${m.cbBefore >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>{fmt(m.cbBefore)}</td>
                    <td className={`px-4 py-2 font-mono font-semibold ${m.cbAfter >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>{fmt(m.cbAfter)}</td>
                    <td className={`px-4 py-2 font-mono text-xs ${m.cbAfter - m.cbBefore > 0 ? 'text-green-600' : m.cbAfter - m.cbBefore < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {m.cbAfter - m.cbBefore > 0 ? '+' : ''}{fmt(m.cbAfter - m.cbBefore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
