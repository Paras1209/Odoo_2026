import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Delete, Edit } from '@mui/icons-material';
import tripService from '../../services/tripService';
import { Trip } from '../../types/trip';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

const TripDetail: React.FC = () => {
  const { tripId } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [isCompletedDialogOpen, setIsCompletedDialogOpen] = useState(false);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');

  // Check if user has permission to view this trip
  React.useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // Check permissions based on role
    const userRole = user.role;

    // Admin and Fleet Manager have full access
    if (userRole === 'admin' || userRole === 'fleet_manager') {
      return;
    }

    // Driver can only view their own trips
    if (userRole === 'driver') {
      // We'll check this in the trip data fetching effect
      return;
    }

    // All other roles (safety_officer, financial_analyst, employee) have view-only access
    // They can view all trips, so no redirect needed
  }, [navigate, tripId, user]);

  const {
    data: trip,
    isLoading,
    error,
    refetch
  } = useQuery<Trip, Error>({
    queryKey: tripId ? ['trip', tripId, user?.role === 'driver' ? user.id : null] : [],
    queryFn: () => tripService.getTripById(tripId!).then(response => {
      // Check if driver is trying to access a trip that doesn't belong to them
      if (user?.role === 'driver' && response.data.driverId !== user.id) {
        // Redirect to trips list with an error message
        navigate('/trips');
        // In a real app, we might show a toast or error message
        throw new Error('Unauthorized access to trip');
      }
      return response.data;
    }),
    enabled: !!tripId,
    retry: false,
  });

  const handleCompleteTrip = async () => {
    if (!tripId) return;

    const distance = parseFloat(actualDistance);
    const fuel = parseFloat(fuelConsumed);

    if (isNaN(distance) || distance < 0) {
      setActualDistance('');
      setIsCompletedDialogOpen(true);
      return;
    }

    if (isNaN(fuel) || fuel < 0) {
      setFuelConsumed('');
      setIsCompletedDialogOpen(true);
      return;
    }

    try {
      await tripService.completeTrip(tripId, distance, fuel);
      enqueueSnackbar('Trip completed successfully', { variant: 'success' });
      setIsCompletedDialogOpen(false);
      setActualDistance('');
      setFuelConsumed('');
      refetch();
    } catch (err: any) {
      enqueueSnackbar(
        err.response?.data?.error?.message ||
        'Failed to complete trip',
        { variant: 'error' }
      );
    }
  };

  const handleCancelTrip = async () => {
    if (!tripId) return;

    try {
      await tripService.cancelTrip(tripId);
      enqueueSnackbar('Trip cancelled successfully', { variant: 'success' });
      refetch();
    } catch (err: any) {
      enqueueSnackbar(
        err.response?.data?.error?.message ||
        'Failed to cancel trip',
        { variant: 'error' }
      );
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Error loading trip
        </Typography>
        <Typography variant="body1">
          {error.message}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/trips')} sx={{ mt: 2 }}>
          Back to Trips
        </Button>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Trip not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/trips')} sx={{ mt: 2 }}>
          Back to Trips
        </Button>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'dispatched': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <Container sx={{ py: 4 }}>
        <Card>
          <CardHeader
            title={`Trip #${trip.id.substring(0, 8)}`}
            subheader={
              <Chip
                label={trip.status.toUpperCase()}
                color={getStatusColor(trip.status) as any}
                sx={{ mt: 1 }}
              />
            }
            action={
              <Box sx={{ display: 'flex', gap: 2 }}>
                {trip.status === 'draft' && (
                  <Tooltip title="Edit Trip">
                    <Button variant="outlined" size="small" onClick={() => navigate(`/trips/${trip.id}/edit`)}>
                      <Edit fontSize="small" />
                    </Button>
                  </Tooltip>
                )}
                {(trip.status === 'draft' || trip.status === 'dispatched') && (
                  <Tooltip title="Cancel Trip">
                    <Button variant="outlined" size="small" color="error" onClick={handleCancelTrip}>
                      <Delete fontSize="small" />
                    </Button>
                  </Tooltip>
                )}
              </Box>
            }
          />

          <CardContent>
            <Divider sx={{ my: 3 }} />

            {/* Route Information */}
            <Stack spacing={2}>
              <Typography variant="h6">Route Information</Typography>
              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Source:</strong></Typography>
                <Typography variant="body1">{trip.source}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Destination:</strong></Typography>
                <Typography variant="body1">{trip.destination}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Planned Distance:</strong></Typography>
                <Typography variant="body1">{trip.plannedDistance} km</Typography>
              </Box>

              {trip.actualDistance !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1"><strong>Actual Distance:</strong></Typography>
                  <Typography variant="body1">{trip.actualDistance} km</Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Vehicle Information */}
            <Stack spacing={2}>
              <Typography variant="h6">Vehicle Information</Typography>
              <Divider sx={{ my: 1 }} />

              {trip.vehicle ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1"><strong>Vehicle:</strong></Typography>
                    <Typography variant="body1">
                      {trip.vehicle.registrationNumber} - {trip.vehicle.name} ({trip.vehicle.type})
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1"><strong>Max Capacity:</strong></Typography>
                    <Typography variant="body1">{trip.vehicle.maxCapacity} kg</Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Vehicle information not available
                </Typography>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Driver Information */}
            <Stack spacing={2}>
              <Typography variant="h6">Driver Information</Typography>
              <Divider sx={{ my: 1 }} />

              {trip.driver ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1"><strong>Driver:</strong></Typography>
                    <Typography variant="body1">
                      {trip.driver.name} - {trip.driver.licenseNumber}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1"><strong>Safety Score:</strong></Typography>
                    <Typography variant="body1">{trip.driver.safetyScore} / 100</Typography>
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Driver information not available
                </Typography>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Cargo Information */}
            <Stack spacing={2}>
              <Typography variant="h6">Cargo Information</Typography>
              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Weight:</strong></Typography>
                <Typography variant="body1">{trip.cargoWeight} kg</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Planned Distance:</strong></Typography>
                <Typography variant="body1">{trip.plannedDistance} km</Typography>
              </Box>

              {trip.actualDistance !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1"><strong>Actual Distance:</strong></Typography>
                  <Typography variant="body1">{trip.actualDistance} km</Typography>
                </Box>
              )}

              {trip.fuelConsumed !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1"><strong>Fuel Consumed:</strong></Typography>
                  <Typography variant="body1">{trip.fuelConsumed} L</Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Timestamps */}
            <Stack spacing={2}>
              <Typography variant="h6">Timestamps</Typography>
              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Created At:</strong></Typography>
                <Typography variant="body1">{new Date(trip.createdAt).toLocaleString()}</Typography>
              </Box>

              {trip.startedAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1"><strong>Started At:</strong></Typography>
                  <Typography variant="body1">{new Date(trip.startedAt).toLocaleString()}</Typography>
                </Box>
              )}

              {trip.endedAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1"><strong>Ended At:</strong></Typography>
                  <Typography variant="body1">{new Date(trip.endedAt).toLocaleString()}</Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {trip.status === 'draft' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/trips/${trip.id}/edit`)}
                >
                  Edit Trip
                </Button>
              )}

              {/* Action buttons with role-based access control */}
              {(user?.role === 'admin' || user?.role === 'fleet_manager') && (
                <>
                  {trip.status === 'draft' && (
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        try {
                          await tripService.dispatchTrip(trip.id);
                          refetch();
                        } catch (err: any) {
                          enqueueSnackbar(err.response?.data?.error?.message || 'Failed to dispatch trip', { variant: 'error' });
                        }
                      }}
                    >
                      Dispatch Trip
                    </Button>
                  )}

                  {trip.status === 'dispatched' && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => setIsCompletedDialogOpen(true)}
                    >
                      Complete Trip
                    </Button>
                  )}

                  {(trip.status === 'draft' || trip.status === 'dispatched') && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelTrip}
                    >
                      Cancel Trip
                    </Button>
                  )}

                  {trip.status !== 'completed' && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                          tripService.deleteTrip(trip.id).then(() => {
                            navigate('/trips');
                          });
                        }
                      }}
                    >
                      Delete Trip
                    </Button>
                  )}
                </>
              )}

              {/* Driver-specific actions */}
              {user?.role === 'driver' && (
                <>
                  {/* Drivers can only dispatch/complete/cancel trips assigned to them */}
                  {trip.driverId === user?.id && trip.status === 'draft' && (
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        try {
                          await tripService.dispatchTrip(trip.id);
                          refetch();
                        } catch (err: any) {
                          enqueueSnackbar(err.response?.data?.error?.message || 'Failed to dispatch trip', { variant: 'error' });
                        }
                      }}
                    >
                      Dispatch Trip
                    </Button>
                  )}

                  {trip.driverId === user?.id && trip.status === 'dispatched' && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => setIsCompletedDialogOpen(true)}
                    >
                      Complete Trip
                    </Button>
                  )}

                  {trip.driverId === user?.id && (trip.status === 'draft' || trip.status === 'dispatched') && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelTrip}
                    >
                      Cancel Trip
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="outlined"
                onClick={() => navigate('/trips')}
              >
                Back to List
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      {/* Complete Trip Dialog */}
      <Dialog
        open={isCompletedDialogOpen}
        onClose={() => setIsCompletedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Trip</DialogTitle>
        <DialogContent>
          <TextField
            label="Actual Distance (km)"
            type="number"
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            value={actualDistance}
            onChange={(e) => setActualDistance(e.target.value)}
            required
            error={actualDistance === '' || parseFloat(actualDistance) < 0}
            helperText={actualDistance === '' || parseFloat(actualDistance) < 0 ? 'Please enter a valid distance' : ''}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Fuel Consumed (L)"
            type="number"
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
            value={fuelConsumed}
            onChange={(e) => setFuelConsumed(e.target.value)}
            required
            error={fuelConsumed === '' || parseFloat(fuelConsumed) < 0}
            helperText={fuelConsumed === '' || parseFloat(fuelConsumed) < 0 ? 'Please enter a valid fuel amount' : ''}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCompletedDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCompleteTrip}
            disabled={actualDistance === '' || parseFloat(actualDistance) < 0 || fuelConsumed === '' || parseFloat(fuelConsumed) < 0}
          >
            Complete Trip
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TripDetail;
