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
  Autocomplete,
  CircularProgress,
  Alert,
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
import VerifiedIcon from "@mui/icons-material/Verified";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../contexts/AuthContext";
import { isMapboxConfigured, searchPlacesMapbox } from "../services/api";

const Home = () => {
  const navigate = useNavigate();
  const { user, isClient, isEmployer } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocationOption, setSelectedLocationOption] = useState(null);

  const mapboxEnabled = isMapboxConfigured();

  const heroStats = useMemo(
    () => [
      { label: "Prestataires actifs", value: "500+" },
      { label: "Villes couvertes", value: "42" },
      { label: "Satisfaction moyenne", value: "4.8/5" },
    ],
    []
  );

  const keyBenefits = useMemo(
    () => [
      {
        icon: <VerifiedIcon sx={{ color: "primary.main" }} />,
        title: "Prestataires vérifiés",
        text: "Consultez profils, notes et avis pour choisir en confiance.",
      },
      {
        icon: <CalendarIcon sx={{ color: "primary.main" }} />,
        title: "Rendez-vous simplifiés",
        text: "Réservez rapidement avec date, lieu et mode de paiement clairs.",
      },
      {
        icon: <ChatBubbleOutlineIcon sx={{ color: "primary.main" }} />,
        title: "Messagerie intégrée",
        text: "Discutez directement avec le prestataire avant intervention.",
      },
      {
        icon: <SecurityIcon sx={{ color: "primary.main" }} />,
        title: "Compte sécurisé",
        text: "Gestion du profil, mot de passe et suivi des notifications.",
      },
    ],
    []
  );

  const quickActions = useMemo(() => {
    if (!user) {
      return [
        { label: "Créer un compte", to: "/register", variant: "contained" },
        { label: "Se connecter", to: "/login", variant: "outlined" },
        { label: "Découvrir les services", to: "/search", variant: "text" },
      ];
    }

    if (isClient) {
      return [
        { label: "Rechercher un prestataire", to: "/search", variant: "contained" },
        { label: "Mes rendez-vous", to: "/appointments", variant: "outlined" },
        { label: "Mes favoris", to: "/favorites", variant: "text" },
      ];
    }

    if (isEmployer) {
      return [
        { label: "Rendez-vous reçus", to: "/appointments", variant: "contained" },
        { label: "Messagerie", to: "/messages", variant: "outlined" },
        { label: "Mon profil", to: "/profile", variant: "text" },
      ];
    }

    return [
      { label: "Accueil", to: "/", variant: "contained" },
      { label: "Profil", to: "/profile", variant: "outlined" },
    ];
  }, [user, isClient, isEmployer]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    const normalizedLocation =
      selectedLocationOption?.address || selectedLocationOption?.label || location.trim();
    if (normalizedLocation) params.set("location", normalizedLocation);

    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  React.useEffect(() => {
    if (!mapboxEnabled) {
      setLocationOptions([]);
      return;
    }

    const q = location.trim();
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
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [location, mapboxEnabled]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 } }}>
      <Grid container spacing={3}>
        {/* HERO */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3.2 },
              borderRadius: 4,
              background:
                "radial-gradient(circle at 8% -20%, rgba(243,139,42,.18), transparent 36%), #171b22",
            }}
          >
            <Chip
              icon={<StarIcon />}
              label="Plateforme de services de confiance"
              color="primary"
              sx={{ mb: 1.3 }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                mb: 1.2,
                lineHeight: { xs: 1.2, md: 1.15 },
                maxWidth: 900,
              }}
            >
              Réservez un prestataire qualifié en quelques clics
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 2.4, maxWidth: 880 }}>
              Trouvez rapidement le bon professionnel, comparez les profils et gérez vos
              rendez-vous dans un espace clair, moderne et rassurant.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mb: 2.2 }}>
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  onClick={() => navigate(action.to)}
                  endIcon={action.variant === "contained" ? <ArrowForwardIcon /> : null}
                  startIcon={action.label.includes("rendez") ? <CalendarIcon /> : null}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>

            {!mapboxEnabled && (
              <Alert severity="info" sx={{ mb: 1.6 }}>
                Suggestions d’adresse désactivées. Ajoute{" "}
                <strong>VITE_MAPBOX_TOKEN</strong> dans <strong>frontend/.env</strong>{" "}
                pour l’autocomplete.
              </Alert>
            )}

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.6, md: 2.1 },
                borderRadius: 3,
                background: alpha("#171b22", 0.92),
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box component="form" onSubmit={handleSearch}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={5}>
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

                  <Grid item xs={12} md={5}>
                    <Autocomplete
                      freeSolo
                      options={locationOptions}
                      loading={locationLoading}
                      filterOptions={(x) => x}
                      value={selectedLocationOption}
                      onChange={(_, value) => {
                        if (value && typeof value !== "string") {
                          setSelectedLocationOption(value);
                          setLocation(value.address || value.label || "");
                        } else {
                          setSelectedLocationOption(null);
                        }
                      }}
                      inputValue={location}
                      onInputChange={(_, value) => {
                        setLocation(value);
                        if (!value) setSelectedLocationOption(null);
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.label || ""
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          placeholder="Ville / Adresse (optionnel)"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon sx={{ color: "text.secondary" }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <>
                                {locationLoading ? (
                                  <CircularProgress color="inherit" size={18} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
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
              <Chip icon={<FavoriteIcon />} label="Favoris" />
            </Stack>
          </Paper>
        </Grid>

        {/* SIDEBAR */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: alpha("#171b22", 0.9), mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Pourquoi choisir Nazek ?
            </Typography>
            <Divider sx={{ borderColor: "divider", mb: 2 }} />

            <Stack spacing={1.35}>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <PeopleIcon sx={{ color: "primary.main" }} />
                <Typography>Comptes client et prestataire bien séparés</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <CalendarIcon sx={{ color: "primary.main" }} />
                <Typography>Réservation et suivi des statuts simplifiés</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <ChatBubbleOutlineIcon sx={{ color: "primary.main" }} />
                <Typography>Messagerie directe client / prestataire</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.3, alignItems: "center" }}>
                <SecurityIcon sx={{ color: "primary.main" }} />
                <Typography>Gestion sécurisée du compte et des données</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.4, borderRadius: 4, background: alpha("#171b22", 0.9) }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
              Chiffres clés
            </Typography>
            <Grid container spacing={1}>
              {heroStats.map((item) => (
                <Grid item xs={12} sm={4} md={12} key={item.label}>
                  <Paper
                    sx={{
                      p: 1.2,
                      borderRadius: 2.2,
                      bgcolor: alpha("#232935", 0.7),
                    }}
                  >
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

        {/* BENEFITS ROW */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.4 },
              borderRadius: 4,
              background: alpha("#171b22", 0.88),
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.6 }}>
              Une expérience plus fluide du premier contact au rendez-vous
            </Typography>

            <Grid container spacing={1.5}>
              {keyBenefits.map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.title}>
                  <Paper sx={{ p: 1.6, borderRadius: 3, bgcolor: alpha("#232935", 0.5), height: "100%" }}>
                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 0.7 }}>
                      {item.icon}
                      <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {item.text}
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