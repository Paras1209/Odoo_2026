import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface RoleAccessConfig {
  dashboard: UserRole[];
  trips: UserRole[];
  fleet: UserRole[];
  drivers: UserRole[];
  maintenance: UserRole[];
  compliance: UserRole[];
  fuel: UserRole[];
  expenses: UserRole[];
  analytics: UserRole[];
}

const ROLE_ACCESS: RoleAccessConfig = {
  dashboard: ['dispatcher', 'admin'],
  trips: ['dispatcher', 'fleet_manager', 'driver', 'admin'],
  fleet: ['fleet_manager', 'dispatcher', 'safety_officer', 'admin'],
  drivers: ['fleet_manager', 'safety_officer', 'dispatcher', 'admin'],
  maintenance: ['fleet_manager', 'admin'],
  compliance: ['safety_officer', 'admin'],
  fuel: ['financial_analyst', 'fleet_manager', 'admin'],
  expenses: ['financial_analyst', 'admin'],
  analytics: ['financial_analyst', 'admin'],
};

export function useRoleAccess() {
  const { user } = useAuth();
  const userRole = user?.role;

  const hasAccess = useMemo(() => {
    return (feature: keyof RoleAccessConfig): boolean => {
      if (!userRole) return false;
      if (userRole === 'admin') return true;
      return ROLE_ACCESS[feature].includes(userRole);
    };
  }, [userRole]);

  const canAccessAny = useMemo(() => {
    return (features: (keyof RoleAccessConfig)[]): boolean => {
      return features.some((feature) => hasAccess(feature));
    };
  }, [hasAccess]);

  return {
    userRole,
    hasAccess,
    canAccessAny,
    isAdmin: userRole === 'admin',
    isFleetManager: userRole === 'fleet_manager',
    isDispatcher: userRole === 'dispatcher',
    isSafetyOfficer: userRole === 'safety_officer',
    isFinancialAnalyst: userRole === 'financial_analyst',
    isDriver: userRole === 'driver',
  };
}
