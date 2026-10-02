import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AddCircleOutline as AddIcon,
  EventBusy as CancelIcon,
  EventAvailable as AcceptIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Payment as PaymentIcon,
  Close as RefuseIcon,
  InfoOutlined as InfoIcon,
  CheckCircleOutline as MarkPaidIcon,
  Inventory2Outlined as ArchiveIcon,
} from "@mui/icons-material";

import {
  appointmentAPI,
  employerAPI,
  getServices,
  isMapboxConfigured,
  isStripeConfigured,
  searchPlacesMapbox,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const statusLabelMap = {
  en_attente: "En attente",
  accepté: "Accepté",
  refuse: "Refusé",
  refusé: "Refusé",
  en_cours: "En cours",
  termine: "Terminé",
  terminé: "Terminé",
  annule: "Annulé",
  annulé: "Annulé",
};

const statusColorMap = {
  en_attente: "warning",
  accepté: "success",
  refuse: "error",
  refusé: "error",
  en_cours: "info",
  termine: "success",
  terminé: "success",
  annule: "default",
  annulé: "default",
};

const paymentLabelMap = {
  carte: "Carte bancaire",
  especes: "Espèces sur place",
};

const ARCHIVED_APPOINTMENTS_STORAGE_KEY = "nazek.archivedAppointmentIds.v1";

const toInputDateTimeLocal = (d = new Date()) => {
  const pad = (v) => String(v).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

const normalizeList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

const APPOINTMENT_CANCELLABLE_BY_CLIENT = ["en_attente"];
const APPOINTMENT_CANCELLABLE_BY_EMPLOYER = ["en_attente", "accepté", "en_cours"];
const APPOINTMENT_PAYABLE_CASH_STATUSES = ["accepté", "terminé", "termine"];
const APPOINTMENT_REVIEWABLE_STATUSES = ["accepté", "terminé", "termine"];
const ARCHIVABLE_STATUSES = ["annulé", "annule", "refusé", "refuse", "terminé", "termine"];

const Appointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isClient, isEmployer } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [employers, setEmployers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingPayId, setLoadingPayId] = useState(null);
  const [loadingCancelId, setLoadingCancelId] = useState(null);
  const [loadingAcceptId, setLoadingAcceptId] = useState(null);
  const [loadingRefuseId, setLoadingRefuseId] = useState(null);
  const [loadingReviewId, setLoadingReviewId] = useState(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openReview, setOpenReview] = useState(false);

  const [selectedReviewAppointment, setSelectedReviewAppointment] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, feedback: "" });

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialEmployerId = params.get("employerId") || "";
  const initialServiceId = params.get("serviceId") || "";

  const [createForm, setCreateForm] = useState({
    service: initialServiceId,
    employer: initialEmployerId,
    date: toInputDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    description: "",
    location: "",
    payment_method: "especes",
  });

  // archive UI (frontend uniquement, sans suppression DB)
  const [archivedIds, setArchivedIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // Mapbox autocomplete
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapboxEnabled = isMapboxConfigured();

  // Stripe readiness (frontend flag only)
  const stripeEnabled = isStripeConfigured();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ARCHIVED_APPOINTMENTS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setArchivedIds(parsed.filter((id) => Number.isFinite(Number(id))).map(Number));
      }
    } catch {
      // no-op
    }
  }, []);

  const persistArchived = (ids) => {
    setArchivedIds(ids);
    localStorage.setItem(ARCHIVED_APPOINTMENTS_STORAGE_KEY, JSON.stringify(ids));
  };

  const activeEmployers = useMemo(
    () =>
      employers.filter((e) => {
        if (!createForm.service) return true;
        const serviceId = e?.service?.id ?? e?.service ?? null;
        return String(serviceId) === String(createForm.service);
      }),
    [employers, createForm.service]
  );

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db - da;
      }),
    [appointments]
  );

  const visibleAppointments = useMemo(() => {
    if (showArchived) return sortedAppointments;
    return sortedAppointments.filter((a) => !archivedIds.includes(Number(a.id)));
  }, [sortedAppointments, archivedIds, showArchived]);

  const archivedCount = useMemo(
    () => sortedAppointments.filter((a) => archivedIds.includes(Number(a.id))).length,
    [sortedAppointments, archivedIds]
  );

  const stats = useMemo(() => {
    const src = visibleAppointments;
    const total = src.length;
    const pending = src.filter((a) => a.status === "en_attente").length;
    const confirmed = src.filter((a) => a.status === "accepté").length;
    const finished = src.filter((a) => ["terminé", "termine"].includes(a.status)).length;
    const canceled = src.filter((a) => ["annulé", "annule"].includes(a.status)).length;
    return { total, pending, confirmed, finished, canceled };
  }, [visibleAppointments]);

  const resetMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  const fetchAll = async () => {
    setLoading(true);
    resetMessages();
    try {
      const [appointmentsData, servicesData, employersData] = await Promise.all([
        appointmentAPI.list(),
        getServices(),
        employerAPI.list(),
      ]);

      setAppointments(normalizeList(appointmentsData));
      setServices(normalizeList(servicesData));
      setEmployers(normalizeList(employersData));
    } catch (err) {
      setError(err?.message || "Erreur lors du chargement des rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if ((initialEmployerId || initialServiceId) && isClient) {
      setOpenCreate(true);
    }
  }, [initialEmployerId, initialServiceId, isClient]);

  useEffect(() => {
    if (!mapboxEnabled) {
      setLocationOptions([]);
      return;
    }

    const q = (createForm.location || "").trim();
    if (q.length < 3) {
      setLocationOptions([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLocationLoading(true);
        const places = await searchPlacesMapbox(q, { limit: 6, language: "fr" });
        if (!active) return;
        setLocationOptions(places);
      } catch {
        if (!active) return;
        setLocationOptions([]);
      } finally {
        if (active) setLocationLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [createForm.location, mapboxEnabled]);

  const handleCreateField = (key, value) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAppointmentLocation = (option) => {
    if (!option) return;
    handleCreateField("location", option.address || option.label || "");
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!isClient) {
      setError("Seul un compte client peut créer un rendez-vous.");
      return;
    }

    if (!createForm.service || !createForm.employer || !createForm.date) {
      setError("Service, prestataire et date/heure sont obligatoires.");
      return;
    }

    setLoadingCreate(true);
    try {
      await appointmentAPI.create({
        service: Number(createForm.service),
        employer: Number(createForm.employer),
        date: new Date(createForm.date).toISOString(),
        description: createForm.description,
        location: createForm.location,
        payment_method: createForm.payment_method,
      });

      setSuccessMsg(
        createForm.payment_method === "especes"
          ? "Rendez-vous créé. Paiement en espèces à effectuer sur place après service."
          : "Rendez-vous créé. Paiement carte bientôt disponible (Stripe non configuré)."
      );

      setOpenCreate(false);
      await fetchAll();
    } catch (err) {
      setError(err?.message || "Impossible de créer le rendez-vous.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    resetMessages();
    setLoadingCancelId(appointmentId);
    try {
      await appointmentAPI.cancel(appointmentId, "Annulation depuis mon espace");
      setSuccessMsg("Rendez-vous annulé.");
      await fetchAll();
    } catch (err) {
      setError(err?.message || "Impossible d’annuler ce rendez-vous.");
    } finally {
      setLoadingCancelId(null);
    }
  };

  const handleAccept = async (appointmentId) => {
    resetMessages();
    setLoadingAcceptId(appointmentId);
    try {
      await appointmentAPI.accept(appointmentId);
      setSuccessMsg("Rendez-vous accepté.");
      await fetchAll();
    } catch (err) {
      setError(err?.message || "Impossible d’accepter ce rendez-vous.");
    } finally {
      setLoadingAcceptId(null);
    }
  };

  const handleRefuse = async (appointmentId) => {
    resetMessages();
    setLoadingRefuseId(appointmentId);
    try {
      await appointmentAPI.refuse(appointmentId, "Refus depuis l’espace prestataire");
      setSuccessMsg("Rendez-vous refusé.");
      await fetchAll();
    } catch (err) {
      setError(err?.message || "Impossible de refuser ce rendez-vous.");
    } finally {
      setLoadingRefuseId(null);
    }
  };

  const handleMarkCashReceivedByEmployer = async (appointmentId) => {
    resetMessages();
    setLoadingPayId(appointmentId);
    try {
      await appointmentAPI.pay(appointmentId, { payment_method: "especes" });
      setSuccessMsg("Paiement en espèces marqué comme reçu.");
      await fetchAll();
    } catch (err) {
      setError(err?.message || "Impossible de marquer ce paiement.");
    } finally {
      setLoadingPayId(null);
    }
  };

  const handleCardPaymentPlaceholder = (appointment) => {
    resetMessages();
    if (!stripeEnabled) {
      setError("Stripe non configuré : paiement carte indisponible pour le moment.");
      return;
    }
    setError(
      `Paiement carte en préparation pour le rendez-vous #${appointment.id}. Le flux Stripe réel n'est pas encore activé.`
    );
  };

  const openReviewDialog = (appointment) => {
    setSelectedReviewAppointment(appointment);
    setReviewData({
      rating: appointment?.rating || 5,
      feedback: appointment?.feedback || "",
    });
    setOpenReview(true);
  };

  const submitReview = async () => {
    if (!selectedReviewAppointment) return;
    resetMessages();
    setLoadingReviewId(selectedReviewAppointment.id);
    try {
      await appointmentAPI.review(selectedReviewAppointment.id, {
        rating: Number(reviewData.rating),
        feedback: reviewData.feedback,
      });
      setSuccessMsg("Avis envoyé avec succès.");
      setOpenReview(false);
      await fetchAll();
    } catch (err) {
      setError(err?.message || "Impossible d’envoyer l’avis.");
    } finally {
      setLoadingReviewId(null);
    }
  };

  const canClientCancel = (appointment) =>
    isClient && APPOINTMENT_CANCELLABLE_BY_CLIENT.includes(appointment.status);

  const canEmployerCancel = (appointment) =>
    isEmployer && APPOINTMENT_CANCELLABLE_BY_EMPLOYER.includes(appointment.status);

  const canEmployerAccept = (appointment) => isEmployer && appointment.status === "en_attente";

  const canEmployerRefuse = (appointment) => isEmployer && appointment.status === "en_attente";

  const canReview = (appointment) =>
    isClient &&
    APPOINTMENT_REVIEWABLE_STATUSES.includes(appointment.status) &&
    !["annulé", "annule"].includes(appointment.status);

  const canShowCardButton = (appointment) =>
    isClient &&
    !appointment.is_paid &&
    appointment.payment_method === "carte" &&
    !["annulé", "annule"].includes(appointment.status);

  const canEmployerMarkCashReceived = (appointment) =>
    isEmployer &&
    !appointment.is_paid &&
    appointment.payment_method === "especes" &&
    APPOINTMENT_PAYABLE_CASH_STATUSES.includes(appointment.status);

  const isArchivable = (appointment) => ARCHIVABLE_STATUSES.includes(appointment.status);
  const isArchived = (appointment) => archivedIds.includes(Number(appointment.id));

  const handleArchiveToggle = (appointment) => {
    const id = Number(appointment.id);
    if (isArchived(appointment)) {
      persistArchived(archivedIds.filter((x) => x !== id));
      return;
    }
    persistArchived([...archivedIds, id]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.2,
          borderRadius: 4,
          background:
            "radial-gradient(circle at 10% -30%, rgba(93,168,255,.14), transparent 38%), #171d28",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1.6}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {isEmployer ? "Rendez-vous reçus" : "Mes rendez-vous"}
            </Typography>
            <Typography color="text.secondary">
              {isClient
                ? "Créez, suivez, annulez et notez vos rendez-vous."
                : "Consultez, acceptez/refusez et confirmez les paiements espèces."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {isClient && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
                Nouveau rendez-vous
              </Button>
            )}
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAll}>
              Actualiser
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={1.2} sx={{ mt: 1 }}>
          {[
            ["Total visibles", stats.total],
            ["En attente", stats.pending],
            ["Acceptés", stats.confirmed],
            ["Terminés", stats.finished],
            ["Annulés", stats.canceled],
            ["Archivés (UI)", archivedCount],
          ].map(([label, value]) => (
            <Grid item xs={12} sm={6} md={2} key={label}>
              <Paper sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#27344A", 0.55) }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, flexWrap: "wrap" }}>
          <InfoIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            Espèces : paiement sur place après service (confirmé par prestataire). Carte : Stripe non configuré tant que le backend n’expose pas le flux réel.
          </Typography>
        </Stack>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Switch checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />}
          label="Afficher aussi les rendez-vous archivés (masqués côté interface uniquement)"
        />
      </Paper>

      {!mapboxEnabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Suggestions d’adresse désactivées dans la création de rendez-vous. Ajoutez{" "}
          <strong>VITE_MAPBOX_TOKEN</strong> dans <strong>frontend/.env</strong>.
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 1.2 }}>Chargement des rendez-vous...</Typography>
        </Paper>
      ) : visibleAppointments.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h6">Aucun rendez-vous visible</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.6, mb: 1.8 }}>
            {isClient
              ? "Créez votre premier rendez-vous ou affichez les éléments archivés."
              : "Les rendez-vous s’afficheront ici dès qu’ils seront créés."}
          </Typography>
          {isClient && (
            <Button variant="contained" onClick={() => setOpenCreate(true)}>
              Créer un rendez-vous
            </Button>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 2, borderRadius: 3.5 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 1120 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>{isEmployer ? "Client" : "Prestataire"}</TableCell>
                  <TableCell>Localisation</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Paiement</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleAppointments.map((appointment) => {
                  const statusKey = appointment.status || "en_attente";
                  const statusLabel = statusLabelMap[statusKey] || statusKey;
                  const statusColor = statusColorMap[statusKey] || "default";

                  return (
                    <TableRow key={appointment.id} hover>
                      <TableCell>{formatDate(appointment.date)}</TableCell>
                      <TableCell>{appointment?.service?.name || "—"}</TableCell>
                      <TableCell>
                        {isEmployer ? appointment?.client?.name || "—" : appointment?.employer?.name || "—"}
                      </TableCell>
                      <TableCell>{appointment?.location || "—"}</TableCell>
                      <TableCell>
                        <Chip label={statusLabel} color={statusColor} size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.4}>
                          <Typography variant="body2">
                            {paymentLabelMap[appointment.payment_method] ||
                              appointment.payment_method ||
                              "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.is_paid ? "Payé" : "Non payé"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          title={appointment.description || ""}
                        >
                          {appointment.description || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                          {canShowCardButton(appointment) && (
                            <Tooltip title="Paiement carte bientôt disponible (Stripe)">
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PaymentIcon />}
                                  onClick={() => handleCardPaymentPlaceholder(appointment)}
                                  disabled={loadingPayId === appointment.id}
                                >
                                  Payer par carte
                                </Button>
                              </span>
                            </Tooltip>
                          )}

                          {canEmployerMarkCashReceived(appointment) && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<MarkPaidIcon />}
                              onClick={() => handleMarkCashReceivedByEmployer(appointment.id)}
                              disabled={loadingPayId === appointment.id}
                            >
                              {loadingPayId === appointment.id ? "..." : "Espèces reçues"}
                            </Button>
                          )}

                          {canEmployerAccept(appointment) && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<AcceptIcon />}
                              onClick={() => handleAccept(appointment.id)}
                              disabled={loadingAcceptId === appointment.id}
                            >
                              {loadingAcceptId === appointment.id ? "..." : "Accepter"}
                            </Button>
                          )}

                          {canEmployerRefuse(appointment) && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<RefuseIcon />}
                              onClick={() => handleRefuse(appointment.id)}
                              disabled={loadingRefuseId === appointment.id}
                            >
                              {loadingRefuseId === appointment.id ? "..." : "Refuser"}
                            </Button>
                          )}

                          {(canClientCancel(appointment) || canEmployerCancel(appointment)) && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancel(appointment.id)}
                              disabled={loadingCancelId === appointment.id}
                            >
                              {loadingCancelId === appointment.id ? "..." : "Annuler"}
                            </Button>
                          )}

                          {canReview(appointment) && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<StarIcon />}
                              onClick={() => openReviewDialog(appointment)}
                            >
                              Noter
                            </Button>
                          )}

                          {isArchivable(appointment) && (
                            <Button
                              size="small"
                              variant={isArchived(appointment) ? "contained" : "outlined"}
                              startIcon={<ArchiveIcon />}
                              onClick={() => handleArchiveToggle(appointment)}
                            >
                              {isArchived(appointment) ? "Désarchiver" : "Archiver"}
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
        <DialogTitle>Nouveau rendez-vous</DialogTitle>
        <DialogContent dividers>
          {!isClient ? (
            <Alert severity="warning">Seul un compte client peut créer un rendez-vous.</Alert>
          ) : (
            <Box component="form" id="create-appointment-form" onSubmit={handleCreateAppointment}>
              <Grid container spacing={2} sx={{ mt: 0.2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Service"
                    fullWidth
                    value={createForm.service}
                    onChange={(e) => handleCreateField("service", e.target.value)}
                  >
                    {services.map((srv) => (
                      <MenuItem key={srv.id} value={String(srv.id)}>
                        {srv.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Prestataire"
                    fullWidth
                    value={createForm.employer}
                    onChange={(e) => handleCreateField("employer", e.target.value)}
                  >
                    {activeEmployers.map((emp) => (
                      <MenuItem key={emp.id} value={String(emp.id)}>
                        {emp.name} {emp?.service?.name ? `(${emp.service.name})` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date / Heure"
                    type="datetime-local"
                    fullWidth
                    value={createForm.date}
                    onChange={(e) => handleCreateField("date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Mode de paiement"
                    fullWidth
                    value={createForm.payment_method}
                    onChange={(e) => handleCreateField("payment_method", e.target.value)}
                  >
                    <MenuItem value="especes">Espèces sur place</MenuItem>
                    <MenuItem value="carte">Carte bancaire (Stripe bientôt)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={locationOptions}
                    loading={locationLoading}
                    filterOptions={(x) => x}
                    getOptionLabel={(option) => (typeof option === "string" ? option : option.label || "")}
                    inputValue={createForm.location}
                    onInputChange={(_, value) => handleCreateField("location", value)}
                    onChange={(_, selected) => {
                      if (selected && typeof selected !== "string") {
                        handleSelectAppointmentLocation(selected);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Localisation"
                        fullWidth
                        placeholder="Adresse exacte du rendez-vous"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {locationLoading ? <CircularProgress color="inherit" size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={3}
                    value={createForm.description}
                    onChange={(e) => handleCreateField("description", e.target.value)}
                    placeholder="Détails utiles pour le prestataire..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" variant="outlined">
                    {createForm.payment_method === "especes"
                      ? "Paiement en espèces : règlement sur place après réalisation du service."
                      : "Paiement carte : Stripe non configuré pour l’instant (aucun débit effectué)."}
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Fermer</Button>
          {isClient && (
            <Button type="submit" form="create-appointment-form" variant="contained" disabled={loadingCreate}>
              {loadingCreate ? "Création..." : "Créer"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={openReview} onClose={() => setOpenReview(false)} fullWidth maxWidth="sm">
        <DialogTitle>Noter ce rendez-vous</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
                Note
              </Typography>
              <Rating
                value={Number(reviewData.rating)}
                onChange={(_, value) => setReviewData((p) => ({ ...p, rating: value || 1 }))}
                max={5}
              />
            </Box>

            <TextField
              label="Commentaire"
              multiline
              minRows={3}
              value={reviewData.feedback}
              onChange={(e) => setReviewData((p) => ({ ...p, feedback: e.target.value }))}
              placeholder="Partagez votre expérience..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReview(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={submitReview}
            disabled={loadingReviewId === selectedReviewAppointment?.id}
          >
            {loadingReviewId === selectedReviewAppointment?.id ? "Envoi..." : "Envoyer l’avis"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Appointments;