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

interface CancelTripModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

const CancelTripModal: React.FC<CancelTripModalProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = React.useState('');

  const handleSubmit = () => {
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancel Trip</DialogTitle>
      <DialogContent>
        <TextField
          label="Reason for Cancellation (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Typography variant="caption" color="text.secondary">
          Cancelling this trip will set vehicle and driver status back to 'Available'
          (unless vehicle is retired)
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleSubmit}>
          Cancel Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelTripModal;