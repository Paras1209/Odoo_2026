import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
  Toolbar,
  AppBar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocalShipping as TripIcon,
  DirectionsCar as FleetIcon,
  People as DriverIcon,
  Build as MaintenanceIcon,
  Security as ComplianceIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as ExpenseIcon,
  BarChart as AnalyticsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  DirectionsBus as BusIcon,
  Group as UsersIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks/useRoleAccess';

const DRAWER_WIDTH = 260;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { hasAccess, isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusColor = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
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

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo/Brand */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <BusIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h6" fontWeight={700} color="primary">
          TransitOps
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={getRoleLabel(user?.role)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            label={user?.status || 'Unknown'}
            size="small"
            color={getStatusColor(user?.status)}
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
        {navigationItems
          .filter(item => hasAccess(item.access as any))
          .map(item => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              selected={location.pathname === '/admin/users'}
              onClick={() => handleNavigation('/admin/users')}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItemButton>
          </>
        )}
      </List>

      {/* Bottom Actions */}
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItemButton onClick={() => handleNavigation('/profile')} sx={{ mx: 1, borderRadius: 1, my: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
        <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 1, mb: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'secondary.dark',
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <BusIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" noWrap component="div" fontWeight={700}>
              TransitOps
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
    </Box>
  );
}
