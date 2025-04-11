// frontend/src/pages/Register.jsx
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
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ServiceSelection from '../components/common/ServiceSelection';

const steps = ['Informations personnelles', 'Type de compte', 'Informations professionnelles'];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Informations personnelles
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Type de compte
  const [isEmployer, setIsEmployer] = useState(false);
  
  // Informations professionnelles
  const [selectedService, setSelectedService] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        is_employer: isEmployer,
        ...(isEmployer && {
          service_type: selectedService,
          service_description: serviceDescription,
        }),
      };

      await register(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleNext}
              sx={{ mt: 3 }}
            >
              Suivant
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isEmployer}
                  onChange={(e) => setIsEmployer(e.target.checked)}
                />
              }
              label="Je suis un prestataire de services"
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Retour</Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Suivant
              </Button>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            {isEmployer && (
              <ServiceSelection
                selectedService={selectedService}
                onServiceChange={setSelectedService}
                description={serviceDescription}
                onDescriptionChange={setServiceDescription}
              />
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Retour</Button>
              <Button
                type="submit"
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Inscription en cours...' : 'S\'inscrire'}
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Inscription
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Vous avez déjà un compte ?{' '}
              <Link component={RouterLink} to="/login">
                Connectez-vous
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
