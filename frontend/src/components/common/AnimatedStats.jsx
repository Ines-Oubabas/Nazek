import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  People as PeopleIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';

const StatCard = ({ icon, title, value, delay }) => {
  const [count, setCount] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Fade in={true} timeout={1000} style={{ transitionDelay: `${delay}ms` }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box
          sx={{
            color: 'primary.main',
            mb: 2,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component="div"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          {count}+
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Paper>
    </Fade>
  );
};

const AnimatedStats = () => {
  const stats = [
    {
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      title: 'Utilisateurs actifs',
      value: 15000,
    },
    {
      icon: <StarIcon sx={{ fontSize: 40 }} />,
      title: 'Avis positifs',
      value: 4500,
    },
    {
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      title: 'Rendez-vous',
      value: 25000,
    },
    {
      icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
      title: 'Prestataires',
      value: 800,
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} delay={index * 200} />
        </Grid>
      ))}
    </Grid>
  );
};

export default AnimatedStats; 