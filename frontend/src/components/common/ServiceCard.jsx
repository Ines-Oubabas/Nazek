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
import ImageFallback from './ImageFallback';

const ServiceCard = ({
  service,
  onFavoriteClick,
  isFavorite,
  showRating = true,
  showLocation = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/services/${service.id}`);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/placeholder.jpg';
  };

  return (
    <Fade in timeout={1000}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: handleClick ? 'pointer' : 'default',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': handleClick ? {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          } : {},
        }}
        onClick={handleClick}
      >
        <CardMedia
          component="img"
          height={isMobile ? 140 : 200}
          image={service.image || '/images/placeholder.jpg'}
          alt={service.name}
          onError={handleImageError}
          sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
            },
          }}
        />
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            zIndex: 1,
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteClick(service.id);
          }}
        >
          {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
        </IconButton>
        <CardContent sx={{ flexGrow: 1 }}>
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
          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {service.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {showRating && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon
                  sx={{
                    color: theme.palette.warning.main,
                    fontSize: 20,
                    mr: 0.5,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {service.rating?.toFixed(1) || 'N/A'}
                </Typography>
              </Box>
            )}
            {showLocation && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon
                  sx={{
                    color: theme.palette.primary.main,
                    fontSize: 20,
                    mr: 0.5,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {service.location}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {service.tags?.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  background: 'rgba(33, 150, 243, 0.1)',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    background: 'rgba(33, 150, 243, 0.2)',
                  },
                }}
              />
            ))}
          </Box>
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontWeight: 600,
              mt: 'auto',
            }}
          >
            {service.price}€/h
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ServiceCard; 