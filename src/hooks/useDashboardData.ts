import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../lib/errors';
import { dashboardService } from '../services/dashboardService';
import type { DashboardDataState } from '../types/dashboard';

export function useDashboardData() {
  const { activeTenant, isConfigured, isStructuralPreview } = useAuth();
  const [data, setData] = useState<DashboardDataState>(() =>
    dashboardService.createUnconfiguredState()
  );

  const loadDashboard = useCallback(async () => {
    if (!isConfigured || !activeTenant?.id || isStructuralPreview) {
      setData(dashboardService.createUnconfiguredState());
      return;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const next = await dashboardService.fetchTenantDashboard(activeTenant.id);
      setData(next);
    } catch (err) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err, 'Erro ao carregar indicadores do dashboard.'),
      }));
    }
  }, [activeTenant?.id, isConfigured, isStructuralPreview]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    ...data,
    refresh: loadDashboard,
  };
}
