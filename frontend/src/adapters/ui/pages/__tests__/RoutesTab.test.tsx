import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoutesTab from '../RoutesTab';
import { apiClient } from '../../../infrastructure/ApiClient';
import type { Route } from '../../../../core/domain/types';

vi.mock('../../../infrastructure/ApiClient', () => ({
  apiClient: {
    getRoutes: vi.fn(),
    setBaseline: vi.fn(),
  },
}));

const mockRoutes: Route[] = [
  {
    id: 'uuid-1',
    routeId: 'R001',
    vesselType: 'Container',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true,
  },
  {
    id: 'uuid-2',
    routeId: 'R002',
    vesselType: 'BulkCarrier',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false,
  },
];

describe('RoutesTab', () => {
  beforeEach(() => {
    vi.mocked(apiClient.getRoutes).mockResolvedValue(mockRoutes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the routes table after loading', async () => {
    render(<RoutesTab />);
    expect(screen.getByText('Loading routes...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('R001')).toBeInTheDocument();
      expect(screen.getByText('R002')).toBeInTheDocument();
    });
  });

  it('shows "Baseline" badge on the baseline route (using role)', async () => {
    render(<RoutesTab />);
    await waitFor(() => {
      // The badge is a <span> in the table body, not the <th> header
      const badges = screen.getAllByText('Baseline');
      // One is the table header <th>, one is the badge <span>
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "Set Baseline" button only on non-baseline routes', async () => {
    render(<RoutesTab />);
    await waitFor(() => {
      const buttons = screen.getAllByText('Set Baseline');
      expect(buttons).toHaveLength(1); // only R002
    });
  });

  it('calls setBaseline on button click', async () => {
    vi.mocked(apiClient.setBaseline).mockResolvedValue({ ...mockRoutes[1], isBaseline: true });
    vi.mocked(apiClient.getRoutes)
      .mockResolvedValueOnce(mockRoutes)
      .mockResolvedValueOnce([{ ...mockRoutes[0] }, { ...mockRoutes[1], isBaseline: true }]);

    render(<RoutesTab />);
    await waitFor(() => screen.getByText('Set Baseline'));

    await userEvent.click(screen.getByText('Set Baseline'));
    expect(apiClient.setBaseline).toHaveBeenCalledWith('uuid-2');
  });

  it('filters by vessel type', async () => {
    render(<RoutesTab />);
    await waitFor(() => screen.getByText('R001'));

    const select = screen.getByDisplayValue('All Vessel Types');
    await userEvent.selectOptions(select, 'BulkCarrier');

    expect(screen.queryByText('R001')).not.toBeInTheDocument();
    expect(screen.getByText('R002')).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    vi.mocked(apiClient.getRoutes).mockRejectedValue(new Error('Network error'));
    render(<RoutesTab />);
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
