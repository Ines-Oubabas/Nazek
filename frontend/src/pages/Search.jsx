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
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

import {
  getServices,
  searchPlacesMapbox,
  searchAPI,
  favoritesAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isClient } = useAuth();

  const [services, setServices] = useState([]);
  const [employers, setEmployers] = useState([]);

  const [favorites, setFavorites] = useState([]); // [{id, employer:{id,...}}]
  const favoriteEmployerIds = useMemo(
    () => new Set(favorites.map((f) => f?.employer?.id).filter(Boolean)),
    [favorites]
  );

  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [error, setError] = useState("");

  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

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
    const list = Array.isArray(data) ? data : data?.results ?? [];
    setServices(list);
  };

  const loadEmployers = async (params = {}) => {
    const data = await searchAPI.employers(params);
    const list = Array.isArray(data) ? data : data?.results ?? [];
    setEmployers(list);
  };

  const loadFavorites = async () => {
    if (!isAuthenticated || !isClient) {
      setFavorites([]);
      return;
    }
    setLoadingFavorites(true);
    try {
      const data = await favoritesAPI.listEmployers();
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setFavorites(list);
    } catch {
      // Non bloquant pour la recherche
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
    const run = async () => {
      const q = (filters.location || "").trim();
      if (q.length < 3) {
        setLocationOptions([]);
        return;
      }

      try {
        setLocationLoading(true);
        const results = await searchPlacesMapbox(q);
        setLocationOptions(results.map((r) => r.place_name));
      } finally {
        setLocationLoading(false);
      }
    };

    const timer = setTimeout(run, 350);
    return () => clearTimeout(timer);
  }, [filters.location]);

  const handleReset = async () => {
    setFilters({ q: "", location: "", service: "" });
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

    const params = {
      q: filters.q || undefined,
      location: filters.location || undefined,
      service: selectedServiceId || filters.service || undefined,
    };

    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.location) query.set("location", filters.location);
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
              Recherchez par nom, service, description ou localisation.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset}>
              Réinitialiser
            </Button>
          </Stack>
        </Stack>

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
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    service: e.target.value,
                  }))
                }
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
                inputValue={filters.location}
                onInputChange={(_, value) => setFilters((p) => ({ ...p, location: value }))}
                loading={locationLoading}
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
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                            <PersonIcon fontSize="small" sx={{ color: "primary.main" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                              {employer.name || "Prestataire"}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
                            <Chip size="small" label={serviceLabel} variant="outlined" />
                            {employer.is_verified && (
                              <Chip
                                size="small"
                                color="success"
                                icon={<VerifiedIcon />}
                                label="Vérifié"
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack spacing={1.1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Localisation
                          </Typography>
                          <Typography variant="body2">
                            {employer.city || employer.address || "Non renseignée"}
                          </Typography>
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
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/employers/${employer.id}`)}
                      >
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
                      >
                        Rendez-vous
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