import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ModuleRouteId } from '../types/navigation';
import {
  canAccessModule,
  getAccessibleModules,
  getDefaultRouteForRole,
  ROLE_LABELS,
} from '../utils/rbac';

export function usePermissions() {
  const { activeRole, isStructuralPreview } = useAuth();

  const effectiveRole = activeRole ?? (isStructuralPreview ? 'owner' : null);

  const accessibleModules = useMemo(
    () => getAccessibleModules(effectiveRole),
    [effectiveRole]
  );

  const canAccess = (moduleId: ModuleRouteId) =>
    canAccessModule(effectiveRole, moduleId);

  return {
    role: effectiveRole,
    roleLabel: effectiveRole ? ROLE_LABELS[effectiveRole] : 'Sem vínculo',
    accessibleModules,
    defaultRoute: getDefaultRouteForRole(effectiveRole),
    canAccess,
  };
}
