import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { RouteComparison } from '../../../core/domain/types';
import { apiClient } from '../../infrastructure/ApiClient';

const TARGET = 89.3368;

export default function CompareTab() {
  const [comparisons, setComparisons] = useState<RouteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparisons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getComparison();
      setComparisons(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComparisons(); }, [fetchComparisons]);

  const chartData = comparisons.length > 0
    ? [
        { name: comparisons[0].baseline.routeId + ' (Baseline)', ghgIntensity: comparisons[0].baseline.ghgIntensity, fill: '#3b82f6' },
        ...comparisons.map((c) => ({
          name: c.comparison.routeId,
          ghgIntensity: c.comparison.ghgIntensity,
          fill: c.compliant ? '#22c55e' : '#ef4444',
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="ml-2 text-sm text-gray-400">Loading comparison data...</span>
        </div>
      ) : comparisons.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No baseline set. Go to the Routes tab and click "Set Baseline" on a route.
        </div>
      ) : (
        <>
          {/* Target callout */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">FuelEU 2025 Target:</span> {TARGET} gCO₂e/MJ (2% below 91.16 gCO₂e/MJ)
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">GHG Intensity Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[85, 96]} unit=" gCO₂e" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(4)} gCO₂e/MJ`, 'GHG Intensity']} />
                <Legend />
                <ReferenceLine y={TARGET} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', position: 'right', fontSize: 11, fill: '#f59e0b' }} />
                <Bar dataKey="ghgIntensity" name="GHG Intensity (gCO₂e/MJ)" fill="#3b82f6"
                  label={{ position: 'top', fontSize: 10, formatter: (v: unknown) => Number(v).toFixed(1) }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Route', 'Vessel', 'Fuel', 'Year', 'GHG Intensity (gCO₂e/MJ)', 'vs Baseline (%)', 'Compliant'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {/* Baseline row */}
                <tr className="bg-blue-50 dark:bg-blue-900/20">
                  <td className="px-4 py-3 font-mono font-semibold text-blue-700 dark:text-blue-400">{comparisons[0].baseline.routeId} <span className="text-xs font-normal">(baseline)</span></td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{comparisons[0].baseline.vesselType}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{comparisons[0].baseline.fuelType}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{comparisons[0].baseline.year}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-white">{comparisons[0].baseline.ghgIntensity.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3">{comparisons[0].baseline.ghgIntensity <= TARGET ? '✅' : '❌'}</td>
                </tr>
                {comparisons.map((c) => (
                  <tr key={c.comparison.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-mono text-blue-700 dark:text-blue-400">{c.comparison.routeId}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.comparison.vesselType}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.comparison.fuelType}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.comparison.year}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{c.comparison.ghgIntensity.toFixed(4)}</td>
                    <td className={`px-4 py-3 font-mono font-medium ${c.percentDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {c.percentDiff > 0 ? '+' : ''}{c.percentDiff.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-lg">{c.compliant ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
