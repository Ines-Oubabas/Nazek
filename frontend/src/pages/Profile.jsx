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
  const [loadingRoleProfile, setLoadingRoleProfile] = useState(false);
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

  const submitRoleProfile = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoadingRoleProfile(true);

    try {
      if (isClient) {
        await userAPI.updateProfile(
          {
            name: clientForm.name,
            email: clientForm.email,
            phone: clientForm.phone,
            address: clientForm.address,
            city: clientForm.city,
          },
          "client"
        );
        setSuccessMsg("Profil client mis à jour.");
      } else if (isEmployer) {
        await userAPI.updateProfile(
          {
            name: employerForm.name,
            email: employerForm.email,
            phone: employerForm.phone,
            description: employerForm.description,
            city: employerForm.city,
            address: employerForm.address,
            hourly_rate: employerForm.hourly_rate === "" ? null : Number(employerForm.hourly_rate),
          },
          "employer"
        );
        setSuccessMsg("Profil prestataire mis à jour.");
      } else {
        setErrorMsg("Rôle de compte non reconnu.");
      }

      await refreshUser();
    } catch (err) {
      setErrorMsg(err?.message || "Impossible de sauvegarder le profil.");
    } finally {
      setLoadingRoleProfile(false);
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
                Gestion de vos informations personnelles et de la sécurité.
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
              <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Informations utilisateur</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Box component="form" onSubmit={submitUserUpdate}>
                <Grid container spacing={1.4}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      value={userForm.first_name}
                      onChange={(e) => handleUserField("first_name", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      value={userForm.last_name}
                      onChange={(e) => handleUserField("last_name", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email"
                      value={userForm.email}
                      onChange={(e) => handleUserField("email", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={userForm.phone}
                      onChange={(e) => handleUserField("phone", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Adresse"
                      value={userForm.address}
                      onChange={(e) => handleUserField("address", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" type="submit" startIcon={<SaveIcon />} disabled={loadingUser}>
                      {loadingUser ? "Sauvegarde..." : "Sauvegarder le profil utilisateur"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha("#111318", 0.45) }}>
              <Typography sx={{ fontWeight: 800, mb: 1.2 }}>
                {isClient ? "Profil client" : "Profil prestataire"}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              <Box component="form" onSubmit={submitRoleProfile}>
                <Grid container spacing={1.4}>
                  {isClient ? (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nom"
                          value={clientForm.name}
                          onChange={(e) => handleClientField("name", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="email"
                          label="Email"
                          value={clientForm.email}
                          onChange={(e) => handleClientField("email", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Téléphone"
                          value={clientForm.phone}
                          onChange={(e) => handleClientField("phone", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ville"
                          value={clientForm.city}
                          onChange={(e) => handleClientField("city", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Adresse"
                          value={clientForm.address}
                          onChange={(e) => handleClientField("address", e.target.value)}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nom"
                          value={employerForm.name}
                          onChange={(e) => handleEmployerField("name", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="email"
                          label="Email"
                          value={employerForm.email}
                          onChange={(e) => handleEmployerField("email", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Téléphone"
                          value={employerForm.phone}
                          onChange={(e) => handleEmployerField("phone", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ville"
                          value={employerForm.city}
                          onChange={(e) => handleEmployerField("city", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Tarif horaire"
                          type="number"
                          value={employerForm.hourly_rate}
                          onChange={(e) => handleEmployerField("hourly_rate", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Adresse"
                          value={employerForm.address}
                          onChange={(e) => handleEmployerField("address", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label="Description"
                          value={employerForm.description}
                          onChange={(e) => handleEmployerField("description", e.target.value)}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      type="submit"
                      startIcon={<SaveIcon />}
                      disabled={loadingRoleProfile}
                    >
                      {loadingRoleProfile ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha("#111318", 0.45) }}>
              <Typography sx={{ fontWeight: 800, mb: 1.2 }}>Sécurité</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Box component="form" onSubmit={submitPasswordChange}>
                <Grid container spacing={1.4}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Mot de passe actuel"
                      value={passwordForm.current_password}
                      onChange={(e) => handlePasswordField("current_password", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Nouveau mot de passe"
                      value={passwordForm.new_password}
                      onChange={(e) => handlePasswordField("new_password", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirmer"
                      value={passwordForm.confirm_password}
                      onChange={(e) => handlePasswordField("confirm_password", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      type="submit"
                      startIcon={<LockResetIcon />}
                      disabled={loadingPassword}
                    >
                      {loadingPassword ? "Modification..." : "Changer le mot de passe"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha("#2b1418", 0.45) }}>
              <Typography sx={{ fontWeight: 800, mb: 0.6 }}>Zone sensible</Typography>
              <Typography color="text.secondary" sx={{ mb: 1.2 }}>
                Cette action supprime définitivement votre compte.
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
            Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Annuler</Button>
          <Button color="error" onClick={confirmDeleteAccount} disabled={loadingDelete}>
            {loadingDelete ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;