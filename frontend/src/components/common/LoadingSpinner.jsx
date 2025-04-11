import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const LoadingSpinner = ({ message = 'Chargement...' }) => {
  const theme = useTheme();

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          gap: 2,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 4,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: '200px',
          }}
        >
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default LoadingSpinner; 