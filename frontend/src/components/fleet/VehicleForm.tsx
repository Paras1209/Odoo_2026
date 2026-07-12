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
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import vehicleService, { Vehicle } from '../../services/vehicleService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

type VehicleFormData = {
  registrationNumber: string;
  name: string;
  model: string;
  type: 'bus' | 'van' | 'truck' | 'car' | 'motorcycle' | 'trailer' | 'other';
  maxCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
};

const VehicleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<VehicleFormData>({
    defaultValues: {
      registrationNumber: '',
      name: '',
      model: '',
      type: 'other',
      maxCapacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      status: 'Available',
    },
    mode: 'onChange',
  });

  // Load vehicle data if editing
  const {
    data: vehicleData,
  } = useQuery<{ success: boolean; data: Vehicle }, Error>({
    queryKey: id ? ['vehicle', id] : [],
    queryFn: () => vehicleService.getVehicle(id!),
    enabled: !!id,
    retry: false,
  });

  // Initialize form with vehicle data when editing
  useEffect(() => {
    if (vehicleData?.data && isEditMode) {
      const vehicle = vehicleData.data;
      reset({
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        model: vehicle.model,
        type: vehicle.type,
        maxCapacity: vehicle.maxCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
      });
    }
  }, [vehicleData, isEditMode, reset]);

  const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode && id) {
        await vehicleService.updateVehicle(id, data);
        enqueueSnackbar('Vehicle updated successfully', { variant: 'success' });
      } else {
        await vehicleService.createVehicle(data);
        enqueueSnackbar('Vehicle created successfully', { variant: 'success' });
      }

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate('/fleet');
    } catch (err: any) {
      enqueueSnackbar(
        err.response?.data?.message || 'An error occurred while saving the vehicle',
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
            {isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Registration Number"
                placeholder="e.g., ABC-123"
                {...register('registrationNumber', { 
                  required: 'Registration number is required',
                  minLength: { value: 2, message: 'Registration number must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Registration number must not exceed 50 characters' }
                })}
                error={!!errors.registrationNumber}
                helperText={errors.registrationNumber?.message}
                fullWidth
              />

              <TextField
                label="Vehicle Name"
                placeholder="e.g., Volvo Bus 2023"
                {...register('name', { 
                  required: 'Vehicle name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 120, message: 'Name must not exceed 120 characters' }
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
              />

              <TextField
                label="Model"
                placeholder="e.g., Volvo 9700"
                {...register('model', { 
                  required: 'Model is required',
                  minLength: { value: 2, message: 'Model must be at least 2 characters' },
                  maxLength: { value: 120, message: 'Model must not exceed 120 characters' }
                })}
                error={!!errors.model}
                helperText={errors.model?.message}
                fullWidth
              />

              <FormControl fullWidth error={!!errors.type}>
                <InputLabel id="type-label">Vehicle Type</InputLabel>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Vehicle type is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="type-label"
                      label="Vehicle Type"
                    >
                      <MenuItem value="bus">Bus</MenuItem>
                      <MenuItem value="van">Van</MenuItem>
                      <MenuItem value="truck">Truck</MenuItem>
                      <MenuItem value="car">Car</MenuItem>
                      <MenuItem value="motorcycle">Motorcycle</MenuItem>
                      <MenuItem value="trailer">Trailer</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  )}
                />
                {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
              </FormControl>

              <TextField
                label="Maximum Capacity (kg)"
                type="number"
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                {...register('maxCapacity', { 
                  required: 'Maximum capacity is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Capacity must be at least 1 kg' }
                })}
                error={!!errors.maxCapacity}
                helperText={errors.maxCapacity?.message}
                fullWidth
              />

              <TextField
                label="Odometer Reading (km)"
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                {...register('odometer', { 
                  required: 'Odometer reading is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Odometer cannot be negative' }
                })}
                error={!!errors.odometer}
                helperText={errors.odometer?.message}
                fullWidth
              />

              <TextField
                label="Acquisition Cost"
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                {...register('acquisitionCost', { 
                  required: 'Acquisition cost is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Cost cannot be negative' }
                })}
                error={!!errors.acquisitionCost}
                helperText={errors.acquisitionCost?.message}
                fullWidth
              />

              <FormControl fullWidth error={!!errors.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: 'Status is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="status-label"
                      label="Status"
                    >
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="On Trip">On Trip</MenuItem>
                      <MenuItem value="In Shop">In Shop</MenuItem>
                      <MenuItem value="Retired">Retired</MenuItem>
                    </Select>
                  )}
                />
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={4}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                >
                  {isLoading ? 'Saving...' : isEditMode ? 'Update Vehicle' : 'Add Vehicle'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/fleet')}
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

export default VehicleForm;
