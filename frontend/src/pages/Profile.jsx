import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      await updateUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      });
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={3} className="p-6">
        <Box display="flex" alignItems="center" mb={4}>
          <Avatar sx={{ width: 72, height: 72, mr: 2 }} src={user.profile_picture || ''} />
          <Box>
            <Typography variant="h5" fontWeight={600}>Mon Profil</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
          </Box>
        </Box>

        {success && <Alert severity="success" className="mb-4">{success}</Alert>}
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleProfileUpdate} className="space-y-6 mb-6">
          <Typography variant="h6">Informations personnelles</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Prénom" name="firstName" value={formData.firstName} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom" name="lastName" value={formData.lastName} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Téléphone" name="phone" value={formData.phone} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Mettre à jour'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Divider className="my-6" />

        {/* Partie changement de mot de passe à ajouter plus tard */}
      </Paper>
    </Container>
  );
};

export default Profile;
