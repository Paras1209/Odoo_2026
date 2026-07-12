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
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  DirectionsBus as BusIcon,
  Dashboard as DashboardIcon,
  LocalShipping as TripIcon,
  DirectionsCar as FleetIcon,
  People as DriverIcon,
  Build as MaintenanceIcon,
  Security as ComplianceIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as ExpenseIcon,
  BarChart as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks/useRoleAccess';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { hasAccess } = useRoleAccess();
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/', access: 'dashboard' },
    { label: 'Trips', icon: <TripIcon />, path: '/trips', access: 'trips' },
    { label: 'Fleet', icon: <FleetIcon />, path: '/fleet', access: 'fleet' },
    { label: 'Drivers', icon: <DriverIcon />, path: '/drivers', access: 'drivers' },
    { label: 'Maintenance', icon: <MaintenanceIcon />, path: '/maintenance', access: 'maintenance' },
    { label: 'Compliance', icon: <ComplianceIcon />, path: '/compliance', access: 'compliance' },
    { label: 'Fuel', icon: <FuelIcon />, path: '/fuel', access: 'fuel' },
    { label: 'Expenses', icon: <ExpenseIcon />, path: '/expenses', access: 'expenses' },
    { label: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', access: 'analytics' },
  ] as const;

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
            <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
              {navigationItems
                .filter(item => hasAccess(item.access as any))
                .map(item => (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => navigate(item.path)}
                    startIcon={item.icon}
                    sx={{ textTransform: 'none' }}
                  >
                    {item.label}
                  </Button>
                ))}
            </Box>
            
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
              slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" fontWeight={600}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={getRoleLabel(user?.role)} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={user?.status || 'Unknown'} 
                    size="small" 
                    color={getStatusColor(user?.status)}
                  />
                </Box>
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
          <Box sx={{ width: 280, pt: 2 }}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="h6" color="primary" fontWeight={700}>
                TransitOps
              </Typography>
            </Box>
            <Divider />
            <List>
              {isAuthenticated ? (
                <>
                  <ListItemButton disabled sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ListItemText 
                      primary={user?.name} 
                      secondary={user?.email}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={getRoleLabel(user?.role)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={user?.status || 'Unknown'} 
                        size="small" 
                        color={getStatusColor(user?.status)}
                      />
                    </Box>
                  </ListItemButton>
                  <Divider sx={{ my: 1 }} />
                  {navigationItems
                    .filter(item => hasAccess(item.access as any))
                    .map(item => (
                      <ListItemButton 
                        key={item.path}
                        onClick={() => { setDrawerOpen(false); navigate(item.path); }}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    ))}
                  <Divider sx={{ my: 1 }} />
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
