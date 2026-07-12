import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function GuestOnly({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
