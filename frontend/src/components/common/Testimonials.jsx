import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Rating,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  FormatQuote as QuoteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const testimonials = [
  {
    name: 'Marie Dupont',
    role: 'Client satisfait',
    image: '/images/testimonials/user1.jpg',
    rating: 5,
    text: 'Service exceptionnel ! Les prestataires sont très professionnels et le processus de réservation est simple et rapide.',
  },
  {
    name: 'Pierre Martin',
    role: 'Client régulier',
    image: '/images/testimonials/user2.jpg',
    rating: 5,
    text: 'Je recommande vivement cette plateforme. La qualité des services est remarquable et le support client est très réactif.',
  },
  {
    name: 'Sophie Bernard',
    role: 'Nouvelle cliente',
    image: '/images/testimonials/user3.jpg',
    rating: 5,
    text: 'Une expérience utilisateur incroyable ! Tout est intuitif et les prestataires sont soigneusement sélectionnés.',
  },
];

const Testimonials = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <Box sx={{ position: 'relative', py: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        align="center"
        gutterBottom
        sx={{ mb: 4, fontWeight: 'bold' }}
      >
        Ce que disent nos clients
      </Typography>

      <Box sx={{ position: 'relative', maxWidth: 800, mx: 'auto' }}>
        <Fade in={true} timeout={1000}>
          <Card
            elevation={3}
            sx={{
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={testimonials[currentIndex].image}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {testimonials[currentIndex].name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonials[currentIndex].role}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <QuoteIcon sx={{ color: 'primary.main', mr: 1, mt: 0.5 }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontStyle: 'italic',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                  }}
                >
                  {testimonials[currentIndex].text}
                </Typography>
              </Box>

              <Rating
                value={testimonials[currentIndex].rating}
                readOnly
                sx={{ color: 'warning.main' }}
              />
            </CardContent>
          </Card>
        </Fade>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mt: 3,
          }}
        >
          <IconButton
            onClick={handlePrevious}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
              },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Testimonials; 