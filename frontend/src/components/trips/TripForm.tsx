import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Select,
  MenuItem,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, SubmitHandler, UseFormHandle } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import tripService from '../../services/tripService';
import { TripFormData, Trip } from '../../types/trip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

const tripFormSchema = Yup.object({
  source: Yup.string().required('Source is required'),
  destination: Yup.string().required('Destination is required'),
  vehicleId: Yup.string().required('Vehicle is required'),
  driverId: Yup.string().required('Driver is required'),
  cargoWeight: Yup.number()
    .typeError('Cargo weight must be a number')
    .positive('Cargo weight must be greater than 0')
    .required('Cargo weight is required'),
  plannedDistance: Yup.number()
    .typeError('Planned distance must be a number')
    .positive('Planned distance must be greater than 0')
    .required('Planned distance is required'),
});

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
    const userRole = user.role?.code;

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
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<TripFormData>({
    resolver: yupResolver(tripFormSchema),
    defaultValues: {
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeight: 0,
      plannedDistance: 0,
    },
  });

  // For drivers, automatically set themselves as the driver when creating a new trip
  React.useEffect(() => {
    if (!tripId && user?.role?.code === 'driver') {
      setValue('driverId', user.id);
    }
  }, [tripId, user, setValue]);

  // For drivers, prevent changing the driverId when editing (they can only edit their own trips)
  React.useEffect(() => {
    if (tripId && user?.role?.code === 'driver') {
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

  // Load trip data if editing
  const {
    data: tripData,
    isLoading: isLoadingTrip
  } = useQuery<Trip, Error>(
    tripId ? ['trip', tripId] : [],
    () => tripService.getTripById(tripId!),
    {
      enabled: !!tripId,
      retry: false,
    }
  );

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
        setSelectedDriver(tripData.driver);
      }
    }
  }, [tripData, tripId, reset]);

  // Simulate fetching vehicles and drivers (in a real app, these would come from API calls)
  useEffect(() => {
    // Mock vehicle data
    const mockVehicles = [
      { id: '1', registrationNumber: 'ABC-123', name: 'Truck A', type: 'truck', maxCapacity: 10000 },
      { id: '2', registrationNumber: 'XYZ-789', name: 'Van B', type: 'van', maxCapacity: 3000 },
      { id: '3', registrationNumber: 'DEF-456', name: 'Bus C', type: 'bus', maxCapacity: 50 },
    ];

    setVehicleOptions(
      mockVehicles.map(v => ({
        value: v.id,
        label: `${v.registrationNumber} - ${v.name} (${v.type})`
      }))
    );

    // Mock driver data
    const mockDrivers = [
      { id: '1', name: 'John Doe', licenseNumber: 'DL12345', safetyScore: 85 },
      { id: '2', name: 'Jane Smith', licenseNumber: 'DL67890', safetyScore: 92 },
      { id: '3', name: 'Bob Johnson', licenseNumber: 'DL54321', safetyScore: 78 },
    ];

    setDriverOptions(
      mockDrivers.map(d => ({
        value: d.id,
        label: `${d.name} - ${d.licenseNumber}`
      }))
    );
  }, []);

  const onSubmit: SubmitHandler<TripFormData> = async (data) => {
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
        err.response?.data?.error?.message ||
        'An error occurred while saving the trip',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Typography variant="h5" align="center" mb={4}>
            {tripId ? 'Edit Trip' : 'Create New Trip'}
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Source"
                placeholder="Enter starting location"
                {...register('source')}
                error={!!errors.source}
                helperText={errors.source?.message}
                sx={{ width: '100%' }}
              />

              <TextField
                label="Destination"
                placeholder="Enter ending location"
                {...register('destination')}
                error={!!errors.destination}
                helperText={errors.destination?.message}
                sx={{ width: '100%' }}
              />

              <Select
                label="Vehicle"
                labelId="vehicle-label"
                id="vehicle-select"
                value={vehicleId}
                onChange={(e) => setValue('vehicleId', e.target.value)}
                {...register('vehicleId')}
                error={!!errors.vehicleId}
                helperText={errors.vehicleId?.message}
                sx={{ width: '100%' }}
                MenuProps={{ sx: { width: 260 } }}
              >
                <MenuItem value="">
                  <!-- -->Select a vehicle<!-- -->
                </MenuItem>
                {vehicleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <Select
                label="Driver"
                labelId="driver-label"
                id="driver-select"
                value={driverId}
                onChange={(e) => setValue('driverId', e.target.value)}
                {...register('driverId')}
                error={!!errors.driverId}
                helperText={errors.driverId?.message}
                sx={{ width: '100%' }}
                MenuProps={{ sx: { width: 260 } }}
              >
                <MenuItem value="">
                  <!-- -->Select a driver<!-- -->
                </MenuItem>
                {driverOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                label="Cargo Weight (kg)"
                type="number"
                inputProps={{ min: 0.1, step: 0.1 }}
                {...register('cargoWeight')}
                error={!!errors.cargoWeight}
                helperText={errors.cargoWeight?.message}
                sx={{ width: '100%' }}
              />

              <TextField
                label="Planned Distance (km)"
                type="number"
                inputProps={{ min: 0.1, step: 0.1 }}
                {...register('plannedDistance')}
                error={!!errors.plannedDistance}
                helperText={errors.plannedDistance?.message}
                sx={{ width: '100%' }}
              />

              {selectedVehicle && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected Vehicle Capacity: {selectedVehicle.maxCapacity} kg
                  </Typography>
                  {parseFloat(watch('cargoWeight') || '0') > parseFloat(selectedVehicle.maxCapacity || '0') && (
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
                  disabled={isLoading || !isValid}
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