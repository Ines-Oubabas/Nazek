// frontend/src/pages/Login.tsx

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Connexion JWT via AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Échec de la connexion. Vérifiez vos identifiants.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className="mt-10 mb-6">
      <Paper elevation={4} className="p-8 rounded-xl shadow-lg bg-white">
        <Typography variant="h4" align="center" className="mb-4 font-bold text-primary">
          Connexion
        </Typography>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            className="mt-4"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <Box className="text-center mt-6">
          <Typography variant="body2">
            Vous n'avez pas de compte ?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Inscrivez-vous
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
