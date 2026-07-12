import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import type { User, UserRole, UserStatus } from '../../types/auth';

interface UpdateUserData {
  role?: UserRole;
  status?: UserStatus;
  name?: string;
  email?: string;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({});

  // Fetch all users
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ success: boolean; count: number; data: User[] }>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    },
  });

  // Fetch all roles
  const { data: rolesData } = useQuery<{ success: boolean; count: number; data: Array<{ id: string; code: string; name: string }> }>({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const { data } = await api.get('/admin/roles');
      return data;
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const response = await api.put(`/admin/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      setEditDialogOpen(false);
      setSelectedUser(null);
      setEditForm({});
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to update user',
        { variant: 'error' }
      );
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to delete user',
        { variant: 'error' }
      );
    },
  });

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      status: user.status,
      name: user.name,
      email: user.email,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ userId: selectedUser.id, data: editForm });
  };

  const handleDeleteClick = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return 'No Role';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRoleColor = (role?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' => {
    if (!role) return 'default';
    const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
      admin: 'error',
      fleet_manager: 'secondary',
      dispatcher: 'primary',
      driver: 'success',
      safety_officer: 'warning',
      financial_analyst: 'info',
      employee: 'default',
    };
    return colorMap[role] || 'default';
  };

  const getStatusColor = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
    if (!status) return 'default';
    const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      active: 'success',
      pending: 'warning',
      suspended: 'error',
      inactive: 'default',
    };
    return colorMap[status] || 'default';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load users. Please try again.</Alert>
      </Box>
    );
  }

  const users = usersData?.data || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="secondary.dark">
          User Management
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Last Login</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status || 'unknown'}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role || ''}
                label="Role"
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              >
                {rolesData?.data.map((role) => (
                  <MenuItem key={role.code} value={role.code}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status || ''}
                label="Status"
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
