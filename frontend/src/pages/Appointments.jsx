// frontend/src/pages/Appointments.jsx
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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarToday as CalendarIcon,
  Autorenew as RefreshIcon,
  AddCircleOutline as AddIcon,
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
  const { user, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const total = appointments.length;
  const accepted = appointments.filter((a) =>
    String(a.status_display || a.status || "").toLowerCase().includes("accept")
  ).length;
  const pending = appointments.filter((a) =>
    String(a.status_display || a.status || "").toLowerCase().includes("attente")
  ).length;

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 7 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          mb: 2.2,
          background:
            "radial-gradient(circle at 10% -30%, rgba(255,138,28,.16), transparent 38%), #171a21",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 2.2 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarIcon sx={{ color: "primary.main" }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Rendez-vous
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gérez vos rendez-vous et suivez leur statut en temps réel.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAppointments}
              disabled={loading}
            >
              Rafraîchir
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/search")}
            >
              Réserver un service
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.6, borderRadius: 2.5, bgcolor: alpha("#1f2430", 0.85) }}>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {total}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.6, borderRadius: 2.5, bgcolor: alpha("#1f2430", 0.85) }}>
              <Typography variant="caption" color="text.secondary">
                Acceptés
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "success.main" }}>
                {accepted}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 1.6, borderRadius: 2.5, bgcolor: alpha("#1f2430", 0.85) }}>
              <Typography variant="caption" color="text.secondary">
                En attente
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "warning.main" }}>
                {pending}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : appointments.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              backgroundColor: alpha("#1f2430", 0.45),
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6">Aucun rendez-vous pour le moment</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6, mb: 1.8 }}>
              Commence par réserver un service pour alimenter ton tableau.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/search")}>
              Rechercher un service
            </Button>
          </Paper>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Prestataire</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {appointments.map((a) => {
                const statusLabel = a.status_display || a.status || "—";
                return (
                  <TableRow
                    key={a.id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: alpha("#ff8a1c", 0.06),
                      },
                    }}
                  >
                    <TableCell>{a.id}</TableCell>
                    <TableCell>{toDateLabel(a.date || a.datetime || a.start_time || a.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor(statusLabel)}
                        label={statusLabel}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{a.service?.name || a.service_name || a.service || "—"}</TableCell>
                    <TableCell>
                      {a.employer?.name || a.employer?.user?.username || a.employer_name || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default Appointments;