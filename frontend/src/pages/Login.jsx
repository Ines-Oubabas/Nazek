// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { Container, Box, Typography, TextField, Button, Link, Alert, Paper } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // ✅ si on vient d'une page protégée, ServiceDetails fait:
  // navigate("/login", { state: { from: location.pathname } })
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

      // ✅ retour là où l’utilisateur était
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);

      // Ton apiRequest lance new Error(message) => err.message est fiable
      const message = err?.message || "Échec de la connexion. Veuillez vérifier vos identifiants.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Connexion
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
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
              margin="normal"
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
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2">
              Vous n&apos;avez pas de compte ?{" "}
              <Link component={RouterLink} to="/register">
                Inscrivez-vous
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;