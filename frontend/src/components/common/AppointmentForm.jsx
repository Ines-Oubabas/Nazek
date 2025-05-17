import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const AppointmentForm = ({ open, onClose, onSubmit, service, provider }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    serviceFor: 'self',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      serviceFor: 'self',
      email: '',
      phone: '',
      address: '',
      notes: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      service: service.id,
      provider: provider.id,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Réservation de {service.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          avec {provider.name}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel>Le service est pour</FormLabel>
                <RadioGroup
                  row
                  name="serviceFor"
                  value={formData.serviceFor}
                  onChange={handleChange}
                  sx={{
                    '& .MuiFormControlLabel-root': { marginRight: 4 },
                  }}
                >
                  <FormControlLabel
                    value="self"
                    control={<Radio sx={{ color: theme.palette.primary.main, '&.Mui-checked': { color: theme.palette.primary.main } }} />}
                    label="Moi-même"
                  />
                  <FormControlLabel
                    value="other"
                    control={<Radio sx={{ color: theme.palette.primary.main, '&.Mui-checked': { color: theme.palette.primary.main } }} />}
                    label="Un proche"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de téléphone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                inputProps={{ pattern: '[0-9]{10}' }}
                helperText="Format : 0612345678"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse du service"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description détaillée"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleReset} sx={{ color: theme.palette.text.secondary }}>
            Réinitialiser
          </Button>
          <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Continuer vers le paiement
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AppointmentForm;
