import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import {
  Person as PersonIcon,
  BusinessCenter as BusinessIcon,
  Save as SaveIcon,
  LockReset as LockResetIcon,
  DeleteForever as DeleteIcon,
  AddCircleOutline as AddIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    clientProfile,
    employerProfile,
    isClient,
    isEmployer,
    updateUser,
    refreshUser,
    deleteAccount,
  } = useAuth();

  const [tab, setTab] = useState("user");

  const [userForm, setUserForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [clientForm, setClientForm] = useState({
    name: clientProfile?.name || "",
    email: clientProfile?.email || user?.email || "",
    phone: clientProfile?.phone || user?.phone || "",
    address: clientProfile?.address || user?.address || "",
    city: clientProfile?.city || "",
  });

  const [employerForm, setEmployerForm] = useState({
    name: employerProfile?.name || "",
    email: employerProfile?.email || user?.email || "",
    phone: employerProfile?.phone || user?.phone || "",
    description: employerProfile?.description || "",
    city: employerProfile?.city || "",
    address: employerProfile?.address || user?.address || "",
    hourly_rate:
      employerProfile?.hourly_rate !== null && employerProfile?.hourly_rate !== undefined
        ? String(employerProfile.hourly_rate)
        : "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [loadingEmployer, setLoadingEmployer] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initials = useMemo(() => {
    const full = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    if (full) return full.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    return (user?.username || "U").slice(0, 2).toUpperCase();
  }, [user]);

  const resetMessages = () => {
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleUserField = (key, value) => {
    setUserForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClientField = (key, value) => {
    setClientForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmployerField = (key, value) => {
    setEmployerForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasswordField = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitUserUpdate = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoadingUser(true);

    try {
      await updateUser({
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        email: userForm.email,
        phone: userForm.phone,
        address: userForm.address,
      });
      await refreshUser();
      setSuccessMsg("Profil utilisateur mis à jour avec succès.");
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de mettre à jour le profil utilisateur.");
    } finally {
      setLoadingUser(false);
    }
  };

  const submitClientProfile = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoadingClient(true);

    try {
      if (clientProfile) {
        await userAPI.updateProfile({
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone,
          address: clientForm.address,
          city: clientForm.city,
        });
      } else {
        await userAPI.createClientProfile({
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone,
          address: clientForm.address,
          city: clientForm.city,
        });
      }

      await refreshUser();
      setSuccessMsg(clientProfile ? "Profil client mis à jour." : "Profil client créé avec succès.");
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de sauvegarder le profil client.");
    } finally {
      setLoadingClient(false);
    }
  };

  const submitEmployerProfile = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoadingEmployer(true);

    try {
      const payload = {
        name: employerForm.name,
        email: employerForm.email,
        phone: employerForm.phone,
        description: employerForm.description,
        city: employerForm.city,
        address: employerForm.address,
        hourly_rate: employerForm.hourly_rate === "" ? null : Number(employerForm.hourly_rate),
      };

      if (employerProfile) {
        await userAPI.updateProfile(payload);
      } else {
        await userAPI.createEmployerProfile(payload);
      }

      await refreshUser();
      setSuccessMsg(employerProfile ? "Profil prestataire mis à jour." : "Profil prestataire créé avec succès.");
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de sauvegarder le profil prestataire.");
    } finally {
      setLoadingEmployer(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!passwordForm.current_password || !passwordForm.new_password) {
      setErrorMsg("Veuillez renseigner l’ancien et le nouveau mot de passe.");
      return;
    }
    if (
      passwordForm.confirm_password &&
      passwordForm.new_password !== passwordForm.confirm_password
    ) {
      setErrorMsg("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setLoadingPassword(true);
    try {
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
                Mon profil
              </Typography>
              <Typography color="text.secondary">
                Gérez vos informations, vos profils et la sécurité de votre compte.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<PersonIcon />}
              label={isClient ? "Compte client actif" : "Compte client inactif"}
              color={isClient ? "success" : "default"}
              variant={isClient ? "filled" : "outlined"}
            />
            <Chip
              icon={<BusinessIcon />}
              label={isEmployer ? "Compte prestataire actif" : "Compte prestataire inactif"}
              color={isEmployer ? "success" : "default"}
              variant={isEmployer ? "filled" : "outlined"}
            />
          </Stack>
        </Stack>

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

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Button
            variant={tab === "user" ? "contained" : "outlined"}
            onClick={() => setTab("user")}
          >
            Utilisateur
          </Button>
          <Button
            variant={tab === "client" ? "contained" : "outlined"}
            onClick={() => setTab("client")}
          >
            Profil client
          </Button>
          <Button
            variant={tab === "employer" ? "contained" : "outlined"}
            onClick={() => setTab("employer")}
          >
            Profil prestataire
          </Button>
          <Button
            variant={tab === "security" ? "contained" : "outlined"}
            onClick={() => setTab("security")}
          >
            Sécurité
          </Button>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {tab === "user" && (
          <Box component="form" onSubmit={submitUserUpdate}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Prénom"
                  fullWidth
                  value={userForm.first_name}
                  onChange={(e) => handleUserField("first_name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom"
                  fullWidth
                  value={userForm.last_name}
                  onChange={(e) => handleUserField("last_name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={userForm.email}
                  onChange={(e) => handleUserField("email", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Téléphone"
                  fullWidth
                  value={userForm.phone}
                  onChange={(e) => handleUserField("phone", e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Adresse"
                  fullWidth
                  multiline
                  minRows={2}
                  value={userForm.address}
                  onChange={(e) => handleUserField("address", e.target.value)}
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loadingUser}
              >
                {loadingUser ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </Stack>
          </Box>
        )}

        {tab === "client" && (
          <Box component="form" onSubmit={submitClientProfile}>
            {!clientProfile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Vous n’avez pas encore de profil client. Complétez le formulaire pour le créer.
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom complet client"
                  fullWidth
                  value={clientForm.name}
                  onChange={(e) => handleClientField("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email client"
                  type="email"
                  fullWidth
                  value={clientForm.email}
                  onChange={(e) => handleClientField("email", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Téléphone client"
                  fullWidth
                  value={clientForm.phone}
                  onChange={(e) => handleClientField("phone", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ville"
                  fullWidth
                  value={clientForm.city}
                  onChange={(e) => handleClientField("city", e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Adresse client"
                  fullWidth
                  multiline
                  minRows={2}
                  value={clientForm.address}
                  onChange={(e) => handleClientField("address", e.target.value)}
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
              {!clientProfile ? (
                <Chip icon={<AddIcon />} color="warning" label="Création d’un nouveau profil client" />
              ) : (
                <Chip icon={<PersonIcon />} color="success" label="Profil client existant" />
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loadingClient}
              >
                {loadingClient
                  ? "Enregistrement..."
                  : clientProfile
                  ? "Mettre à jour"
                  : "Créer le profil client"}
              </Button>
            </Stack>
          </Box>
        )}

        {tab === "employer" && (
          <Box component="form" onSubmit={submitEmployerProfile}>
            {!employerProfile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Vous n’avez pas encore de profil prestataire. Complétez le formulaire pour le créer.
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom prestataire"
                  fullWidth
                  value={employerForm.name}
                  onChange={(e) => handleEmployerField("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email prestataire"
                  type="email"
                  fullWidth
                  value={employerForm.email}
                  onChange={(e) => handleEmployerField("email", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Téléphone prestataire"
                  fullWidth
                  value={employerForm.phone}
                  onChange={(e) => handleEmployerField("phone", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tarif horaire"
                  type="number"
                  fullWidth
                  value={employerForm.hourly_rate}
                  onChange={(e) => handleEmployerField("hourly_rate", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ville"
                  fullWidth
                  value={employerForm.city}
                  onChange={(e) => handleEmployerField("city", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Adresse prestataire"
                  fullWidth
                  value={employerForm.address}
                  onChange={(e) => handleEmployerField("address", e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  value={employerForm.description}
                  onChange={(e) => handleEmployerField("description", e.target.value)}
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
              {!employerProfile ? (
                <Chip
                  icon={<AddIcon />}
                  color="warning"
                  label="Création d’un nouveau profil prestataire"
                />
              ) : (
                <Chip icon={<BusinessIcon />} color="success" label="Profil prestataire existant" />
              )}

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loadingEmployer}
              >
                {loadingEmployer
                  ? "Enregistrement..."
                  : employerProfile
                  ? "Mettre à jour"
                  : "Créer le profil prestataire"}
              </Button>
            </Stack>
          </Box>
        )}

        {tab === "security" && (
          <Stack spacing={3}>
            <Box component="form" onSubmit={submitPasswordChange}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Changer le mot de passe
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Mot de passe actuel"
                    type="password"
                    fullWidth
                    value={passwordForm.current_password}
                    onChange={(e) => handlePasswordField("current_password", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nouveau mot de passe"
                    type="password"
                    fullWidth
                    value={passwordForm.new_password}
                    onChange={(e) => handlePasswordField("new_password", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    fullWidth
                    value={passwordForm.confirm_password}
                    onChange={(e) => handlePasswordField("confirm_password", e.target.value)}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  startIcon={<LockResetIcon />}
                  disabled={loadingPassword}
                >
                  {loadingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Zone de danger
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Cette action est irréversible. Toutes vos données associées seront supprimées.
              </Typography>

              <Button
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteConfirm(true)}
              >
                Supprimer mon compte
              </Button>
            </Box>
          </Stack>
        )}
      </Paper>

      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer définitivement votre compte ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteAccount}
            disabled={loadingDelete}
          >
            {loadingDelete ? "Suppression..." : "Oui, supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;