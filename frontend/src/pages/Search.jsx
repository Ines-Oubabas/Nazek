import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Grid,
  TextField,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  InputAdornment,
  Chip,
  Autocomplete,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  RestartAlt as ResetIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";

import { getServices, searchPlacesMapbox } from "../services/api";
import ServiceCard from "../components/common/ServiceCard";

const FAVORITES_KEY = "favorites_services";

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const [filters, setFilters] = useState({
    query: searchParams.get("q") || "",
    location: searchParams.get("location") || "",
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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getServices();
        const list = Array.isArray(data) ? data : data?.results ?? [];
        setAllServices(list);
      } catch (err) {
        setError(err.message || "Erreur de chargement des services.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

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

  const filteredServices = useMemo(() => {
    const q = (filters.query || "").trim().toLowerCase();
    const loc = (filters.location || "").trim().toLowerCase();

    return allServices.filter((s) => {
      const hay = `${s?.name ?? ""} ${s?.description ?? ""}`.toLowerCase();
      if (q && !hay.includes(q)) return false;

      if (loc) {
        const hayLoc = `${s?.location ?? ""} ${s?.city ?? ""} ${s?.address ?? ""}`.toLowerCase();
        if (hayLoc && !hayLoc.includes(loc)) return false;
      }

      return true;
    });
  }, [allServices, filters]);

  const handleReset = () => {
    setFilters({ query: "", location: "" });
    navigate("/search");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = encodeURIComponent(filters.query || "");
    const loc = encodeURIComponent(filters.location || "");
    navigate(`/search?q=${q}&location=${loc}`);
  };

  const toggleFavorite = (serviceId) => {
    setFavorites((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 7 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.5,
          borderRadius: 4,
          background: "radial-gradient(circle at 10% -30%, rgba(243,139,42,.18), transparent 40%), #171b22",
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
            <Chip icon={<TuneIcon />} label="Recherche intelligente" color="primary" sx={{ mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Explorer les services
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Filtrez, comparez et trouvez rapidement le bon prestataire.
            </Typography>
          </Box>

          <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset}>
            Réinitialiser
          </Button>
        </Stack>

        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Que recherchez-vous ?"
                value={filters.query}
                onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))}
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
                inputValue={filters.location}
                onInputChange={(_, value) => setFilters((p) => ({ ...p, location: value }))}
                loading={locationLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Ville / Adresse (Mapbox)"
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
        </Paper>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredServices.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography>Aucun service trouvé.</Typography>
        </Paper>
      ) : (
        <>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {filteredServices.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <ServiceCard
                  service={service}
                  isFavorite={favorites.includes(service.id)}
                  onToggleFavorite={() => toggleFavorite(service.id)}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Search;