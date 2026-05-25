import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import {
  Person as PersonIcon,
  BusinessCenter as BusinessIcon,
  Save as SaveIcon,
  LockReset as LockResetIcon,
  DeleteForever as DeleteIcon,
  HomeWork as HomeWorkIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { searchPlacesMapbox, userAPI, isMapboxConfigured } from "../services/api";

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    clientProfile,
    employerProfile,
    isClient,
    isEmployer,
    refreshUser,
    deleteAccount,
  } = useAuth();

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    name: "",
    description: "",
    hourly_rate: "",
    is_available: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // Mapbox autocomplete (adresse)
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [mapboxEnabled] = useState(isMapboxConfigured());

  const roleLabel = isEmployer ? "prestataire" : "client";

  const initials = useMemo(() => {
    const first = profileForm.first_name || user?.first_name || "";
    const last = profileForm.last_name || user?.last_name || "";
    const full = `${first} ${last}`.trim();
    if (full) {
      return full
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return (user?.username || "U").slice(0, 2).toUpperCase();
  }, [profileForm.first_name, profileForm.last_name, user]);

  const resetMessages = () => {
    setSuccessMsg("");
    setErrorMsg("");
  };

  useEffect(() => {
    if (isClient) {
      setProfileForm({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: clientProfile?.email || user?.email || "",
        phone: clientProfile?.phone || user?.phone || "",
        address: clientProfile?.address || user?.address || "",
        city: clientProfile?.city || "",
        name:
          clientProfile?.name ||
          `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
        description: "",
        hourly_rate: "",
        is_available: true,
      });
      return;
    }

    if (isEmployer) {
      setProfileForm({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: employerProfile?.email || user?.email || "",
        phone: employerProfile?.phone || user?.phone || "",
        address: employerProfile?.address || user?.address || "",
        city: employerProfile?.city || "",
        name: employerProfile?.name || "",
        description: employerProfile?.description || "",
        hourly_rate:
          employerProfile?.hourly_rate !== null &&
          employerProfile?.hourly_rate !== undefined
            ? String(employerProfile.hourly_rate)
            : "",
        is_available:
          typeof employerProfile?.is_available === "boolean"
            ? employerProfile.is_available
            : true,
      });
    }
  }, [isClient, isEmployer, user, clientProfile, employerProfile]);

  useEffect(() => {
    if (!mapboxEnabled) {
      setAddressOptions([]);
      return;
    }

    const q = (profileForm.address || "").trim();
    if (q.length < 3) {
      setAddressOptions([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setAddressLoading(true);
        const places = await searchPlacesMapbox(q, { limit: 6, language: "fr" });
        if (!active) return;
        setAddressOptions(places);
      } catch {
        if (!active) return;
        setAddressOptions([]);
      } finally {
        if (active) setAddressLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [profileForm.address, mapboxEnabled]);

  const handleProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasswordField = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAddress = (option) => {
    if (!option) return;
    handleProfileField("address", option.address || option.label || "");
    if (option.city) {
      handleProfileField("city", option.city);
    }
  };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoadingProfile(true);

    try {
      // 1) Mise à jour user de base (toujours)
      await userAPI.updateUser({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
      });

      // 2) Mise à jour profil par rôle (strict, pas de mélange)
      if (isClient) {
        await userAPI.updateProfile(
          {
            name:
              profileForm.name ||
              `${profileForm.first_name} ${profileForm.last_name}`.trim(),
            email: profileForm.email,
            phone: profileForm.phone,
            address: profileForm.address,
            city: profileForm.city,
          },
          "client"
        );
      } else if (isEmployer) {
        await userAPI.updateProfile(
          {
            name: profileForm.name,
            email: profileForm.email,
            phone: profileForm.phone,
            address: profileForm.address,
            city: profileForm.city,
            description: profileForm.description,
            hourly_rate:
              profileForm.hourly_rate === ""
                ? null
                : Number(profileForm.hourly_rate),
            is_available: !!profileForm.is_available,
          },
          "employer"
        );
      } else {
        throw new Error("Rôle de compte non reconnu.");
      }

      await refreshUser();
      setSuccessMsg(`Profil ${roleLabel} mis à jour avec succès.`);
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de mettre à jour le profil.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!passwordForm.current_password || !passwordForm.new_password) {
      setErrorMsg("Veuillez renseigner l’ancien et le nouveau mot de passe.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErrorMsg("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    try {
      setLoadingPassword(true);
      await userAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setSuccessMsg("Mot de passe modifié avec succès.");
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de modifier le mot de passe.");
    } finally {
      setLoadingPassword(false);
    }
  };

  const confirmDeleteAccount = async () => {
    resetMessages();
    setLoadingDelete(true);
    try {
      await deleteAccount();
      setOpenDeleteConfirm(false);
      navigate("/login", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de supprimer le compte.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
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
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: alpha("#f38b2a", 0.25),
                color: "#ffd9b0",
                border: "1px solid",
                borderColor: "divider",
                width: 56,
                height: 56,
                fontWeight: 800,
              }}
            >
              {initials}
            </Avatar>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {isClient ? "Profil client" : "Profil prestataire"}
              </Typography>
              <Typography color="text.secondary">
                {isClient
                  ? "Gérez vos informations personnelles de réservation."
                  : "Gérez vos informations professionnelles et votre visibilité."}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<PersonIcon />}
              label={isClient ? "Compte client" : "Compte utilisateur"}
              color={isClient ? "success" : "default"}
              variant={isClient ? "filled" : "outlined"}
            />
            <Chip
              icon={<BusinessIcon />}
              label={isEmployer ? "Compte prestataire" : "Non prestataire"}
              color={isEmployer ? "success" : "default"}
              variant={isEmployer ? "filled" : "outlined"}
            />
          </Stack>
        </Stack>

        {!mapboxEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Suggestions d’adresse désactivées. Ajoutez{" "}
            <strong>VITE_MAPBOX_TOKEN</strong> dans le fichier <strong>.env</strong>{" "}
            du frontend pour activer l’autocomplete.
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha("#111318", 0.45) }}>
              <Typography sx={{ fontWeight: 800, mb: 1.2 }}>
                {isClient ? "Profil client" : "Profil prestataire"}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              <Box component="form" onSubmit={submitProfileUpdate}>
                <Grid container spacing={1.4}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      value={profileForm.first_name}
                      onChange={(e) =>
                        handleProfileField("first_name", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      value={profileForm.last_name}
                      onChange={(e) =>
                        handleProfileField("last_name", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email"
                      value={profileForm.email}
                      onChange={(e) => handleProfileField("email", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={profileForm.phone}
                      onChange={(e) => handleProfileField("phone", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={isClient ? "Nom affiché client" : "Nom du prestataire"}
                      value={profileForm.name}
                      onChange={(e) => handleProfileField("name", e.target.value)}
                      placeholder={isClient ? "Ex: Ahmed K." : "Ex: Plomberie Pro DZ"}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ville"
                      value={profileForm.city}
                      onChange={(e) => handleProfileField("city", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      freeSolo
                      options={addressOptions}
                      loading={addressLoading}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.label || ""
                      }
                      filterOptions={(x) => x}
                      onInputChange={(_, value) =>
                        handleProfileField("address", value)
                      }
                      onChange={(_, selected) => {
                        if (selected && typeof selected !== "string") {
                          handleSelectAddress(selected);
                        }
                      }}
                      inputValue={profileForm.address}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Adresse"
                          placeholder="Tapez une adresse précise..."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {addressLoading ? (
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

                  {isEmployer && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Tarif horaire (DA)"
                          type="number"
                          value={profileForm.hourly_rate}
                          onChange={(e) =>
                            handleProfileField("hourly_rate", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Disponibilité / statut"
                          value={profileForm.is_available ? "available" : "unavailable"}
                          onChange={(e) =>
                            handleProfileField(
                              "is_available",
                              e.target.value === "available"
                            )
                          }
                        >
                          <MenuItem value="available">Disponible</MenuItem>
                          <MenuItem value="unavailable">Indisponible</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label="Description"
                          value={profileForm.description}
                          onChange={(e) =>
                            handleProfileField("description", e.target.value)
                          }
                          placeholder="Présentez vos services, votre expérience, zones couvertes..."
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      type="submit"
                      startIcon={<SaveIcon />}
                      disabled={loadingProfile}
                    >
                      {loadingProfile
                        ? "Sauvegarde..."
                        : `Sauvegarder le profil ${roleLabel}`}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha("#111318", 0.45) }}>
              <Typography sx={{ fontWeight: 800, mb: 1.2 }}>
                Sécurité du compte
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              <Box component="form" onSubmit={submitPasswordChange}>
                <Grid container spacing={1.4}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Mot de passe actuel"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        handlePasswordField("current_password", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Nouveau mot de passe"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        handlePasswordField("new_password", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirmer le nouveau mot de passe"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        handlePasswordField("confirm_password", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      type="submit"
                      startIcon={<LockResetIcon />}
                      disabled={loadingPassword}
                    >
                      {loadingPassword
                        ? "Modification..."
                        : "Changer le mot de passe"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha("#2b1418", 0.45) }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.6 }}>
                <HomeWorkIcon sx={{ color: "error.main" }} />
                <Typography sx={{ fontWeight: 800 }}>Suppression du compte</Typography>
              </Stack>

              <Typography color="text.secondary" sx={{ mb: 1.2 }}>
                Cette action supprime définitivement votre compte {roleLabel} et toutes
                vos données associées.
              </Typography>

              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteConfirm(true)}
              >
                Supprimer mon compte
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
            irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Annuler</Button>
          <Button color="error" onClick={confirmDeleteAccount} disabled={loadingDelete}>
            {loadingDelete ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;