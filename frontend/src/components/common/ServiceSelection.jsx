import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

const services = [
  { id: 'medecin', label: 'Médecin' },
  { id: 'electricien', label: 'Électricien' },
  { id: 'menage', label: 'Ménage' },
  { id: 'plombier', label: 'Plombier' },
];

const ServiceSelection = ({ selectedService, onServiceChange, description, onDescriptionChange }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Informations sur le service
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Service proposé</InputLabel>
        <Select
          value={selectedService}
          onChange={(e) => onServiceChange(e.target.value)}
          label="Service proposé"
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
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Décrivez votre service, vos qualifications et votre expérience..."
      />
    </Box>
  );
};

export default ServiceSelection; 