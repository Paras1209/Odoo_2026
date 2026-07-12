import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{ py: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}
    >
      <Typography variant="body2" color="text.secondary">
        TRANSITOPS &copy; {new Date().getFullYear()} &middot; RBAC ENABLED
      </Typography>
    </Box>
  );
}
