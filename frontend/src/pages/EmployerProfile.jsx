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
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api, { EMPLOYER_UPDATE_URL, EMPLOYER_AVAILABILITY_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EmployerProfile = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [availabilityDialog, setAvailabilityDialog] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 0,
    start_time: '',
    end_time: '',
  });
  const [galleryDialog, setGalleryDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchEmployerData();
  }, []);

  const fetchEmployerData = async () => {
    try {
      const response = await api.get(EMPLOYER_UPDATE_URL);
      setEmployer(response.data);
      setEditData(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const response = await api.patch(EMPLOYER_UPDATE_URL, editData);
      setEmployer(response.data);
      setEditMode(false);
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditData(employer);
    setEditMode(false);
  };

  const handleAvailabilitySubmit = async () => {
    try {
      await api.post(EMPLOYER_AVAILABILITY_URL(employer.id), newAvailability);
      fetchEmployerData();
      setAvailabilityDialog(false);
    } catch (err) {
      setError('Erreur lors de l\'ajout de la disponibilité');
      console.error(err);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await api.patch(EMPLOYER_UPDATE_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setEmployer(response.data);
      } catch (err) {
        setError('Erreur lors du téléchargement de l\'image');
        console.error(err);
      }
    }
  };

  const getDayName = (day) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[day];
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
                  src={employer.profile_picture}
                  sx={{ width: 100, height: 100, mr: 3 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" component="h1">
                      {employer.name}
                    </Typography>
                    <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    {employer.service?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Rating value={employer.average_rating} readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({employer.total_reviews} avis)
                    </Typography>
                  </Box>
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
                    <Typography>{employer.location}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1 }} />
                    <Typography>{employer.phone}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1 }} />
                    <Typography>{employer.email}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1 }} />
                    <Typography>{employer.hourly_rate}€/h</Typography>
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
              <Tab label="Disponibilités" />
              <Tab label="Galerie" />
              <Tab label="Avis" />
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
                      value={editMode ? editData.name : employer.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={editMode ? editData.email : employer.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={editMode ? editData.phone : employer.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tarif horaire"
                      type="number"
                      value={editMode ? editData.hourly_rate : employer.hourly_rate}
                      onChange={(e) => setEditData({ ...editData, hourly_rate: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      value={editMode ? editData.description : employer.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Disponibilités</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setAvailabilityDialog(true)}
                  >
                    Ajouter une disponibilité
                  </Button>
                </Box>

                <List>
                  {employer.availabilities?.map((availability) => (
                    <ListItem key={availability.id}>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${getDayName(availability.day_of_week)}`}
                        secondary={`${availability.start_time} - ${availability.end_time}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Dialog open={availabilityDialog} onClose={() => setAvailabilityDialog(false)}>
                  <DialogTitle>Ajouter une disponibilité</DialogTitle>
                  <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <TextField
                          select
                          fullWidth
                          label="Jour"
                          value={newAvailability.day_of_week}
                          onChange={(e) => setNewAvailability({ ...newAvailability, day_of_week: e.target.value })}
                        >
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <option key={day} value={day}>
                              {getDayName(day)}
                            </option>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="time"
                          label="Heure de début"
                          value={newAvailability.start_time}
                          onChange={(e) => setNewAvailability({ ...newAvailability, start_time: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="time"
                          label="Heure de fin"
                          value={newAvailability.end_time}
                          onChange={(e) => setNewAvailability({ ...newAvailability, end_time: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setAvailabilityDialog(false)}>Annuler</Button>
                    <Button onClick={handleAvailabilitySubmit} variant="contained">
                      Ajouter
                    </Button>
                  </DialogActions>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Galerie photos</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    component="label"
                  >
                    Ajouter une photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {employer.gallery?.map((image) => (
                    <Grid item xs={12} sm={6} md={4} key={image.id}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="200"
                          image={image.url}
                          alt={image.description}
                          onClick={() => {
                            setSelectedImage(image);
                            setGalleryDialog(true);
                          }}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Dialog
                  open={galleryDialog}
                  onClose={() => setGalleryDialog(false)}
                  maxWidth="md"
                  fullWidth
                >
                  {selectedImage && (
                    <>
                      <DialogTitle>{selectedImage.description}</DialogTitle>
                      <DialogContent>
                        <Box
                          component="img"
                          src={selectedImage.url}
                          alt={selectedImage.description}
                          sx={{ width: '100%', height: 'auto' }}
                        />
                      </DialogContent>
                    </>
                  )}
                </Dialog>
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Avis clients
                </Typography>
                <List>
                  {employer.reviews?.map((review) => (
                    <React.Fragment key={review.id}>
                      <ListItem>
                        <ListItemIcon>
                          <StarIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Rating value={review.rating} readOnly size="small" />
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                par {review.client_name}
                              </Typography>
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
                                {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default EmployerProfile; 