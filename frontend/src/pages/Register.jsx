// frontend/src/pages/Register.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";
import ServiceSelection from "../components/common/ServiceSelection";
import { userAPI } from "../services/api";

const STEP_LABELS = ["Informations personnelles", "Type de compte", "Coordonnées"];

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const buildUsernameFromEmail = (email) => {
  const base = String(email || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 25);

  // fallback si email bizarre
  return base || `user_${Math.floor(Date.now() / 1000)}`;
};

const formatDRFErrors = (data) => {
  // DRF peut renvoyer: {field: ["msg1","msg2"], non_field_errors:[...]}
  if (!data || typeof data !== "object") return null;

  const lines = [];
  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      lines.push(`${key}: ${val.join(" ")}`);
    } else if (typeof val === "string") {
      lines.push(`${key}: ${val}`);
    } else if (val && typeof val === "object") {
      // cas nested
      try {
        lines.push(`${key}: ${JSON.stringify(val)}`);
      } catch {
        lines.push(`${key}: erreur`);
      }
    }
  });

  return lines.length ? lines.join(" • ") : null;
};

const normalizeServiceValue = (value) => {
  // Supporte: "3", 3, {id:3}, {value:3}...
  if (!value) return null;
  if (typeof value === "object") return value.id ?? value.value ?? null;
  return value;
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Étape 0 - Infos perso
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Étape 1 - Type de compte
  const [isEmployer, setIsEmployer] = useState(false);

  // Étape 2 - Coordonnées (+ prestataire)
  const [selectedService, setSelectedService] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const step2Label = isEmployer ? "Informations professionnelles" : "Coordonnées";

  const steps = useMemo(() => {
    const s = [...STEP_LABELS];
    s[2] = step2Label;
    return s;
  }, [step2Label]);

  const validateStep = (stepIndex) => {
    const fn = String(firstName || "").trim();
    const ln = String(lastName || "").trim();
    const em = String(email || "").trim();
    const pw = String(password || "");
    const cpw = String(confirmPassword || "");
    const ph = String(phone || "").trim();
    const addr = String(address || "").trim();

    if (stepIndex === 0) {
      if (!fn || !ln || !em || !pw || !cpw) return "Veuillez remplir tous les champs.";
      if (!isValidEmail(em)) return "Adresse email invalide.";
      if (pw.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
      if (pw !== cpw) return "Les mots de passe ne correspondent pas.";
      return "";
    }

    if (stepIndex === 1) {
      // aucun champ obligatoire ici
      return "";
    }

    if (stepIndex === 2) {
      if (!ph || !addr) return "Veuillez renseigner votre téléphone et votre adresse.";
      if (isEmployer) {
        if (!selectedService) return "Veuillez sélectionner un service proposé.";
        // description pas obligatoire côté backend, mais utile
      }
      return "";
    }

    return "";
  };

  const canGoNext = useMemo(() => !validateStep(activeStep), [activeStep, email, password, confirmPassword, firstName, lastName, phone, address, isEmployer, selectedService]);

  const handleNext = () => {
    const msg = validateStep(activeStep);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async () => {
    const msg = validateStep(2);
    if (msg) {
      setError(msg);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // ✅ Payload compatible backend (UserSerializer + RegisterView)
      // IMPORTANT: on n'envoie PAS service_type/service_description ici (sinon 400)
      const role = isEmployer ? "employer" : "client";
      const payload = {
        username: buildUsernameFromEmail(email),
        email: String(email || "").trim(),
        password,
        first_name: String(firstName || "").trim(),
        last_name: String(lastName || "").trim(),
        role,
        phone: String(phone || "").trim(),
        address: String(address || "").trim(),
      };

      const res = await register(payload);

      // ✅ Bonus: si prestataire, on essaye de compléter le profil employeur (service + phone + name)
      // (si ça échoue, le compte est quand même créé => on ne bloque pas)
      if (isEmployer) {
        const serviceValue = normalizeServiceValue(selectedService);
        if (serviceValue) {
          try {
            await userAPI.updateProfile({
              name: `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim(),
              email: String(email || "").trim(),
              phone: String(phone || "").trim(),
              service: serviceValue,
              // serviceDescription non géré par EmployerUpdateSerializer actuellement
            });
          } catch (e) {
            // ignore
          }
        }
      }

      // tu peux rediriger où tu veux (home / profile)
      navigate("/");
      return res;
    } catch (err) {
      const apiMsg = formatDRFErrors(err?.data);
      setError(apiMsg || err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // Form submit (Enter) : next si pas dernière étape, sinon submit final
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (activeStep < 2) {
      handleNext();
    } else {
      await handleFinalSubmit();
    }
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Minimum 6 caractères."
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{ mt: 3 }}
            disabled={!canGoNext || loading}
          >
            Suivant
          </Button>
        </Box>
      );
    }

    if (activeStep === 1) {
      return (
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isEmployer}
                onChange={(e) => setIsEmployer(e.target.checked)}
              />
            }
            label="Je suis un prestataire de services"
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isEmployer
              ? "Vous pourrez proposer un service et recevoir des demandes de rendez-vous."
              : "Vous pourrez réserver des services et gérer vos rendez-vous."}
          </Typography>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button type="button" onClick={handleBack}>
              Retour
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
            >
              Suivant
            </Button>
          </Box>
        </Box>
      );
    }

    // step 2
    return (
      <Box sx={{ mt: 2 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Adresse"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="street-address"
        />

        {isEmployer && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Informations sur le service
            </Typography>

            <ServiceSelection
              selectedService={selectedService}
              onServiceChange={setSelectedService}
              description={serviceDescription}
              onDescriptionChange={setServiceDescription}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Astuce : vous pourrez compléter votre profil prestataire après inscription.
            </Typography>
          </>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button type="button" onClick={handleBack}>
            Retour
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !canGoNext}
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Inscription
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleFormSubmit}>
            {renderStepContent()}
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2">
              Vous avez déjà un compte ?{" "}
              <Link component={RouterLink} to="/login">
                Connectez-vous
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;