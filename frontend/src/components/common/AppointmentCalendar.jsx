import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  useTheme,
  Fade,
} from '@mui/material';
import { format, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00',
];

const AppointmentCalendar = ({ onSelectDateTime }) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const finalDate = new Date(selectedDate);
      finalDate.setHours(hours, minutes, 0, 0);
      onSelectDateTime({
        date: finalDate.toISOString().split('T')[0],
        time: selectedTime,
      });
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}
    >
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
        Sélectionnez une date et une heure
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Dates disponibles
        </Typography>
        <Grid container spacing={1} sx={{ mb: 3 }}>
          {availableDates.map((date) => (
            <Grid item key={date.toDateString()}>
              <Chip
                label={format(date, 'EEE d MMM', { locale: fr })}
                onClick={() => handleDateSelect(date)}
                color={selectedDate && isSameDay(selectedDate, date) ? 'primary' : 'default'}
                sx={{
                  '&:hover': {
                    background: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>

        {selectedDate && (
          <Fade in>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Créneaux horaires disponibles
              </Typography>
              <Grid container spacing={1}>
                {timeSlots.map((time) => (
                  <Grid item key={time}>
                    <Chip
                      label={time}
                      onClick={() => handleTimeSelect(time)}
                      color={selectedTime === time ? 'primary' : 'default'}
                      sx={{
                        '&:hover': {
                          background: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                        },
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        )}

        {selectedDate && selectedTime && (
          <Fade in>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                Sélectionné : {format(selectedDate, 'EEEE d MMMM', { locale: fr })} à {selectedTime}
              </Typography>
              <Button
                variant="contained"
                onClick={handleConfirm}
                sx={{
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Confirmer la sélection
              </Button>
            </Box>
          </Fade>
        )}
      </Box>
    </Paper>
  );
};

export default AppointmentCalendar;
