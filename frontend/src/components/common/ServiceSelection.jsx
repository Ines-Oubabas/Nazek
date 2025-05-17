import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';

const services = [
  { id: 'medecin', label: 'Médecin' },
  { id: 'electricien', label: 'Électricien' },
  { id: 'menage', label: 'Ménage' },
  { id: 'plombier', label: 'Plombier' },
];

const ServiceSelection = ({
  selectedService,
  onServiceChange,
  description,
  onDescriptionChange,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Informations sur le service
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="service-select-label">Service proposé</InputLabel>
        <Select
          labelId="service-select-label"
          id="service-select"
          value={selectedService}
          onChange={(e) => onServiceChange(e.target.value)}
          label="Service proposé"
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        >
          {services.map((service) => (
            <MenuItem key={service.id} value={service.id}>
              {service.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Description du service"
        placeholder="Décrivez votre service, vos qualifications, votre expérience..."
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
          },
        }}
      />
    </Box>
  );
};

export default ServiceSelection;
