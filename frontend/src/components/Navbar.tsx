import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  DirectionsBus as BusIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setAnchorEl(null);
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'secondary.dark' }} elevation={0}>
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1 }}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        <BusIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'white', fontWeight: 700 }}
        >
          TransitOps
        </Typography>

        {/* Desktop */}
        {!isMobile && isAuthenticated && (
          <>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              color="inherit"
              aria-label="User menu"
            >
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15 }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 180, mt: 1 } } }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        )}

        {!isMobile && !isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 260, pt: 2 }}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="h6" color="primary" fontWeight={700}>
                TransitOps
              </Typography>
            </Box>
            <Divider />
            <List>
              {isAuthenticated ? (
                <>
                  <ListItemButton disabled>
                    <ListItemText primary={user?.name} secondary={user?.role?.replace(/_/g, ' ')} />
                  </ListItemButton>
                  <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/profile'); }}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </>
              ) : (
                <>
                  <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/login'); }}>
                    <ListItemText primary="Sign In" />
                  </ListItemButton>
                  <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/register'); }}>
                    <ListItemText primary="Sign Up" />
                  </ListItemButton>
                </>
              )}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}
