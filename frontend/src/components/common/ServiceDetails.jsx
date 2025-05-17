import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Rating,
  Divider,
  useTheme,
  Fade,
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  Euro,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import AppointmentCalendar from './AppointmentCalendar';

const ServiceDetails = ({ service, onBook }) => {
  const theme = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleFavoriteClick = () => {
    setIsFavorite((prev) => !prev);
  };

  const handleDateTimeSelect = (dateTime) => {
    if (onBook) {
      onBook(service, dateTime);
    }
  };

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={4}>
          {/* Infos principales */}
          <Grid item xs={12} md={8}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img
                src={service?.image || '/images/placeholder.jpg'}
                alt={service?.name}
                style={{
                  width: '100%',
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
              <Button
                onClick={handleFavoriteClick}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.9)',
                  minWidth: 0,
                  borderRadius: '50%',
                  '&:hover': {
                    background: 'white',
                  },
                }}
              >
                {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
              </Button>
            </Box>

            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {service?.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={service?.rating} readOnly precision={0.5} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({service?.reviewCount || 0} avis)
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              {service?.description}
            </Typography>

            {/* Tags */}
            {service?.tags?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {service.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      sx={{
                        background: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                          background: theme.palette.primary.main,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <Typography>{service?.location || 'Non spécifiée'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime color="primary" sx={{ mr: 1 }} />
                <Typography>{service?.duration} min</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Euro color="primary" sx={{ mr: 1 }} />
                <Typography>{service?.price} €</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Prestataire */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Prestataire
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <img
                  src={service?.provider?.image || '/images/placeholder-avatar.jpg'}
                  alt={service?.provider?.name}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    marginRight: 12,
                    objectFit: 'cover',
                  }}
                />
                <Box>
                  <Typography variant="subtitle1">
                    {service?.provider?.name}
                  </Typography>
                  <Rating
                    value={service?.provider?.rating || 0}
                    readOnly
                    size="small"
                  />
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => setShowCalendar(true)}
                sx={{
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33,203,243,.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Réserver maintenant
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Calendrier de réservation */}
      {showCalendar && (
        <Fade in={true}>
          <Box sx={{ mt: 4 }}>
            <AppointmentCalendar
              onSelectDateTime={handleDateTimeSelect}
              provider={service?.provider}
            />
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default ServiceDetails;
