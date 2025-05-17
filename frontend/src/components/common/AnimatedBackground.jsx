import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react'; // ✅ préférer emotion pour compatibilité

// 🔄 Animation du dégradé
const gradientKeyframes = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const AnimatedBackground = ({ children }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(-45deg, #2196f3, #21CBF3, #f50057, #2196f3)',
          backgroundSize: '400% 400%',
          animation: `${gradientKeyframes} 18s ease infinite`,
          opacity: 0.25,
          zIndex: -2,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(12px)',
          zIndex: -1,
        },
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedBackground;
