import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  CircularProgress,
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
  WorkOutline as WorkOutlineIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext";
import {
  getAuthSessionVersion,
  isStaleSessionError,
  notificationAPI,
} from "../../services/api";

const normalizeNotifications = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user, logout, loading, isClient, isEmployer } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorUserMenu, setAnchorUserMenu] = useState(null);
  const [anchorNotifMenu, setAnchorNotifMenu] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const mountedRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const notificationRequestVersionRef = useRef(0);
  const logoutActionVersionRef = useRef(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const userDisplayName = useMemo(() => {
    if (!user) return "";

    const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return full || user.username || user.email || "Utilisateur";
  }, [user]);

  const userRoleLabel = useMemo(() => {
    if (isEmployer) return "Prestataire";
    if (isClient) return "Client";
    return "Visiteur";
  }, [isEmployer, isClient]);

  const userAvatarSrc = useMemo(() => {
    if (!user?.profile_picture) return "";

    const src = String(user.profile_picture);

    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }

    if (src.startsWith("/")) {
      return `${API_URL}${src}`;
    }

    return `${API_URL}/${src}`;
  }, [user, API_URL]);

  const menuItems = useMemo(() => {
    if (!user) {
      return [
        {
          text: "Accueil",
          icon: <HomeIcon />,
          path: "/",
          auth: false,
        },
        {
          text: "Rechercher",
          icon: <SearchIcon />,
          path: "/search",
          auth: true,
        },
        {
          text: "Connexion",
          icon: <PersonIcon />,
          path: "/login",
          auth: false,
        },
        {
          text: "Inscription",
          icon: <WorkOutlineIcon />,
          path: "/register",
          auth: false,
        },
      ];
    }

    if (isClient) {
      return [
        {
          text: "Accueil",
          icon: <HomeIcon />,
          path: "/",
          auth: false,
        },
        {
          text: "Rechercher",
          icon: <SearchIcon />,
          path: "/search",
          auth: true,
        },
        {
          text: "Rendez-vous",
          icon: <CalendarIcon />,
          path: "/appointments",
          auth: true,
        },
        {
          text: "Favoris",
          icon: <FavoriteIcon />,
          path: "/favorites",
          auth: true,
        },
        {
          text: "Messages",
          icon: <ChatIcon />,
          path: "/messages",
          auth: true,
        },
        {
          text: "Aide",
          icon: <HelpIcon />,
          path: "/help",
          auth: false,
        },
      ];
    }

    if (isEmployer) {
      return [
        {
          text: "Accueil",
          icon: <HomeIcon />,
          path: "/",
          auth: false,
        },
        {
          text: "Rendez-vous reçus",
          icon: <CalendarIcon />,
          path: "/appointments",
          auth: true,
        },
        {
          text: "Messages",
          icon: <ChatIcon />,
          path: "/messages",
          auth: true,
        },
        {
          text: "Profil",
          icon: <AccountCircleIcon />,
          path: "/profile",
          auth: true,
        },
        {
          text: "Aide",
          icon: <HelpIcon />,
          path: "/help",
          auth: false,
        },
      ];
    }

    return [
      {
        text: "Accueil",
        icon: <HomeIcon />,
        path: "/",
        auth: false,
      },
      {
        text: "Aide",
        icon: <HelpIcon />,
        path: "/help",
        auth: false,
      },
    ];
  }, [user, isClient, isEmployer]);

  const closeUserMenu = useCallback(() => {
    setAnchorUserMenu(null);
  }, []);

  const closeNotifMenu = useCallback(() => {
    setAnchorNotifMenu(null);
  }, []);

  const closeAllMenus = useCallback(() => {
    setAnchorUserMenu(null);
    setAnchorNotifMenu(null);
    setMobileOpen(false);
  }, []);

  const invalidateNotificationRequests = useCallback(() => {
    notificationRequestVersionRef.current += 1;
    return notificationRequestVersionRef.current;
  }, []);

  const isNotificationRequestCurrent = useCallback(
    ({ requestVersion, userId, sessionVersion }) =>
      mountedRef.current &&
      notificationRequestVersionRef.current === requestVersion &&
      currentUserIdRef.current === userId &&
      getAuthSessionVersion() === sessionVersion,
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      currentUserIdRef.current = null;
      invalidateNotificationRequests();
      logoutActionVersionRef.current += 1;
    };
  }, [invalidateNotificationRequests]);

  useEffect(() => {
    const userId = user?.id ?? null;
    const requestVersion = invalidateNotificationRequests();

    currentUserIdRef.current = userId;

    setNotifications([]);
    setNotifLoading(false);
    closeAllMenus();

    if (!userId) {
      return undefined;
    }

    const sessionVersion = getAuthSessionVersion();

    const fetchNotifications = async () => {
      if (!mountedRef.current) return;

      setNotifLoading(true);

      try {
        const data = await notificationAPI.list();

        if (
          !isNotificationRequestCurrent({
            requestVersion,
            userId,
            sessionVersion,
          })
        ) {
          return;
        }

        setNotifications(normalizeNotifications(data));
      } catch (err) {
        if (
          isStaleSessionError(err) ||
          !isNotificationRequestCurrent({
            requestVersion,
            userId,
            sessionVersion,
          })
        ) {
          return;
        }

        setNotifications([]);
      } finally {
        if (
          isNotificationRequestCurrent({
            requestVersion,
            userId,
            sessionVersion,
          })
        ) {
          setNotifLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      if (
        notificationRequestVersionRef.current === requestVersion
      ) {
        invalidateNotificationRequests();
      }
    };
  }, [
    user?.id,
    closeAllMenus,
    invalidateNotificationRequests,
    isNotificationRequestCurrent,
  ]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification && notification.is_read === false
      ).length,
    [notifications]
  );

  const handleDrawerToggle = () => {
    setMobileOpen((value) => !value);
  };

  const goTo = (path, requiresAuth = false) => {
    if (requiresAuth && !user) {
      navigate("/login", {
        state: {
          from: path,
        },
      });
      return;
    }

    navigate(path);
  };

  const openUserMenu = (event) => {
    setAnchorUserMenu(event.currentTarget);
  };

  const openNotifMenu = (event) => {
    setAnchorNotifMenu(event.currentTarget);
  };

  const handleLogout = async () => {
    const actionVersion = logoutActionVersionRef.current + 1;
    logoutActionVersionRef.current = actionVersion;

    closeAllMenus();
    setNotifications([]);
    setNotifLoading(false);
    invalidateNotificationRequests();

    const logoutPromise = logout();
    const logoutSessionVersion = getAuthSessionVersion();

    try {
      await logoutPromise;
    } catch (err) {
      if (!isStaleSessionError(err)) {
        // AuthContext conserve la déconnexion locale même si le serveur échoue.
      }
    }

    const logoutIsStillCurrent =
      mountedRef.current &&
      logoutActionVersionRef.current === actionVersion &&
      currentUserIdRef.current === null &&
      getAuthSessionVersion() === logoutSessionVersion;

    if (logoutIsStillCurrent) {
      navigate("/login");
    }
  };

  const handleMarkRead = async (id) => {
    const userId = currentUserIdRef.current;

    if (!userId) return;

    const requestVersion = notificationRequestVersionRef.current;
    const sessionVersion = getAuthSessionVersion();

    try {
      await notificationAPI.markRead(id);

      if (
        !isNotificationRequestCurrent({
          requestVersion,
          userId,
          sessionVersion,
        })
      ) {
        return;
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (err) {
      if (isStaleSessionError(err)) {
        return;
      }

      // L’échec de lecture ne doit pas bloquer la navigation.
    }
  };

  const navButtonSx = (active) => ({
    color: active ? "primary.light" : "text.primary",
    borderRadius: 2.5,
    px: 1.2,
    py: 0.8,
    minWidth: "auto",
    fontWeight: 650,
    whiteSpace: "nowrap",
    backgroundColor: active
      ? alpha(theme.palette.primary.main, 0.14)
      : "transparent",
    border: active
      ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
      : "1px solid transparent",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      borderColor: active
        ? alpha(theme.palette.primary.main, 0.42)
        : alpha(theme.palette.primary.main, 0.2),
    },
  });

  const drawer = (
    <Box
      sx={{
        width: 310,
        height: "100%",
        bgcolor: "background.paper",
        p: 1.5,
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: "text.primary",
              letterSpacing: "-0.02em",
            }}
          >
            Nazek
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Plateforme premium de réservation
          </Typography>
        </Box>

        <Chip label={userRoleLabel} size="small" color="primary" />
      </Box>

      <Divider sx={{ borderColor: "divider", mb: 1.5 }} />

      <List sx={{ px: 0.5 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => {
              goTo(item.path, item.auth);

              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            sx={{
              borderRadius: 2,
              mb: 0.7,
              border: "1px solid transparent",
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                border: `1px solid ${alpha(
                  theme.palette.primary.main,
                  0.4
                )}`,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 38,
                color:
                  location.pathname === item.path
                    ? "primary.light"
                    : "text.secondary",
              }}
            >
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

                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                borderRadius: 2,
                mb: 0.6,
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>
                <Avatar
                  src={userAvatarSrc}
                  sx={{
                    width: 27,
                    height: 27,
                  }}
                >
                  {userDisplayName?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </ListItemIcon>

              <ListItemText
                primary={userDisplayName}
                secondary={user.email || ""}
              />
            </ListItemButton>

            <ListItemButton
              onClick={handleLogout}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: "text.secondary",
                }}
              >
                <LogoutIcon />
              </ListItemIcon>

              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </>
        ) : null}
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
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.95),
          boxShadow: "0 10px 26px rgba(0,0,0,.3)",
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: 72 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              aria-label="menu"
              sx={{ color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                cursor: "pointer",
                letterSpacing: "-0.03em",
                color: "text.primary",
                whiteSpace: "nowrap",
                mr: 0.4,
              }}
              onClick={() => goTo("/")}
            >
              Nazek
            </Typography>

            {!isMobile && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.45,
                  minWidth: 0,
                  overflowX: "auto",
                  py: 0.2,
                  pr: 0.4,
                }}
              >
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    startIcon={item.icon}
                    onClick={() => goTo(item.path, item.auth)}
                    sx={navButtonSx(location.pathname === item.path)}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}
          </Box>

          {loading ? (
            <CircularProgress size={22} />
          ) : user ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
              }}
            >
              <Tooltip title="Notifications">
                <IconButton
                  onClick={openNotifMenu}
                  sx={{ color: "text.primary" }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={userDisplayName}>
                <IconButton
                  onClick={openUserMenu}
                  sx={{ p: 0.2 }}
                >
                  <Avatar
                    src={userAvatarSrc}
                    sx={{
                      width: 34,
                      height: 34,
                    }}
                  >
                    {userDisplayName?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="text"
                onClick={() =>
                  navigate("/login", {
                    state: {
                      from: location.pathname,
                    },
                  })
                }
              >
                Connexion
              </Button>

              <Button
                variant="contained"
                onClick={() => navigate("/register")}
              >
                Inscription
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>

      <Menu
        anchorEl={anchorUserMenu}
        open={Boolean(anchorUserMenu)}
        onClose={closeUserMenu}
      >
        <MenuItem
          onClick={() => {
            navigate("/profile");
            closeUserMenu();
          }}
        >
          Profil
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate("/appointments");
            closeUserMenu();
          }}
        >
          Rendez-vous
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          Déconnexion
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={anchorNotifMenu}
        open={Boolean(anchorNotifMenu)}
        onClose={closeNotifMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 430,
          },
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1,
            fontWeight: 700,
          }}
        >
          Notifications
        </Box>

        <Divider />

        {notifLoading ? (
          <Box
            sx={{
              px: 2,
              py: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={20} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box
            sx={{
              px: 2,
              py: 2,
              color: "text.secondary",
            }}
          >
            Aucune notification.
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) {
                  handleMarkRead(notification.id);
                }
              }}
              sx={{
                alignItems: "flex-start",
                whiteSpace: "normal",
                opacity: notification.is_read ? 0.78 : 1,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: notification.is_read ? 500 : 700,
                  }}
                >
                  {notification.title || "Notification"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {notification.message || ""}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default Navigation;586