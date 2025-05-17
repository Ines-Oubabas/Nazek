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
  CircularProgress,
  Alert,
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
import { useAuth } from '@/contexts/AuthContext';
import { appointmentAPI, serviceAPI } from '@/services/api';
import ServiceCard from '@/components/common/ServiceCard';

const ServiceDetails = () => {
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
      const response = await serviceAPI.detail(id);
      setService(response);
      setIsFavorite(response.is_favorite || false);
    } catch (err) {
      setError('Erreur lors du chargement du service');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) return navigate('/login');
    try {
      setIsFavorite((prev) => !prev);
      // Implémenter côté backend l'ajout/retrait de favori
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppointmentSubmit = async () => {
    if (!user) return navigate('/login');
    try {
      await appointmentAPI.create({
        service: id,
        ...appointmentData,
      });
      setAppointmentDialog(false);
      navigate('/appointments');
    } catch (err) {
      console.error('Erreur lors de la prise de rendez-vous', err);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ overflow: 'hidden', mb: 4 }}>
            <Box component="img" src={service.image || '/images/placeholder.jpg'} alt={service.name} sx={{ width: '100%', height: 400, objectFit: 'cover' }} />
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>{service.name}</Typography>
                <IconButton onClick={handleFavoriteClick}>
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LocationIcon sx={{ mr: 1 }} /><Typography>{service.location}</Typography>
                <EuroIcon sx={{ mr: 1 }} /><Typography>{service.price}€</Typography>
                <Rating value={service.rating} readOnly size="small" />
              </Box>
              <Typography paragraph>{service.description}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {service.tags?.map((tag) => <Chip key={tag} label={tag} />)}
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6">Avis clients</Typography>
            {service.reviews?.map((review) => (
              <Box key={review.id} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={review.user.avatar} sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle1">{review.user.name}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">{format(new Date(review.created_at), 'dd MMM yyyy', { locale: fr })}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ mt: 1 }}>{review.comment}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6">Prestataire</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={service.provider.avatar} sx={{ mr: 2 }} />
              <Box>
                <Typography variant="subtitle1">{service.provider.name}</Typography>
                <Typography variant="body2" color="text.secondary">{service.provider.experience} ans</Typography>
              </Box>
            </Box>
            <Typography variant="body2">{service.provider.description}</Typography>
            <Button variant="outlined" fullWidth sx={{ mt: 2 }} startIcon={<ChatIcon />}>Contacter</Button>
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => setAppointmentDialog(true)} startIcon={<CalendarIcon />}>Prendre rendez-vous</Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={appointmentDialog} onClose={() => setAppointmentDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Prendre rendez-vous</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Date" type="date" value={appointmentData.date} onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Heure" type="time" value={appointmentData.time} onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })} sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          <TextField select fullWidth label="Durée" value={appointmentData.duration} onChange={(e) => setAppointmentData({ ...appointmentData, duration: Number(e.target.value) })} sx={{ mt: 2 }}>
            <MenuItem value={30}>30 minutes</MenuItem>
            <MenuItem value={60}>1 heure</MenuItem>
            <MenuItem value={90}>1h30</MenuItem>
            <MenuItem value={120}>2 heures</MenuItem>
          </TextField>
          <TextField fullWidth multiline rows={4} label="Notes" value={appointmentData.notes} onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentDialog(false)}>Annuler</Button>
          <Button onClick={handleAppointmentSubmit} variant="contained">Confirmer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceDetails;
