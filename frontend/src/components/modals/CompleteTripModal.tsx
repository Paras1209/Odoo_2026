import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

interface CompleteTripModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (actualDistance: number, fuelConsumed: number) => void;
}

const CompleteTripModal: React.FC<CompleteTripModalProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  const [actualDistance, setActualDistance] = React.useState('');
  const [fuelConsumed, setFuelConsumed] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = () => {
    const distance = parseFloat(actualDistance);
    const fuel = parseFloat(fuelConsumed);

    if (isNaN(distance) || distance < 0) {
      setError('Please enter a valid distance (0 or greater)');
      return;
    }

    if (isNaN(fuel) || fuel < 0) {
      setError('Please enter a valid fuel amount (0 or greater)');
      return;
    }

    setError(null);
    onConfirm(distance, fuel);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Trip</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        <TextField
          label="Actual Distance (km)"
          type="number"
          inputProps={{ min: 0, step: 0.1 }}
          value={actualDistance}
          onChange={(e) => setActualDistance(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Fuel Consumed (L)"
          type="number"
          inputProps={{ min: 0, step: 0.1 }}
          value={fuelConsumed}
          onChange={(e) => setFuelConsumed(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <Typography variant="caption" color="text.secondary">
          Completing trip will record actual distance and fuel consumption
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={handleSubmit} disabled={!(actualDistance && fuelConsumed)}>
          Complete Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteTripModal;