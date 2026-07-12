import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsBus as BusIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  LocalShipping as FleetIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      clearError();
      await login(values);
      navigate(from, { replace: true });
    } catch {
      // error handled by context
    }
  };

  const roleAccessInfo = [
    { role: 'Fleet Manager', access: 'Fleet, Maintenance', icon: <FleetIcon fontSize="small" /> },
    { role: 'Dispatcher', access: 'Dashboard, Trips', icon: <DashboardIcon fontSize="small" /> },
    { role: 'Safety Officer', access: 'Drivers, Compliance', icon: <SecurityIcon fontSize="small" /> },
    { role: 'Financial Analyst', access: 'Fuel & Expenses, Analytics', icon: <AnalyticsIcon fontSize="small" /> },
  ];

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          display: 'flex',
          overflow: 'hidden',
          maxWidth: 920,
          width: '100%',
          minHeight: 540,
        }}
      >
        {/* Left Panel — Branding */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'secondary.dark',
            color: 'white',
            p: 5,
            width: '42%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusIcon sx={{ fontSize: 38, color: 'primary.main', mr: 1.5 }} />
            <Typography variant="h5" fontWeight={700}>
              TransitOps
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 5, opacity: 0.75 }}>
            Smart Transport Operations Platform
          </Typography>

          <Typography
            variant="overline"
            sx={{ mb: 1.5, opacity: 0.5, letterSpacing: 1.5 }}
          >
            Role-Scoped Access
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roleAccessInfo.map((item) => (
              <Box key={item.role} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} fontSize={13}>
                    {item.role}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.65 }}>
                    {item.access}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Typography variant="caption" sx={{ mt: 'auto', pt: 5, opacity: 0.4 }}>
            TRANSITOPS &copy; 2026 &middot; RBAC ENABLED
          </Typography>
        </Box>

        {/* Right Panel — Login Form */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 3, sm: 5 },
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight={700} color="secondary.dark">
            Sign in to your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your credentials to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              label="Email Address"
              placeholder="raven.k@transitops.in"
              margin="normal"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                mb: 2,
              }}
            >
              <FormControlLabel
                control={<Checkbox size="small" color="primary" />}
                label={<Typography variant="body2">Remember me</Typography>}
              />
              <MuiLink
                component={Link}
                to="/forgot-password"
                variant="body2"
                color="primary"
                underline="hover"
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Don&apos;t have an account?{' '}
              <MuiLink
                component={Link}
                to="/register"
                color="primary"
                underline="hover"
                fontWeight={600}
              >
                Sign Up
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
