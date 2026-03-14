import { useState, useEffect, Suspense, lazy } from 'react';

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
  const [isDark, setIsDark] = useState(() =>
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg tracking-wider">FuelEU</div>
            <div>
              <h1 className="text-lg font-semibold text-white">Maritime Compliance Dashboard</h1>
              <p className="text-xs text-blue-200">Regulation (EU) 2023/1805 — GHG Intensity Monitoring</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-blue-300 text-xs font-medium tracking-wide hidden sm:block">EU MARITIME</span>
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 text-blue-200 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
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
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{active.label}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{active.description}</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        }>
          {activeTab === 'routes'  && <RoutesTab />}
          {activeTab === 'compare' && <CompareTab />}
          {activeTab === 'banking' && <BankingTab />}
          {activeTab === 'pooling' && <PoolingTab />}
        </Suspense>
      </main>
    </div>
  );
}
