import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Favorite as FavoriteIcon,
  Chat as ChatIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const toggleDrawer = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Accueil', icon: <HomeIcon />, path: '/' },
    { text: 'Rechercher', icon: <SearchIcon />, path: '/search' },
    { text: 'Rendez-vous', icon: <CalendarIcon />, path: '/appointments' },
    { text: 'Favoris', icon: <FavoriteIcon />, path: '/favorites' },
    { text: 'Messages', icon: <ChatIcon />, path: '/messages' },
    { text: 'Aide', icon: <HelpIcon />, path: '/help' }
  ];

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              toggleDrawer();
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider sx={{ my: 2 }} />
        {user ? (
          <>
            <ListItem button onClick={() => navigate('/profile')}>
              <ListItemIcon><Avatar src={user.profile_picture} /></ListItemIcon>
              <ListItemText primary={user.name} />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button onClick={() => navigate('/login')}>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Connexion" />
            </ListItem>
            <ListItem button onClick={() => navigate('/register')}>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Inscription" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={toggleDrawer} color="inherit">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/')}>Nazek</Typography>
          {!isMobile && menuItems.map((item) => (
            <Button
              key={item.text}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              color={location.pathname === item.path ? 'primary' : 'inherit'}
            >
              {item.text}
            </Button>
          ))}

          {!isMobile && (
            <>
              <IconButton onClick={handleMenuOpen}>
                <Badge badgeContent={2} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              {user ? (
                <>
                  <IconButton onClick={handleMenuOpen}>
                    <Avatar src={user.profile_picture} />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}><PersonIcon sx={{ mr: 1 }} /> Profil</MenuItem>
                    <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}><SettingsIcon sx={{ mr: 1 }} /> Paramètres</MenuItem>
                    <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1 }} /> Déconnexion</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button color="inherit" onClick={() => navigate('/login')}>Connexion</Button>
                  <Button variant="contained" color="primary" onClick={() => navigate('/register')}>Inscription</Button>
                </>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleDrawer}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: 250 } }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navigation;
