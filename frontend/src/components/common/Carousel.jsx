import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Fade,
  Slide,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const Carousel = ({ items }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '400px' : '600px',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      {items.map((item, index) => (
        <Fade
          key={index}
          in={index === currentIndex}
          timeout={1000}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: index === currentIndex ? 'block' : 'none',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <Slide
              direction={index === currentIndex ? 'left' : 'right'}
              in={index === currentIndex}
              timeout={1000}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  textAlign: 'center',
                  color: 'white',
                  p: 4,
                  maxWidth: '800px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography
                  variant={isMobile ? 'h4' : 'h2'}
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                    background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant={isMobile ? 'body1' : 'h6'}
                  paragraph
                  sx={{
                    mb: 4,
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {item.description}
                </Typography>
                {item.button && (
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={item.button.onClick}
                    sx={{
                      background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {item.button.text}
                  </Button>
                )}
              </Box>
            </Slide>
          </Box>
        </Fade>
      ))}

      <IconButton
        onClick={handlePrevious}
        sx={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(5px)',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-50%) scale(1.1)',
          },
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(5px)',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-50%) scale(1.1)',
          },
        }}
      >
        <ChevronRightIcon />
      </IconButton>

      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
        }}
      >
        {items.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                background: 'white',
                transform: 'scale(1.2)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Carousel; 