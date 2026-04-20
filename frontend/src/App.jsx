// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { ThemeProvider, createTheme, alpha } from "@mui/material/styles";
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
    mode: "dark",
    primary: { main: "#ff8a1c", dark: "#e97711", light: "#ff9f40", contrastText: "#0f1115" },
    secondary: { main: "#1f2430" },
    background: {
      default: "#0f1115",
      paper: "#171a21",
    },
    text: {
      primary: "#f3f4f6",
      secondary: "#a1a1aa",
    },
    divider: "#2a3140",
    success: { main: "#3fb950" },
    info: { main: "#58a6ff" },
    warning: { main: "#ffb347" },
    error: { main: "#ff6b6b" },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 760, letterSpacing: "-0.02em" },
    h5: { fontWeight: 720 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0f1115",
          backgroundImage:
            "radial-gradient(circle at 20% -10%, rgba(255,138,28,0.12), transparent 35%), radial-gradient(circle at 85% 20%, rgba(88,166,255,0.10), transparent 30%)",
        },
        "*::-webkit-scrollbar": { width: "10px", height: "10px" },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "#2a3140",
          borderRadius: "999px",
        },
        "*::-webkit-scrollbar-track": { backgroundColor: "#0f1115" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #2a3140",
          boxShadow: "0 10px 40px rgba(0,0,0,.25)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #2a3140",
          boxShadow: "0 10px 30px rgba(0,0,0,.24)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          paddingBlock: 9,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #ff8a1c 0%, #ff9f40 100%)",
          color: "#0f1115",
          boxShadow: "0 8px 26px rgba(255,138,28,.35)",
          "&:hover": {
            background: "linear-gradient(135deg, #ff9f40 0%, #ffb15f 100%)",
            boxShadow: "0 10px 28px rgba(255,159,64,.4)",
          },
        },
        outlined: {
          borderColor: "#2a3140",
          "&:hover": {
            borderColor: "#ff8a1c",
            backgroundColor: alpha("#ff8a1c", 0.08),
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#171a21",
          borderRadius: 12,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a3140" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#ff8a1c" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#ff8a1c", borderWidth: 1.5 },
        },
        input: {
          color: "#f3f4f6",
          "&::placeholder": { color: "#a1a1aa", opacity: 1 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #2a3140",
        },
        head: {
          color: "#f3f4f6",
          fontWeight: 700,
          backgroundColor: "#1f2430",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid #2a3140",
        },
      },
    },
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

      <Box component="main" sx={{ flex: 1, py: { xs: 2, md: 4 } }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/help" element={<Help />} />
          <Route path="/services/:id" element={<ServiceDetails />} />

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
                <Favorites />
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