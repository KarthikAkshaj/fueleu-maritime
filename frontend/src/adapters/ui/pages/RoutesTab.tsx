import { useState, useEffect, useCallback } from 'react';
import type { Route, VesselType, FuelType } from '../../../core/domain/types';
import { apiClient } from '../../infrastructure/ApiClient';

const VESSEL_TYPES: VesselType[] = ['Container', 'BulkCarrier', 'Tanker', 'RoRo'];
const FUEL_TYPES: FuelType[] = ['HFO', 'LNG', 'MGO'];
const TARGET = 89.3368;

export default function RoutesTab() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingBaseline, setSettingBaseline] = useState<string | null>(null);

  const [filterVessel, setFilterVessel] = useState<string>('');
  const [filterFuel, setFilterFuel] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getRoutes();
      setRoutes(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const handleSetBaseline = async (route: Route) => {
    setSettingBaseline(route.id);
    try {
      await apiClient.setBaseline(route.id);
      await fetchRoutes();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSettingBaseline(null);
    }
  };

  const filtered = routes.filter((r) => {
    if (filterVessel && r.vesselType !== filterVessel) return false;
    if (filterFuel && r.fuelType !== filterFuel) return false;
    if (filterYear && r.year !== Number(filterYear)) return false;
    return true;
  });

  const years = [...new Set(routes.map((r) => r.year))].sort();
  const compliantCount = routes.filter((r) => r.ghgIntensity <= TARGET).length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {routes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Routes</p>
            <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Compliant (≤ 89.3368)</p>
            <p className="text-2xl font-bold text-green-600">{compliantCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Non-Compliant</p>
            <p className="text-2xl font-bold text-red-500">{routes.length - compliantCount}</p>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          value={filterVessel}
          onChange={(e) => setFilterVessel(e.target.value)}
        >
          <option value="">All Vessel Types</option>
          {VESSEL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          value={filterFuel}
          onChange={(e) => setFilterFuel(e.target.value)}
        >
          <option value="">All Fuel Types</option>
          {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={fetchRoutes}
          className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading routes...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Route ID', 'Vessel Type', 'Fuel Type', 'Year', 'GHG Intensity (gCO₂e/MJ)', 'Fuel (t)', 'Distance (km)', 'Emissions (t)', 'Baseline', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className={r.isBaseline ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 font-mono font-medium text-blue-700">{r.routeId}</td>
                  <td className="px-4 py-3">{r.vesselType}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{r.fuelType}</span>
                  </td>
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3 font-mono">
                    <span className={`font-semibold ${r.ghgIntensity <= TARGET ? 'text-green-600' : 'text-red-600'}`}>
                      {r.ghgIntensity.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{r.fuelConsumption.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{r.distance.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{r.totalEmissions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    {r.isBaseline ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Baseline</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!r.isBaseline && (
                      <button
                        onClick={() => handleSetBaseline(r)}
                        disabled={settingBaseline === r.id}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {settingBaseline === r.id ? 'Setting...' : 'Set Baseline'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No routes match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
