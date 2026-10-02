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
  Avatar,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
      { label: "Indicateur plateforme", value: "Données réelles selon backend", isPlaceholder: true },
      { label: "Disponibilité", value: "Recherche & RDV actifs", isPlaceholder: false },
      { label: "Confiance", value: "Profils + avis + messages", isPlaceholder: false },
    ],
    []
  );

  const keyBenefits = useMemo(
    () => [
      {
        icon: <VerifiedIcon sx={{ color: "primary.main" }} />,
        title: "Prestataires vérifiés",
        text: "Consultez profils, notes et avis avant de réserver.",
      },
      {
        icon: <CalendarIcon sx={{ color: "primary.main" }} />,
        title: "Rendez-vous clairs",
        text: "Créez, suivez et gérez les statuts dans une interface simple.",
      },
      {
        icon: <ChatBubbleOutlineIcon sx={{ color: "primary.main" }} />,
        title: "Messagerie intégrée",
        text: "Échangez avec le prestataire avant et après intervention.",
      },
      {
        icon: <SecurityIcon sx={{ color: "primary.main" }} />,
        title: "Compte sécurisé",
        text: "Gestion du profil, mot de passe et confidentialité utilisateur.",
      },
    ],
    []
  );

  const categories = useMemo(
    () => [
      { name: "Ménage", icon: "🧹" },
      { name: "Plomberie", icon: "🔧" },
      { name: "Électricité", icon: "⚡" },
      { name: "Coiffure", icon: "💇" },
      { name: "Soutien scolaire", icon: "📚" },
      { name: "Informatique", icon: "💻" },
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Client Nazek",
        role: "Réservation à domicile",
        text: "Interface claire, prise de rendez-vous rapide, suivi rassurant.",
      },
      {
        name: "Prestataire Nazek",
        role: "Services professionnels",
        text: "Les demandes sont mieux organisées et la messagerie facilite tout.",
      },
      {
        name: "Utilisateur vérifié",
        role: "Expérience régulière",
        text: "On gagne du temps pour trouver le bon profil, sans confusion.",
      },
    ],
    []
  );

  const faqItems = useMemo(
    () => [
      {
        q: "Comment réserver ?",
        a: "Recherchez un prestataire, consultez son profil puis créez un rendez-vous.",
      },
      {
        q: "Le paiement carte est-il disponible ?",
        a: "Le paiement espèces est disponible. Stripe peut être ajouté ensuite selon la configuration backend.",
      },
      {
        q: "Mapbox est-il obligatoire ?",
        a: "Non. Sans token, la recherche par ville/adresse texte reste fonctionnelle.",
      },
    ],
    []
  );

  const quickActions = useMemo(() => {
    if (!user) {
      return [
        { label: "Créer un compte", to: "/register", variant: "contained" },
        { label: "Se connecter", to: "/login", variant: "outlined" },
        { label: "Découvrir les prestataires", to: "/search", variant: "text" },
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
    }, 320);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [location, mapboxEnabled]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 5 } }}>
      <Grid container spacing={3}>
        {/* HERO */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 4,
              background:
                "radial-gradient(circle at 8% -20%, rgba(245,158,66,.16), transparent 36%), radial-gradient(circle at 92% 12%, rgba(93,168,255,.10), transparent 32%), #171d28",
            }}
          >
            <Stack spacing={2}>
              <Chip
                icon={<WorkspacePremiumIcon />}
                label="Plateforme moderne de réservation de services"
                color="primary"
                sx={{ alignSelf: "flex-start" }}
              />

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  lineHeight: { xs: 1.2, md: 1.12 },
                  maxWidth: 920,
                }}
              >
                Trouvez un prestataire fiable et réservez en toute confiance
              </Typography>

              <Typography color="text.secondary" sx={{ maxWidth: 880 }}>
                Nazek centralise recherche, rendez-vous, favoris, messagerie et notifications
                dans une expérience fluide, claire et rassurante — côté client comme prestataire.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    onClick={() => navigate(action.to)}
                    endIcon={action.variant === "contained" ? <ArrowForwardIcon /> : null}
                    startIcon={action.label.toLowerCase().includes("rendez") ? <CalendarIcon /> : null}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>

              {!mapboxEnabled && (
                <Alert severity="info">
                  Suggestions d’adresse désactivées. Le site fonctionne normalement avec un champ
                  texte ville/adresse. Ajoutez <strong>VITE_MAPBOX_TOKEN</strong> pour l’autocomplete.
                </Alert>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, md: 2 },
                  borderRadius: 3,
                  background: alpha("#141B27", 0.88),
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box component="form" onSubmit={handleSearch}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        placeholder="Service, spécialité, besoin..."
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
                                  {locationLoading ? <CircularProgress color="inherit" size={18} /> : null}
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

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip icon={<CheckCircleOutlineIcon />} label="Comptes client/prestataire séparés" />
                <Chip icon={<FavoriteIcon />} label="Favoris & suivi" />
                <Chip icon={<ChatBubbleOutlineIcon />} label="Messagerie intégrée" />
                <Chip icon={<ScheduleIcon />} label="Gestion des rendez-vous" />
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* COMMENT ÇA MARCHE */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, background: alpha("#141B27", 0.85) }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              Comment ça marche
            </Typography>
            <Grid container spacing={1.4}>
              {[
                { title: "1. Rechercher", text: "Filtrez par service, nom et localisation." },
                { title: "2. Comparer", text: "Consultez profils, notes, tarifs et disponibilités." },
                { title: "3. Réserver", text: "Créez un rendez-vous en quelques clics." },
                { title: "4. Échanger", text: "Utilisez la messagerie pour finaliser les détails." },
              ].map((step) => (
                <Grid item xs={12} sm={6} key={step.title}>
                  <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha("#1E2837", 0.65), height: "100%" }}>
                    <Typography sx={{ fontWeight: 700, mb: 0.4 }}>{step.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.text}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* CHIFFRES / CRÉDIBILITÉ */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.4, borderRadius: 4, background: alpha("#141B27", 0.85), height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.4 }}>
              Indicateurs de confiance
            </Typography>
            <Grid container spacing={1}>
              {heroStats.map((item) => (
                <Grid item xs={12} key={item.label}>
                  <Paper sx={{ p: 1.2, borderRadius: 2.2, bgcolor: alpha("#27344A", 0.52) }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800 }}>
                      {item.value}
                    </Typography>
                    {item.isPlaceholder && (
                      <Typography variant="caption" color="warning.main">
                        Placeholder: relier au backend pour des métriques exactes.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* CATÉGORIES */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.6 }, borderRadius: 4, background: alpha("#141B27", 0.82) }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
              Catégories populaires
            </Typography>
            <Grid container spacing={1.2}>
              {categories.map((category) => (
                <Grid item xs={6} sm={4} md={2} key={category.name}>
                  <Paper
                    onClick={() => navigate(`/search?service=${encodeURIComponent(category.name)}`)}
                    sx={{
                      p: 1.4,
                      borderRadius: 3,
                      bgcolor: alpha("#27344A", 0.45),
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "transform .18s ease, box-shadow .18s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 24px rgba(0,0,0,.24)",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: 24, mb: 0.4 }}>{category.icon}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {category.name}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* BENEFICES + PRESTATAIRE CTA */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.6 }, borderRadius: 4, background: alpha("#141B27", 0.82), height: "100%" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
              Pourquoi choisir Nazek
            </Typography>
            <Grid container spacing={1.3}>
              {keyBenefits.map((item) => (
                <Grid item xs={12} sm={6} key={item.title}>
                  <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha("#27344A", 0.45), height: "100%" }}>
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

        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.6 },
              borderRadius: 4,
              background: alpha("#141B27", 0.82),
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <StorefrontIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Espace prestataire
              </Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Recevez des demandes clients, gérez vos rendez-vous et échangez directement via la messagerie.
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <Typography variant="body2">Profil professionnel visible</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <Typography variant="body2">Réponses plus rapides aux demandes</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <Typography variant="body2">Suivi centralisé des échanges</Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: "auto", pt: 2 }}>
              <Button variant="contained" fullWidth onClick={() => navigate(user ? "/appointments" : "/register")}>
                {user && isEmployer ? "Voir mes rendez-vous" : "Créer un compte prestataire"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* AVIS */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.6 }, borderRadius: 4, background: alpha("#141B27", 0.78) }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.4 }}>
              Avis clients
            </Typography>
            <Grid container spacing={1.3}>
              {testimonials.map((t, idx) => (
                <Grid item xs={12} md={4} key={`${t.name}-${idx}`}>
                  <Paper sx={{ p: 1.6, borderRadius: 3, bgcolor: alpha("#27344A", 0.45), height: "100%" }}>
                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ bgcolor: alpha("#fff", 0.12), width: 34, height: 34 }}>
                        {t.name[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{t.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.role}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      “{t.text}”
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* FAQ */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.6 }, borderRadius: 4, background: alpha("#141B27", 0.76) }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
              <HelpOutlineIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                FAQ rapide
              </Typography>
            </Stack>
            <Grid container spacing={1.2}>
              {faqItems.map((item) => (
                <Grid item xs={12} md={4} key={item.q}>
                  <Paper sx={{ p: 1.4, borderRadius: 3, bgcolor: alpha("#27344A", 0.42), height: "100%" }}>
                    <Typography sx={{ fontWeight: 700, mb: 0.6 }}>{item.q}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.a}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 1.8 }} />
            <Button variant="text" onClick={() => navigate("/help")}>
              Voir le centre d’aide
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;