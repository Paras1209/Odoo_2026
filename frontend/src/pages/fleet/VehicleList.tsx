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
  type SelectChangeEvent,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MoreVert, Refresh } from '@mui/icons-material';
import vehicleService, { Vehicle } from '../../services/vehicleService';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

interface VehicleFilters {
  status?: string;
  type?: string;
  search?: string;
}

const VehicleList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  const {
    data: vehiclesData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; data: Vehicle[]; count: number }, Error>({
    queryKey: ['vehicles', filters],
    queryFn: () => vehicleService.getVehicles(filters.status),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const handleFilterChange = (field: keyof VehicleFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedVehicleId(null);
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicleId) return;

    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await vehicleService.deleteVehicle(selectedVehicleId);
        await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        enqueueSnackbar('Vehicle deleted successfully', { variant: 'success' });
        handleCloseMenu();
      } catch (err: any) {
        enqueueSnackbar(err.response?.data?.message || 'Failed to delete vehicle', { variant: 'error' });
      }
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';

  if (isLoading) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography mt={2}>Loading vehicles...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography color="error">Error loading vehicles: {error.message}</Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const vehicles = vehiclesData?.data || [];
  const filteredVehicles = vehicles.filter(vehicle => {
    if (filters.type && vehicle.type !== filters.type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        vehicle.name.toLowerCase().includes(search) ||
        vehicle.registrationNumber.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <Container sx={{ py: 4 }}>
      <Toolbar>
        <Typography variant="h6" flexGrow={1}>
          Fleet Management
        </Typography>
        {canEdit && (
          <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={() => navigate('/fleet/new')}>
            Add Vehicle
          </Button>
        )}
      </Toolbar>

      {/* Filters */}
      <Card sx={{ mt: 3, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Search"
              placeholder="Search by name, registration, or model"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ flex: 2 }}
            />
            <Select
              displayEmpty
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value as string)}
              sx={{ flex: 1, minWidth: 150 }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="bus">Bus</MenuItem>
              <MenuItem value="van">Van</MenuItem>
              <MenuItem value="truck">Truck</MenuItem>
              <MenuItem value="car">Car</MenuItem>
              <MenuItem value="motorcycle">Motorcycle</MenuItem>
              <MenuItem value="trailer">Trailer</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            <Select
              displayEmpty
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as string)}
              sx={{ flex: 1, minWidth: 150 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="On Trip">On Trip</MenuItem>
              <MenuItem value="In Shop">In Shop</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
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

      {/* Vehicles Table */}
      {filteredVehicles.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Registration</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Model</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Capacity (kg)</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Odometer (km)</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle: Vehicle) => (
                  <tr key={vehicle.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {vehicle.registrationNumber}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>{vehicle.name}</td>
                    <td style={{ padding: '12px' }}>{vehicle.model}</td>
                    <td style={{ padding: '12px' }}>
                      <Chip
                        label={vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                        size="small"
                        color="default"
                      />
                    </td>
                    <td style={{ padding: '12px' }}>{vehicle.maxCapacity.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{vehicle.odometer.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <Chip
                        label={vehicle.status}
                        size="small"
                        color={
                          vehicle.status === 'Available'
                            ? 'success'
                            : vehicle.status === 'On Trip'
                            ? 'primary'
                            : vehicle.status === 'In Shop'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Tooltip title="Actions">
                        <IconButton
                          aria-label="Vehicle actions"
                          size="small"
                          onClick={(e) => handleOpenMenu(e, vehicle.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Showing {filteredVehicles.length} of {vehicles.length} vehicles
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center', py: 8 }}>
          <Typography variant="h6">No vehicles found</Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.search || filters.type || filters.status
              ? 'Try adjusting your filters'
              : 'Add your first vehicle to get started'}
          </Typography>
          {canEdit && (
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/fleet/new')}>
              Add First Vehicle
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
          if (selectedVehicleId) navigate(`/fleet/${selectedVehicleId}`);
          handleCloseMenu();
        }}>
          View Details
        </MenuItem>
        {canEdit && (
          <>
            <MenuItem onClick={() => {
              if (selectedVehicleId) navigate(`/fleet/${selectedVehicleId}/edit`);
              handleCloseMenu();
            }}>
              Edit Vehicle
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteVehicle}>
              Delete Vehicle
            </MenuItem>
          </>
        )}
      </MuiMenu>
    </Container>
  );
};

export default VehicleList;
