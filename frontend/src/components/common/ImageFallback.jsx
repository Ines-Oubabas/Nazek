import React from 'react';
import { Box, Typography } from '@mui/material';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

const ImageFallback = ({ alt = 'Image non disponible', width = '100%', height = '200px' }) => {
  return (
    <Box
      sx={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1,
        border: '1px dashed',
        borderColor: 'grey.300',
      }}
    >
      <ImageNotSupportedIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        {alt}
      </Typography>
    </Box>
  );
};

export default ImageFallback;
