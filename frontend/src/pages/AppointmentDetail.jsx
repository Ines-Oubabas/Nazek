import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  LinearProgress,
  Rating,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Chat as ChatIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import api, { APPOINTMENTS_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LocationSelector from '../components/common/LocationSelector';
import PaymentSelector from '../components/common/PaymentSelector';

const statusColors = {
  en_attente: 'warning',
  accepté: 'info',
  refusé: 'error',
  annulé: 'error',
  terminé: 'success',
};

const statusLabels = {
  en_attente: 'En attente',
  accepté: 'Accepté',
  refusé: 'Refusé',
  annulé: 'Annulé',
  terminé: 'Terminé',
};

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [chatDialog, setChatDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editData, setEditData] = useState({
    date: '',
    time: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      const response = await api.get(`${APPOINTMENTS_URL}${id}/`);
      setAppointment(response.data);
      setEditData({
        date: response.data.date,
        time: response.data.time,
        location: response.data.location,
        notes: response.data.notes || '',
      });
    } catch (err) {
      setError('Erreur lors du chargement des informations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await api.patch(`${APPOINTMENTS_URL}${id}/`, editData);
      setSnackbar({
        open: true,
        message: 'Rendez-vous modifié avec succès',
        severity: 'success',
      });
      setEditDialog(false);
      fetchAppointmentDetails();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la modification',
        severity: 'error',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`${APPOINTMENTS_URL}${id}/cancel/`);
      setSnackbar({
        open: true,
        message: 'Rendez-vous annulé avec succès',
        severity: 'success',
      });
      setCancelDialog(false);
      fetchAppointmentDetails();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'annulation',
        severity: 'error',
      });
    }
  };

  const handleReviewSubmit = async () => {
    try {
      await api.post(`/api/v1/reviews/`, {
        provider: appointment.provider.id,
        appointment: id,
        rating: review.rating,
        comment: review.comment,
      });
      setSnackbar({
        open: true,
        message: 'Avis publié avec succès',
        severity: 'success',
      });
      setReviewDialog(false);
      fetchAppointmentDetails();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la publication de l\'avis',
        severity: 'error',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      const response = await api.post(`/api/v1/messages/`, {
        provider: appointment.provider.id,
        appointment: id,
        content: message,
      });
      setMessages((prev) => [...prev, response.data]);
      setMessage('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'envoi du message',
        severity: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSnackbar({
        open: true,
        message: 'Lien copié dans le presse-papiers',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la copie du lien',
        severity: 'error',
      });
    }
  };

  const isPast = appointment && isBefore(parseISO(appointment?.date), new Date());
  const isUpcoming = appointment && isAfter(parseISO(appointment?.date), new Date());

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* En-tête du rendez-vous */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Avatar
                  src={appointment?.provider.profile_picture}
                  sx={{ width: 100, height: 100, mr: 3 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4">
                      Rendez-vous avec {appointment?.provider.name}
                    </Typography>
                    <Chip
                      label={statusLabels[appointment?.status]}
                      color={statusColors[appointment?.status]}
                      sx={{ ml: 2 }}
                    />
                    <Box sx={{ ml: 'auto' }}>
                      <Tooltip title="Partager">
                        <IconButton onClick={handleShare}>
                          <ShareIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Contacter">
                        <IconButton onClick={() => setChatDialog(true)}>
                          <ChatIcon />
                        </IconButton>
                      </Tooltip>
                      {isUpcoming && (
                        <>
                          <Tooltip title="Modifier">
                            <IconButton onClick={() => setEditDialog(true)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Annuler">
                            <IconButton onClick={() => setCancelDialog(true)}>
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {appointment?.service.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {format(parseISO(appointment?.date), 'EEEE d MMMM yyyy', {
                          locale: fr,
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {format(parseISO(appointment?.time), 'HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon sx={{ mr: 1 }} />
                      <Typography variant="body1">{appointment?.service.price}€</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Stepper activeStep={getAppointmentStep(appointment?.status)} sx={{ mb: 3 }}>
                <Step>
                  <StepLabel>Réservation</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Confirmation</StepLabel>
                </Step>
                <Step>
                  <StepLabel>En cours</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Terminé</StepLabel>
                </Step>
              </Stepper>

              <Grid container spacing={3}>
                {/* Informations détaillées */}
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informations détaillées
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <LocationIcon sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2">Localisation</Typography>
                              <Typography>{appointment?.location}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ScheduleIcon sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2">Durée</Typography>
                              <Typography>{appointment?.service.duration} minutes</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <DescriptionIcon sx={{ mr: 1, mt: 0.5 }} />
                            <Box>
                              <Typography variant="subtitle2">Notes</Typography>
                              <Typography>
                                {appointment?.notes || 'Aucune note'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Actions */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Actions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {isUpcoming && (
                          <>
                            <Button
                              variant="contained"
                              startIcon={<CalendarIcon />}
                              onClick={() => setEditDialog(true)}
                            >
                              Modifier le rendez-vous
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => setCancelDialog(true)}
                            >
                              Annuler le rendez-vous
                            </Button>
                          </>
                        )}
                        {isPast && !appointment?.review && (
                          <Button
                            variant="contained"
                            startIcon={<StarIcon />}
                            onClick={() => setReviewDialog(true)}
                          >
                            Laisser un avis
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          startIcon={<ReceiptIcon />}
                          onClick={() => window.open(appointment?.invoice_url)}
                        >
                          Voir la facture
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogues */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier le rendez-vous</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={editData.date}
              onChange={(event) =>
                setEditData((prev) => ({ ...prev, date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Heure"
              type="time"
              value={editData.time}
              onChange={(event) =>
                setEditData((prev) => ({ ...prev, time: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <LocationSelector
              value={editData.location}
              onChange={(location) =>
                setEditData((prev) => ({ ...prev, location }))
              }
            />
            <TextField
              label="Notes"
              multiline
              rows={4}
              value={editData.notes}
              onChange={(event) =>
                setEditData((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Annuler le rendez-vous</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est
            irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Non, garder</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
          >
            Oui, annuler
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewDialog}
        onClose={() => setReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Laisser un avis</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Rating
              value={review.rating}
              onChange={(event, newValue) =>
                setReview((prev) => ({ ...prev, rating: newValue }))
              }
              size="large"
            />
            <TextField
              label="Commentaire"
              multiline
              rows={4}
              value={review.comment}
              onChange={(event) =>
                setReview((prev) => ({ ...prev, comment: event.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleReviewSubmit}
            disabled={!review.rating || !review.comment}
          >
            Publier
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={chatDialog}
        onClose={() => setChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chat avec {appointment?.provider.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, overflowY: 'auto', mb: 2 }}>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.is_sender ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: msg.is_sender ? 'primary.light' : 'grey.100',
                  }}
                >
                  <Typography>{msg.content}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(msg.created_at), 'HH:mm', { locale: fr })}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Écrivez votre message..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              Envoyer
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const getAppointmentStep = (status) => {
  switch (status) {
    case 'en_attente':
      return 0;
    case 'accepté':
      return 1;
    case 'terminé':
      return 3;
    case 'refusé':
    case 'annulé':
      return -1;
    default:
      return 0;
  }
};

export default AppointmentDetail; 