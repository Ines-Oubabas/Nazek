import React, { useEffect, useState } from 'react';
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

// Format français des nombres
const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num);

const StatCard = ({ icon, title, value, delay }) => {
  const [count, setCount] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    let start = null;
    const duration = 2000;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percent = Math.min(progress / duration, 1);
      setCount(Math.floor(percent * value));
      if (progress < duration) {
        requestAnimationFrame(step);
      }
    };

    const timeout = setTimeout(() => {
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <Fade in timeout={1000} style={{ transitionDelay: `${delay}ms` }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          textAlign: 'center',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.8))',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ color: 'primary.main', mb: 2 }}>{icon}</Box>
        <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight="bold" mb={1}>
          {formatNumber(count)}+
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
    <Grid container spacing={3} sx={{ mt: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} delay={index * 250} />
        </Grid>
      ))}
    </Grid>
  );
};

export default AnimatedStats;
