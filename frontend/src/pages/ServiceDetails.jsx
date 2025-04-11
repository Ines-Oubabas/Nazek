import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Grid,
  Rating,
  Chip,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import AppointmentCalendar from '../components/common/AppointmentCalendar';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getService(id);
      setService(data);
      // TODO: Vérifier si le service est en favori
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du chargement du service');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = () => {
    // TODO: Implémenter l'ajout/suppression des favoris
    setIsFavorite(!isFavorite);
  };

  const handleBookAppointment = (dateTime) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedDateTime(dateTime);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    try {
      const response = await api.createAppointment({
        serviceId: service.id,
        date: selectedDateTime.date,
        time: selectedDateTime.time,
        notes: bookingNotes,
      });

      navigate('/appointments');
    } catch (err) {
      setError(err.message || 'Erreur lors de la réservation');
    }
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

  if (!service) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Service non trouvé</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="h4" component="h1">
                {service.name}
              </Typography>
              <Button
                startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleFavoriteClick}
                color={isFavorite ? 'secondary' : 'default'}
              >
                {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Rating value={service.rating} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {service.review_count} avis
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              {service.description}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {service.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <LocationIcon color="action" />
              <Typography>{service.location}</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <TimeIcon color="action" />
              <Typography>Durée: {service.duration} minutes</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <EuroIcon color="action" />
              <Typography variant="h6">{service.price}€</Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={() => setShowCalendar(true)}
            >
              Réserver
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              À propos du prestataire
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                component="img"
                src={service.provider.avatar || '/images/placeholder.jpg'}
                alt={service.provider.name}
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  mr: 2,
                }}
              />
              <Box>
                <Typography variant="subtitle1">{service.provider.name}</Typography>
                <Rating value={service.provider.rating} readOnly size="small" />
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {service.provider.description}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {showCalendar && (
        <Box sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Choisissez une date et une heure
            </Typography>
            <AppointmentCalendar onSelectDateTime={handleBookAppointment} />
          </Paper>
        </Box>
      )}

      <Dialog
        open={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la réservation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Voulez-vous ajouter des notes pour le prestataire ?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            placeholder="Notes pour le prestataire (optionnel)"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBookingDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleConfirmBooking}
            sx={{
              background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
              },
            }}
          >
            Confirmer la réservation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceDetails; 