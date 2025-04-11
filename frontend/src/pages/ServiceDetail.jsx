import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Button,
  Rating,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Euro as EuroIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  CalendarToday as CalendarIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api, { SERVICES_URL, APPOINTMENTS_URL } from '../services/api';
import ServiceCard from '../components/common/ServiceCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { useAuth } from '../contexts/AuthContext';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [appointmentDialog, setAppointmentDialog] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    duration: 60,
    notes: '',
  });

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`${SERVICES_URL}${id}/`);
      setService(response.data);
      setIsFavorite(response.data.is_favorite);
    } catch (err) {
      setError('Erreur lors du chargement du service');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/api/v1/services/${id}/favorite/`);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Erreur lors de l\'ajout aux favoris:', err);
    }
  };

  const handleAppointmentSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(APPOINTMENTS_URL, {
        service: id,
        ...appointmentData,
      });
      setAppointmentDialog(false);
      navigate('/appointments');
    } catch (err) {
      console.error('Erreur lors de la création du rendez-vous:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement du service..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={fetchServiceDetails} />;
  }

  if (!service) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert message="Service non trouvé" />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Image et informations principales */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ overflow: 'hidden', mb: 4 }}>
            <Box
              component="img"
              src={service.image || '/images/placeholder.jpg'}
              alt={service.name}
              sx={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
              }}
            />
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                  {service.name}
                </Typography>
                <IconButton onClick={handleFavoriteClick}>
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  <Typography>{service.location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EuroIcon sx={{ mr: 1 }} />
                  <Typography>{service.price}€/h</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={service.rating} readOnly size="small" />
                  <Typography sx={{ ml: 1 }}>({service.total_reviews} avis)</Typography>
                </Box>
              </Box>
              <Typography variant="body1" paragraph>
                {service.description}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {service.tags?.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Description détaillée */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Description détaillée
            </Typography>
            <Typography variant="body1" paragraph>
              {service.detailed_description}
            </Typography>
          </Paper>

          {/* Avis */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Avis clients
            </Typography>
            {service.reviews?.map((review) => (
              <Box key={review.id} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar src={review.user.avatar} sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle1">{review.user.name}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {review.comment}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Informations du prestataire et réservation */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={service.provider.avatar}
                sx={{ width: 64, height: 64, mr: 2 }}
              />
              <Box>
                <Typography variant="h6">{service.provider.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {service.provider.experience} ans d'expérience
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" paragraph>
              {service.provider.description}
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ChatIcon />}
              sx={{ mb: 2 }}
            >
              Contacter
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={() => setAppointmentDialog(true)}
            >
              Prendre rendez-vous
            </Button>
          </Paper>

          {/* Services similaires */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Services similaires
            </Typography>
            {service.similar_services?.map((similarService) => (
              <Box key={similarService.id} sx={{ mb: 2 }}>
                <ServiceCard
                  service={similarService}
                  onClick={() => navigate(`/services/${similarService.id}`)}
                />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de réservation */}
      <Dialog
        open={appointmentDialog}
        onClose={() => setAppointmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Prendre rendez-vous</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={appointmentData.date}
                onChange={(e) =>
                  setAppointmentData({ ...appointmentData, date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Heure"
                type="time"
                value={appointmentData.time}
                onChange={(e) =>
                  setAppointmentData({ ...appointmentData, time: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Durée"
                value={appointmentData.duration}
                onChange={(e) =>
                  setAppointmentData({ ...appointmentData, duration: e.target.value })
                }
              >
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 heure</MenuItem>
                <MenuItem value={90}>1h30</MenuItem>
                <MenuItem value={120}>2 heures</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={appointmentData.notes}
                onChange={(e) =>
                  setAppointmentData({ ...appointmentData, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAppointmentSubmit}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceDetail; 