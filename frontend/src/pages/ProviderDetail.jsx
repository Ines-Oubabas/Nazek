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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemSecondaryAction,
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
  Verified as VerifiedIcon,
  Photo as PhotoIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import api, { EMPLOYERS_URL, EMPLOYER_AVAILABILITY_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LocationSelector from '../components/common/LocationSelector';
import PaymentSelector from '../components/common/PaymentSelector';

const ProviderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [chatDialog, setChatDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    service: '',
    location: '',
    notes: '',
  });
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [report, setReport] = useState({ reason: '', description: '' });
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    fetchProviderDetails();
    fetchMessages();
    checkFavorite();
  }, [id]);

  const fetchProviderDetails = async () => {
    try {
      const response = await api.get(`${EMPLOYERS_URL}${id}/`);
      setProvider(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des informations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/v1/messages/?provider=${id}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/v1/favorites/`);
      setFavorite(response.data.some((f) => f.provider.id === parseInt(id)));
    } catch (err) {
      console.error('Erreur lors de la vérification des favoris:', err);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Connectez-vous pour ajouter aux favoris',
        severity: 'warning',
      });
      return;
    }

    try {
      if (favorite) {
        await api.delete(`/api/v1/favorites/${id}/`);
        setSnackbar({
          open: true,
          message: 'Retiré des favoris',
          severity: 'success',
        });
      } else {
        await api.post('/api/v1/favorites/', { provider: id });
        setSnackbar({
          open: true,
          message: 'Ajouté aux favoris',
          severity: 'success',
        });
      }
      setFavorite(!favorite);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la modification des favoris',
        severity: 'error',
      });
    }
  };

  const handleBookingSubmit = async () => {
    try {
      await api.post('/api/v1/appointments/', {
        provider: id,
        ...bookingData,
      });
      setSnackbar({
        open: true,
        message: 'Rendez-vous créé avec succès',
        severity: 'success',
      });
      setBookingDialog(false);
      navigate('/appointments');
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la création du rendez-vous',
        severity: 'error',
      });
    }
  };

  const handleReviewSubmit = async () => {
    try {
      await api.post('/api/v1/reviews/', {
        provider: id,
        rating: review.rating,
        comment: review.comment,
      });
      setSnackbar({
        open: true,
        message: 'Avis publié avec succès',
        severity: 'success',
      });
      setReviewDialog(false);
      fetchProviderDetails();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la publication de l\'avis',
        severity: 'error',
      });
    }
  };

  const handleReportSubmit = async () => {
    try {
      await api.post('/api/v1/reports/', {
        provider: id,
        reason: report.reason,
        description: report.description,
      });
      setSnackbar({
        open: true,
        message: 'Signalement envoyé avec succès',
        severity: 'success',
      });
      setReportDialog(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'envoi du signalement',
        severity: 'error',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      const response = await api.post('/api/v1/messages/', {
        provider: id,
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
        {/* En-tête du profil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Avatar
                  src={provider?.profile_picture}
                  sx={{ width: 120, height: 120, mr: 3 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4">{provider?.name}</Typography>
                    <VerifiedIcon
                      sx={{ color: 'primary.main', ml: 1, fontSize: 24 }}
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
                      <Tooltip title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                        <IconButton onClick={handleFavorite} color="primary">
                          {favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Signaler">
                        <IconButton onClick={() => setReportDialog(true)}>
                          <ReportIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ color: 'warning.main', mr: 0.5 }} />
                      <Typography>{provider?.rating}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon sx={{ mr: 0.5, color: 'success.main' }} />
                      <Typography>{provider?.hourly_rate}€/h</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 0.5, color: 'info.main' }} />
                      <Typography>{provider?.location}</Typography>
                    </Box>
                  </Box>
                  <Typography color="text.secondary" paragraph>
                    {provider?.bio}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CalendarIcon />}
                    onClick={() => setBookingDialog(true)}
                  >
                    Prendre rendez-vous
                  </Button>
                </Box>
              </Box>

              <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="À propos" />
                <Tab label="Services" />
                <Tab label="Disponibilités" />
                <Tab label="Avis" />
                <Tab label="Photos" />
              </Tabs>

              <Box sx={{ mt: 3 }}>
                {activeTab === 0 && (
                  <Fade in timeout={500}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        À propos
                      </Typography>
                      <Typography paragraph>{provider?.about}</Typography>
                      <Typography variant="h6" gutterBottom>
                        Expérience
                      </Typography>
                      <Typography paragraph>{provider?.experience}</Typography>
                      <Typography variant="h6" gutterBottom>
                        Formation
                      </Typography>
                      <Typography paragraph>{provider?.education}</Typography>
                    </Box>
                  </Fade>
                )}

                {activeTab === 1 && (
                  <Fade in timeout={500}>
                    <Grid container spacing={2}>
                      {provider?.services.map((service) => (
                        <Grid item xs={12} sm={6} md={4} key={service.id}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {service.name}
                              </Typography>
                              <Typography color="text.secondary" paragraph>
                                {service.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <MoneyIcon sx={{ mr: 0.5, color: 'success.main' }} />
                                  <Typography>{service.price}€</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TimeIcon sx={{ mr: 0.5, color: 'info.main' }} />
                                  <Typography>{service.duration} min</Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Fade>
                )}

                {activeTab === 2 && (
                  <Fade in timeout={500}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Disponibilités
                      </Typography>
                      <Grid container spacing={2}>
                        {provider?.availability.map((slot) => (
                          <Grid item xs={12} sm={6} md={4} key={slot.id}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                  {format(parseISO(slot.date), 'EEEE d MMMM', {
                                    locale: fr,
                                  })}
                                </Typography>
                                <List>
                                  {slot.times.map((time) => (
                                    <ListItem key={time}>
                                      <ListItemIcon>
                                        <AccessTime />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={format(parseISO(time), 'HH:mm', {
                                          locale: fr,
                                        })}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {activeTab === 3 && (
                  <Fade in timeout={500}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Avis clients
                      </Typography>
                      <List>
                        {provider?.reviews.map((review) => (
                          <ListItem key={review.id}>
                            <ListItemAvatar>
                              <Avatar src={review.client.profile_picture} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1">
                                    {review.client.name}
                                  </Typography>
                                  <Rating value={review.rating} readOnly size="small" />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {review.comment}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {format(parseISO(review.created_at), 'd MMMM yyyy', {
                                      locale: fr,
                                    })}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      {user && (
                        <Button
                          variant="outlined"
                          startIcon={<StarIcon />}
                          onClick={() => setReviewDialog(true)}
                        >
                          Laisser un avis
                        </Button>
                      )}
                    </Box>
                  </Fade>
                )}

                {activeTab === 4 && (
                  <Fade in timeout={500}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Photos
                      </Typography>
                      <Grid container spacing={2}>
                        {provider?.photos.map((photo) => (
                          <Grid item xs={12} sm={6} md={4} key={photo.id}>
                            <Card>
                              <CardContent>
                                <Box
                                  component="img"
                                  src={photo.url}
                                  alt={photo.description}
                                  sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {photo.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Fade>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogues */}
      <Dialog
        open={bookingDialog}
        onClose={() => setBookingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Prendre rendez-vous</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={bookingData.date}
              onChange={(event) =>
                setBookingData((prev) => ({ ...prev, date: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Heure"
              type="time"
              value={bookingData.time}
              onChange={(event) =>
                setBookingData((prev) => ({ ...prev, time: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Service"
              value={bookingData.service}
              onChange={(event) =>
                setBookingData((prev) => ({ ...prev, service: event.target.value }))
              }
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Sélectionnez un service</option>
              {provider?.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.price}€ ({service.duration} min)
                </option>
              ))}
            </TextField>
            <LocationSelector
              value={bookingData.location}
              onChange={(location) =>
                setBookingData((prev) => ({ ...prev, location }))
              }
            />
            <TextField
              label="Notes"
              multiline
              rows={4}
              value={bookingData.notes}
              onChange={(event) =>
                setBookingData((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleBookingSubmit}
            disabled={
              !bookingData.date ||
              !bookingData.time ||
              !bookingData.service ||
              !bookingData.location
            }
          >
            Confirmer
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
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Signaler un problème</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Raison"
              value={report.reason}
              onChange={(event) =>
                setReport((prev) => ({ ...prev, reason: event.target.value }))
              }
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Sélectionnez une raison</option>
              <option value="inappropriate">Contenu inapproprié</option>
              <option value="spam">Spam</option>
              <option value="fake">Profil faux</option>
              <option value="other">Autre</option>
            </TextField>
            <TextField
              label="Description"
              multiline
              rows={4}
              value={report.description}
              onChange={(event) =>
                setReport((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleReportSubmit}
            disabled={!report.reason || !report.description}
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={chatDialog}
        onClose={() => setChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chat avec {provider?.name}</DialogTitle>
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

export default ProviderDetail; 