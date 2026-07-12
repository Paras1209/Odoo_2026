import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  MenuItem,
  Link as MuiLink,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsBus as BusIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

const roles: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'driver', label: 'Driver' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'financial_analyst', label: 'Financial Analyst' },
];

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    role: z.string().min(1, 'Select a role'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'employee',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      clearError();
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role as UserRole,
      });
      navigate('/profile', { replace: true });
    } catch {
      // handled by context
    }
  };

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
        }}
      >
        {/* Left Panel */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'secondary.dark',
            color: 'white',
            p: 5,
            width: '36%',
          }}
        >
          <BusIcon sx={{ fontSize: 52, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} textAlign="center">
            TransitOps
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.75, textAlign: 'center' }}>
            Smart Transport Operations Platform
          </Typography>
          <Typography variant="body2" sx={{ mt: 5, opacity: 0.55, textAlign: 'center', maxWidth: 200 }}>
            Create your account to get started with role-based fleet management.
          </Typography>
        </Box>

        {/* Right Panel — Register Form */}
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
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fill in the details below to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              label="Full Name"
              margin="dense"
              autoComplete="name"
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register('name')}
            />

            <TextField
              fullWidth
              label="Email Address"
              margin="dense"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />

            <TextField
              fullWidth
              label="Role"
              select
              margin="dense"
              defaultValue="employee"
              error={!!errors.role}
              helperText={errors.role?.message}
              {...register('role')}
            >
              {roles.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="dense"
              autoComplete="new-password"
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

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              margin="dense"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((s) => !s)}
                      edge="end"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2">I accept the terms and conditions</Typography>}
                  />
                  {errors.acceptTerms && (
                    <FormHelperText error>{errors.acceptTerms.message}</FormHelperText>
                  )}
                </Box>
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2, py: 1.5 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Already have an account?{' '}
              <MuiLink component={Link} to="/login" color="primary" underline="hover" fontWeight={600}>
                Sign In
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
