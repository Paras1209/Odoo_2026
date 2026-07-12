import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import type { User } from '../types/auth';

const profileSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Enter a valid email'),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.newPassword && d.newPassword.length > 0 && d.newPassword.length < 6) return false;
      return true;
    },
    { message: 'Password must be at least 6 characters', path: ['newPassword'] }
  )
  .refine(
    (d) => {
      if (d.newPassword && d.newPassword !== d.confirmNewPassword) return false;
      return true;
    },
    { message: 'Passwords must match', path: ['confirmNewPassword'] }
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    authService
      .getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name || '',
      email: profile?.email || '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setError(null);
      setSuccess(null);

      const payload: Record<string, string> = {};
      if (values.name !== profile?.name) payload.name = values.name;
      if (values.email !== profile?.email) payload.email = values.email;
      if (values.newPassword) payload.password = values.newPassword;

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await authService.updateProfile(payload);
      setProfile((prev) => (prev ? { ...prev, ...response.data } : prev));
      updateUser(response.data as Partial<User>);
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
      reset({ name: values.name, email: values.email, newPassword: '', confirmNewPassword: '' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile.';
      setError(message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    reset();
  };

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const getRoleColor = (role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
    const map: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
      admin: 'secondary',
      fleet_manager: 'primary',
      driver: 'success',
      safety_officer: 'warning',
      financial_analyst: 'info',
      employee: 'primary',
    };
    return map[role] || 'primary';
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, maxWidth: 700, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} color="secondary.dark" gutterBottom>
        My Profile
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'secondary.dark',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700 }}
          >
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {profile?.name}
            </Typography>
            <Chip
              label={formatRole(profile?.role || 'employee')}
              color={getRoleColor(profile?.role || 'employee')}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
          {!isEditing && (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 'auto', color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ p: 3 }}>
          {!isEditing ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Full Name</Typography>
                </Box>
                <Typography fontWeight={500}>{profile?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                </Box>
                <Typography fontWeight={500}>{profile?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <BadgeIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Role</Typography>
                </Box>
                <Typography fontWeight={500}>{formatRole(profile?.role || '')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Last Login</Typography>
                </Box>
                <Typography fontWeight={500}>
                  {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Member Since</Typography>
                </Box>
                <Typography fontWeight={500}>
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <BadgeIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                </Box>
                <Chip
                  label={profile?.status || 'active'}
                  color={profile?.status === 'active' ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                fullWidth
                label="Full Name"
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
              <TextField
                fullWidth
                label="Email Address"
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Change Password (leave blank to keep current)
              </Typography>

              <TextField
                fullWidth
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                margin="normal"
                autoComplete="new-password"
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                {...register('newPassword')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((s) => !s)}
                        edge="end"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                margin="normal"
                autoComplete="new-password"
                error={!!errors.confirmNewPassword}
                helperText={errors.confirmNewPassword?.message}
                {...register('confirmNewPassword')}
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
