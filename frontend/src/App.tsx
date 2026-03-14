import { useState, Suspense, lazy } from 'react';

const RoutesTab = lazy(() => import('./adapters/ui/pages/RoutesTab'));
const CompareTab = lazy(() => import('./adapters/ui/pages/CompareTab'));
const BankingTab = lazy(() => import('./adapters/ui/pages/BankingTab'));
const PoolingTab = lazy(() => import('./adapters/ui/pages/PoolingTab'));

type TabId = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: 'routes',  label: 'Routes',  description: 'View and manage all routes' },
  { id: 'compare', label: 'Compare', description: 'GHG intensity vs target' },
  { id: 'banking', label: 'Banking', description: 'Art. 20 — Bank & Apply surplus' },
  { id: 'pooling', label: 'Pooling', description: 'Art. 21 — Compliance pools' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('routes');

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">FuelEU</div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Maritime Compliance Dashboard</h1>
              <p className="text-xs text-gray-500">Regulation (EU) 2023/1805 — GHG Intensity Monitoring</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">{active.label}</h2>
          <p className="text-sm text-gray-500">{active.description}</p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-gray-400">Loading...</div>}>
          {activeTab === 'routes'  && <RoutesTab />}
          {activeTab === 'compare' && <CompareTab />}
          {activeTab === 'banking' && <BankingTab />}
          {activeTab === 'pooling' && <PoolingTab />}
        </Suspense>
      </main>
    </div>
  );
}
