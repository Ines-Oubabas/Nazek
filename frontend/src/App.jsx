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

const brand = {
  orange: "#f38b2a",
  orangeSoft: "#ffae57",
  charcoal: "#111318",
  charcoalSoft: "#171b22",
  slate: "#232935",
  border: "#2e3544",
  text: "#f2f4f8",
  muted: "#a9b1bf",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: brand.orange,
      dark: "#db7820",
      light: brand.orangeSoft,
      contrastText: "#121418",
    },
    secondary: { main: brand.slate },
    background: {
      default: brand.charcoal,
      paper: brand.charcoalSoft,
    },
    text: {
      primary: brand.text,
      secondary: brand.muted,
    },
    divider: brand.border,
    success: { main: "#46bc74" },
    info: { main: "#56a9ff" },
    warning: { main: "#ffbf69" },
    error: { main: "#ff6f78" },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontWeight: 780, letterSpacing: "-0.02em" },
    h4: { fontWeight: 760, letterSpacing: "-0.02em" },
    h5: { fontWeight: 720 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.charcoal,
          backgroundImage:
            "radial-gradient(circle at 8% -10%, rgba(243,139,42,0.2), transparent 32%), radial-gradient(circle at 90% 15%, rgba(86,169,255,0.09), transparent 26%), linear-gradient(180deg, #12161d 0%, #111318 100%)",
        },
        a: {
          color: "inherit",
          textDecoration: "none",
        },
        "*::-webkit-scrollbar": { width: "10px", height: "10px" },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: brand.border,
          borderRadius: "999px",
        },
        "*::-webkit-scrollbar-track": { backgroundColor: brand.charcoal },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${brand.border}`,
          boxShadow: "0 12px 34px rgba(0,0,0,.3)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${brand.border}`,
          boxShadow: "0 12px 30px rgba(0,0,0,.26)",
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
          background: `linear-gradient(135deg, ${brand.orange} 0%, ${brand.orangeSoft} 100%)`,
          color: "#111318",
          boxShadow: "0 10px 28px rgba(243,139,42,.35)",
          "&:hover": {
            background: "linear-gradient(135deg, #f79d49 0%, #ffbf79 100%)",
            boxShadow: "0 12px 30px rgba(243,139,42,.42)",
          },
        },
        outlined: {
          borderColor: brand.border,
          "&:hover": {
            borderColor: brand.orange,
            backgroundColor: alpha(brand.orange, 0.08),
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
          backgroundColor: "#181c25",
          borderRadius: 12,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: brand.orange },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: brand.orange,
            borderWidth: 1.5,
          },
        },
        input: {
          color: brand.text,
          "&::placeholder": { color: brand.muted, opacity: 1 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${brand.border}`,
        },
        head: {
          color: brand.text,
          fontWeight: 700,
          backgroundColor: alpha(brand.slate, 0.72),
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
          border: `1px solid ${brand.border}`,
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