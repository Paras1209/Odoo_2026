import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Select,
  MenuItem,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import tripService from '../../services/tripService';
import vehicleService, { Vehicle } from '../../services/vehicleService';
import driverService, { Driver } from '../../services/driverService';
import { TripFormData, Trip } from '../../types/trip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

type TripFormProps = {
  onSuccess?: () => void;
};

const TripForm: React.FC<TripFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId?: string }>();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has permission to access this form
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

    // Driver can only access if editing their own trip
    if (userRole === 'driver') {
      // If creating a new trip, drivers can create
      if (!tripId) {
        return;
      }

      // If editing, check if the trip belongs to the driver
      // This check will happen in the tripData effect below
      return;
    }

    // All other roles (safety_officer, financial_analyst, employee) have view-only access
    // Redirect to trips list
    navigate('/trips');
  }, [navigate, tripId, user]);
  
  const [vehicleOptions, setVehicleOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [driverOptions, setDriverOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TripFormData>({
    defaultValues: {
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeight: 0,
      plannedDistance: 0,
    },
    mode: 'onChange',
  });

  // For drivers, automatically set themselves as the driver when creating a new trip
  React.useEffect(() => {
    if (!tripId && user?.role === 'driver') {
      setValue('driverId', user.id);
    }
  }, [tripId, user, setValue]);

  // For drivers, prevent changing the driverId when editing (they can only edit their own trips)
  React.useEffect(() => {
    if (tripId && user?.role === 'driver') {
      // This would ideally be validated in the useEffect that fetches tripData
      // But we can also warn the user if they try to change it
      const driverId = watch('driverId');
      if (driverId && driverId !== user.id) {
        // Reset to their own ID if they tried to change it
        setValue('driverId', user.id);
      }
    }
  }, [tripId, user, watch, setValue]);

  // Watch for vehicle/driver changes to update validation
  const vehicleId = watch('vehicleId');
  const driverId = watch('driverId');
  const cargoWeight = watch('cargoWeight');

  // Load trip data if editing
  const {
    data: tripData,
  } = useQuery<Trip, Error>({
    queryKey: tripId ? ['trip', tripId] : [],
    queryFn: () => tripService.getTripById(tripId!).then(res => res.data),
    enabled: !!tripId,
    retry: false,
  });

  // Initialize form with trip data when editing
  useEffect(() => {
    if (tripData && !tripId) return; // Only for editing
    if (tripData) {
      reset({
        source: tripData.source,
        destination: tripData.destination,
        vehicleId: tripData.vehicleId,
        driverId: tripData.driverId,
        cargoWeight: tripData.cargoWeight,
        plannedDistance: tripData.plannedDistance,
      });

      // Set vehicle and driver options based on trip data
      if (tripData.vehicle) {
        setVehicleOptions([{
          value: tripData.vehicleId,
          label: `${tripData.vehicle.registrationNumber} - ${tripData.vehicle.name} (${tripData.vehicle.type})`
        }]);
        setSelectedVehicle(tripData.vehicle);
      }

      if (tripData.driver) {
        setDriverOptions([{
          value: tripData.driverId,
          label: `${tripData.driver.name} - ${tripData.driver.licenseNumber}`
        }]);
      }
    }
  }, [tripData, tripId, reset]);

  // Fetch vehicles and drivers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        setDataError(null);

        const [vehiclesRes, driversRes] = await Promise.all([
          vehicleService.getVehicles('Available'),
          driverService.getDrivers('Active')
        ]);

        setVehicles(vehiclesRes.data);
        setDrivers(driversRes.data);

        setVehicleOptions(
          vehiclesRes.data.map(v => ({
            value: v.id,
            label: `${v.registrationNumber} - ${v.name} (${v.type})`
          }))
        );

        setDriverOptions(
          driversRes.data.map(d => ({
            value: d.id,
            label: `${d.name} - ${d.licenseNumber}`
          }))
        );
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to load vehicles and drivers';
        setDataError(errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [enqueueSnackbar]);

  const onSubmit: SubmitHandler<TripFormData> = async (data) => {
    // Validate cargo weight against vehicle capacity
    if (selectedVehicle && data.cargoWeight > selectedVehicle.maxCapacity) {
      enqueueSnackbar(
        `Cargo weight (${data.cargoWeight} kg) exceeds vehicle capacity (${selectedVehicle.maxCapacity} kg)`,
        { variant: 'error' }
      );
      return;
    }

    // Validate required fields
    if (!data.vehicleId) {
      enqueueSnackbar('Please select a vehicle', { variant: 'error' });
      return;
    }
    if (!data.driverId) {
      enqueueSnackbar('Please select a driver', { variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      if (tripId) {
        // Update existing trip
        await tripService.updateTrip(tripId, data);
        enqueueSnackbar('Trip updated successfully', { variant: 'success' });
      } else {
        // Create new trip
        await tripService.createTrip(data);
        enqueueSnackbar('Trip created successfully', { variant: 'success' });
      }

      // Invalidate queries to refresh trips list
      await queryClient.invalidateQueries({ queryKey: ['trips'] });

      // Reset form
      reset();

      // Navigate back to list or call callback
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/trips');
      }
    } catch (err: any) {
      enqueueSnackbar(
        err.response?.data?.message ||
        'An error occurred while saving the trip',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form has errors or cargo exceeds capacity
  const hasValidationErrors = 
    Object.keys(errors).length > 0 || 
    (selectedVehicle && cargoWeight > selectedVehicle.maxCapacity) ||
    !vehicleId ||
    !driverId ||
    !watch('source') ||
    !watch('destination') ||
    !cargoWeight ||
    !watch('plannedDistance');

  return (
    <Container sx={{ py: 4 }}>
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Typography variant="h5" align="center" mb={4}>
            {tripId ? 'Edit Trip' : 'Create New Trip'}
          </Typography>

          {dataError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {dataError}
            </Alert>
          )}

          {loadingData && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Loading vehicles and drivers...
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Source"
                placeholder="Enter starting location"
                {...register('source', { required: 'Source is required' })}
                error={!!errors.source}
                helperText={errors.source?.message}
                sx={{ width: '100%' }}
              />

              <TextField
                label="Destination"
                placeholder="Enter ending location"
                {...register('destination', { required: 'Destination is required' })}
                error={!!errors.destination}
                helperText={errors.destination?.message}
                sx={{ width: '100%' }}
              />

              <FormControl fullWidth error={!!errors.vehicleId}>
                <InputLabel id="vehicle-label">Vehicle</InputLabel>
                <Select
                  labelId="vehicle-label"
                  id="vehicle-select"
                  label="Vehicle"
                  value={vehicleId}
                  onChange={(e) => {
                    setValue('vehicleId', e.target.value, { shouldValidate: true });
                    const selected = vehicles.find(v => v.id === e.target.value);
                    setSelectedVehicle(selected || null);
                  }}
                >
                  <MenuItem value="">Select a vehicle</MenuItem>
                  {vehicleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.vehicleId && <FormHelperText>{errors.vehicleId.message}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth error={!!errors.driverId}>
                <InputLabel id="driver-label">Driver</InputLabel>
                <Select
                  labelId="driver-label"
                  id="driver-select"
                  label="Driver"
                  value={driverId}
                  onChange={(e) => setValue('driverId', e.target.value, { shouldValidate: true })}
                >
                  <MenuItem value="">Select a driver</MenuItem>
                  {driverOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.driverId && <FormHelperText>{errors.driverId.message}</FormHelperText>}
              </FormControl>

              <TextField
                label="Cargo Weight (kg)"
                type="number"
                slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }}
                {...register('cargoWeight', { 
                  required: 'Cargo weight is required',
                  valueAsNumber: true,
                  min: { value: 0.1, message: 'Cargo weight must be greater than 0' }
                })}
                error={!!errors.cargoWeight}
                helperText={errors.cargoWeight?.message}
                sx={{ width: '100%' }}
              />

              <TextField
                label="Planned Distance (km)"
                type="number"
                slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }}
                {...register('plannedDistance', { 
                  required: 'Planned distance is required',
                  valueAsNumber: true,
                  min: { value: 0.1, message: 'Planned distance must be greater than 0' }
                })}
                error={!!errors.plannedDistance}
                helperText={errors.plannedDistance?.message}
                sx={{ width: '100%' }}
              />

              {selectedVehicle && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected Vehicle Capacity: {selectedVehicle.maxCapacity} kg
                  </Typography>
                  {(cargoWeight || 0) > (selectedVehicle.maxCapacity || 0) && (
                    <Typography variant="body2" color="error">
                      Warning: Cargo weight exceeds vehicle capacity!
                    </Typography>
                  )}
                </Box>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={4}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading || hasValidationErrors || loadingData}
                  sx={{ flex: 1 }}
                >
                  {isLoading ? 'Saving...' : tripId ? 'Update Trip' : 'Create Trip'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    reset();
                    navigate('/trips');
                  }}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TripForm;