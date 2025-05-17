// frontend/src/components/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

import Carousel from '@/components/common/Carousel';
import ServiceCard from '@/components/common/ServiceCard';
import Testimonials from '@/components/common/Testimonials';
import { serviceAPI } from '@/services/api';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const carouselItems = [
    {
      image: '/images/hero1.jpg',
      title: 'Des services sur mesure',
      description: 'Réservez des prestations à domicile selon vos besoins.',
      buttonText: 'Découvrir les services',
      buttonLink: '/search',
    },
    {
      image: '/images/hero2.jpg',
      title: 'Professionnels vérifiés',
      description: 'Tous nos prestataires sont sélectionnés avec soin.',
      buttonText: 'Voir les profils',
      buttonLink: '/providers',
    },
    {
      image: '/images/hero3.jpg',
      title: 'Gagnez du temps',
      description: 'Prenez rendez-vous en quelques clics depuis votre mobile.',
      buttonText: 'Créer un compte',
      buttonLink: '/register',
    },
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await serviceAPI.list();
      setServices(data);
    } catch (err) {
      setError('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search', { state: { query: searchQuery, location } });
  };

  const handleFavoriteClick = (serviceId) => {
    setFavorites((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  if (loading) {
    return (
      <Box className="flex justify-center mt-10">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* Carousel */}
      <Container maxWidth="lg" sx={{ my: 6 }}>
        <Carousel items={carouselItems} />
      </Container>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Bienvenue sur Nazek ✨
              </Typography>
              <Typography variant="h5" sx={{ mb: 4 }}>
                Trouvez le service parfait pour vos besoins
              </Typography>

              <form onSubmit={handleSearch}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      placeholder="Quel service ?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      placeholder="Où ?"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="secondary"
                      sx={{ height: '100%' }}
                    >
                      Rechercher
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Services Populaires */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
          Services Populaires
        </Typography>
        <Grid container spacing={4}>
          {services.slice(0, 6).map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <ServiceCard
                service={service}
                isFavorite={favorites.includes(service.id)}
                onFavoriteClick={() => handleFavoriteClick(service.id)}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pourquoi nous choisir */}
      <Box sx={{ backgroundColor: '#f5f5f5', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ mb: 6 }}>
            Pourquoi nous choisir ?
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <PeopleIcon fontSize="large" sx={{ mb: 2 }} />
                <Typography variant="h6">Prestataires Qualifiés</Typography>
                <Typography>Prestataires sélectionnés et vérifiés.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <ScheduleIcon fontSize="large" sx={{ mb: 2 }} />
                <Typography variant="h6">Disponibilité 24/7</Typography>
                <Typography>Services disponibles tout le temps.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <SecurityIcon fontSize="large" sx={{ mb: 2 }} />
                <Typography variant="h6">Paiement Sécurisé</Typography>
                <Typography>Transactions 100% sécurisées.</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Témoignages */}
      <Box sx={{ backgroundColor: '#fff', py: 8 }}>
        <Container maxWidth="lg">
          <Testimonials />
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
