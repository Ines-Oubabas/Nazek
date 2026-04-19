// frontend/src/pages/Search.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Container,
  Grid,
  TextField,
  Box,
  Typography,
  Button,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Euro as EuroIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";

import { getServices } from "../services/api";
import ServiceCard from "../components/common/ServiceCard";

const FAVORITES_KEY = "favorites_services";

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const Search = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();

  // ✅ init depuis Home (location.state) OU URL params
  const initialQuery =
    routerLocation.state?.query ??
    searchParams.get("q") ??
    "";
  const initialLocation =
    routerLocation.state?.location ??
    searchParams.get("location") ??
    "";

  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    query: initialQuery,
    location: initialLocation,
    minPrice: "",
    maxPrice: "",
    rating: 0,
    category: "",
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // ✅ Fetch UNE seule fois
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getServices();
        const list = Array.isArray(data) ? data : data?.results ?? [];
        setAllServices(list);
      } catch (err) {
        setError(err.message || "Une erreur est survenue lors du chargement des services");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // ✅ Si l’utilisateur revient via back/forward et que l’URL change, on sync
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const loc = searchParams.get("location") ?? "";

    // On ne remplace pas si déjà identique
    setFilters((prev) => {
      if (prev.query === q && prev.location === loc) return prev;
      return { ...prev, query: q, location: loc };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const hasAnyPrice = useMemo(
    () => allServices.some((s) => s?.price !== undefined && s?.price !== null),
    [allServices]
  );

  const hasAnyRating = useMemo(
    () =>
      allServices.some(
        (s) =>
          s?.rating !== undefined ||
          s?.average_rating !== undefined ||
          s?.avg_rating !== undefined
      ),
    [allServices]
  );

  const availableCategories = useMemo(() => {
    // essaie de trouver une catégorie si elle existe côté backend
    const cats = new Set();
    allServices.forEach((s) => {
      const c =
        s?.category ||
        s?.service_type ||
        s?.type ||
        "";
      if (c) cats.add(String(c));
    });
    return Array.from(cats);
  }, [allServices]);

  const filteredServices = useMemo(() => {
    const q = (filters.query || "").trim().toLowerCase();
    const loc = (filters.location || "").trim().toLowerCase();
    const minP = filters.minPrice === "" ? null : safeNumber(filters.minPrice, null);
    const maxP = filters.maxPrice === "" ? null : safeNumber(filters.maxPrice, null);
    const minRating = safeNumber(filters.rating, 0);
    const category = (filters.category || "").trim().toLowerCase();

    return allServices.filter((s) => {
      // --- text query
      if (q) {
        const hay = `${s?.name ?? ""} ${s?.description ?? ""} ${s?.icon ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // --- location (si ton backend n’a pas ce champ, ça n’exclut rien)
      if (loc) {
        const hayLoc = `${s?.location ?? ""} ${s?.city ?? ""} ${s?.address ?? ""}`.toLowerCase();
        if (hayLoc && !hayLoc.includes(loc)) return false;
      }

      // --- category (si pas de champ catégorie, on ignore)
      if (category) {
        const c = `${s?.category ?? s?.service_type ?? s?.type ?? ""}`.toLowerCase();
        if (c && c !== category) return false;
      }

      // --- price (uniquement si au moins un service a price)
      if (hasAnyPrice) {
        const price = safeNumber(s?.price, 0);
        if (minP !== null && price < minP) return false;
        if (maxP !== null && price > maxP) return false;
      }

      // --- rating (uniquement si au moins un service a rating)
      if (hasAnyRating) {
        const r =
          safeNumber(s?.rating, NaN) ||
          safeNumber(s?.average_rating, NaN) ||
          safeNumber(s?.avg_rating, NaN) ||
          0;
        if (minRating > 0 && r < minRating) return false;
      }

      return true;
    });
  }, [allServices, filters, hasAnyPrice, hasAnyRating]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const q = encodeURIComponent(filters.query || "");
    const loc = encodeURIComponent(filters.location || "");

    // ✅ URL propre + partageable
    navigate(`/search?q=${q}&location=${loc}`);
  };

  const handleReset = () => {
    setFilters({
      query: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      rating: 0,
      category: "",
    });
    navigate("/search");
  };

  const toggleFavorite = (serviceId) => {
    setFavorites((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      {/* Header / Search bar */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Rechercher un service
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tapez un mot-clé, appliquez des filtres, puis ouvrez un service pour réserver.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button variant="contained" onClick={() => navigate("/")}>
              Accueil
            </Button>
          </Stack>
        </Stack>

        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Que recherchez-vous ? (ex: ménage, réparation...)"
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
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
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ville / Adresse (optionnel)"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
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
              <Button fullWidth variant="contained" type="submit" sx={{ height: "56px" }}>
                Rechercher
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
            <Typography variant="h6" sx={{ fontWeight: 800 }} gutterBottom>
              Filtres
            </Typography>
            <Divider sx={{ my: 2 }} />

            {/* Prix */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom sx={{ fontWeight: 700 }}>
                Prix
              </Typography>

              {!hasAnyPrice ? (
                <Alert severity="info" sx={{ mb: 1 }}>
                  Le champ <b>price</b> n’est pas disponible dans ton backend (normal).
                </Alert>
              ) : null}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Min"
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    disabled={!hasAnyPrice}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EuroIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Max"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    disabled={!hasAnyPrice}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EuroIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Note */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom sx={{ fontWeight: 700 }}>
                Note minimum
              </Typography>

              {!hasAnyRating ? (
                <Alert severity="info" sx={{ mb: 1 }}>
                  Le champ <b>rating</b> n’est pas disponible dans ton backend (normal).
                </Alert>
              ) : null}

              <Rating
                value={filters.rating}
                onChange={(_, value) => handleFilterChange("rating", value || 0)}
                precision={0.5}
                disabled={!hasAnyRating}
                emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
              />
            </Box>

            {/* Catégorie */}
            <Box>
              <Typography gutterBottom sx={{ fontWeight: 700 }}>
                Catégorie
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={filters.category}
                  label="Catégorie"
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>

                  {/* ✅ si ton backend a des catégories -> on les affiche */}
                  {availableCategories.length > 0 ? (
                    availableCategories.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))
                  ) : (
                    <>
                      {/* fallback UI (non bloquant) */}
                      <MenuItem value="beauty">Beauté</MenuItem>
                      <MenuItem value="health">Santé</MenuItem>
                      <MenuItem value="education">Éducation</MenuItem>
                      <MenuItem value="home">Maison</MenuItem>
                      <MenuItem value="other">Autre</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={9}>
          <Paper elevation={0} sx={{ mb: 2, p: 2, borderRadius: 3, bgcolor: "grey.50" }}>
            <Typography variant="body2" color="text.secondary">
              Résultats : <b>{filteredServices.length}</b> service(s)
            </Typography>
          </Paper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : filteredServices.length === 0 ? (
            <Alert severity="info">
              Aucun service trouvé. Essayez de modifier la recherche ou les filtres.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredServices.map((service) => (
                <Grid item xs={12} sm={6} key={service.id}>
                  <ServiceCard
                    service={service}
                    isFavorite={favorites.includes(service.id)}
                    onFavoriteClick={() => toggleFavorite(service.id)}
                    onClick={() => navigate(`/services/${service.id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Search;