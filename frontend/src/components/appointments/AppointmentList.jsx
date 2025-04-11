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
import { APPOINTMENTS_URL } from '../../services/api';

const AppointmentList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(APPOINTMENTS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des rendez-vous');
      }

      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${APPOINTMENTS_URL}/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation du rendez-vous');
      }

      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${APPOINTMENTS_URL}/${selectedAppointment.id}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'avis');
      }

      setShowReviewDialog(false);
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    switch (tabValue) {
      case 0:
        return appointment.status === 'confirmed';
      case 1:
        return appointment.status === 'pending';
      case 2:
        return appointment.status === 'cancelled';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
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
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
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
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar
                        src={appointment.provider.image}
                        alt={appointment.provider.name}
                        sx={{ width: 56, height: 56 }}
                      />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6" gutterBottom>
                        {appointment.service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.provider.name}
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
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mx: 1 }}
                        >
                          •
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.time}
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
                        onClick={() => window.location.href = `/messages/${appointment.provider.id}`}
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

      <Dialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Donner votre avis</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography component="legend">Note</Typography>
            <Rating
              value={reviewData.rating}
              onChange={(event, newValue) => {
                setReviewData({ ...reviewData, rating: newValue });
              }}
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
          <Button
            variant="contained"
            onClick={handleReviewSubmit}
            disabled={!reviewData.rating}
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentList; 