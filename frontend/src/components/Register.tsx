import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Grid,
  Box,
  Paper,
} from '@mui/material';
import { authAPI, serviceAPI } from '@/services/api';
import { Service } from '@/types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'client',
    service: '',
    hourly_rate: '',
    description: '',
  });

  // Charger les services disponibles
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceAPI.list();
        setServices(data);
      } catch {
        setServices([]);
      }
    };
    fetchServices();
  }, []);

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validation et soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, service, hourly_rate, description, ...dataToSend } = formData;

      // Ajouter des champs spécifiques pour les employeurs
      if (formData.role === 'employer') {
        Object.assign(dataToSend, {
          service,
          hourly_rate,
          description,
        });
      }

      // Log des données envoyées
      console.log('Données envoyées à l\'API :', dataToSend);

      // Appel à l'API pour l'inscription
      await authAPI.register(dataToSend);
      setSuccess('Inscription réussie ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      // Log de l'erreur
      console.error('Erreur lors de l\'inscription :', err.response?.data || err.message);

      // Affichage d'un message d'erreur
      const errorMsg =
        err.response?.data?.detail || err.message || 'Erreur lors de l’inscription.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Créer un compte
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="first_name"
                label="Prénom"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                aria-label="Prénom"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="last_name"
                label="Nom"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                aria-label="Nom"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="username"
                label="Nom d'utilisateur"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                aria-label="Nom d'utilisateur"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                aria-label="Email"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="password"
                label="Mot de passe"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                aria-label="Mot de passe"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="confirmPassword"
                label="Confirmer mot de passe"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                aria-label="Confirmer mot de passe"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="phone"
                label="Téléphone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                aria-label="Téléphone"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="address"
                label="Adresse"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                aria-label="Adresse"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="role"
                select
                label="Type de compte"
                name="role"
                value={formData.role}
                onChange={handleChange}
                aria-label="Type de compte"
              >
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="employer">Employeur</MenuItem>
              </TextField>
            </Grid>

            {formData.role === 'employer' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="service"
                    select
                    label="Service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    aria-label="Service"
                  >
                    <MenuItem value="">-- Sélectionner un service --</MenuItem>
                    {services.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="hourly_rate"
                    type="number"
                    name="hourly_rate"
                    label="Tarif horaire (DA)"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    aria-label="Tarif horaire"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="description"
                    multiline
                    rows={3}
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    aria-label="Description"
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "S'inscrire"}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Vous avez déjà un compte ? <Link to="/login">Connectez-vous</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;