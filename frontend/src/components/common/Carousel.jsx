// frontend/src/components/common/Carousel.jsx

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';

const Carousel = ({ items, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  useEffect(() => {
    const autoSlide = setInterval(nextSlide, interval);
    return () => clearInterval(autoSlide);
  }, [items.length, interval]);

  if (!items || items.length === 0) {
    return null; // Aucun élément à afficher
  }

  const currentItem = items[currentIndex];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      {/* Image */}
      <Box
        component="img"
        src={currentItem.image}
        alt={currentItem.title}
        sx={{
          width: '100%',
          height: { xs: 250, md: 400 },
          objectFit: 'cover',
        }}
      />

      {/* Texte et bouton */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          {currentItem.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {currentItem.description}
        </Typography>
        {currentItem.button && (
          <Button
            variant="contained"
            color="secondary"
            onClick={currentItem.button.onClick}
          >
            {currentItem.button.text}
          </Button>
        )}
      </Box>

      {/* Boutons navigation */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 16,
          transform: 'translateY(-50%)',
        }}
      >
        <Button
          onClick={prevSlide}
          sx={{
            minWidth: 0,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.3)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
          }}
        >
          <ArrowBackIos />
        </Button>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: 16,
          transform: 'translateY(-50%)',
        }}
      >
        <Button
          onClick={nextSlide}
          sx={{
            minWidth: 0,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.3)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
          }}
        >
          <ArrowForwardIos />
        </Button>
      </Box>
    </Box>
  );
};

export default Carousel;
