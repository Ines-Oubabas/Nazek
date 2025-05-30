import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  TextField,
  Box,
  Typography,
  Button,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';

import ServiceCard from '@/components/common/ServiceCard';
import { serviceAPI } from '@/services/api'; // ✅ Correction ici

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    minPrice: 0,
    maxPrice: 1000,
    rating: 0,
    category: '',
  });

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await serviceAPI.list(); // ✅ Correction ici
      setServices(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${filters.query}&location=${filters.location}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Que recherchez-vous ?"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
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
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
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
              <Button fullWidth variant="contained" type="submit" sx={{ height: '56px' }}>
                Rechercher
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Grid container spacing={3}>
        {/* Filtres */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filtres
            </Typography>
            <Divider sx={{ my: 2 }} />

            {/* Prix */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Prix</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Min"
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    InputProps={{
                      startAdornment: <EuroIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Max"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    InputProps={{
                      startAdornment: <EuroIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Note */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Note minimum</Typography>
              <Rating
                value={filters.rating}
                onChange={(_, value) => handleFilterChange('rating', value)}
                precision={0.5}
                emptyIcon={<StarIcon style={{ opacity: 0.3 }} />}
              />
            </Box>

            {/* Catégorie */}
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={filters.category}
                label="Catégorie"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="beauty">Beauté</MenuItem>
                <MenuItem value="health">Santé</MenuItem>
                <MenuItem value="education">Éducation</MenuItem>
                <MenuItem value="home">Maison</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Résultats */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : services.length === 0 ? (
            <Alert severity="info">Aucun service trouvé</Alert>
          ) : (
            <Grid container spacing={3}>
              {services.map((service) => (
                <Grid item xs={12} sm={6} key={service.id}>
                  <ServiceCard
                    service={service}
                    onClick={() => navigate(`/services/${service.id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Search;
