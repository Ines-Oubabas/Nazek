import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Stack,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarToday as CalendarIcon,
  Autorenew as RefreshIcon,
  AddCircleOutline as AddIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  EventNote as EventNoteIcon,
} from "@mui/icons-material";

import { appointmentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const toDateLabel = (raw) => {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
  } catch {
    return String(raw);
  }
};

const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("accept")) return "success";
  if (s.includes("refus")) return "error";
  if (s.includes("attente")) return "warning";
  if (s.includes("annul")) return "default";
  return "info";
};

const Appointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isClient } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openReview, setOpenReview] = useState(false);
  const [targetReviewId, setTargetReviewId] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, feedback: "" });

  const fromState = useMemo(() => ({ from: location.pathname }), [location.pathname]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await appointmentAPI.list();
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setAppointments(list);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", { state: fromState, replace: true });
        return;
      }
      setError(err.message || "Erreur lors du chargement des rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { state: fromState, replace: true });
      return;
    }
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => String(a.status).toLowerCase().includes("attente")).length;
    const confirmed = appointments.filter((a) => String(a.status).toLowerCase().includes("accept")).length;
    return { total, pending, confirmed };
  }, [appointments]);

  const handleCancel = async (id) => {
    try {
      setError("");
      await appointmentAPI.delete(id);
      await fetchAppointments();
    } catch (err) {
      setError(err.message || "Impossible d’annuler ce rendez-vous.");
    }
  };

  const handlePay = async (id) => {
    try {
      setError("");
      await appointmentAPI.pay(id, { payment_method: "carte" });
      await fetchAppointments();
    } catch (err) {
      setError(err.message || "Paiement impossible.");
    }
  };

  const openReviewDialog = (id) => {
    setTargetReviewId(id);
    setReviewData({ rating: 5, feedback: "" });
    setOpenReview(true);
  };

  const submitReview = async () => {
    try {
      await appointmentAPI.review(targetReviewId, reviewData);
      setOpenReview(false);
      await fetchAppointments();
    } catch (err) {
      setError(err.message || "Envoi d’avis impossible.");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 1.3 }}>Chargement des rendez-vous...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.2,
          borderRadius: 4,
          background: "radial-gradient(circle at 10% -30%, rgba(86,169,255,.14), transparent 38%), #171b22",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.6}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Mes rendez-vous</Typography>
            <Typography color="text.secondary">
              {isClient
                ? "Gérez vos réservations, paiements et avis."
                : "Consultez et gérez vos rendez-vous avec les clients."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {isClient && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/search")}>
                Prendre un rendez-vous
              </Button>
            )}
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAppointments}>
              Actualiser
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={1.2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.6, borderRadius: 2.5, bgcolor: alpha("#232935", 0.6) }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventNoteIcon color="info" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.total}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.6, borderRadius: 2.5, bgcolor: alpha("#232935", 0.6) }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PendingActionsIcon color="warning" />
                <Box>
                  <Typography variant="caption" color="text.secondary">En attente</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.pending}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.6, borderRadius: 2.5, bgcolor: alpha("#232935", 0.6) }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon color="success" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Confirmés</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.confirmed}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2.2, borderRadius: 3.5 }}>
        {appointments.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              backgroundColor: alpha("#232935", 0.45),
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <CalendarIcon sx={{ fontSize: 42, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6">Aucun rendez-vous pour le moment</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6, mb: 1.8 }}>
              {isClient
                ? "Commence par réserver un service."
                : "Les rendez-vous programmés apparaîtront ici."}
            </Typography>
            {isClient && (
              <Button variant="contained" onClick={() => navigate("/search")}>
                Rechercher un service
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>{isClient ? "Prestataire" : "Client"}</TableCell>
                  <TableCell>Paiement</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {appointments.map((a) => {
                  const statusLabel = a.status_display || a.status || "—";
                  const partner = isClient
                    ? a.employer?.name || a.employer_name || "—"
                    : a.client?.name || a.client_name || "—";

                  return (
                    <TableRow key={a.id} hover sx={{ "&:hover": { bgcolor: alpha("#f38b2a", 0.06) } }}>
                      <TableCell>{a.id}</TableCell>
                      <TableCell>{toDateLabel(a.date || a.datetime || a.start_time || a.created_at)}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor(statusLabel)} label={statusLabel} sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>{a.service?.name || a.service_name || a.service || "—"}</TableCell>
                      <TableCell>{partner}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={a.is_paid ? "Payé" : "Non payé"}
                          color={a.is_paid ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {isClient && !a.is_paid && (
                            <Button size="small" variant="outlined" onClick={() => handlePay(a.id)}>
                              Payer
                            </Button>
                          )}

                          {isClient && (
                            <Button size="small" variant="contained" onClick={() => openReviewDialog(a.id)}>
                              Avis
                            </Button>
                          )}

                          <Button size="small" variant="text" color="error" onClick={() => handleCancel(a.id)}>
                            Annuler
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Dialog open={openReview} onClose={() => setOpenReview(false)} fullWidth maxWidth="sm">
        <DialogTitle>Laisser un avis</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <TextField
              label="Note (1 à 5)"
              type="number"
              inputProps={{ min: 1, max: 5 }}
              value={reviewData.rating}
              onChange={(e) => setReviewData((p) => ({ ...p, rating: Number(e.target.value) }))}
            />
            <TextField
              label="Commentaire"
              multiline
              minRows={3}
              value={reviewData.feedback}
              onChange={(e) => setReviewData((p) => ({ ...p, feedback: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReview(false)}>Annuler</Button>
          <Button variant="contained" onClick={submitReview}>Envoyer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Appointments;