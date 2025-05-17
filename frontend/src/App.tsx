import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import Navigation from './components/common/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import Search from './pages/Search';
import Help from './pages/Help';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import ServiceDetails from './pages/ServiceDetails';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme'; // Utilise ton fichier theme.ts
import './index.css'; // ✅ N'oublie pas d'importer ton index.css pour Tailwind !

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fonction pour basculer entre le mode sombre et clair
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Application du thème en fonction du mode
  const appliedTheme = {
    ...theme,
    palette: {
      ...theme.palette,
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? '#121212' : theme.palette.background?.default || '#f9fafb',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#111827',
        secondary: isDarkMode ? '#b0bec5' : '#6b7280',
      },
    },
  };

  return (
    <ThemeProvider theme={appliedTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true, // Active le comportement de transition de React Router v7
            v7_relativeSplatPath: true, // Active la résolution relative des routes avec splat
          }}
        >
          {/* Barre de navigation */}
          <Navigation />

          {/* Bouton pour basculer entre Dark/Light Mode */}
          <div className="fixed top-4 right-4 z-50">
            <IconButton onClick={toggleDarkMode} color="inherit">
              {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </div>

          {/* Contenu principal */}
          <main className="min-h-screen flex flex-col pt-20 px-4 lg:px-16 bg-white text-gray-800 font-sans">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/search" element={<Search />} />
              <Route path="/help" element={<Help />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/services/:id" element={<ServiceDetails />} />
            </Routes>
          </main>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;