import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

const LoadingSpinner = ({ message = 'Chargement en cours...', height = '200px', size = 60 }) => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: height,
          gap: 2,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(6px)',
          borderRadius: 2,
          p: 4,
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        <CircularProgress size={size} thickness={4} color="primary" />
        <Typography variant="body1" sx={{ fontWeight: 500, maxWidth: 220 }}>
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default LoadingSpinner;
