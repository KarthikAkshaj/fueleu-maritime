import type { IApiPort } from '../../core/ports/IApiPort';
import type {
  Route,
  RouteComparison,
  ComplianceBalance,
  BankEntry,
  BankingResult,
  ApplyBankedResult,
  Pool,
} from '../../core/domain/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export class ApiClient implements IApiPort {
  getRoutes(): Promise<Route[]> {
    return request<Route[]>('/routes');
  }

  setBaseline(routeId: string): Promise<Route> {
    return request<Route>(`/routes/${routeId}/baseline`, { method: 'POST' });
  }

  getComparison(): Promise<RouteComparison[]> {
    return request<RouteComparison[]>('/routes/comparison');
  }

  getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    return request<ComplianceBalance>(`/compliance/cb?shipId=${shipId}&year=${year}`);
  }

  getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
    return request<ComplianceBalance>(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
  }

  getBankingRecords(shipId: string, year: number): Promise<{ records: BankEntry[]; totalBanked: number }> {
    return request(`/banking/records?shipId=${shipId}&year=${year}`);
  }

  bankSurplus(shipId: string, year: number): Promise<BankingResult> {
    return request<BankingResult>('/banking/bank', {
      method: 'POST',
      body: JSON.stringify({ shipId, year }),
    });
  }

  applyBanked(shipId: string, year: number, amount: number): Promise<ApplyBankedResult> {
    return request<ApplyBankedResult>('/banking/apply', {
      method: 'POST',
      body: JSON.stringify({ shipId, year, amount }),
    });
  }

  createPool(year: number, shipIds: string[]): Promise<Pool> {
    return request<Pool>('/pools', {
      method: 'POST',
      body: JSON.stringify({ year, shipIds }),
    });
  }
}

export const apiClient = new ApiClient();
