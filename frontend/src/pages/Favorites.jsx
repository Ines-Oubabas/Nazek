import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import ServiceCard from "../components/common/ServiceCard";
import { useNavigate } from "react-router-dom";
import { getServices } from "../services/api";

const FAVORITES_KEY = "favorites_services";

const Favorites = () => {
  const navigate = useNavigate();

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getServices();
        const list = Array.isArray(data) ? data : data?.results ?? [];
        setServices(list);
      } catch (err) {
        setError(err.message || "Impossible de charger les favoris.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const favorites = useMemo(() => {
    const idSet = new Set(favoriteIds.map((id) => String(id)));
    return services.filter((s) => idSet.has(String(s.id)));
  }, [services, favoriteIds]);

  const removeFavorite = (serviceId) => {
    setFavoriteIds((prev) => prev.filter((id) => String(id) !== String(serviceId)));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 7 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          mb: 2.2,
          background: "radial-gradient(circle at 10% -30%, rgba(243,139,42,.14), transparent 38%), #171b22",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.2}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Mes favoris
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6 }}>
              Retrouve rapidement les services que tu as sauvegardés.
            </Typography>
          </Box>

          <Chip
            icon={<FavoriteIcon />}
            label={`${favorites.length} favori(s)`}
            color="primary"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Paper>

      {favorites.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3.5,
            bgcolor: alpha("#232935", 0.52),
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <FavoriteBorderIcon sx={{ fontSize: 50, color: "primary.main", mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Aucun service en favori
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.8, mb: 2.1 }}>
            Ajoute des services en favoris pour les retrouver ici en un clic.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" startIcon={<SearchIcon />} onClick={() => navigate("/search")}>
              Explorer les services
            </Button>
            <Button variant="outlined" onClick={() => navigate("/")}>
              Retour à l’accueil
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Grid container spacing={2.2}>
          {favorites.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <ServiceCard
                service={service}
                isFavorite
                onFavoriteClick={() => removeFavorite(service.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Favorites;