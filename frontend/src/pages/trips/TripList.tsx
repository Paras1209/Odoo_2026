import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import Menu from '../../components/Menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarToday, Delete, Edit, LocationOn, Refresh, DirectionsCar, Person, Scale, LocalDrink, MoreVert } from '@mui/icons/material';
import tripService from '../../services/tripService';
import { Trip, TripFilters } from '../../types/trip';
import { SnackbarProvider, useSnackbar } from 'notistack';
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
  const [cancelReason, setCancelReason] = useState('');

  const { page = 1, limit = 10, source, destination, vehicleType, status, startDate, endDate } = filters;

  // Modify filters for driver role to only show their own trips
  const driverFilters = user?.role?.code === 'driver'
    ? { ...filters, driverId: user.id }
    : filters;

  const {
    data: tripsData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; data: Trip[]; count: number }, Error>(
    ['trips', { page, limit, source, destination, vehicleType, status, startDate, endDate }, user?.role?.code === 'driver' ? user.id : null],
    () => tripService.getTrips({ ...driverFilters, page, limit }),
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

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

  const handleDeleteTrip = async () => {
    if (!selectedTripId) return;

    try {
      await tripService.deleteTrip(selectedTripId);
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      enqueueSnackbar('Trip deleted successfully', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.error?.message || 'Failed to delete trip', { variant: 'error' });
    } finally {
      handleCloseMenu();
    }
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

  const handleCancelTrip = async (reason: string) => {
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
    <>
      <SnackbarProvider maxSnack={3}>
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
                  <RefreshIcon fontSize="small" /> Filter
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Trips Table */}
          {trips.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th>Source → Destination</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Cargo (kg)</th>
                      <th>Distance (km)</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td>
                          <Typography variant="body2">
                            {trip.source} → {trip.destination}
                          </Typography>
                        </td>
                        <td>
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
                        <td>
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
                        <td>{trip.cargoWeight}</td>
                        <td>{trip.plannedDistance}{trip.actualDistance ? ` (${trip.actualDistance} actual)` : ''}</td>
                        <td>
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
                        <td>
                          <Typography variant="caption">
                            {new Date(trip.createdAt).toLocaleDateString()}
                          </Typography>
                        </td>
                        <td>
                          <IconButton
                            aria-label="Trip actions"
                            size="small"
                            onClick={(e) => handleOpenMenu(e, trip.id)}
                          >
                            <Tooltip title="Actions">
                              <MoreVert />
                            </Tooltip>
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>

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
                    label="Rows per page"
                    value={limit}
                    onChange={(e) => handleLimitChange(parseInt(e.target.value as string))}
                    labelWidth={0}
                    select={{ menuIcon: () => <MoreVertIcon /> }}
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
          )}
        </Container>
      </SnackbarProvider>

      {/* Action Menu */}
      <div
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
            {user?.role?.code === 'admin' || user?.role?.code === 'fleet_manager' ? (
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
                {user?.role?.code === 'driver' && (
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
                {user?.role?.code === 'safety_officer' && (
                  <>
                    {/* Safety officers can view all trips but cannot modify */}
                    {/* No action buttons for safety officers */}
                  </>
                )}
                {user?.role?.code === 'financial_analyst' && (
                  <>
                    {/* Financial analysts can view all trips but cannot modify */}
                    {/* No action buttons for financial analysts */}
                  </>
                )}
                {user?.role?.code === 'employee' && (
                  <>
                    {/* Employees can view all trips but cannot modify */}
                    {/* No action buttons for employees */}
                  </>
                )}
              </>
            )}
            <Divider />
            {user?.role?.code === 'admin' || user?.role?.code === 'fleet_manager' || (user?.role?.code === 'driver' && selectedTrip && selectedTrip.driverId === user?.id) ? (
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
      </div>

      {/* Dispatch Confirmation Modal */}
      <DispatchConfirmationModal
        open={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        onConfirm={handleDispatchTrip}
        trip={selectedTrip || {
          source: '',
          destination: '',
          vehicle: { registrationNumber: '', name: '', type: '' },
          driver: { name: '', licenseNumber: '' }
        }}
      />

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
    </>
  );
};

export default TripList;