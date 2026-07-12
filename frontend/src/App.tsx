import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, Container, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import theme from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, GuestOnly } from './components/RequireAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// Layout
import Navbar from './components/Navbar';
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

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <Container component="main" maxWidth="lg" sx={{ flex: 1 }}>
                  <Routes>
                    {/* Public */}
                    <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                    <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* Protected */}
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                    <Route path="/" element={<RequireAuth><Profile /></RequireAuth>} />

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
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
