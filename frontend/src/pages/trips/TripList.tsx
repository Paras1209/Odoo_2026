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
import tripService from '../../services/tripService';
import { Trip, TripFilters } from '../../types/trip';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import DispatchConfirmationModal from '../../components/modals/DispatchConfirmationModal';
import CompleteTripModal from '../../components/modals/CompleteTripModal';
import CancelTripModal from '../../components/modals/CancelTripModal';

const TripList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [filters, setFilters] = useState<TripFilters>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const open = Boolean(anchorEl);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const { page = 1, limit = 10, source, destination, vehicleType, status, startDate, endDate } = filters;

  // Modify filters for driver role to only show their own trips
  const driverFilters = user?.role === 'driver'
    ? { ...filters, driverId: user.id }
    : filters;

  const {
    data: tripsData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; data: Trip[]; count: number }, Error>({
    queryKey: ['trips', { page, limit, source, destination, vehicleType, status, startDate, endDate }, user?.role === 'driver' ? user.id : null],
    queryFn: () => tripService.getTrips({ ...driverFilters, page, limit }),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const handleFilterChange = (field: keyof TripFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
    // Reset to first page when filters change
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, tripId: string) => {
    setSelectedTripId(tripId);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTripId(null);
    setSelectedTrip(null);
  };

  const handleDispatchTrip = async () => {
    if (!selectedTrip) return;

    try {
      await tripService.dispatchTrip(selectedTrip.id);
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      enqueueSnackbar('Trip dispatched successfully', { variant: 'success' });
      setDispatchModalOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.error?.message || 'Failed to dispatch trip', { variant: 'error' });
    }
  };

  const handleCompleteTrip = async (actualDistance: number, fuelConsumed: number) => {
    if (!selectedTrip) return;

    try {
      await tripService.completeTrip(selectedTrip.id, actualDistance, fuelConsumed);
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      enqueueSnackbar('Trip completed successfully', { variant: 'success' });
      setCompleteModalOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.error?.message || 'Failed to complete trip', { variant: 'error' });
    }
  };

  const handleCancelTrip = async () => {
    if (!selectedTripId) return;

    try {
      await tripService.cancelTrip(selectedTripId);
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      enqueueSnackbar('Trip cancelled successfully', { variant: 'success' });
      setCancelModalOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.error?.message || 'Failed to cancel trip', { variant: 'error' });
    }
  };

  // Fetch selected trip details when selectedTripId changes
  React.useEffect(() => {
    if (selectedTripId) {
      tripService.getTripById(selectedTripId)
        .then(response => {
          setSelectedTrip(response.data);
        })
        .catch(err => {
          console.error('Failed to fetch trip details:', err);
          setSelectedTrip(null);
        });
    }
  }, [selectedTripId]);

  if (isLoading) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography mt={2}>Loading trips...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography color="error">Error loading trips: {error.message}</Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const trips = tripsData?.data || [];
  const totalCount = tripsData?.count || 0;

  return (
    <Container sx={{ py: 4 }}>
      <Toolbar>
        <Typography variant="h6" flexGrow={1}>
          Trip Management
        </Typography>
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={() => navigate('/trips/new')}>
          New Trip
        </Button>
      </Toolbar>

      {/* Filters */}
      <Card sx={{ mt: 3, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Source"
              value={source || ''}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Destination"
              value={destination || ''}
              onChange={(e) => handleFilterChange('destination', e.target.value)}
              sx={{ flex: 1 }}
            />
            <Select
              label="Status"
              value={status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as string)}
              sx={{ flex: 1 }}
              MenuProps={{ sx: { width: 200 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="dispatched">Dispatched</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
            <Button variant="outlined" onClick={() => {
              setFilters({});
              setFilters(prev => ({ ...prev, page: 1 }));
            }}>
              Clear Filters
            </Button>
            <Button variant="contained" color="primary" onClick={() => refetch()}>
              <Refresh fontSize="small" /> Filter
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Trips Table */}
      {trips.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Source → Destination</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Vehicle</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Driver</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Cargo (kg)</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Distance (km)</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip: Trip) => (
                  <tr key={trip.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2">
                        {trip.source} → {trip.destination}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {trip.vehicle ? (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {trip.vehicle.registrationNumber}
                          </Typography>
                          <Typography variant="body2">
                            {trip.vehicle.name} ({trip.vehicle.type})
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2">N/A</Typography>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {trip.driver ? (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {trip.driver.licenseNumber}
                          </Typography>
                          <Typography variant="body2">
                            {trip.driver.name}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2">N/A</Typography>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>{trip.cargoWeight}</td>
                    <td style={{ padding: '12px' }}>{trip.plannedDistance}{trip.actualDistance ? ` (${trip.actualDistance} actual)` : ''}</td>
                    <td style={{ padding: '12px' }}>
                      <Chip
                        label={trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor:
                            trip.status === 'draft'
                              ? 'grey.100'
                              : trip.status === 'dispatched'
                              ? 'blue.100'
                              : trip.status === 'completed'
                              ? 'green.100'
                              : 'red.100',
                          color:
                            trip.status === 'draft'
                              ? 'grey.800'
                              : trip.status === 'dispatched'
                              ? 'blue.800'
                              : trip.status === 'completed'
                              ? 'green.800'
                              : 'red.800',
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="caption">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Tooltip title="Actions">
                        <IconButton
                          aria-label="Trip actions"
                          size="small"
                          onClick={(e) => handleOpenMenu(e, trip.id)}
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

          {/* Pagination */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Showing {trips.length} of {totalCount} trips
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                size="small"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={page >= Math.ceil(totalCount / limit)}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
              <Select
                value={limit}
                onChange={(e: SelectChangeEvent<number>) => handleLimitChange(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((val) => (
                  <MenuItem key={val} value={val}>
                    {val}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center', py: 8 }}>
          <Typography variant="h6">No trips found</Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or create your first trip
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/trips/new')}>
            Create First Trip
          </Button>
        </Box>
      )}      {/* Action Menu */}
      <MuiMenu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={open}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (selectedTripId) navigate(`/trips/${selectedTripId}`);
          handleCloseMenu();
        }}>
          View Details
        </MenuItem>
        {selectedTripId && (
          <>
            <MenuItem onClick={() => {
              if (selectedTripId) navigate(`/trips/${selectedTripId}/edit`);
              handleCloseMenu();
            }}>
              Edit Trip
            </MenuItem>
            <Divider />
            {/* Role-based access control for actions */}
            {user?.role === 'admin' || user?.role === 'fleet_manager' ? (
              <>
                {selectedTrip && selectedTrip.status === 'draft' && (
                  <MenuItem onClick={() => {
                    setDispatchModalOpen(true);
                    setSelectedTrip(selectedTrip);
                    handleCloseMenu();
                  }}>
                    Dispatch Trip
                  </MenuItem>
                )}
                {selectedTrip && selectedTrip.status === 'dispatched' && (
                  <MenuItem onClick={() => {
                    setCompleteModalOpen(true);
                    setSelectedTrip(selectedTrip);
                    handleCloseMenu();
                  }}>
                    Complete Trip
                  </MenuItem>
                )}
                {(selectedTrip && (selectedTrip.status === 'draft' || selectedTrip.status === 'dispatched')) && (
                  <MenuItem onClick={() => {
                    setCancelModalOpen(true);
                    setSelectedTrip(selectedTrip);
                    handleCloseMenu();
                  }}>
                    Cancel Trip
                  </MenuItem>
                )}
              </>
            ) : (
              <>
                {/* View-only roles (driver, safety_officer, financial_analyst, employee) */}
                {user?.role === 'driver' && (
                  <>
                    {/* Drivers can only view/edit trips assigned to them */}
                    {selectedTrip && selectedTrip.driverId === user?.id && (
                      <>
                        {selectedTrip.status === 'draft' && (
                          <MenuItem onClick={() => {
                            setDispatchModalOpen(true);
                            setSelectedTrip(selectedTrip);
                            handleCloseMenu();
                          }}>
                            Dispatch Trip
                          </MenuItem>
                        )}
                        {selectedTrip.status === 'dispatched' && (
                          <MenuItem onClick={() => {
                            setCompleteModalOpen(true);
                            setSelectedTrip(selectedTrip);
                            handleCloseMenu();
                          }}>
                            Complete Trip
                          </MenuItem>
                        )}
                        {(selectedTrip.status === 'draft' || selectedTrip.status === 'dispatched') && (
                          <MenuItem onClick={() => {
                            setCancelModalOpen(true);
                            setSelectedTrip(selectedTrip);
                            handleCloseMenu();
                          }}>
                            Cancel Trip
                          </MenuItem>
                        )}
                      </>
                    )}
                  </>
                )}
                {user?.role === 'safety_officer' && (
                  <>
                    {/* Safety officers can view all trips but cannot modify */}
                    {/* No action buttons for safety officers */}
                  </>
                )}
                {user?.role === 'financial_analyst' && (
                  <>
                    {/* Financial analysts can view all trips but cannot modify */}
                    {/* No action buttons for financial analysts */}
                  </>
                )}
                {user?.role === 'employee' && (
                  <>
                    {/* Employees can view all trips but cannot modify */}
                    {/* No action buttons for employees */}
                  </>
                )}
              </>
            )}
            <Divider />
            {user?.role === 'admin' || user?.role === 'fleet_manager' || (user?.role === 'driver' && selectedTrip && selectedTrip.driverId === user?.id) ? (
              <MenuItem onClick={() => {
                if (selectedTripId) {
                  // In a real app, this would open a delete confirmation modal
                  // For now, we'll just call the delete API directly
                  if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                    tripService.deleteTrip(selectedTripId).then(() => {
                      // Refresh the trips list
                      queryClient.invalidateQueries({ queryKey: ['trips'] });
                      enqueueSnackbar('Trip deleted successfully', { variant: 'success' });
                    });
                  }
                }
                handleCloseMenu();
              }}>
                Delete Trip
              </MenuItem>
            ) : null}
          </>
        )}
      </MuiMenu>

      {/* Dispatch Confirmation Modal */}
      {selectedTrip && (
        <DispatchConfirmationModal
          open={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          onConfirm={handleDispatchTrip}
          trip={{
            source: selectedTrip.source,
            destination: selectedTrip.destination,
            vehicle: {
              registrationNumber: selectedTrip.vehicle?.registrationNumber || '',
              name: selectedTrip.vehicle?.name || '',
              type: selectedTrip.vehicle?.type || '',
            },
            driver: {
              name: selectedTrip.driver?.name || '',
              licenseNumber: selectedTrip.driver?.licenseNumber || '',
            },
          }}
        />
      )}

      {/* Complete Trip Modal */}
      <CompleteTripModal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onConfirm={handleCompleteTrip}
      />

      {/* Cancel Trip Modal */}
      <CancelTripModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelTrip}
      />
    </Container>
  );
};

export default TripList;