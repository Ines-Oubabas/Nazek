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
  Typography,
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
  Help as HelpIcon,
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
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

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
    { text: 'Aide', icon: <HelpIcon />, path: '/help' },
  ];

  const drawer = (
    <Box sx={{ p: 2 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            component="button"
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) handleDrawerToggle();
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
            <ListItem
              component="button"
              onClick={() => {
                navigate('/profile');
                if (isMobile) handleDrawerToggle();
              }}
            >
              <ListItemIcon>
                <Avatar src={user.profile_picture} sx={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary={user.name} />
            </ListItem>
            <ListItem component="button" onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem
              component="button"
              onClick={() => {
                navigate('/login');
                if (isMobile) handleDrawerToggle();
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Connexion" />
            </ListItem>
            <ListItem
              component="button"
              onClick={() => {
                navigate('/register');
                if (isMobile) handleDrawerToggle();
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
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
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ height: 40, marginRight: 16 }}
            />
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    startIcon={item.icon}
                    onClick={() => navigate(item.path)}
                    color={location.pathname === item.path ? 'primary' : 'inherit'}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleNotificationsOpen}>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              {user ? (
                <>
                  <IconButton onClick={handleMenuOpen}>
                    <Avatar src={user.profile_picture} />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                      <PersonIcon sx={{ mr: 1 }} /> Profil
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
                      <SettingsIcon sx={{ mr: 1 }} /> Paramètres
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} /> Déconnexion
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    startIcon={<PersonIcon />}
                    onClick={() => navigate('/login')}
                  >
                    Connexion
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PersonIcon />}
                    onClick={() => navigate('/register')}
                  >
                    Inscription
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
      >
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2">Nouveau message</Typography>
            <Typography variant="body2" color="text.secondary">
              Vous avez reçu un nouveau message
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2">Rendez-vous confirmé</Typography>
            <Typography variant="body2" color="text.secondary">
              Votre rendez-vous a été confirmé
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navigation; 