import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Rating,
  Button,
  TextField,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Paper,
  useTheme,
  useMediaQuery,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api, { CLIENT_UPDATE_URL, CLIENT_FAVORITES_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ClientProfile = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchClientData();
    fetchFavorites();
    fetchAppointmentHistory();
    fetchPaymentMethods();
  }, []);

  const fetchClientData = async () => {
    try {
      const response = await api.get(CLIENT_UPDATE_URL);
      setClient(response.data);
      setEditData(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await api.get(CLIENT_FAVORITES_URL);
      setFavorites(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des favoris:', err);
    }
  };

  const fetchAppointmentHistory = async () => {
    try {
      const response = await api.get('/api/v1/appointments/history/');
      setAppointmentHistory(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/api/v1/payments/methods/');
      setPaymentMethods(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des moyens de paiement:', err);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const response = await api.patch(CLIENT_UPDATE_URL, editData);
      setClient(response.data);
      setEditMode(false);
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditData(client);
    setEditMode(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await api.patch(CLIENT_UPDATE_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setClient(response.data);
      } catch (err) {
        setError('Erreur lors du téléchargement de l\'image');
        console.error(err);
      }
    }
  };

  const getAppointmentStatus = (status) => {
    const statusMap = {
      pending: { label: 'En attente', color: 'warning' },
      confirmed: { label: 'Confirmé', color: 'success' },
      completed: { label: 'Terminé', color: 'info' },
      cancelled: { label: 'Annulé', color: 'error' },
    };
    return statusMap[status] || { label: status, color: 'default' };
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* En-tête du profil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={client.profile_picture}
                  sx={{ width: 100, height: 100, mr: 3 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" component="h1">
                      {client.name}
                    </Typography>
                    <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    Membre depuis {format(new Date(client.created_at), 'MMMM yyyy', { locale: fr })}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Modifier
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1 }} />
                    <Typography>{client.location}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1 }} />
                    <Typography>{client.phone}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1 }} />
                    <Typography>{client.email}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PaymentIcon sx={{ mr: 1 }} />
                    <Typography>{paymentMethods.length} moyens de paiement</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Onglets */}
        <Grid item xs={12}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : false}
            >
              <Tab label="Informations" />
              <Tab label="Historique" />
              <Tab label="Favoris" />
              <Tab label="Paiements" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Contenu des onglets */}
        <Grid item xs={12}>
          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      value={editMode ? editData.name : client.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={editMode ? editData.email : client.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={editMode ? editData.phone : client.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Adresse"
                      value={editMode ? editData.location : client.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  {editMode && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={handleCancel}>
                          Annuler
                        </Button>
                        <Button variant="contained" onClick={handleSave}>
                          Enregistrer
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Historique des rendez-vous
                </Typography>
                <Timeline>
                  {appointmentHistory.map((appointment) => {
                    const status = getAppointmentStatus(appointment.status);
                    return (
                      <TimelineItem key={appointment.id}>
                        <TimelineSeparator>
                          <TimelineDot color={status.color} />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1">
                              {appointment.service?.name}
                            </Typography>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(appointment.date), 'dd MMMM yyyy', { locale: fr })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.employer?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.duration} minutes - {appointment.price}€
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mes prestataires favoris
                </Typography>
                <Grid container spacing={3}>
                  {favorites.map((favorite) => (
                    <Grid item xs={12} sm={6} md={4} key={favorite.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              src={favorite.employer.profile_picture}
                              sx={{ width: 60, height: 60, mr: 2 }}
                            />
                            <Box>
                              <Typography variant="subtitle1">
                                {favorite.employer.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {favorite.employer.service?.name}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating value={favorite.employer.average_rating} readOnly size="small" />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              ({favorite.employer.total_reviews} avis)
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {favorite.employer.location}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Moyens de paiement</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {/* Ouvrir le dialogue d'ajout de carte */}}
                  >
                    Ajouter une carte
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {paymentMethods.map((method) => (
                    <Grid item xs={12} sm={6} key={method.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PaymentIcon sx={{ mr: 2 }} />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1">
                                {method.type === 'card' ? 'Carte bancaire' : 'Virement bancaire'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {method.type === 'card' ? `**** ${method.last4}` : method.iban}
                              </Typography>
                            </Box>
                            <IconButton color="error" size="small">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ClientProfile; 