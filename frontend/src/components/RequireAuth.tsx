import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Alert, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import type { UserRole, UserStatus } from '../types/auth';

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export function RequireAuth({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // Check account status
  if (user?.status === 'pending') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning">
          <strong>Account Pending Approval</strong>
          <br />
          Your account is awaiting administrator approval. You will be able to access the system once your account has been activated and a role has been assigned.
        </Alert>
      </Container>
    );
  }

  if (user?.status === 'suspended') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          <strong>Account Suspended</strong>
          <br />
          Your account has been suspended. Please contact your administrator for more information.
        </Alert>
      </Container>
    );
  }

  if (user?.status === 'inactive') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          <strong>Account Inactive</strong>
          <br />
          Your account has been deactivated. Please contact your administrator for assistance.
        </Alert>
      </Container>
    );
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0) {
    const userRole = user?.role;
    
    // Admin has access to everything
    if (userRole !== 'admin' && !roles.includes(userRole as UserRole)) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Alert severity="error">
            <strong>Access Denied</strong>
            <br />
            You do not have permission to access this page. Required role: {roles.join(', ')}
          </Alert>
        </Container>
      );
    }
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
