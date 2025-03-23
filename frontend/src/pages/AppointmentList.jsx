import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api, { APPOINTMENTS_URL } from '../services/api';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get(APPOINTMENTS_URL);
      setAppointments(response.data);
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des rendez-vous:', err);
      setError('Erreur lors du chargement des rendez-vous. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente':
        return 'warning';
      case 'accepté':
        return 'success';
      case 'refusé':
        return 'error';
      case 'en_cours':
        return 'info';
      case 'terminé':
        return 'success';
      case 'annulé':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente':
        return 'En attente';
      case 'accepté':
        return 'Accepté';
      case 'refusé':
        return 'Refusé';
      case 'en_cours':
        return 'En cours';
      case 'terminé':
        return 'Terminé';
      case 'annulé':
        return 'Annulé';
      default:
        return status;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filters.status !== 'all' && appointment.status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        appointment.service?.name?.toLowerCase().includes(searchLower) ||
        appointment.employer?.name?.toLowerCase().includes(searchLower) ||
        appointment.location?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
        <Button
          variant="contained"
          onClick={fetchAppointments}
          sx={{ mt: 2 }}
        >
          Réessayer
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mes Rendez-vous
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              name="search"
              label="Rechercher"
              value={filters.search}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="en_attente">En attente</MenuItem>
                <MenuItem value="accepté">Acceptés</MenuItem>
                <MenuItem value="refusé">Refusés</MenuItem>
                <MenuItem value="en_cours">En cours</MenuItem>
                <MenuItem value="terminé">Terminés</MenuItem>
                <MenuItem value="annulé">Annulés</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {filteredAppointments.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
            Aucun rendez-vous trouvé.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredAppointments.map((appointment) => (
              <Grid item xs={12} md={6} key={appointment.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{appointment.service?.name}</Typography>
                      <Chip
                        label={getStatusLabel(appointment.status)}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventIcon sx={{ mr: 1 }} />
                      <Typography>
                        {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon sx={{ mr: 1 }} />
                      <Typography>
                        {format(new Date(appointment.date), 'HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1 }} />
                      <Typography>{appointment.employer?.name}</Typography>
                    </Box>
                    
                    {appointment.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationOnIcon sx={{ mr: 1 }} />
                        <Typography>{appointment.location}</Typography>
                      </Box>
                    )}
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      Voir les détails
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default AppointmentList; 