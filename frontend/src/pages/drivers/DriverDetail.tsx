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
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, ArrowBack, Warning } from '@mui/icons-material';
import driverService, { Driver } from '../../services/driverService';
import { useAuth } from '../../contexts/AuthContext';

const DriverDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: driverData,
    isLoading,
    error,
  } = useQuery<{ success: boolean; data: Driver }, Error>({
    queryKey: ['driver', id],
    queryFn: () => driverService.getDriver(id!),
    enabled: !!id,
    retry: false,
  });

  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';

  if (isLoading) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography mt={2}>Loading driver details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !driverData?.data) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography color="error">
            {error?.message || 'Driver not found'}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/drivers')} sx={{ mt: 2 }}>
            Back to Drivers
          </Button>
        </Box>
      </Container>
    );
  }

  const driver = driverData.data;
  const licenseExpired = new Date(driver.licenseExpiry) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(driver.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/drivers')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" flexGrow={1}>
          Driver Details
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/drivers/${id}/edit`)}
          >
            Edit
          </Button>
        )}
      </Stack>

      {licenseExpired && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>
          This driver's license has expired. They should not be assigned to any trips.
        </Alert>
      )}

      {!licenseExpired && daysUntilExpiry <= 30 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          This driver's license will expire in {daysUntilExpiry} days.
        </Alert>
      )}

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
                  Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {driver.name}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  License Number
                </Typography>
                <Typography variant="body1">
                  {driver.licenseNumber}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  License Category
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={driver.licenseCategory}
                    size="small"
                    color="default"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  License Expiry Date
                </Typography>
                <Typography 
                  variant="body1"
                  color={licenseExpired ? 'error' : daysUntilExpiry <= 30 ? 'warning.main' : 'inherit'}
                  fontWeight={licenseExpired ? 600 : 400}
                >
                  {new Date(driver.licenseExpiry).toLocaleDateString()}
                  {licenseExpired && ' (EXPIRED)'}
                  {!licenseExpired && daysUntilExpiry <= 30 && ` (Expires in ${daysUntilExpiry} days)`}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Contact Information
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {driver.contact}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={driver.status}
                    size="small"
                    color={
                      driver.status === 'Available'
                        ? 'success'
                        : driver.status === 'On Trip'
                        ? 'primary'
                        : 'default'
                    }
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance & Safety */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance & Safety
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Safety Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={`${driver.safetyScore}/100`}
                    size="medium"
                    color={
                      driver.safetyScore >= 80
                        ? 'success'
                        : driver.safetyScore >= 60
                        ? 'warning'
                        : 'error'
                    }
                  />
                  <Typography variant="body2" color="text.secondary">
                    {driver.safetyScore >= 80
                      ? 'Excellent'
                      : driver.safetyScore >= 60
                      ? 'Good'
                      : 'Needs Improvement'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Performance Rating
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 12, 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${driver.safetyScore}%`, 
                      height: '100%', 
                      bgcolor: driver.safetyScore >= 80
                        ? 'success.main'
                        : driver.safetyScore >= 60
                        ? 'warning.main'
                        : 'error.main',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Eligibility Status
                </Typography>
                {licenseExpired ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Not eligible for trip assignment - License expired
                  </Alert>
                ) : driver.status === 'Suspended' ? (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Not eligible for trip assignment - Driver suspended
                  </Alert>
                ) : driver.status === 'On Trip' ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Currently on a trip
                  </Alert>
                ) : (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Eligible for trip assignment
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Record Information */}
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
                    {new Date(driver.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(driver.updatedAt).toLocaleString()}
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

export default DriverDetail;
