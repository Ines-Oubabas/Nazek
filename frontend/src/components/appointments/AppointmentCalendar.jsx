import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { format, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const AppointmentCalendar = ({ onSelectDateTime }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Générer les 7 prochains jours
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Générer les créneaux horaires (9h à 17h, par 30 minutes)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (selectedDate) {
      onSelectDateTime({
        date: format(selectedDate, 'yyyy-MM-dd'),
        time,
      });
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Sélectionnez une date
      </Typography>
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {dates.map((date) => (
          <Grid item xs={4} sm={3} md={2} key={date.toString()}>
            <Paper
              elevation={selectedDate && isSameDay(selectedDate, date) ? 3 : 1}
              sx={{
                p: 1,
                textAlign: 'center',
                cursor: 'pointer',
                background: selectedDate && isSameDay(selectedDate, date)
                  ? 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)'
                  : 'rgba(255, 255, 255, 0.9)',
                color: selectedDate && isSameDay(selectedDate, date) ? 'white' : 'inherit',
                '&:hover': {
                  background: selectedDate && isSameDay(selectedDate, date)
                    ? 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)'
                    : 'rgba(255, 255, 255, 0.95)',
                },
              }}
              onClick={() => handleDateSelect(date)}
            >
              <Typography variant="caption" display="block">
                {format(date, 'EEE', { locale: fr })}
              </Typography>
              <Typography variant="body2">
                {format(date, 'd MMM', { locale: fr })}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Fade in={!!selectedDate}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Sélectionnez une heure
          </Typography>
          <Grid container spacing={1}>
            {timeSlots.map((time) => (
              <Grid item xs={4} sm={3} md={2} key={time}>
                <Button
                  variant={selectedTime === time ? 'contained' : 'outlined'}
                  fullWidth
                  size="small"
                  onClick={() => handleTimeSelect(time)}
                  sx={{
                    background: selectedTime === time
                      ? 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)'
                      : 'transparent',
                    '&:hover': {
                      background: selectedTime === time
                        ? 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)'
                        : 'rgba(33, 150, 243, 0.1)',
                    },
                  }}
                >
                  {time}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Fade>
    </Box>
  );
};

export default AppointmentCalendar; 