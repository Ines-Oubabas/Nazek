import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import AppointmentList from '@/components/appointments/AppointmentList'; // ✅ Correction ici : chemin absolu

const Appointments = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <Paper elevation={2} sx={{ p: 6 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            Mes Rendez-vous
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez vos rendez-vous et donnez votre avis sur les services reçus
          </Typography>
        </Box>
        <AppointmentList />
      </Paper>
    </Container>
  );
};

export default Appointments;
