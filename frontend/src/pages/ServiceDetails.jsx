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

const pad2 = (n) => String(n).padStart(2, "0");

const normalizeDateTime = (value) => {
  if (!value) return { date: "", time: "" };

  if (typeof value === "object" && (value.date || value.time)) {
    let dateStr = "";
    if (value.date instanceof Date) {
      dateStr = `${value.date.getFullYear()}-${pad2(value.date.getMonth() + 1)}-${pad2(
        value.date.getDate()
      )}`;
    } else if (typeof value.date === "string") {
      dateStr = value.date.includes("T") ? value.date.split("T")[0] : value.date;
    }

    let timeStr = "";
    if (typeof value.time === "string") {
      timeStr = value.time.slice(0, 5);
    } else if (value.date instanceof Date) {
      timeStr = `${pad2(value.date.getHours())}:${pad2(value.date.getMinutes())}`;
    }

    return { date: dateStr, time: timeStr };
  }

  if (value instanceof Date) {
    return {
      date: `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`,
      time: `${pad2(value.getHours())}:${pad2(value.getMinutes())}`,
    };
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

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  const getEmployerName = (e) =>
    e?.name || e?.user?.username || e?.user?.email || `Prestataire #${e?.id}`;

  const getEmployerDesc = (e) =>
    e?.description || e?.bio || e?.user?.first_name || "Prestataire de service";

  const employersForService = useMemo(() => {
    if (!service) return [];

    const sId = String(service.id);
    const sName = String(service.name || "").toLowerCase();

    const filtered = employers.filter((e) => {
      if (e?.service && String(e.service) === sId) return true;
      if (e?.service?.id && String(e.service.id) === sId) return true;
      if (e?.category && String(e.category).toLowerCase() === sName) return true;
      if (e?.service_name && String(e.service_name).toLowerCase() === sName) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : employers;
  }, [employers, service]);

  const selectedEmployer = useMemo(() => {
    if (!selectedEmployerId) return employersForService[0] || null;
    return employersForService.find((e) => String(e.id) === String(selectedEmployerId)) || null;
  }, [selectedEmployerId, employersForService]);

  useEffect(() => {
    if (employersForService.length > 0) {
      setSelectedEmployerId((prev) => {
        const stillExists = employersForService.some((e) => String(e.id) === String(prev));
        return stillExists ? prev : String(employersForService[0].id);
      });
    } else {
      setSelectedEmployerId("");
    }
  }, [employersForService]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        const [serviceData, employerList] = await Promise.all([
          serviceAPI.detail(id),
          employerAPI.list(),
        ]);

        setService(serviceData);
        const list = Array.isArray(employerList) ? employerList : employerList?.results ?? [];
        setEmployers(list);
      } catch (err) {
        setError(err.message || "Une erreur est survenue lors du chargement du service");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const goLogin = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  const handleFavoriteClick = () => {
    setIsFavorite((prev) => !prev);
  };

  const handleOpenCalendar = () => {
    if (!user) return goLogin();
    if (!service) {
      setError("Service introuvable.");
      return;
    }
    if (service.is_active === false) {
      setError("Ce service est indisponible pour le moment.");
      return;
    }
    if (!selectedEmployer) {
      setError("Veuillez sélectionner un prestataire avant de réserver.");
      return;
    }
    setError("");
    setShowCalendar(true);
  };

  const handleSelectDateTime = (dateTime) => {
    if (!user) return goLogin();
    if (!selectedEmployer) {
      setError("Veuillez sélectionner un prestataire avant de choisir une date.");
      return;
    }
    setError("");
    setSelectedDateTime(dateTime);
    setShowBookingDialog(true);
  };

  const handleCloseDialog = () => {
    setShowBookingDialog(false);
  };

  const handleConfirmBooking = async () => {
    try {
      if (!user) return goLogin();

      if (!service) throw new Error("Service introuvable.");
      if (!selectedEmployer) throw new Error("Prestataire introuvable.");
      if (!selectedDateTime) throw new Error("Veuillez choisir une date et une heure.");

      const { date, time } = normalizeDateTime(selectedDateTime);

      if (!date || !time) {
        throw new Error("Date/heure invalide. Veuillez re-sélectionner un créneau.");
      }

      setError("");

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
      if (err.status === 401) return goLogin();
      setError(err.message || "Erreur lors de la réservation");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !service) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Service non trouvé</Alert>
      </Container>
    );
  }

  const { date: pickedDate, time: pickedTime } = normalizeDateTime(selectedDateTime);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 7 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.2}>
        {/* Main panel */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background:
                "radial-gradient(circle at 10% -30%, rgba(255,138,28,.14), transparent 38%), #171a21",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {service.name}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                  {service.icon ? <Chip label={service.icon} /> : null}
                  {service.is_active === false ? (
                    <Chip color="warning" label="Indisponible" />
                  ) : (
                    <Chip color="success" label="Actif" />
                  )}
                </Stack>
              </Box>

              <Button
                startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleFavoriteClick}
                variant={isFavorite ? "contained" : "outlined"}
              >
                {isFavorite ? "Favori" : "Ajouter aux favoris"}
              </Button>
            </Stack>

            <Box sx={{ mb: 2 }}>
              <Rating value={Number(service.rating || 0)} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                {service.review_count ? `${service.review_count} avis` : "Aucun avis pour le moment"}
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              {service.description || "Aucune description."}
            </Typography>

            <Stack spacing={1.2} sx={{ mb: 2.2 }}>
              {service.location ? (
                <Box sx={{ display: "flex", gap: 1.2, alignItems: "center" }}>
                  <LocationIcon sx={{ color: "primary.main" }} />
                  <Typography>{service.location}</Typography>
                </Box>
              ) : null}

              {service.duration ? (
                <Box sx={{ display: "flex", gap: 1.2, alignItems: "center" }}>
                  <TimeIcon sx={{ color: "primary.main" }} />
                  <Typography>Durée estimée: {service.duration} minutes</Typography>
                </Box>
              ) : null}

              {service.price ? (
                <Box sx={{ display: "flex", gap: 1.2, alignItems: "center" }}>
                  <EuroIcon sx={{ color: "primary.main" }} />
                  <Typography sx={{ fontWeight: 700 }}>{service.price}€</Typography>
                </Box>
              ) : null}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={service.is_active === false}
              onClick={handleOpenCalendar}
              startIcon={<CalendarMonthIcon />}
            >
              Réserver ce service
            </Button>
          </Paper>

          {showCalendar && (
            <Paper sx={{ mt: 2.2, p: 2.2, borderRadius: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.2 }}>
                Choisissez une date et une heure
              </Typography>
              <AppointmentCalendar onSelectDateTime={handleSelectDateTime} />
            </Paper>
          )}
        </Grid>

        {/* Right panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.2, borderRadius: 3.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
              <PersonIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Prestataire
              </Typography>
            </Stack>

            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <InputLabel>Choisir un prestataire</InputLabel>
              <Select
                value={selectedEmployerId}
                label="Choisir un prestataire"
                onChange={(e) => setSelectedEmployerId(e.target.value)}
              >
                {employersForService.map((e) => (
                  <MenuItem key={e.id} value={String(e.id)}>
                    {getEmployerName(e)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedEmployer ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: alpha("#1f2430", 0.52),
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {getEmployerName(selectedEmployer)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
                  {getEmployerDesc(selectedEmployer)}
                </Typography>
              </Box>
            ) : (
              <Alert severity="info">Aucun prestataire trouvé.</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={showBookingDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmer la réservation</DialogTitle>
        <DialogContent>
          {pickedDate && pickedTime ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Créneau sélectionné : <b>{pickedDate}</b> à <b>{pickedTime}</b>
            </Alert>
          ) : null}

          <Typography variant="body1" sx={{ mb: 1 }}>
            Notes pour le prestataire (optionnel)
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            placeholder="Ex: Adresse, détails du besoin, étage, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleConfirmBooking}>
            Confirmer la réservation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceDetails;