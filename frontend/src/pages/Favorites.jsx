import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import ServiceCard from '../components/common/ServiceCard';
import { useAuth } from '../contexts/AuthContext';

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Implémenter la récupération des favoris
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mes Services Favoris
      </Typography>
      {favorites.length === 0 ? (
        <Alert severity="info">
          Vous n'avez pas encore de services favoris
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <ServiceCard
                service={service}
                isFavorite={true}
                onFavoriteClick={() => {
                  // TODO: Implémenter la suppression des favoris
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Favorites; 