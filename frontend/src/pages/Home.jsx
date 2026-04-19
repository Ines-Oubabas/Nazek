// frontend/src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

import ServiceCard from "../components/common/ServiceCard";
import { getServices } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const FAVORITES_KEY = "favorites_services";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const popularServices = useMemo(() => services.slice(0, 6), [services]);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getServices();

      // Support: liste [] ou pagination {results: []}
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setServices(list);
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors du chargement des services.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();

    // On passe la recherche à la page Search (si tu gères state côté Search)
    navigate("/search", {
      state: { query: searchQuery.trim(), location: location.trim() },
    });
  };

  const handleFavoriteClick = (serviceId) => {
    setFavorites((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const goAppointments = () => {
    if (!user) {
      navigate("/login", { state: { from: "/appointments" } });
      return;
    }
    navigate("/appointments");
  };

  const goSearch = () => navigate("/search");

  const goRegister = () => navigate("/register");

  // -----------------------------
  // UI States
  // -----------------------------
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchServices}>
          Réessayer
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      {/* HERO */}
      <Box
        sx={{
          color: "white",
          py: { xs: 6, md: 9 },
          background:
            "radial-gradient(1200px 500px at 10% 10%, rgba(33,203,243,.45), transparent 60%), linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mb: 1 }}>
                Réservez un service en quelques clics
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.95, mb: 3 }}>
                Trouvez des prestataires, choisissez un créneau et suivez vos rendez-vous.
              </Typography>

              {/* Actions rapides */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={goSearch}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ bgcolor: "white", color: "primary.main", "&:hover": { bgcolor: "grey.100" } }}
                >
                  Réserver un service
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={goAppointments}
                  startIcon={<CalendarIcon />}
                  sx={{ borderColor: "rgba(255,255,255,.7)", color: "white" }}
                >
                  Mes rendez-vous
                </Button>

                {!user && (
                  <Button
                    variant="text"
                    size="large"
                    onClick={goRegister}
                    sx={{ color: "white", textDecoration: "underline" }}
                  >
                    Créer un compte
                  </Button>
                )}
              </Stack>

              {/* Barre de recherche */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "rgba(255,255,255,.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,.25)",
                }}
              >
                <Box component="form" onSubmit={handleSearch}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        placeholder="Quel service recherchez-vous ?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                          sx: { bgcolor: "white", borderRadius: 2 },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        placeholder="Ville / Adresse (optionnel)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon />
                            </InputAdornment>
                          ),
                          sx: { bgcolor: "white", borderRadius: 2 },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ height: "100%", borderRadius: 2 }}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Rechercher
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                <Chip icon={<StarIcon />} label="Qualité" sx={{ bgcolor: "rgba(255,255,255,.18)", color: "white" }} />
                <Chip icon={<SecurityIcon />} label="Sécurisé" sx={{ bgcolor: "rgba(255,255,255,.18)", color: "white" }} />
                <Chip icon={<ScheduleIcon />} label="Rapide" sx={{ bgcolor: "rgba(255,255,255,.18)", color: "white" }} />
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: "rgba(255,255,255,.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,.25)",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Aperçu rapide
                </Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,.25)", mb: 2 }} />

                <Stack spacing={1.2}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <PeopleIcon />
                    <Typography>Accès prestataires & clients</Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <CalendarIcon />
                    <Typography>Réservation simple par créneaux</Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <SecurityIcon />
                    <Typography>Authentification & notifications</Typography>
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Connecté :{" "}
                      <b>{user ? user.email || user.username : "Non"}</b>
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SERVICES POPULAIRES */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 7 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Services populaires
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliquez sur un service pour voir les détails et réserver.
            </Typography>
          </Box>

          <Button variant="outlined" onClick={goSearch} startIcon={<SearchIcon />}>
            Voir tout
          </Button>
        </Stack>

        {services.length === 0 ? (
          <Alert severity="info">Aucun service disponible pour le moment.</Alert>
        ) : (
          <Grid container spacing={3}>
            {popularServices.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <ServiceCard
                  service={service}
                  isFavorite={favorites.includes(service.id)}
                  onFavoriteClick={() => handleFavoriteClick(service.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* POURQUOI NOUS */}
      <Box sx={{ bgcolor: "grey.50", py: 7 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ fontWeight: 900 }}>
            Pourquoi nous choisir ?
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mt: 1 }}>
            Une expérience simple, claire et sécurisée.
          </Typography>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }} elevation={0}>
                <PeopleIcon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Prestataires qualifiés
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Profils clairs, service associé, suivi des rendez-vous.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }} elevation={0}>
                <ScheduleIcon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Réservation rapide
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Sélectionnez un créneau et confirmez votre demande.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }} elevation={0}>
                <SecurityIcon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Sécurité & notifications
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Connexion sécurisée + notifications pour suivre l’évolution.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;