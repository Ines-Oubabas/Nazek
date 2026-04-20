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
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

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
          position: "relative",
          overflow: "hidden",
          py: { xs: 7, md: 10 },
          borderBottom: "1px solid",
          borderColor: "divider",
          background:
            "radial-gradient(circle at 10% 0%, rgba(255,138,28,.22) 0%, transparent 35%), radial-gradient(circle at 80% 20%, rgba(88,166,255,.16) 0%, transparent 32%), linear-gradient(180deg, #12161f 0%, #0f1115 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4.5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<AutoAwesomeIcon />}
                label="Plateforme premium de services"
                color="primary"
                sx={{ mb: 2, fontWeight: 700 }}
              />

              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontSize: { xs: "2rem", md: "3rem" },
                  lineHeight: 1.1,
                  mb: 1.6,
                }}
              >
                Réservez vos services avec une expérience{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  moderne
                </Box>{" "}
                et fluide.
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 3.2, maxWidth: 720 }}>
                Une interface claire pour trouver le bon prestataire, réserver rapidement et suivre
                vos rendez-vous dans un espace professionnel.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={goSearch}
                  endIcon={<ArrowForwardIcon />}
                >
                  Réserver un service
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={goAppointments}
                  startIcon={<CalendarIcon />}
                >
                  Mes rendez-vous
                </Button>

                {!user && (
                  <Button variant="text" size="large" onClick={goRegister} sx={{ color: "text.primary" }}>
                    Créer un compte
                  </Button>
                )}
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.6, md: 2.1 },
                  borderRadius: 3,
                  background: alpha("#171a21", 0.92),
                  border: "1px solid",
                  borderColor: "divider",
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
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        placeholder="Ville / Adresse (optionnel)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ height: { xs: 44, md: 56 } }}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Rechercher
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              <Stack direction="row" spacing={1} sx={{ mt: 2.1, flexWrap: "wrap" }}>
                <Chip
                  icon={<StarIcon />}
                  label="Qualité"
                  sx={{ bgcolor: alpha("#ff8a1c", 0.14), color: "text.primary", border: "1px solid #2a3140" }}
                />
                <Chip
                  icon={<SecurityIcon />}
                  label="Sécurisé"
                  sx={{ bgcolor: alpha("#58a6ff", 0.12), color: "text.primary", border: "1px solid #2a3140" }}
                />
                <Chip
                  icon={<ScheduleIcon />}
                  label="Rapide"
                  sx={{ bgcolor: alpha("#3fb950", 0.12), color: "text.primary", border: "1px solid #2a3140" }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: alpha("#171a21", 0.92),
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Aperçu rapide
                </Typography>
                <Divider sx={{ borderColor: "divider", mb: 2 }} />

                <Stack spacing={1.4}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <PeopleIcon sx={{ color: "primary.main" }} />
                    <Typography>Espaces client et prestataire unifiés</Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <CalendarIcon sx={{ color: "primary.main" }} />
                    <Typography>Réservation simple par créneaux</Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <SecurityIcon sx={{ color: "primary.main" }} />
                    <Typography>Authentification & notifications</Typography>
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Connecté : <b style={{ color: "#f3f4f6" }}>{user ? user.email || user.username : "Non"}</b>
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SERVICES */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 7 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2.2 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Services populaires
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sélectionnez un service pour voir les détails et réserver.
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

      {/* WHY */}
      <Box sx={{ py: 7 }}>
        <Container maxWidth="lg">
          <Paper sx={{ p: { xs: 2.4, md: 4 }, borderRadius: 4 }}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 800 }}>
              Pourquoi nous choisir ?
            </Typography>
            <Typography align="center" color="text.secondary" sx={{ mt: 1 }}>
              Une expérience simple, structurée et crédible pour gérer vos services.
            </Typography>

            <Grid container spacing={2.2} sx={{ mt: 2.2 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.6, borderRadius: 3, height: "100%", bgcolor: "background.default" }}>
                  <PeopleIcon sx={{ fontSize: 38, color: "primary.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Prestataires qualifiés
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Profils clairs, services structurés, suivi de chaque interaction.
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.6, borderRadius: 3, height: "100%", bgcolor: "background.default" }}>
                  <ScheduleIcon sx={{ fontSize: 38, color: "primary.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Réservation rapide
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Parcours fluide de la recherche au rendez-vous confirmé.
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.6, borderRadius: 3, height: "100%", bgcolor: "background.default" }}>
                  <SecurityIcon sx={{ fontSize: 38, color: "primary.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Sécurité & notifications
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Suivi sécurisé de l’activité et alertes en temps réel.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;