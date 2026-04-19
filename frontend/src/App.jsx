// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

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

import { AuthProvider, useAuth } from "./contexts/AuthContext";

const theme = createTheme({
  palette: {
    primary: { main: "#2196f3" },
    secondary: { main: "#f50057" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
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

      {/* Contenu principal */}
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/help" element={<Help />} />
          <Route path="/services/:id" element={<ServiceDetails />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
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
                <Favorites />
              </RequireAuth>
            }
          />

          {/* 404 */}
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
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;