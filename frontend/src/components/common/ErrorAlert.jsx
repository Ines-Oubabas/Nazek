import React from 'react';
import { Alert, Box, Button, Fade } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const ErrorAlert = ({ message = 'Une erreur est survenue', onRetry, severity = 'error' }) => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Alert
          severity={severity}
          variant="filled"
          action={
            onRetry && (
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Réessayer
              </Button>
            )
          }
          sx={{
            alignItems: 'center',
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem',
            },
          }}
        >
          {message}
        </Alert>
      </Box>
    </Fade>
  );
};

export default ErrorAlert;
