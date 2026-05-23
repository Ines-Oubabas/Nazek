import React, { useState } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const from = location.state?.from || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      const raw = err?.message || "Connexion impossible.";
      if (raw.toLowerCase().includes("incorrect") || raw.toLowerCase().includes("invalid")) {
        setErrorMsg("Mot de passe incorrect ou compte introuvable.");
      } else {
        setErrorMsg(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Connexion
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Connectez-vous à votre espace client ou professionnel.
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </Stack>
        </Box>

        <Typography sx={{ mt: 2 }} color="text.secondary">
          Pas encore de compte ?{" "}
          <Link component={RouterLink} to="/register">
            Créer un compte
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;