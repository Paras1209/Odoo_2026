import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Menu as MuiMenu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MoreVert, Refresh, Warning } from '@mui/icons-material';
import driverService, { Driver } from '../../services/driverService';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

interface DriverFilters {
  status?: string;
  search?: string;
}

const DriverList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [filters, setFilters] = useState<DriverFilters>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  const {
    data: driversData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; data: Driver[]; count: number }, Error>({
    queryKey: ['drivers', filters],
    queryFn: () => driverService.getDrivers(filters.status),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const handleFilterChange = (field: keyof DriverFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, driverId: string) => {
    setSelectedDriverId(driverId);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedDriverId(null);
  };

  const handleDeleteDriver = async () => {
    if (!selectedDriverId) return;

    if (window.confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
      try {
        await driverService.deleteDriver(selectedDriverId);
        await queryClient.invalidateQueries({ queryKey: ['drivers'] });
        enqueueSnackbar('Driver deleted successfully', { variant: 'success' });
        handleCloseMenu();
      } catch (err: any) {
        enqueueSnackbar(err.response?.data?.message || 'Failed to delete driver', { variant: 'error' });
      }
    }
  };

  const isLicenseExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
  };

  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';

  if (isLoading) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography mt={2}>Loading drivers...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography color="error">Error loading drivers: {error.message}</Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const drivers = driversData?.data || [];
  const filteredDrivers = drivers.filter(driver => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        driver.name.toLowerCase().includes(search) ||
        driver.licenseNumber.toLowerCase().includes(search) ||
        driver.contact.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <Container sx={{ py: 4 }}>
      <Toolbar>
        <Typography variant="h6" flexGrow={1}>
          Driver Management
        </Typography>
        {canEdit && (
          <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={() => navigate('/drivers/new')}>
            Add Driver
          </Button>
        )}
      </Toolbar>

      {/* Filters */}
      <Card sx={{ mt: 3, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Search"
              placeholder="Search by name, license, or contact"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ flex: 2 }}
            />
            <Select
              displayEmpty
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as string)}
              sx={{ flex: 1, minWidth: 150 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="On Trip">On Trip</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
            </Select>
            <Button variant="outlined" onClick={() => setFilters({})}>
              Clear
            </Button>
            <Button variant="contained" color="primary" onClick={() => refetch()}>
              <Refresh fontSize="small" />
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      {filteredDrivers.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>License Number</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>License Expiry</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Contact</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Safety Score</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver: Driver) => {
                  const licenseExpired = isLicenseExpired(driver.licenseExpiry);
                  return (
                    <tr key={driver.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {driver.name}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px' }}>{driver.licenseNumber}</td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={driver.licenseCategory}
                          size="small"
                          color="default"
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color={licenseExpired ? 'error' : 'inherit'}>
                            {new Date(driver.licenseExpiry).toLocaleDateString()}
                          </Typography>
                          {licenseExpired && (
                            <Tooltip title="License expired">
                              <Warning color="error" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Typography variant="body2">{driver.contact}</Typography>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={`${driver.safetyScore}/100`}
                          size="small"
                          color={
                            driver.safetyScore >= 80
                              ? 'success'
                              : driver.safetyScore >= 60
                              ? 'warning'
                              : 'error'
                          }
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={driver.status}
                          size="small"
                          color={
                            driver.status === 'Available'
                              ? 'success'
                              : driver.status === 'On Trip'
                              ? 'primary'
                              : 'default'
                          }
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Tooltip title="Actions">
                          <IconButton
                            aria-label="Driver actions"
                            size="small"
                            onClick={(e) => handleOpenMenu(e, driver.id)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Showing {filteredDrivers.length} of {drivers.length} drivers
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center', py: 8 }}>
          <Typography variant="h6">No drivers found</Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.search || filters.status
              ? 'Try adjusting your filters'
              : 'Add your first driver to get started'}
          </Typography>
          {canEdit && (
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/drivers/new')}>
              Add First Driver
            </Button>
          )}
        </Box>
      )}

      {/* Action Menu */}
      <MuiMenu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={open}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (selectedDriverId) navigate(`/drivers/${selectedDriverId}`);
          handleCloseMenu();
        }}>
          View Details
        </MenuItem>
        {canEdit && (
          <>
            <MenuItem onClick={() => {
              if (selectedDriverId) navigate(`/drivers/${selectedDriverId}/edit`);
              handleCloseMenu();
            }}>
              Edit Driver
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteDriver}>
              Delete Driver
            </MenuItem>
          </>
        )}
      </MuiMenu>
    </Container>
  );
};

export default DriverList;
