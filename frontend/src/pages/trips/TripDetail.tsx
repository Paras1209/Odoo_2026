import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Delete, Edit, Person, LocalDrink, Scale, LocationOn, DirectionsCar, Schedule, AccessTime } from '@mui/icons-material';
import tripService from '../../services/tripService';
import { Trip } from '../../types/trip';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState } from 'react';

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
    const userRole = user.role?.code;

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
    return;
  }, [navigate, tripId, user]);

  const {
    data: trip,
    isLoading,
    error
  } = useQuery<Trip, Error>(
    tripId ? ['trip', tripId, user?.role?.code === 'driver' ? user.id : null] : [],
    () => tripService.getTripById(tripId!).then(response => {
      // Check if driver is trying to access a trip that doesn't belong to them
      if (user?.role?.code === 'driver' && response.data.driverId !== user.id) {
        // Redirect to trips list with an error message
        navigate('/trips');
        // In a real app, we might show a toast or error message
        throw new Error('Unauthorized access to trip');
      }
      return response.data;
    }),
    {
      enabled: !!tripId,
      retry: false,
    }
  );

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
      // Refetch trip data
      await window.location.reload();
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
      // Refetch trip data
      await window.location.reload();
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

  const statusColor: Record<string, string> = {
    draft: 'grey',
    dispatched: 'info.main',
    completed: 'success.main',
    cancelled: 'error.main',
  };

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title={`Trip #${trip.id.substring(0, 8)}`}
          subheader={
            <Chip
              label={trip.status.toUpperCase()}
              sx={{ backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette[statusColor[trip.status] as keyof typeof statusCode]?.main || '#fff'
                  : theme.palette[statusCode[trip.status] as keyof typeof statusCode]?.main || '#fff',
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '#fff'
                    : 'white'
              }}
            />
          }
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              {trip.status === 'draft' && (
                <Tooltip title="Edit Trip">
                  <ButtonVariant name="&#34;outlined&#34; size=&#34;small&#34; onClick={() ="> navigate(`/trips/${trip.id}/edit`)}>
                    <Edit fontSize="small" />
                  </Button>
                )}
              </Tooltip>
            )}
            {trip.status === 'draft' || trip.status === 'dispatched' && (
              <Tooltip title="Cancel Trip">
                <ButtonVariant name="&#34;outlined&#34; size=&#34;small&#34; color=&#34;error&#34; onClick={handleCancelTrip}">
                  <Delete fontSize="small" />
                </Button>
              </Tooltip>
            )}
          </Box>
          }
        />
      </CardHeader>

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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1"><strong>Current Odometer:</strong></Typography>
                <Typography variant="body1">{trip.vehicle.odometer ?? 0} km</Typography>
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
          {user?.role?.code === 'admin' || user?.role?.code === 'fleet_manager' && (
            <>
              {trip.status === 'draft' && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    // In a real app, this would open a dispatch confirmation modal
                    // For now, we'll just call the dispatch API directly
                    tripService.dispatchTrip(trip.id).then(() => {
                      window.location.reload();
                    });
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
                    // In a real app, this would open a delete confirmation modal
                    // For now, we'll just call the delete API directly
                    if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                      tripService.deleteTrip(trip.id).then(() => {
                        navigate('/trips');
                      });
                    }
                  }}
                >
                  Delete Trip
                </Button>
              )
            </>
          )}

          {/* Driver-specific actions */}
          {user?.role?.code === 'driver' && (
            <>
              {/* Drivers can only dispatch/complete/cancel trips assigned to them */}
              {trip.driverId === user?.id && trip.status === 'draft' && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    // In a real app, this would open a dispatch confirmation modal
                    // For now, we'll just call the dispatch API directly
                    tripService.dispatchTrip(trip.id).then(() => {
                      window.location.reload();
                    });
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

          {/* View-only roles (safety_officer, financial_analyst, employee) get no action buttons */}}

          <Button
            variant="outlined"
            onClick={() => navigate('/trips')}
          >
            Back to List
          </Button>
        </Stack>
      </CardContent>
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
          inputProps={{ min: 0, step: 0.1 }}
          value={actualDistance}
          onChange={(e) => setActualDistance(e.target.value)}
          required
          error={actualDistance === '' || parseFloat(actualDistance) < 0}
          helperText={actualDistance === '' || parseFloat(actualDistance) < 0 ? 'Please enter a valid distance' : ''}
          fullWidth
        />
        <TextField
          label="Fuel Consumed (L)"
          type="number"
          inputProps={{ min: 0, step: 0.1 }}
          value={fuelConsumed}
          onChange={(e) => setFuelConsumed(e.target.value)}
          required
          error={fuelConsumed === '' || parseFloat(fuelConsumed) < 0}
          helperText={fuelConsumed === '' || parseFloat(fuelConsumed) < 0 ? 'Please enter a valid fuel amount' : ''}
          fullWidth
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
  );
};

export default TripDetail;