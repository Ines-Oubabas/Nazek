// frontend/src/components/common/Navigation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  ListItemButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Favorite as FavoriteIcon,
  Chat as ChatIcon,
  Help as HelpIcon,
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext";
import { notificationAPI } from "../../services/api";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorUserMenu, setAnchorUserMenu] = useState(null);
  const [anchorNotifMenu, setAnchorNotifMenu] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const userDisplayName = useMemo(() => {
    if (!user) return "";
    const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return full || user.username || user.email || "Utilisateur";
  }, [user]);

  const userAvatarSrc = useMemo(() => {
    if (!user?.profile_picture) return "";
    const src = String(user.profile_picture);
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("/")) return `${API_URL}${src}`;
    return `${API_URL}/${src}`;
  }, [user, API_URL]);

  const menuItems = useMemo(
    () => [
      { text: "Accueil", icon: <HomeIcon />, path: "/", auth: false },
      { text: "Rechercher", icon: <SearchIcon />, path: "/search", auth: false },
      { text: "Rendez-vous", icon: <CalendarIcon />, path: "/appointments", auth: true },
      { text: "Favoris", icon: <FavoriteIcon />, path: "/favorites", auth: true },
      { text: "Messages", icon: <ChatIcon />, path: "/messages", auth: true },
      { text: "Aide", icon: <HelpIcon />, path: "/help", auth: false },
    ],
    []
  );

  const handleDrawerToggle = () => setMobileOpen((v) => !v);

  const goTo = (path, requiresAuth = false) => {
    if (requiresAuth && !user) {
      navigate("/login", { state: { from: path } });
      return;
    }
    navigate(path);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setNotifLoading(true);
      const data = await notificationAPI.list();
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n && n.is_read === false).length,
    [notifications]
  );

  const openUserMenu = (e) => setAnchorUserMenu(e.currentTarget);
  const closeUserMenu = () => setAnchorUserMenu(null);

  const openNotifMenu = (e) => setAnchorNotifMenu(e.currentTarget);
  const closeNotifMenu = () => setAnchorNotifMenu(null);

  const handleLogout = async () => {
    await logout();
    closeUserMenu();
    navigate("/login");
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // noop
    }
  };

  const navButtonSx = (active) => ({
    color: active ? "primary.main" : "text.primary",
    borderRadius: 2.5,
    px: 1.2,
    py: 0.8,
    minWidth: "auto",
    fontWeight: 600,
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.14) : "transparent",
    border: active ? `1px solid ${alpha(theme.palette.primary.main, 0.35)}` : "1px solid transparent",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  });

  const drawer = (
    <Box sx={{ width: 290, height: "100%", bgcolor: "background.paper", p: 1.5 }}>
      <Box sx={{ px: 1, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: "text.primary" }}>
            Nazek
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Premium services platform
          </Typography>
        </Box>
        <Chip label="SaaS" size="small" color="primary" />
      </Box>

      <Divider sx={{ borderColor: "divider", mb: 1.5 }} />

      <List sx={{ px: 0.5 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => {
              goTo(item.path, item.auth);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.6,
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: location.pathname === item.path ? "primary.main" : "text.secondary" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.4, borderColor: "divider" }} />

        {user ? (
          <>
            <ListItemButton
              onClick={() => {
                goTo("/profile", true);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 2, mb: 0.6 }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>
                <Avatar src={userAvatarSrc} sx={{ width: 26, height: 26 }}>
                  {userDisplayName?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </ListItemIcon>
              <ListItemText primary={userDisplayName} secondary={user.email || ""} />
            </ListItemButton>

            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 38, color: "text.secondary" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </>
        ) : (
          <>
            <ListItemButton
              onClick={() => {
                navigate("/login", { state: { from: location.pathname } });
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 2, mb: 0.6 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "text.secondary" }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Connexion" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                navigate("/register");
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "text.secondary" }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Inscription" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.82),
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "0 10px 20px rgba(0,0,0,.22)",
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: 72 }}>
          {isMobile && (
            <IconButton edge="start" onClick={handleDrawerToggle} aria-label="menu" sx={{ color: "text.primary" }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, cursor: "pointer", letterSpacing: "-0.02em" }}
              onClick={() => goTo("/")}
            >
              Nazek
            </Typography>

            {!isMobile && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {menuItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Button
                      key={item.text}
                      startIcon={item.icon}
                      onClick={() => goTo(item.path, item.auth)}
                      sx={navButtonSx(active)}
                    >
                      {item.text}
                    </Button>
                  );
                })}
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            {user && (
              <>
                <Tooltip title="Notifications">
                  <IconButton onClick={openNotifMenu} aria-label="notifications">
                    <Badge
                      badgeContent={notifLoading ? 0 : unreadCount}
                      color="error"
                      invisible={!unreadCount && !notifLoading}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorNotifMenu}
                  open={Boolean(anchorNotifMenu)}
                  onClose={closeNotifMenu}
                  PaperProps={{
                    sx: {
                      width: 370,
                      maxWidth: "92vw",
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      mt: 1.2,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {unreadCount ? `${unreadCount} non lue(s)` : "Aucune notification non lue"}
                    </Typography>
                  </Box>
                  <Divider />

                  {(notifications.slice(0, 6) || []).map((n) => (
                    <MenuItem
                      key={n.id}
                      onClick={() => n?.id && handleMarkRead(n.id)}
                      sx={{
                        whiteSpace: "normal",
                        alignItems: "flex-start",
                        opacity: n?.is_read ? 0.68 : 1,
                        py: 1.2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {n.title || "Notification"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {n.message || ""}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}

                  {notifications.length === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rien à afficher.
                      </Typography>
                    </Box>
                  )}

                  <Divider />
                  <MenuItem
                    onClick={() => {
                      closeNotifMenu();
                      fetchNotifications();
                    }}
                  >
                    Rafraîchir
                  </MenuItem>
                </Menu>
              </>
            )}

            {user ? (
              <>
                <Tooltip title={userDisplayName}>
                  <IconButton onClick={openUserMenu} aria-label="user-menu">
                    <Avatar src={userAvatarSrc} sx={{ bgcolor: "secondary.main", color: "text.primary" }}>
                      {userDisplayName?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorUserMenu}
                  open={Boolean(anchorUserMenu)}
                  onClose={closeUserMenu}
                  PaperProps={{
                    sx: {
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      mt: 1.2,
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      closeUserMenu();
                      goTo("/profile", true);
                    }}
                  >
                    <PersonIcon sx={{ mr: 1 }} /> Mon profil
                  </MenuItem>

                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} /> Déconnexion
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button onClick={() => navigate("/login", { state: { from: location.pathname } })}>
                  Connexion
                </Button>
                <Button variant="contained" onClick={() => navigate("/register")}>
                  Inscription
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar sx={{ minHeight: "72px !important" }} />

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 290 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navigation;