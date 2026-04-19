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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

      // Support pagination {results: []} ou liste []
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setAppointments(list);
    } catch (err) {
      if (err.status === 401) {
        // token absent/expiré → login
        navigate("/login", { state: fromState, replace: true });
        return;
      }
      setError(err.message || "Erreur lors du chargement des rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // attendre la fin du checkAuth
    if (authLoading) return;

    // ✅ force login
    if (!user) {
      navigate("/login", { state: fromState, replace: true });
      return;
    }

    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Rendez-vous
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gérez vos rendez-vous et suivez leur statut.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={fetchAppointments} disabled={loading}>
              Rafraîchir
            </Button>
            <Button variant="contained" onClick={() => navigate("/search")}>
              Réserver un service
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : appointments.length === 0 ? (
          <Alert severity="info">Aucun rendez-vous pour le moment.</Alert>
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
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.id}</TableCell>

                  <TableCell>{toDateLabel(a.date || a.datetime || a.start_time || a.created_at)}</TableCell>

                  <TableCell>{a.status_display || a.status || "—"}</TableCell>

                  <TableCell>{a.service?.name || a.service_name || a.service || "—"}</TableCell>

                  <TableCell>
                    {a.employer?.name || a.employer?.user?.username || a.employer_name || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default Appointments;