// frontend/src/components/common/AppointmentCalendar.jsx
import React, { useMemo, useState } from "react";
import { Box, Paper, Typography, Grid, Button, Chip, Fade } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

const DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const AppointmentCalendar = ({ onSelectDateTime, provider, timeSlots = DEFAULT_TIME_SLOTS }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");

  const availableDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)),
    []
  );

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    if (typeof onSelectDateTime !== "function") return;

    onSelectDateTime({
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        backgroundImage: "none",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: "text.primary" }}>
        Sélectionnez une date et une heure
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {provider?.name
          ? `Créneaux proposés par ${provider.name}`
          : "Choisissez un jour puis un créneau pour confirmer votre réservation."}
      </Typography>

      <Box sx={{ mt: 1.2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: "text.secondary" }}>
          Dates disponibles
        </Typography>

        <Grid container spacing={1} sx={{ mb: 2.3 }}>
          {availableDates.map((date) => {
            const active = selectedDate && isSameDay(selectedDate, date);

            return (
              <Grid item key={date.toISOString()}>
                <Chip
                  label={format(date, "EEE d MMM", { locale: fr })}
                  onClick={() => handleDateSelect(date)}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  sx={{
                    fontWeight: 600,
                    borderColor: active ? "transparent" : "divider",
                    bgcolor: active ? "primary.main" : alpha("#232935", 0.45),
                    color: active ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      bgcolor: active ? "primary.main" : alpha("#f38b2a", 0.14),
                      borderColor: active ? "transparent" : "primary.main",
                    },
                  }}
                />
              </Grid>
            );
          })}
        </Grid>

        {selectedDate && (
          <Fade in>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: "text.secondary" }}>
                Créneaux horaires disponibles
              </Typography>

              <Grid container spacing={1}>
                {timeSlots.map((time) => {
                  const active = selectedTime === time;

                  return (
                    <Grid item key={time}>
                      <Chip
                        label={time}
                        onClick={() => handleTimeSelect(time)}
                        color={active ? "primary" : "default"}
                        variant={active ? "filled" : "outlined"}
                        sx={{
                          fontWeight: 600,
                          borderColor: active ? "transparent" : "divider",
                          bgcolor: active ? "primary.main" : alpha("#232935", 0.45),
                          color: active ? "primary.contrastText" : "text.primary",
                          "&:hover": {
                            bgcolor: active ? "primary.main" : alpha("#f38b2a", 0.14),
                            borderColor: active ? "transparent" : "primary.main",
                          },
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Fade>
        )}

        {selectedDate && selectedTime && (
          <Fade in>
            <Box
              sx={{
                mt: 2.4,
                p: 1.6,
                borderRadius: 2.2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: alpha("#232935", 0.45),
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.1 }}>
                Vous avez sélectionné le{" "}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                  {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                </Box>{" "}
                à{" "}
                <Box component="span" sx={{ color: "primary.main", fontWeight: 800 }}>
                  {selectedTime}
                </Box>
                .
              </Typography>

              <Button variant="contained" onClick={handleConfirm}>
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