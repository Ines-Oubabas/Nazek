import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const AnimatedBackground = ({ children }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(-45deg, rgba(33, 150, 243, 0.1), rgba(33, 203, 243, 0.1), rgba(245, 0, 87, 0.1), rgba(33, 150, 243, 0.1))',
          backgroundSize: '400% 400%',
          animation: `${gradientAnimation} 15s ease infinite`,
          zIndex: -1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
          backdropFilter: 'blur(10px)',
          zIndex: -1,
        },
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedBackground; 