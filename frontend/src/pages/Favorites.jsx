import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import VerifiedIcon from "@mui/icons-material/Verified";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { favoritesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const normalizeList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

const Favorites = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();

  const [favoriteServices, setFavoriteServices] = useState([]);
  const [favoriteEmployers, setFavoriteEmployers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const totalCount = useMemo(
    () => favoriteServices.length + favoriteEmployers.length,
    [favoriteServices.length, favoriteEmployers.length]
  );

  const resetMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  const fetchFavorites = async () => {
    setLoading(true);
    resetMessages();

    try {
      const [servicesRes, employersRes] = await Promise.all([
        favoritesAPI.listServices(),
        favoritesAPI.listEmployers(),
      ]);

      setFavoriteServices(normalizeList(servicesRes));
      setFavoriteEmployers(normalizeList(employersRes));
    } catch (err) {
      setError(err?.message || "Impossible de charger vos favoris.");
      setFavoriteServices([]);
      setFavoriteEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isClient) {
      setLoading(false);
      setError("Les favoris sont disponibles uniquement pour les comptes clients.");
      return;
    }

    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isClient]);

  const removeServiceFavorite = async (favoriteId) => {
    const key = `service-${favoriteId}`;
    setRemovingKey(key);
    resetMessages();

    try {
      await favoritesAPI.removeService(favoriteId);
      setFavoriteServices((prev) => prev.filter((item) => item.id !== favoriteId));
      setSuccessMsg("Service retiré des favoris.");
    } catch (err) {
      setError(err?.message || "Impossible de retirer ce service des favoris.");
    } finally {
      setRemovingKey("");
    }
  };

  const removeEmployerFavorite = async (favoriteId) => {
    const key = `employer-${favoriteId}`;
    setRemovingKey(key);
    resetMessages();

    try {
      await favoritesAPI.removeEmployer(favoriteId);
      setFavoriteEmployers((prev) => prev.filter((item) => item.id !== favoriteId));
      setSuccessMsg("Prestataire retiré des favoris.");
    } catch (err) {
      setError(err?.message || "Impossible de retirer ce prestataire des favoris.");
    } finally {
      setRemovingKey("");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.2,
          borderRadius: 4,
          background:
            "radial-gradient(circle at 8% -28%, rgba(255,111,120,.16), transparent 42%), #171b22",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1.4}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FavoriteIcon sx={{ color: "#ff6f78" }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Mes favoris
              </Typography>
            </Stack>
            <Typography color="text.secondary">
              Retrouvez vos services et prestataires favoris en un seul endroit.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<FavoriteBorderIcon />}
              label={`${totalCount} favori${totalCount > 1 ? "s" : ""}`}
              color="primary"
              variant="outlined"
            />
            <Button variant="outlined" onClick={fetchFavorites} disabled={loading}>
              Actualiser
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 1.2 }} color="text.secondary">
            Chargement des favoris...
          </Typography>
        </Paper>
      ) : !isClient ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h6">Accès limité</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.7 }}>
            Les favoris sont réservés aux comptes clients.
          </Typography>
        </Paper>
      ) : totalCount === 0 ? (
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: "center",
            backgroundColor: alpha("#232935", 0.45),
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <FavoriteBorderIcon sx={{ fontSize: 42, color: "text.secondary", mb: 1 }} />
          <Typography variant="h6">Aucun favori pour le moment</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.7, mb: 2 }}>
            Ajoutez des services ou des prestataires depuis la recherche.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/search")}>
            Rechercher
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {/* Services favoris */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
              <BuildCircleIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Services favoris
              </Typography>
              <Chip size="small" label={favoriteServices.length} />
            </Stack>

            <Divider sx={{ mb: 1.6 }} />

            {favoriteServices.length === 0 ? (
              <Paper sx={{ p: 2.2, borderRadius: 2.5 }}>
                <Typography color="text.secondary">
                  Aucun service favori.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {favoriteServices.map((fav) => {
                  const service = fav.service || {};
                  const isRemoving = removingKey === `service-${fav.id}`;

                  return (
                    <Grid item xs={12} sm={6} lg={4} key={fav.id}>
                      <Card
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          backgroundColor: alpha("#171b22", 0.95),
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.6 }}>
                            {service.name || "Service"}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: 58,
                            }}
                          >
                            {service.description || "Aucune description disponible."}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: "wrap" }}>
                          {service.id && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/services/${service.id}`)}
                            >
                              Voir détail
                            </Button>
                          )}

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => removeServiceFavorite(fav.id)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? "Suppression..." : "Retirer"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* Prestataires favoris */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
              <BusinessCenterIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Prestataires favoris
              </Typography>
              <Chip size="small" label={favoriteEmployers.length} />
            </Stack>

            <Divider sx={{ mb: 1.6 }} />

            {favoriteEmployers.length === 0 ? (
              <Paper sx={{ p: 2.2, borderRadius: 2.5 }}>
                <Typography color="text.secondary">
                  Aucun prestataire favori.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {favoriteEmployers.map((fav) => {
                  const employer = fav.employer || {};
                  const isRemoving = removingKey === `employer-${fav.id}`;

                  return (
                    <Grid item xs={12} sm={6} lg={4} key={fav.id}>
                      <Card
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          backgroundColor: alpha("#171b22", 0.95),
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                              {employer.name || "Prestataire"}
                            </Typography>
                            {employer.is_verified && (
                              <Chip
                                size="small"
                                color="success"
                                icon={<VerifiedIcon />}
                                label="Vérifié"
                              />
                            )}
                          </Stack>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.7 }}>
                            {employer?.service?.name || "Service non précisé"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.7 }}>
                            {employer.city || employer.address || "Localisation non précisée"}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: 58,
                            }}
                          >
                            {employer.description || "Aucune description disponible."}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/search?q=${encodeURIComponent(employer.name || "")}`)}
                          >
                            Voir profil
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              navigate(
                                `/appointments?employerId=${employer.id || ""}&serviceId=${
                                  employer?.service?.id || employer?.service || ""
                                }`
                              )
                            }
                          >
                            Prendre RDV
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => removeEmployerFavorite(fav.id)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? "Suppression..." : "Retirer"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Stack>
      )}
    </Container>
  );
};

export default Favorites;