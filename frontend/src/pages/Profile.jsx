import React, { useMemo, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  Stack,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { useAuth } from "../contexts/AuthContext";
import { apiRequest, AUTH_URLS, CHANGE_PASSWORD_URL } from "../services/api";

const Profile = () => {
  const { user, refreshUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const displayName = useMemo(() => {
    const full = `${formData.firstName} ${formData.lastName}`.trim();
    return full || user?.username || "Utilisateur";
  }, [formData.firstName, formData.lastName, user?.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoadingProfile(true);

    try {
      await apiRequest(AUTH_URLS.USER, {
        method: "PATCH",
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        },
      });

      await refreshUser?.();
      setSuccess("Profil mis à jour avec succès.");
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoadingPassword(true);

    try {
      await apiRequest(CHANGE_PASSWORD_URL, {
        method: "POST",
        data: {
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        },
      });

      setSuccess("Mot de passe modifié avec succès.");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setError(
        err.message ||
          "Impossible de changer le mot de passe (endpoint peut être indisponible côté backend)."
      );
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Endpoint de suppression compte non garanti côté backend actuel.
    // On garde un comportement non destructif.
    setError(
      "Suppression de compte non disponible actuellement côté backend. Contacte le support pour cette action."
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          mb: 2.2,
          background:
            "radial-gradient(circle at 10% -30%, rgba(255,138,28,.14), transparent 38%), #171a21",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
          <Avatar
            sx={{
              width: 78,
              height: 78,
              bgcolor: alpha("#ff8a1c", 0.2),
              color: "primary.main",
              border: "1px solid",
              borderColor: "divider",
            }}
            src={user?.avatar}
          >
            {displayName?.[0]?.toUpperCase()}
          </Avatar>

          <Box>
            <Chip icon={<PersonOutlineIcon />} label="Espace compte" color="primary" sx={{ mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {displayName}
            </Typography>
            <Typography color="text.secondary">{formData.email || "—"}</Typography>
          </Box>
        </Stack>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.4, borderRadius: 3.5, height: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <PersonOutlineIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Informations personnelles
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handleProfileUpdate}>
              <Grid container spacing={1.4}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" disabled={loadingProfile}>
                    {loadingProfile ? "Mise à jour..." : "Mettre à jour le profil"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.4, borderRadius: 3.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <LockOutlinedIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Sécurité du compte
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handlePasswordChange}>
              <Stack spacing={1.4}>
                <TextField
                  fullWidth
                  label="Mot de passe actuel"
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="Nouveau mot de passe"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />

                <Button type="submit" variant="contained" disabled={loadingPassword}>
                  {loadingPassword ? "Mise à jour..." : "Changer le mot de passe"}
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 2.2 }} />

            <Box
              sx={{
                p: 1.4,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: alpha("#ff6b6b", 0.06),
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                <WarningAmberIcon color="error" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Zone sensible
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.2 }}>
                La suppression de compte n’est pas activée dans l’API actuelle.
              </Typography>
              <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
                Supprimer mon compte
              </Button>
              <Button variant="text" sx={{ ml: 1 }} onClick={logout}>
                Se déconnecter
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;