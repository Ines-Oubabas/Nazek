// frontend/src/components/common/ServiceCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const ServiceCard = ({
  service,
  onFavoriteClick = () => {},
  isFavorite = false,
  showRating = true,
  showLocation = true,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = () => {
    navigate(`/services/${service.id}`);
  };

  return (
    <Fade in timeout={500}>
      <Card
        onClick={handleClick}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 6,
          },
        }}
      >
        {/* Image */}
        <CardMedia
          component="img"
          height={isMobile ? 160 : 220}
          image={service.image || '/images/placeholder.jpg'}
          alt={service.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/placeholder.jpg';
          }}
        />

        {/* Bouton Favoris */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteClick(service.id);
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.4)',
            color: 'white',
            '&:hover': {
              background: 'rgba(0,0,0,0.6)',
            },
          }}
        >
          {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
        </IconButton>

        {/* Contenu */}
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Nom du service */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {service.name}
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1,
            }}
          >
            {service.description}
          </Typography>

          {/* Infos : Rating + Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            {showRating && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon sx={{ fontSize: 20, color: theme.palette.warning.main, mr: 0.5 }} />
                <Typography variant="body2">
                  {service.rating ? service.rating.toFixed(1) : 'N/A'}
                </Typography>
              </Box>
            )}
            {showLocation && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ fontSize: 20, color: theme.palette.primary.main, mr: 0.5 }} />
                <Typography variant="body2">{service.location || 'Non spécifié'}</Typography>
              </Box>
            )}
          </Box>

          {/* Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {service.tags?.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  background: 'rgba(33, 150, 243, 0.1)',
                  color: theme.palette.primary.main,
                }}
              />
            ))}
          </Box>

          {/* Prix */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
            {service.price ? `${service.price} DA/h` : 'Prix non défini'}
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ServiceCard;
