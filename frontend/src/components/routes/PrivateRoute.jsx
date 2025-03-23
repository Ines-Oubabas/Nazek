import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material'; // Optional: pour un beau loader

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Affiche un spinner de chargement centré
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    // Redirige vers la page de login si l'utilisateur n'est pas connecté
    return <Navigate to="/login" />;
  }

  // Affiche les enfants protégés
  return children;
};

export default PrivateRoute;
