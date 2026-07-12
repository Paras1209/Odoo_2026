import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, Container, Box, Toolbar } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import theme from './styles/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireAuth, GuestOnly } from './components/RequireAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import TripList from './pages/trips/TripList';
import TripForm from './components/trips/TripForm';
import TripDetail from './pages/trips/TripDetail';
import UserManagement from './pages/admin/UserManagement';
import VehicleList from './pages/fleet/VehicleList';
import VehicleForm from './components/fleet/VehicleForm';
import VehicleDetail from './pages/fleet/VehicleDetail';
import DriverList from './pages/drivers/DriverList';
import DriverForm from './components/drivers/DriverForm';
import DriverDetail from './pages/drivers/DriverDetail';

// Layout
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isAuthenticated && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: 'calc(100% - 260px)' },
        }}
      >
        {isAuthenticated && <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />}
        <Container
          maxWidth="xl"
          sx={{
            flex: 1,
            py: { xs: 2, md: 3 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Routes>
            {/* Public */}
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected */}
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/" element={<RequireAuth><Profile /></RequireAuth>} />

            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <RequireAuth roles={['admin']}>
                  <UserManagement />
                </RequireAuth>
              }
            />

            {/* Trip Management Routes - Accessible by Dispatcher, Fleet Manager, Admin */}
            <Route
              path="/trips"
              element={
                <RequireAuth roles={['dispatcher', 'fleet_manager', 'admin']}>
                  <TripList />
                </RequireAuth>
              }
            />
            <Route
              path="/trips/new"
              element={
                <RequireAuth roles={['dispatcher', 'admin']}>
                  <TripForm />
                </RequireAuth>
              }
            />
            <Route
              path="/trips/:id"
              element={
                <RequireAuth roles={['dispatcher', 'fleet_manager', 'driver', 'admin']}>
                  <TripDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/trips/:id/edit"
              element={
                <RequireAuth roles={['dispatcher', 'admin']}>
                  <TripForm />
                </RequireAuth>
              }
            />

            {/* Fleet Management Routes - Accessible by Fleet Manager, Dispatcher, Admin */}
            <Route
              path="/fleet"
              element={
                <RequireAuth roles={['fleet_manager', 'dispatcher', 'safety_officer', 'admin']}>
                  <VehicleList />
                </RequireAuth>
              }
            />
            <Route
              path="/fleet/new"
              element={
                <RequireAuth roles={['fleet_manager', 'admin']}>
                  <VehicleForm />
                </RequireAuth>
              }
            />
            <Route
              path="/fleet/:id"
              element={
                <RequireAuth roles={['fleet_manager', 'dispatcher', 'safety_officer', 'admin']}>
                  <VehicleDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/fleet/:id/edit"
              element={
                <RequireAuth roles={['fleet_manager', 'admin']}>
                  <VehicleForm />
                </RequireAuth>
              }
            />

            {/* Driver Management Routes - Accessible by Fleet Manager, Safety Officer, Admin */}
            <Route
              path="/drivers"
              element={
                <RequireAuth roles={['fleet_manager', 'dispatcher', 'safety_officer', 'admin']}>
                  <DriverList />
                </RequireAuth>
              }
            />
            <Route
              path="/drivers/new"
              element={
                <RequireAuth roles={['fleet_manager', 'admin']}>
                  <DriverForm />
                </RequireAuth>
              }
            />
            <Route
              path="/drivers/:id"
              element={
                <RequireAuth roles={['fleet_manager', 'dispatcher', 'safety_officer', 'admin']}>
                  <DriverDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/drivers/:id/edit"
              element={
                <RequireAuth roles={['fleet_manager', 'admin']}>
                  <DriverForm />
                </RequireAuth>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <h2>404 — Page Not Found</h2>
                  <p>The page you're looking for doesn't exist.</p>
                </Box>
              }
            />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
