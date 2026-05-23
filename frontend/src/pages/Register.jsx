import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    is_employer: false,
    service_type: "",
    service_description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Créer un compte
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Choisissez votre type de compte : client ou professionnel.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={form.is_employer ? "Compte professionnel" : "Compte client"} color="primary" />
        </Stack>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Prénom"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Nom"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                fullWidth
                required
              />
            </Stack>

            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Téléphone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              fullWidth
            />

            <TextField
              label="Adresse"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              fullWidth
            />

            <TextField
              label="Mot de passe"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              fullWidth
              required
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_employer}
                  onChange={(e) => setField("is_employer", e.target.checked)}
                />
              }
              label="Je suis un prestataire de service (compte professionnel)"
            />

            {form.is_employer && (
              <>
                <TextField
                  label="Service (ID ou nom)"
                  value={form.service_type}
                  onChange={(e) => setField("service_type", e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Description de votre service"
                  value={form.service_description}
                  onChange={(e) => setField("service_description", e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </>
            )}

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Inscription..." : "Créer mon compte"}
            </Button>
          </Stack>
        </Box>

        <Typography sx={{ mt: 2 }} color="text.secondary">
          Déjà inscrit ?{" "}
          <Link component={RouterLink} to="/login">
            Se connecter
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Register;