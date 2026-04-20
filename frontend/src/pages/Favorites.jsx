import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import ServiceCard from "../components/common/ServiceCard";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  useEffect(() => {
    // TODO: Implémenter la récupération des favoris backend
    setLoading(false);
  }, []);

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
          background:
            "radial-gradient(circle at 10% -30%, rgba(255,138,28,.14), transparent 38%), #171a21",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Mes favoris
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.6 }}>
          Retrouve rapidement les services que tu as sauvegardés.
        </Typography>
      </Paper>

      {favorites.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3.5,
            bgcolor: alpha("#1f2430", 0.52),
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
                onFavoriteClick={() => {
                  // TODO: Implémenter la suppression des favoris backend
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Favorites;