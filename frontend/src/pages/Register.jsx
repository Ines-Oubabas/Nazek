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
  Stack,
  Chip,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alpha } from "@mui/material/styles";

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

  return base || `user_${Math.floor(Date.now() / 1000)}`;
};

const formatDRFErrors = (data) => {
  if (!data || typeof data !== "object") return null;

  const lines = [];
  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) lines.push(`${key}: ${val.join(" ")}`);
    else if (typeof val === "string") lines.push(`${key}: ${val}`);
    else if (val && typeof val === "object") {
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isEmployer, setIsEmployer] = useState(false);

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

    if (stepIndex === 1) return "";

    if (stepIndex === 2) {
      if (!ph || !addr) return "Veuillez renseigner votre téléphone et votre adresse.";
      if (isEmployer && !selectedService) return "Veuillez sélectionner un service proposé.";
      return "";
    }

    return "";
  };

  const canGoNext = useMemo(
    () => !validateStep(activeStep),
    [activeStep, email, password, confirmPassword, firstName, lastName, phone, address, isEmployer, selectedService]
  );

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

      if (isEmployer) {
        const serviceValue = normalizeServiceValue(selectedService);
        if (serviceValue) {
          try {
            await userAPI.updateProfile({
              name: `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim(),
              email: String(email || "").trim(),
              phone: String(phone || "").trim(),
              service: serviceValue,
            });
          } catch {
            // non bloquant
          }
        }
      }

      navigate("/");
      return res;
    } catch (err) {
      const apiMsg = formatDRFErrors(err?.data);
      setError(apiMsg || err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (activeStep < 2) handleNext();
    else await handleFinalSubmit();
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Stack spacing={1.3} sx={{ mt: 1.5 }}>
          <TextField
            required
            fullWidth
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
          <TextField
            required
            fullWidth
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
          <TextField
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
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
            endIcon={<ArrowForwardIcon />}
            disabled={!canGoNext || loading}
            sx={{ mt: 0.4 }}
          >
            Suivant
          </Button>
        </Stack>
      );
    }

    if (activeStep === 1) {
      return (
        <Box sx={{ mt: 1.5 }}>
          <Paper
            sx={{
              p: 1.6,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              mb: 1.2,
              bgcolor: alpha("#1f2430", 0.52),
            }}
          >
            <FormControlLabel
              control={<Switch checked={isEmployer} onChange={(e) => setIsEmployer(e.target.checked)} />}
              label="Je suis un prestataire de services"
            />
            <Typography variant="body2" color="text.secondary">
              {isEmployer
                ? "Vous pourrez proposer des services et recevoir des demandes de rendez-vous."
                : "Vous pourrez réserver des services et suivre vos rendez-vous."}
            </Typography>
          </Paper>

          <Box sx={{ mt: 1.2, display: "flex", justifyContent: "space-between" }}>
            <Button type="button" onClick={handleBack} startIcon={<ArrowBackIcon />}>
              Retour
            </Button>
            <Button variant="contained" type="submit" endIcon={<ArrowForwardIcon />} disabled={loading}>
              Suivant
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 1.5 }}>
        <Stack spacing={1.3}>
          <TextField
            required
            fullWidth
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <TextField
            required
            fullWidth
            label="Adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </Stack>

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

        <Box sx={{ mt: 2.1, display: "flex", justifyContent: "space-between" }}>
          <Button type="button" onClick={handleBack} startIcon={<ArrowBackIcon />}>
            Retour
          </Button>
          <Button type="submit" variant="contained" disabled={loading || !canGoNext}>
            {loading ? "Inscription en cours..." : "Créer mon compte"}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper
          sx={{
            p: { xs: 2.2, md: 3.2 },
            borderRadius: 4,
            background:
              "radial-gradient(circle at 12% -35%, rgba(255,138,28,.2), transparent 35%), #171a21",
          }}
        >
          <Stack spacing={1.1} sx={{ mb: 2.2 }}>
            <Chip icon={<PersonAddAlt1Icon />} label="Nouveau compte" color="primary" sx={{ width: "fit-content" }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Inscription
            </Typography>
            <Typography color="text.secondary">
              Créez votre compte en quelques étapes et accédez à votre espace premium.
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 2.2,
              "& .MuiStepLabel-label": { color: "text.secondary" },
              "& .MuiStepLabel-label.Mui-active": { color: "text.primary", fontWeight: 700 },
              "& .MuiStepLabel-label.Mui-completed": { color: "text.primary" },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleFormSubmit}>
            {renderStepContent()}
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
              Vous avez déjà un compte ?{" "}
              <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
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