import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Stack,
  Button,
  Chip,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import LocationIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import SecurityIcon from "@mui/icons-material/Security";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const heroStats = useMemo(
    () => [
      { label: "Prestataires", value: "500+" },
      { label: "Villes", value: "42" },
      { label: "Satisfaction", value: "4.8/5" },
    ],
    []
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background: alpha("#171b22", 0.9),
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.2 }}>
              Réservez les meilleurs services en quelques clics
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              Trouvez rapidement le bon prestataire, comparez les offres et suivez vos rendez-vous
              dans un espace clair, premium et cohérent.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} sx={{ mb: 2.5 }}>
              <Button variant="contained" size="large" onClick={() => navigate("/search")} endIcon={<ArrowForwardIcon />}>
                Réserver un service
              </Button>

              <Button variant="outlined" size="large" onClick={() => navigate("/appointments")} startIcon={<CalendarIcon />}>
                Mes rendez-vous
              </Button>

              {!user && (
                <Button variant="text" size="large" onClick={() => navigate("/register")} sx={{ color: "text.primary" }}>
                  Créer un compte
                </Button>
              )}
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.6, md: 2.1 },
                borderRadius: 3,
                background: alpha("#171b22", 0.9),
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
                    <Button type="submit" variant="contained" fullWidth sx={{ height: { xs: 44, md: 56 } }}>
                      Rechercher
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            <Stack direction="row" spacing={1} sx={{ mt: 2.1, flexWrap: "wrap" }}>
              <Chip icon={<StarIcon />} label="Qualité" />
              <Chip icon={<SecurityIcon />} label="Sécurisé" />
              <Chip icon={<ScheduleIcon />} label="Rapide" />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: alpha("#171b22", 0.9) }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Aperçu rapide
            </Typography>
            <Divider sx={{ borderColor: "divider", mb: 2 }} />

            <Stack spacing={1.35} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <PeopleIcon sx={{ color: "primary.main" }} />
                <Typography>Espaces client et prestataire unifiés</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <CalendarIcon sx={{ color: "primary.main" }} />
                <Typography>Réservation simple par créneaux</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <SecurityIcon sx={{ color: "primary.main" }} />
                <Typography>Authentification & notifications</Typography>
              </Box>
            </Stack>

            <Grid container spacing={1}>
              {heroStats.map((item) => (
                <Grid item xs={4} key={item.label}>
                  <Paper sx={{ p: 1.2, borderRadius: 2.2, bgcolor: alpha("#232935", 0.7) }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;