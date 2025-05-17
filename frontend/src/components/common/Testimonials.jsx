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
    <Box sx={{ position: 'relative', py: 6, px: 2, bgcolor: 'background.default' }}>
      <Typography
        variant="h4"
        component="h2"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 4 }}
      >
        Ce que disent nos clients
      </Typography>

      <Box sx={{ position: 'relative', maxWidth: 800, mx: 'auto' }}>
        <Slide in direction="up" timeout={500} key={currentIndex}>
          <Card
            elevation={4}
            sx={{
              borderRadius: 3,
              px: isMobile ? 2 : 4,
              py: 4,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,245,245,0.85))',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease-in-out',
              boxShadow: theme.shadows[6],
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={testimonials[currentIndex].image}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6">{testimonials[currentIndex].name}</Typography>
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
                    lineHeight: 1.6,
                  }}
                >
                  {testimonials[currentIndex].text}
                </Typography>
              </Box>

              <Rating value={testimonials[currentIndex].rating} readOnly sx={{ color: 'warning.main' }} />
            </CardContent>
          </Card>
        </Slide>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <IconButton
            onClick={handlePrevious}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
              },
              boxShadow: 3,
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
              },
              boxShadow: 3,
              transition: 'all 0.2s ease',
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
