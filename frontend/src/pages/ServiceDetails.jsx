import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Grid,
  Rating,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";

import AppointmentCalendar from "../components/common/AppointmentCalendar";
import { useAuth } from "../contexts/AuthContext";
import { serviceAPI, employerAPI, appointmentAPI } from "../services/api";

const FAVORITES_KEY = "favorites_services";

const pad2 = (n) => String(n).padStart(2, "0");

const normalizeDateTime = (value) => {
  if (!value) return { date: "", time: "" };

  if (value instanceof Date) {
    return {
      date: `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`,
      time: `${pad2(value.getHours())}:${pad2(value.getMinutes())}`,
    };
  }

  if (typeof value === "object" && (value.date || value.time)) {
    const date = typeof value.date === "string" ? value.date.split("T")[0] : "";
    const time = typeof value.time === "string" ? value.time.slice(0, 5) : "";
    return { date, time };
  }

  if (typeof value === "string") {
    if (value.includes("T")) {
      const [d, t] = value.split("T");
      return { date: d, time: (t || "").slice(0, 5) };
    }
    return { date: value, time: "" };
  }

  return { date: "", time: "" };
};

const readFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isClient, isEmployer } = useAuth();

  const [service, setService] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedEmployerId, setSelectedEmployerId] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const [bookingNotes, setBookingNotes] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const employersForService = useMemo(() => {
    if (!service) return [];
    return employers.filter((e) => Number(e?.service?.id || e?.service) === Number(service.id));
  }, [employers, service]);

  const selectedEmployer = useMemo(() => {
    if (!selectedEmployerId) return employersForService[0] || null;
    return employersForService.find((e) => String(e.id) === String(selectedEmployerId)) || null;
  }, [selectedEmployerId, employersForService]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [serviceData, employerList] = await Promise.all([serviceAPI.detail(id), employerAPI.list()]);
        setService(serviceData);
        const list = Array.isArray(employerList) ? employerList : employerList?.results ?? [];
        setEmployers(list);
      } catch (err) {
        setError(err.message || "Erreur de chargement du service.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (!service?.id) return;
    const favorites = readFavorites();
    setIsFavorite(favorites.map(String).includes(String(service.id)));
  }, [service?.id]);

  useEffect(() => {
    if (employersForService.length > 0) {
      setSelectedEmployerId(String(employersForService[0].id));
    } else {
      setSelectedEmployerId("");
    }
  }, [employersForService]);

  const goLogin = () => navigate("/login", { state: { from: location.pathname } });

  const toggleFavorite = () => {
    if (!service?.id) return;
    const favorites = readFavorites();
    const exists = favorites.map(String).includes(String(service.id));
    const next = exists
      ? favorites.filter((favId) => String(favId) !== String(service.id))
      : [...favorites, service.id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setIsFavorite(!exists);
  };

  const handleOpenCalendar = () => {
    if (!user) return goLogin();

    if (isEmployer) {
      setError("Un prestataire ne peut pas réserver de rendez-vous.");
      return;
    }

    if (!selectedEmployer) {
      setError("Choisis un prestataire.");
      return;
    }

    setError("");
    setShowCalendar(true);
  };

  const handleConfirmBooking = async () => {
    try {
      if (!isClient) throw new Error("Seul un client peut réserver un rendez-vous.");
      if (!selectedEmployer) throw new Error("Prestataire introuvable.");

      const { date, time } = normalizeDateTime(selectedDateTime);
      if (!date || !time) throw new Error("Choisis une date et une heure valides.");

      await appointmentAPI.create({
        service: service.id,
        employer: selectedEmployer.id,
        date,
        time,
        notes: bookingNotes,
      });

      setShowBookingDialog(false);
      setShowCalendar(false);
      setBookingNotes("");
      setSelectedDateTime(null);
      navigate("/appointments");
    } catch (err) {
      setError(err.message || "Réservation impossible.");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 1.5 }}>Chargement du service...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Service introuvable.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 4, mb: 2, background: alpha("#171b22", 0.9) }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {service.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {service.description || "Aucune description."}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.4 }}>
              <Chip icon={<EuroIcon />} label="Prix selon prestataire" />
              <Chip icon={<LocationIcon />} label="À domicile / sur site" />
              <Chip icon={<TimeIcon />} label="Créneaux disponibles" />
            </Stack>
          </Box>

          <Button
            variant={isFavorite ? "contained" : "outlined"}
            startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            onClick={toggleFavorite}
          >
            {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
              Prestataires
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="provider-select">Choisir un prestataire</InputLabel>
              <Select
                labelId="provider-select"
                label="Choisir un prestataire"
                value={selectedEmployerId}
                onChange={(e) => setSelectedEmployerId(e.target.value)}
              >
                {employersForService.map((e) => (
                  <MenuItem key={e.id} value={String(e.id)}>
                    {e.name || `Prestataire #${e.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedEmployer ? (
              <Paper sx={{ p: 1.8, mt: 1.7, borderRadius: 2.5 }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
                  <PersonIcon sx={{ color: "primary.main" }} />
                  <Typography sx={{ fontWeight: 700 }}>{selectedEmployer.name}</Typography>
                </Stack>
                <Rating value={Number(selectedEmployer.average_rating || 0)} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedEmployer.description || "Aucune description du prestataire."}
                </Typography>
              </Paper>
            ) : (
              <Alert severity="warning" sx={{ mt: 1.5 }}>
                Aucun prestataire trouvé pour ce service.
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Réservation
            </Typography>
            <Divider sx={{ my: 1.4 }} />

            {isEmployer && (
              <Alert severity="info" sx={{ mb: 1.5 }}>
                Compte prestataire: vous ne pouvez pas créer de rendez-vous.
              </Alert>
            )}

            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={handleOpenCalendar}
              disabled={!isClient}
            >
              Choisir un créneau
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={showCalendar} onClose={() => setShowCalendar(false)} fullWidth maxWidth="md">
        <DialogTitle>Choisir une date et une heure</DialogTitle>
        <DialogContent>
          <AppointmentCalendar
            onSelectDateTime={(dt) => {
              setSelectedDateTime(dt);
              setShowBookingDialog(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showBookingDialog} onClose={() => setShowBookingDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirmer la réservation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Ajoute un commentaire pour préciser ton besoin.
          </Typography>
          <TextField
            fullWidth
            label="Notes"
            multiline
            minRows={3}
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBookingDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleConfirmBooking}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceDetails;