import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface DispatchConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trip: {
    source: string;
    destination: string;
    vehicle: {
      registrationNumber: string;
      name: string;
      type: string;
    };
    driver: {
      name: string;
      licenseNumber: string;
    };
  };
}

const DispatchConfirmationModal: React.FC<DispatchConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  trip
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Trip Dispatch</DialogTitle>
      <DialogContent>
        <Typography variant="body1" mb={2}>
          Are you sure you want to dispatch this trip?
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2"><strong>Route:</strong> {trip.source} → {trip.destination}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2"><strong>Vehicle:</strong> {trip.vehicle.registrationNumber} - {trip.vehicle.name} ({trip.vehicle.type})</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2"><strong>Driver:</strong> {trip.driver.name} - {trip.driver.licenseNumber}</Typography>
        </Box>

        <Typography variant="body2" color="warning">
          Dispatching this trip will set vehicle and driver status to 'On Trip'
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={onConfirm}>
          Dispatch Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DispatchConfirmationModal;