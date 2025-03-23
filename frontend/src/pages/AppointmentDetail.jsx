import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import EuroIcon from '@mui/icons-material/Euro';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const response = await api.get(`/api/appointments/${id}/`);
      setAppointment(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Veuillez indiquer une raison d\'annulation');
      return;
    }

    try {
      await api.post(`/api/appointments/${id}/cancel/`, {
        reason: cancelReason
      });
      setCancelDialogOpen(false);
      fetchAppointment();
    } catch (err) {
      setCancelError('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container>
        <Typography>Rendez-vous non trouvé</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Détails du rendez-vous
          </Typography>
          <Chip
            label={getStatusLabel(appointment.status)}
            color={getStatusColor(appointment.status)}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 2 }} />
              <Typography variant="h6">
                {appointment.service.name} avec {appointment.professional.name}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 2 }} />
              <Typography>
                {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 2 }} />
              <Typography>
                {format(new Date(appointment.time), 'HH:mm', { locale: fr })}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon sx={{ mr: 2 }} />
              <Typography>{appointment.location}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EuroIcon sx={{ mr: 2 }} />
              <Typography>{appointment.service.price} €</Typography>
            </Box>
          </Grid>

          {appointment.status !== 'cancelled' && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/appointments')}
                >
                  Retour à la liste
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Annuler le rendez-vous
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Annuler le rendez-vous</DialogTitle>
        <DialogContent>
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Raison de l'annulation"
            fullWidth
            multiline
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCancel} color="error">
            Confirmer l'annulation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentDetail; 