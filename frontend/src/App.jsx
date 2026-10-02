import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import Navigation from "./components/common/Navigation";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Appointments from "./pages/Appointments";
import Search from "./pages/Search";
import Help from "./pages/Help";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import ServiceDetails from "./pages/ServiceDetails";
import ProviderDetail from "./pages/ProviderDetail";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import theme from "./theme/nazekTheme";

const FullPageLoader = () => (
  <Container
    maxWidth="sm"
    sx={{
      minHeight: "60vh",
      display: "grid",
      placeItems: "center",
      textAlign: "center",
    }}
  >
    <Box>
      <CircularProgress />
      <Typography sx={{ mt: 2, color: "text.secondary" }}>Chargement de votre session...</Typography>
    </Box>
  </Container>
);

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return children;
};

const RequireClient = ({ children }) => {
  const { loading, isClient } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!isClient) return <Navigate to="/appointments" replace state={{ from: location.pathname }} />;

  return children;
};

const NotFound = () => (
  <Container maxWidth="md" sx={{ py: 6 }}>
    <Box sx={{ fontSize: 18, fontWeight: 700, mb: 1 }}>Page introuvable</Box>
    <Box sx={{ color: "text.secondary" }}>La page que vous cherchez n’existe pas.</Box>
  </Container>
);

const AppRoutes = () => {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navigation />

      <Box component="main" sx={{ flex: 1, py: { xs: 2, md: 4 }, mt: "72px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/help" element={<Help />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/employers/:id" element={<ProviderDetail />} />

          <Route
            path="/search"
            element={
              <RequireAuth>
                <RequireClient>
                  <Search />
                </RequireClient>
              </RequireAuth>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          <Route
            path="/appointments"
            element={
              <RequireAuth>
                <Appointments />
              </RequireAuth>
            }
          />

          <Route
            path="/messages"
            element={
              <RequireAuth>
                <Messages />
              </RequireAuth>
            }
          />

          <Route
            path="/favorites"
            element={
              <RequireAuth>
                <RequireClient>
                  <Favorites />
                </RequireClient>
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;