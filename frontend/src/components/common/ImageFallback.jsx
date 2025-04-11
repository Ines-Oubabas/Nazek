import React from 'react';
import { Box, Typography } from '@mui/material';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

const ImageFallback = ({ alt, width, height }) => {
  return (
    <Box
      sx={{
        width: width || '100%',
        height: height || '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1,
      }}
    >
      <ImageNotSupportedIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        {alt || 'Image non disponible'}
      </Typography>
    </Box>
  );
};

export default ImageFallback; 