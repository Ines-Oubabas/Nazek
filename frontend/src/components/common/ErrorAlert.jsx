import React from 'react';
import { Alert, Box, Button, Fade } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ErrorAlert = ({ message, onRetry }) => {
  const theme = useTheme();

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          p: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Alert
          severity="error"
          sx={{
            '& .MuiAlert-icon': {
              color: theme.palette.error.main,
            },
            '& .MuiAlert-message': {
              color: theme.palette.error.dark,
            },
          }}
          action={
            onRetry && (
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    background: 'rgba(211, 47, 47, 0.1)',
                  },
                }}
              >
                Réessayer
              </Button>
            )
          }
        >
          {message}
        </Alert>
      </Box>
    </Fade>
  );
};

export default ErrorAlert; 