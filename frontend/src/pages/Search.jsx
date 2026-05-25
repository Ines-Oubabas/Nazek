import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  RestartAlt as ResetIcon,
  Tune as TuneIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  EventAvailable as EventAvailableIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as MessageIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

import {
  getServices,
  isMapboxConfigured,
  searchPlacesMapbox,
  searchAPI,
  favoritesAPI,
  messagingAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const normalizeList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isClient } = useAuth();

  const [services, setServices] = useState([]);
  const [employers, setEmployers] = useState([]);

  const [favorites, setFavorites] = useState([]);
  const favoriteEmployerIds = useMemo(
    () => new Set(favorites.map((f) => f?.employer?.id).filter(Boolean)),
    [favorites]
  );

  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingContactId, setLoadingContactId] = useState(null);
  const [error, setError] = useState("");

  // Mapbox autocomplete state
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocationOption, setSelectedLocationOption] = useState(null);
  const mapboxEnabled = isMapboxConfigured();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    location: searchParams.get("location") || "",
    service: searchParams.get("service") || "",
  });

  const selectedServiceId = useMemo(() => {
    if (!filters.service) return "";
    if (/^\d+$/.test(String(filters.service))) return String(filters.service);
    const found = services.find(
      (s) => s.name?.toLowerCase() === String(filters.service).toLowerCase()
    );
    return found ? String(found.id) : "";
  }, [filters.service, services]);

  const loadServices = async () => {
    const data = await getServices();
    setServices(normalizeList(data));
  };

  const loadEmployers = async (params = {}) => {
    const data = await searchAPI.employers(params);
    setEmployers(normalizeList(data));
  };

  const loadFavorites = async () => {
    if (!isAuthenticated || !isClient) {
      setFavorites([]);
      return;
    }
    setLoadingFavorites(true);
    try {
      const data = await favoritesAPI.listEmployers();
      setFavorites(normalizeList(data));
    } catch {
      setFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([
          loadServices(),
          loadEmployers({
            q: filters.q || undefined,
            location: filters.location || undefined,
            service: filters.service || undefined,
          }),
          loadFavorites(),
        ]);
      } catch (err) {
        setError(err?.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapboxEnabled) {
      setLocationOptions([]);
      return;
    }

    const run = async () => {
      const q = (filters.location || "").trim();
      if (q.length < 3) {
        setLocationOptions([]);
        return;
      }

      try {
        setLocationLoading(true);
        const places = await searchPlacesMapbox(q, { limit: 6, language: "fr" });
        setLocationOptions(places);
      } catch {
        setLocationOptions([]);
      } finally {
        setLocationLoading(false);
      }
    };

    const timer = setTimeout(run, 350);
    return () => clearTimeout(timer);
  }, [filters.location, mapboxEnabled]);

  const handleReset = async () => {
    setFilters({ q: "", location: "", service: "" });
    setSelectedLocationOption(null);
    setError("");
    navigate("/search");
    setLoading(true);
    try {
      await loadEmployers({});
    } catch (err) {
      setError(err?.message || "Erreur de recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedLocation =
      selectedLocationOption?.address || selectedLocationOption?.label || filters.location;

    const params = {
      q: filters.q || undefined,
      location: normalizedLocation || undefined,
      service: selectedServiceId || filters.service || undefined,
    };

    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (normalizedLocation) query.set("location", normalizedLocation);
    if (selectedServiceId) query.set("service", selectedServiceId);
    else if (filters.service) query.set("service", filters.service);

    navigate(`/search${query.toString() ? `?${query.toString()}` : ""}`);

    try {
      await loadEmployers(params);
    } catch (err) {
      setError(err?.message || "Erreur de recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (employer) => {
    if (!isAuthenticated || !isClient) {
      setError("Connectez-vous avec un compte client pour gérer les favoris.");
      return;
    }

    try {
      setError("");
      const existing = favorites.find((f) => f?.employer?.id === employer.id);

      if (existing) {
        await favoritesAPI.removeEmployer(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        const created = await favoritesAPI.addEmployer(employer.id);
        setFavorites((prev) => [created, ...prev]);
      }
    } catch (err) {
      setError(err?.message || "Impossible de mettre à jour les favoris.");
    }
  };

  const handleContactEmployer = async (employer) => {
    if (!isAuthenticated || !isClient) {
      setError("Connectez-vous avec un compte client pour contacter un prestataire.");
      return;
    }

    setLoadingContactId(employer.id);
    try {
      setError("");
      const conversation = await messagingAPI.createConversation(employer.id);
      navigate(`/messages?conversationId=${conversation?.id}`);
    } catch (err) {
      setError(err?.message || "Impossible d'ouvrir la conversation.");
    } finally {
      setLoadingContactId(null);
    }
  };

  const getServiceLabel = (employer) => {
    const serviceName = employer?.service?.name;
    if (serviceName) return serviceName;
    const serviceId = employer?.service;
    if (typeof serviceId === "number") {
      const srv = services.find((s) => s.id === serviceId);
      return srv?.name || "Service non précisé";
    }
    return "Service non précisé";
  };

  const getLocationLabel = (employer) => {
    if (employer?.address && employer?.city) return `${employer.address}, ${employer.city}`;
    return employer?.city || employer?.address || "Non renseignée";
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 7 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.5,
          borderRadius: 4,
          background:
            "radial-gradient(circle at 10% -30%, rgba(243,139,42,.18), transparent 40%), #171b22",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box>
            <Chip icon={<TuneIcon />} label="Recherche prestataires" color="primary" sx={{ mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Trouver un prestataire
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recherchez par service, nom, description et localisation.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset}>
              Réinitialiser
            </Button>
          </Stack>
        </Stack>

        {!mapboxEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Suggestions d’adresse désactivées. Ajoutez <strong>VITE_MAPBOX_TOKEN</strong> dans{" "}
            <strong>frontend/.env</strong> pour activer l’autocomplete.
          </Alert>
        )}

        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Nom, service, description..."
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                value={selectedServiceId}
                onChange={(e) => setFilters((p) => ({ ...p, service: e.target.value }))}
                placeholder="Service"
              >
                <MenuItem value="">Tous les services</MenuItem>
                {services.map((srv) => (
                  <MenuItem key={srv.id} value={String(srv.id)}>
                    {srv.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                freeSolo
                options={locationOptions}
                loading={locationLoading}
                filterOptions={(x) => x}
                value={selectedLocationOption}
                onChange={(_, value) => {
                  if (value && typeof value !== "string") {
                    setSelectedLocationOption(value);
                    setFilters((p) => ({ ...p, location: value.address || value.label || "" }));
                  } else {
                    setSelectedLocationOption(null);
                  }
                }}
                inputValue={filters.location}
                onInputChange={(_, value) => {
                  setFilters((p) => ({ ...p, location: value }));
                  if (!value) setSelectedLocationOption(null);
                }}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label || ""
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Ville / Adresse"
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
              <Button fullWidth variant="contained" type="submit" sx={{ height: 56 }}>
                Rechercher
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {loading ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 1.2 }} color="text.secondary">
            Recherche en cours...
          </Typography>
        </Paper>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : employers.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 0.8 }}>
            Aucun prestataire trouvé
          </Typography>
          <Typography color="text.secondary">
            Essayez d’élargir vos critères (service, ville, nom).
          </Typography>
        </Paper>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 1.2 }}
          >
            <Typography color="text.secondary">
              {employers.length} prestataire{employers.length > 1 ? "s" : ""} trouvé
              {employers.length > 1 ? "s" : ""}.
            </Typography>
            {loadingFavorites && isAuthenticated && isClient && (
              <Typography variant="caption" color="text.secondary">
                Mise à jour des favoris...
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <InfoIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              Sélectionnez un prestataire, contactez-le, puis prenez rendez-vous en un clic.
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {employers.map((employer) => {
              const isFav = favoriteEmployerIds.has(employer.id);
              const serviceLabel = getServiceLabel(employer);

              return (
                <Grid item xs={12} sm={6} lg={4} key={employer.id}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      backgroundColor: alpha("#171b22", 0.95),
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "transform .2s ease, box-shadow .2s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 16px 30px rgba(0,0,0,.32)",
                      },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                            <PersonIcon fontSize="small" sx={{ color: "primary.main" }} />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 800,
                                lineHeight: 1.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={employer.name || "Prestataire"}
                            >
                              {employer.name || "Prestataire"}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
                            <Chip size="small" label={serviceLabel} variant="outlined" />
                            {employer.is_verified && (
                              <Chip size="small" color="success" icon={<VerifiedIcon />} label="Vérifié" />
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack spacing={1.1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Localisation
                          </Typography>
                          <Tooltip title={getLocationLabel(employer)}>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getLocationLabel(employer)}
                            </Typography>
                          </Tooltip>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Description
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {employer.description || "Aucune description disponible."}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 0.5 }}>
                          <Stack direction="row" alignItems="center" spacing={0.7}>
                            <Rating
                              value={Number(employer.average_rating || 0)}
                              precision={0.1}
                              readOnly
                              size="small"
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {Number(employer.average_rating || 0).toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({employer.total_reviews || 0})
                            </Typography>
                          </Stack>
                        </Stack>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Tarif horaire
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {employer.hourly_rate ? `${employer.hourly_rate} DA/h` : "Non renseigné"}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button size="small" variant="outlined" onClick={() => navigate(`/employers/${employer.id}`)}>
                        Voir détail
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EventAvailableIcon />}
                        onClick={() =>
                          navigate(
                            `/appointments?employerId=${employer.id}&serviceId=${
                              employer?.service?.id || employer?.service || ""
                            }`
                          )
                        }
                        disabled={!isClient}
                      >
                        Rendez-vous
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MessageIcon />}
                        onClick={() => handleContactEmployer(employer)}
                        disabled={!isClient || loadingContactId === employer.id}
                      >
                        {loadingContactId === employer.id ? "..." : "Contacter"}
                      </Button>

                      <Button
                        size="small"
                        variant={isFav ? "contained" : "outlined"}
                        color={isFav ? "error" : "primary"}
                        startIcon={isFav ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        onClick={() => handleToggleFavorite(employer)}
                        disabled={!isAuthenticated || !isClient}
                      >
                        {isFav ? "Retirer favori" : "Ajouter favori"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Search;