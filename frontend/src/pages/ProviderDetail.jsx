import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Paper,
  Alert,
  Divider,
  Rating,
  Stack,
  MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";

import { useAuth } from "../contexts/AuthContext";
import { employerAPI, serviceAPI, appointmentAPI } from "../services/api";

const pad2 = (n) => String(n).padStart(2, "0");

const toDateInputValue = (date) => {
  if (!(date instanceof Date)) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const ProviderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookingData, setBookingData] = useState({
    service: "",
    date: toDateInputValue(new Date()),
    time: "10:00",
    notes: "",
  });

  const providerName = useMemo(() => {
    if (!provider) return "Prestataire";
    return (
      provider.name ||
      provider.user?.username ||
      provider.user?.email ||
      `Prestataire #${provider.id}`
    );
  }, [provider]);

  const providerEmail = useMemo(() => {
    return provider?.email || provider?.user?.email || "";
  }, [provider]);

  const providerDescription = useMemo(() => {
    return provider?.description || "Prestataire professionnel disponible sur la plateforme.";
  }, [provider]);

  const providerRating = useMemo(() => {
    const v = Number(provider?.average_rating || 0);
    return Number.isFinite(v) ? v : 0;
  }, [provider]);

  const providerRate = useMemo(() => {
    const r = provider?.hourly_rate;
    if (r === null || r === undefined || r === "") return null;
    return r;
  }, [provider]);

  const resolveDayLabel = (day) => {
    const map = {
      0: "Lundi",
      1: "Mardi",
      2: "Mercredi",
      3: "Jeudi",
      4: "Vendredi",
      5: "Samedi",
      6: "Dimanche",
    };
    return map[day] ?? `Jour ${day}`;
  };

  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      // 1) Récupérer la liste des prestataires puis trouver celui demandé
      const employersRaw = await employerAPI.list();
      const employers = Array.isArray(employersRaw) ? employersRaw : employersRaw?.results ?? [];
      const current = employers.find((e) => String(e.id) === String(id));

      if (!current) {
        setProvider(null);
        setError("Prestataire introuvable.");
        return;
      }

      setProvider(current);

      // 2) Services (pour réservation)
      const servicesRaw = await serviceAPI.list();
      const servicesList = Array.isArray(servicesRaw) ? servicesRaw : servicesRaw?.results ?? [];
      setServices(servicesList);

      // service par défaut
      const defaultServiceId =
        current?.service?.id || current?.service || servicesList?.[0]?.id || "";
      setBookingData((prev) => ({ ...prev, service: String(defaultServiceId || "") }));

      // 3) Disponibilités du prestataire
      try {
        const avRaw = await employerAPI.getAvailabilities(current.id);
        const avList = Array.isArray(avRaw) ? avRaw : avRaw?.results ?? [];
        setAvailabilities(avList);
      } catch {
        // endpoint dispo mais peut être vide/partiel
        setAvailabilities([]);
      }
    } catch (err) {
      setError(err.message || "Erreur lors du chargement du prestataire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openBooking = () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setBookingDialog(true);
  };

  const closeBooking = () => {
    setBookingDialog(false);
  };

  const handleBookingSubmit = async () => {
    try {
      if (!user) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      if (!provider?.id) throw new Error("Prestataire introuvable.");
      if (!bookingData.service) throw new Error("Veuillez sélectionner un service.");
      if (!bookingData.date || !bookingData.time) {
        throw new Error("Veuillez sélectionner une date et une heure.");
      }

      setBookingLoading(true);

      await appointmentAPI.create({
        employer: provider.id,
        service: Number(bookingData.service),
        date: bookingData.date, // YYYY-MM-DD
        time: bookingData.time, // HH:mm
        notes: bookingData.notes,
      });

      setBookingDialog(false);
      navigate("/appointments");
    } catch (err) {
      setError(err.message || "Erreur lors de la création du rendez-vous.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!provider) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Prestataire introuvable."}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.2}>
        {/* Header profil */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background:
                "radial-gradient(circle at 10% -30%, rgba(255,138,28,.14), transparent 38%), #171a21",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Avatar
                src={provider?.profile_picture}
                sx={{
                  width: 88,
                  height: 88,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: alpha("#ff8a1c", 0.18),
                  color: "primary.main",
                }}
              >
                {providerName?.[0]?.toUpperCase() || "P"}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {providerName}
                  </Typography>
                  <VerifiedIcon sx={{ color: "primary.main" }} />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                  <Chip label={provider?.is_verified ? "Vérifié" : "Non vérifié"} color={provider?.is_verified ? "success" : "default"} />
                  <Chip label={provider?.is_active ? "Disponible" : "Indisponible"} color={provider?.is_active ? "info" : "warning"} />
                </Stack>

                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {providerDescription}
                </Typography>
              </Box>

              <Button variant="contained" startIcon={<CalendarIcon />} onClick={openBooking}>
                Prendre rendez-vous
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Infos + dispos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.4, borderRadius: 3.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
              Informations
            </Typography>
            <Divider sx={{ mb: 1.6 }} />

            <Stack spacing={1.1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon sx={{ color: "primary.main" }} />
                <Typography>{providerName}</Typography>
              </Box>

              {providerEmail && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography color="text.secondary">Email :</Typography>
                  <Typography>{providerEmail}</Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Rating value={providerRating} readOnly precision={0.5} />
                <Typography color="text.secondary">
                  ({provider?.total_reviews || 0} avis)
                </Typography>
              </Box>

              {providerRate ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MoneyIcon sx={{ color: "primary.main" }} />
                  <Typography>{providerRate} €/h</Typography>
                </Box>
              ) : null}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.4, borderRadius: 3.5, mt: 2.2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
              Disponibilités
            </Typography>
            <Divider sx={{ mb: 1.6 }} />

            {availabilities.length === 0 ? (
              <Alert severity="info">Aucune disponibilité renseignée pour le moment.</Alert>
            ) : (
              <Stack spacing={1}>
                {availabilities.map((a) => (
                  <Box
                    key={a.id}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: alpha("#1f2430", 0.5),
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimeIcon sx={{ color: "primary.main", fontSize: 18 }} />
                      <Typography>
                        {resolveDayLabel(a.day_of_week)} — {a.start_time?.slice?.(0, 5) || a.start_time} à{" "}
                        {a.end_time?.slice?.(0, 5) || a.end_time}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Sidebar actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.4, borderRadius: 3.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
              Réserver rapidement
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1.6 }}>
              Lance la réservation en quelques clics depuis ce profil.
            </Typography>

            <Button fullWidth variant="contained" startIcon={<CalendarIcon />} onClick={openBooking}>
              Prendre rendez-vous
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<LocationIcon />}
              sx={{ mt: 1.2 }}
              onClick={() => navigate("/search")}
            >
              Voir d’autres prestataires
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog réservation */}
      <Dialog open={bookingDialog} onClose={closeBooking} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Réserver avec {providerName}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              select
              label="Service"
              value={bookingData.service}
              onChange={(e) => setBookingData((prev) => ({ ...prev, service: e.target.value }))}
            >
              {services.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={bookingData.date}
              onChange={(e) => setBookingData((prev) => ({ ...prev, date: e.target.value }))}
            />

            <TextField
              fullWidth
              type="time"
              label="Heure"
              InputLabelProps={{ shrink: true }}
              value={bookingData.time}
              onChange={(e) => setBookingData((prev) => ({ ...prev, time: e.target.value }))}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes (optionnel)"
              placeholder="Précisions pour le prestataire..."
              value={bookingData.notes}
              onChange={(e) => setBookingData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBooking}>Annuler</Button>
          <Button variant="contained" onClick={handleBookingSubmit} disabled={bookingLoading}>
            {bookingLoading ? "Réservation..." : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProviderDetail;