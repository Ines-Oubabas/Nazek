import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AppointmentList from '../components/appointments/AppointmentList';

const Appointments = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mes Rendez-vous
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez vos rendez-vous et donnez votre avis sur les services
        </Typography>
      </Box>
      <AppointmentList />
    </Container>
  );
};

export default Appointments; 