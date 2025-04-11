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
  IconButton,
  Fade,
  Slide,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import ServiceCard from '../components/common/ServiceCard';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du chargement des services');
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
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Slide direction="right" in timeout={1000}>
                <Box>
                  <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{ fontWeight: 700 }}
                  >
                    Trouvez le service parfait pour vos besoins
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                    Des prestataires qualifiés pour tous vos services à domicile
                  </Typography>
                  <form onSubmit={handleSearch}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          placeholder="Quel service recherchez-vous ?"
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
                          variant="contained"
                          fullWidth
                          sx={{ height: '100%' }}
                        >
                          Rechercher
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Box>
              </Slide>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Popular Services Section */}
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Typography variant="h4" gutterBottom>
          Services Populaires
        </Typography>
        <Grid container spacing={3}>
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

      {/* Why Choose Us Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom align="center">
            Pourquoi nous choisir ?
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  background: 'transparent',
                }}
              >
                <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Prestataires Qualifiés
                </Typography>
                <Typography color="text.secondary">
                  Tous nos prestataires sont soigneusement sélectionnés et vérifiés
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  background: 'transparent',
                }}
              >
                <ScheduleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Disponibilité 24/7
                </Typography>
                <Typography color="text.secondary">
                  Réservez vos services à tout moment, selon vos besoins
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  background: 'transparent',
                }}
              >
                <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Service Sécurisé
                </Typography>
                <Typography color="text.secondary">
                  Paiement sécurisé et garantie de satisfaction
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 