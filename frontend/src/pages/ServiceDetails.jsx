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
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from "@mui/icons-material";

import AppointmentCalendar from "../components/common/AppointmentCalendar";
import { useAuth } from "../contexts/AuthContext";
import { serviceAPI, employerAPI, appointmentAPI } from "../services/api";

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * Rend la sortie toujours compatible backend:
 * -> { date: "YYYY-MM-DD", time: "HH:MM" }
 *
 * Accepte:
 * - { date: "YYYY-MM-DD", time: "HH:MM" }
 * - { date: Date, time: "HH:MM" }
 * - Date (JS Date)
 * - string ISO
 */
const normalizeDateTime = (value) => {
  if (!value) return { date: "", time: "" };

  // Case 1: object {date, time}
  if (typeof value === "object" && (value.date || value.time)) {
    // date part
    let dateStr = "";
    if (value.date instanceof Date) {
      dateStr = `${value.date.getFullYear()}-${pad2(value.date.getMonth() + 1)}-${pad2(
        value.date.getDate()
      )}`;
    } else if (typeof value.date === "string") {
      // "YYYY-MM-DD" ou ISO
      dateStr = value.date.includes("T") ? value.date.split("T")[0] : value.date;
    }

    // time part
    let timeStr = "";
    if (typeof value.time === "string") {
      timeStr = value.time.slice(0, 5); // "HH:MM"
    } else if (value.date instanceof Date) {
      timeStr = `${pad2(value.date.getHours())}:${pad2(value.date.getMinutes())}`;
    }

    return { date: dateStr, time: timeStr };
  }

  // Case 2: Date
  if (value instanceof Date) {
    return {
      date: `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`,
      time: `${pad2(value.getHours())}:${pad2(value.getMinutes())}`,
    };
  }

  // Case 3: string ISO
  if (typeof value === "string") {
    // ISO: "YYYY-MM-DDTHH:MM..."
    if (value.includes("T")) {
      const [d, t] = value.split("T");
      return { date: d, time: (t || "").slice(0, 5) };
    }
    // only date
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

  // Helpers robustes (structure employeur inconnue)
  const getEmployerName = (e) =>
    e?.name || e?.user?.username || e?.user?.email || `Prestataire #${e?.id}`;

  const getEmployerDesc = (e) =>
    e?.description || e?.bio || e?.user?.first_name || "Prestataire de service";

  // Filtrage employeurs liés au service (plusieurs formats possibles)
  const employersForService = useMemo(() => {
    if (!service) return [];

    const sId = String(service.id);
    const sName = String(service.name || "").toLowerCase();

    const filtered = employers.filter((e) => {
      // cas 1: employer.service = id
      if (e?.service && String(e.service) === sId) return true;
      // cas 2: employer.service.id = id
      if (e?.service?.id && String(e.service.id) === sId) return true;
      // cas 3: name/category match
      if (e?.category && String(e.category).toLowerCase() === sName) return true;
      if (e?.service_name && String(e.service_name).toLowerCase() === sName) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : employers;
  }, [employers, service]);

  // Employer sélectionné
  const selectedEmployer = useMemo(() => {
    if (!selectedEmployerId) return employersForService[0] || null;
    return employersForService.find((e) => String(e.id) === String(selectedEmployerId)) || null;
  }, [selectedEmployerId, employersForService]);

  // Auto-select quand la liste filtrée change
  useEffect(() => {
    if (employersForService.length > 0) {
      setSelectedEmployerId((prev) => {
        // garde la sélection si elle existe encore
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

        // On peut laisser employerAPI.list() (pas besoin du filtre, on filtre côté front)
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
    // Favoris non branché backend -> UI only
    setIsFavorite((prev) => !prev);
  };

  const handleOpenCalendar = () => {
    // ✅ Forcer login avant d’ouvrir la réservation
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
    // ✅ Re-check login
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
      // ✅ Forcer login avant POST
      if (!user) return goLogin();

      if (!service) throw new Error("Service introuvable.");
      if (!selectedEmployer) throw new Error("Prestataire introuvable.");
      if (!selectedDateTime) throw new Error("Veuillez choisir une date et une heure.");

      const { date, time } = normalizeDateTime(selectedDateTime);

      if (!date || !time) {
        throw new Error("Date/heure invalide. Veuillez re-sélectionner un créneau.");
      }

      setError("");

      // ✅ Payload compatible backend (views.normalize_appointment_payload)
      await appointmentAPI.create({
        service: service.id,
        employer: selectedEmployer.id,
        date, // "YYYY-MM-DD"
        time, // "HH:MM"
        notes: bookingNotes, // backend -> description
        // Optionnel: si tu veux, tu peux envoyer estimated_duration:
        // estimated_duration: service.duration || 60,
      });

      // reset UI
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 3,
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h4" component="h1">
                  {service.name}
                </Typography>

                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {service.icon ? <Chip label={service.icon} /> : null}
                  {service.is_active === false ? (
                    <Chip color="warning" label="Indisponible" />
                  ) : (
                    <Chip color="success" label="Actif" />
                  )}
                </Box>
              </Box>

              <Button
                startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleFavoriteClick}
                color={isFavorite ? "secondary" : "inherit"}
              >
                {isFavorite ? "Favori" : "Ajouter aux favoris"}
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Rating value={Number(service.rating || 0)} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {service.review_count ? `${service.review_count} avis` : "Aucun avis pour le moment"}
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              {service.description || "Aucune description."}
            </Typography>

            {service.location ? (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                <LocationIcon color="action" />
                <Typography>{service.location}</Typography>
              </Box>
            ) : null}

            {service.duration ? (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                <TimeIcon color="action" />
                <Typography>Durée: {service.duration} minutes</Typography>
              </Box>
            ) : null}

            {service.price ? (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                <EuroIcon color="action" />
                <Typography variant="h6">{service.price}€</Typography>
              </Box>
            ) : null}

            <Divider sx={{ my: 3 }} />

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={service.is_active === false}
              onClick={handleOpenCalendar}
            >
              Réserver
            </Button>
          </Paper>

          {showCalendar && (
            <Box sx={{ mt: 4 }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Choisissez une date et une heure
                </Typography>
                <AppointmentCalendar onSelectDateTime={handleSelectDateTime} />
              </Paper>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Choisir un prestataire
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Prestataire</InputLabel>
              <Select
                value={selectedEmployerId}
                label="Prestataire"
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
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {getEmployerName(selectedEmployer)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {getEmployerDesc(selectedEmployer)}
                </Typography>
              </>
            ) : (
              <Alert severity="info">Aucun prestataire trouvé.</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={showBookingDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer la réservation</DialogTitle>
        <DialogContent>
          {pickedDate && pickedTime ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Créneau sélectionné : <b>{pickedDate}</b> à <b>{pickedTime}</b>
            </Alert>
          ) : null}

          <Typography variant="body1" gutterBottom>
            Notes pour le prestataire (optionnel)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            placeholder="Ex: Adresse, détails du besoin, étage, etc."
            sx={{ mt: 2 }}
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