import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, ArrowBack } from '@mui/icons-material';
import vehicleService, { Vehicle } from '../../services/vehicleService';
import { useAuth } from '../../contexts/AuthContext';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: vehicleData,
    isLoading,
    error,
  } = useQuery<{ success: boolean; data: Vehicle }, Error>({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicle(id!),
    enabled: !!id,
    retry: false,
  });

  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';

  if (isLoading) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography mt={2}>Loading vehicle details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !vehicleData?.data) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography color="error">
            {error?.message || 'Vehicle not found'}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/fleet')} sx={{ mt: 2 }}>
            Back to Fleet
          </Button>
        </Box>
      </Container>
    );
  }

  const vehicle = vehicleData.data;

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/fleet')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" flexGrow={1}>
          Vehicle Details
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/fleet/${id}/edit`)}
          >
            Edit
          </Button>
        )}
      </Stack>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Registration Number
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {vehicle.registrationNumber}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {vehicle.name}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Model
                </Typography>
                <Typography variant="body1">
                  {vehicle.model}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                    size="small"
                    color="default"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
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
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Specifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Specifications
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Maximum Capacity
                </Typography>
                <Typography variant="body1">
                  {vehicle.maxCapacity.toLocaleString()} kg
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Odometer Reading
                </Typography>
                <Typography variant="body1">
                  {vehicle.odometer.toLocaleString()} km
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Acquisition Cost
                </Typography>
                <Typography variant="body1">
                  ${vehicle.acquisitionCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>

              {vehicle.operationalCost && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Operational Costs
                  </Typography>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fuel Cost
                    </Typography>
                    <Typography variant="body2">
                      ${vehicle.operationalCost.fuelCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Maintenance Cost
                    </Typography>
                    <Typography variant="body2">
                      ${vehicle.operationalCost.maintenanceCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Operational Cost
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ${vehicle.operationalCost.operationalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Timestamps */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Record Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {new Date(vehicle.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(vehicle.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default VehicleDetail;
