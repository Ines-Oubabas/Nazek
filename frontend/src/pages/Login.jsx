// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err?.message || "Échec de la connexion. Vérifiez vos identifiants.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          maxWidth: 560,
          mx: "auto",
        }}
      >
        <Paper
          sx={{
            p: { xs: 2.2, md: 3.2 },
            borderRadius: 4,
            background:
              "radial-gradient(circle at 12% -35%, rgba(255,138,28,.2), transparent 35%), #171a21",
          }}
        >
          <Stack spacing={1.2} sx={{ mb: 2.2 }}>
            <Chip icon={<LockOpenIcon />} label="Espace sécurisé" color="primary" sx={{ width: "fit-content" }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Connexion
            </Typography>
            <Typography color="text.secondary">
              Accédez à votre tableau de bord pour gérer vos services et rendez-vous.
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.4}>
              <TextField
                required
                fullWidth
                id="email"
                label="Adresse email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  mt: 0.5,
                  py: 1.2,
                  fontSize: "0.97rem",
                }}
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              mt: 2.2,
              p: 1.5,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: alpha("#1f2430", 0.52),
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Vous n’avez pas encore de compte ?{" "}
              <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 700 }}>
                Créer un compte
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;