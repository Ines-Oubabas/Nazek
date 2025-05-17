import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import ServiceCard from '@/components/common/ServiceCard';
import { useAuth } from '@/contexts/AuthContext';

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🛠️ Simulation temporaire (remplacer par une vraie requête API plus tard)
        const dummy = [
          {
            id: 1,
            name: 'Nettoyage à domicile',
            description: 'Un nettoyage complet de votre logement',
            image: '/images/cleaning.jpg',
            price: 2000,
            rating: 4.7,
          },
        ];
        setFavorites(dummy);
      } catch (err) {
        setError("Erreur lors du chargement des favoris.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
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
          Vous n’avez pas encore enregistré de services en favoris.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <ServiceCard
                service={service}
                isFavorite={true}
                onFavoriteClick={() => {
                  setFavorites((prev) => prev.filter((s) => s.id !== service.id));
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
