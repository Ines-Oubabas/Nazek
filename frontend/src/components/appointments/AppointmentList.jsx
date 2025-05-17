import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Message as MessageIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { appointmentAPI } from '@/services/api'; // ✅ On importe l'API corrigée

const AppointmentList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.list(); // ✅ Appel direct de l'API
      setAppointments(data);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.cancel(appointmentId); // ✅ Appel direct de l'API
      fetchAppointments();
    } catch (err) {
      setError(err.message || "Erreur lors de l'annulation du rendez-vous");
    }
  };

  const handleReviewSubmit = async () => {
    try {
      if (selectedAppointment) {
        await appointmentAPI.review(selectedAppointment.id, reviewData); // ✅ Appel direct
        setShowReviewDialog(false);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de l'avis");
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (tabValue === 0) return appointment.status === 'confirmed';
    if (tabValue === 1) return appointment.status === 'pending';
    if (tabValue === 2) return appointment.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 } }}
        >
          <Tab label="Confirmés" />
          <Tab label="En attente" />
          <Tab label="Annulés" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {filteredAppointments.map((appointment) => (
          <Grid item xs={12} key={appointment.id}>
            <Fade in timeout={500}>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar
                        src={appointment.provider?.image || '/images/default-avatar.png'}
                        alt={appointment.provider?.name || ''}
                        sx={{ width: 56, height: 56 }}
                      />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6" gutterBottom>
                        {appointment.service?.name || 'Service'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.provider?.name || 'Prestataire'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(appointment.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item>
                      <Chip
                        label={appointment.status}
                        color={
                          appointment.status === 'confirmed'
                            ? 'success'
                            : appointment.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  {appointment.status === 'confirmed' && (
                    <>
                      <IconButton
                        color="primary"
                        onClick={() => window.location.href = `/messages/${appointment.provider?.id}`}
                      >
                        <MessageIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowReviewDialog(true);
                        }}
                      >
                        <StarIcon />
                      </IconButton>
                    </>
                  )}
                  {appointment.status === 'pending' && (
                    <>
                      <Button
                        startIcon={<EditIcon />}
                        color="primary"
                        onClick={() => window.location.href = `/appointments/${appointment.id}/edit`}
                      >
                        Modifier
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        color="error"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Annuler
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Dialog pour laisser un avis */}
      <Dialog open={showReviewDialog} onClose={() => setShowReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Donner votre avis</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography component="legend">Note</Typography>
            <Rating
              value={reviewData.rating}
              onChange={(e, newValue) => setReviewData({ ...reviewData, rating: newValue || 0 })}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Commentaire"
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleReviewSubmit} disabled={!reviewData.rating}>
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentList;
