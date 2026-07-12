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
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import driverService, { Driver } from '../../services/driverService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

type DriverFormData = {
  name: string;
  licenseNumber: string;
  licenseCategory: 'A' | 'A1' | 'A2' | 'B' | 'B1' | 'C' | 'C1' | 'D' | 'D1' | 'E' | 'F' | 'G' | 'H' | 'other';
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: 'Available' | 'On Trip' | 'Suspended';
};

const DriverForm: React.FC = () => {
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
  } = useForm<DriverFormData>({
    defaultValues: {
      name: '',
      licenseNumber: '',
      licenseCategory: 'other',
      licenseExpiry: '',
      contact: '',
      safetyScore: 0,
      status: 'Available',
    },
    mode: 'onChange',
  });

  // Load driver data if editing
  const {
    data: driverData,
  } = useQuery<{ success: boolean; data: Driver }, Error>({
    queryKey: id ? ['driver', id] : [],
    queryFn: () => driverService.getDriver(id!),
    enabled: !!id,
    retry: false,
  });

  // Initialize form with driver data when editing
  useEffect(() => {
    if (driverData?.data && isEditMode) {
      const driver = driverData.data;
      reset({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        licenseExpiry: driver.licenseExpiry,
        contact: driver.contact,
        safetyScore: driver.safetyScore,
        status: driver.status,
      });
    }
  }, [driverData, isEditMode, reset]);

  const onSubmit: SubmitHandler<DriverFormData> = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode && id) {
        await driverService.updateDriver(id, data);
        enqueueSnackbar('Driver updated successfully', { variant: 'success' });
      } else {
        await driverService.createDriver(data);
        enqueueSnackbar('Driver created successfully', { variant: 'success' });
      }

      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
      navigate('/drivers');
    } catch (err: any) {
      enqueueSnackbar(
        err.response?.data?.message || 'An error occurred while saving the driver',
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
            {isEditMode ? 'Edit Driver' : 'Add New Driver'}
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Driver Name"
                placeholder="e.g., John Doe"
                {...register('name', { 
                  required: 'Driver name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 120, message: 'Name must not exceed 120 characters' }
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
              />

              <TextField
                label="License Number"
                placeholder="e.g., DL123456"
                {...register('licenseNumber', { 
                  required: 'License number is required',
                  minLength: { value: 3, message: 'License number must be at least 3 characters' },
                  maxLength: { value: 60, message: 'License number must not exceed 60 characters' }
                })}
                error={!!errors.licenseNumber}
                helperText={errors.licenseNumber?.message}
                fullWidth
              />

              <FormControl fullWidth error={!!errors.licenseCategory}>
                <InputLabel id="category-label">License Category</InputLabel>
                <Controller
                  name="licenseCategory"
                  control={control}
                  rules={{ required: 'License category is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="category-label"
                      label="License Category"
                    >
                      <MenuItem value="A">A - Motorcycle (35kW+)</MenuItem>
                      <MenuItem value="A1">A1 - Light Motorcycle</MenuItem>
                      <MenuItem value="A2">A2 - Medium Motorcycle</MenuItem>
                      <MenuItem value="B">B - Car</MenuItem>
                      <MenuItem value="B1">B1 - Light Vehicle</MenuItem>
                      <MenuItem value="C">C - Heavy Truck</MenuItem>
                      <MenuItem value="C1">C1 - Medium Truck</MenuItem>
                      <MenuItem value="D">D - Bus</MenuItem>
                      <MenuItem value="D1">D1 - Minibus</MenuItem>
                      <MenuItem value="E">E - Trailer</MenuItem>
                      <MenuItem value="F">F - Agricultural</MenuItem>
                      <MenuItem value="G">G - Construction</MenuItem>
                      <MenuItem value="H">H - Special</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  )}
                />
                {errors.licenseCategory && <FormHelperText>{errors.licenseCategory.message}</FormHelperText>}
              </FormControl>

              <TextField
                label="License Expiry Date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('licenseExpiry', { 
                  required: 'License expiry date is required'
                })}
                error={!!errors.licenseExpiry}
                helperText={errors.licenseExpiry?.message}
                fullWidth
              />

              <TextField
                label="Contact Information"
                placeholder="Phone, email, or address"
                {...register('contact', { 
                  required: 'Contact information is required',
                  minLength: { value: 5, message: 'Contact must be at least 5 characters' },
                  maxLength: { value: 255, message: 'Contact must not exceed 255 characters' }
                })}
                error={!!errors.contact}
                helperText={errors.contact?.message}
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                label="Safety Score"
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                {...register('safetyScore', { 
                  required: 'Safety score is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Safety score must be at least 0' },
                  max: { value: 100, message: 'Safety score cannot exceed 100' }
                })}
                error={!!errors.safetyScore}
                helperText={errors.safetyScore?.message || 'Enter a value between 0 and 100'}
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
                      <MenuItem value="Suspended">Suspended</MenuItem>
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
                  {isLoading ? 'Saving...' : isEditMode ? 'Update Driver' : 'Add Driver'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/drivers')}
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

export default DriverForm;
