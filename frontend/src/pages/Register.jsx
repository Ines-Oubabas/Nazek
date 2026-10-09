import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import {
  isStaleSessionError,
  serviceAPI,
} from "../services/api";

const normalizeServices = (data) => {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return items.filter(
    (service) =>
      service &&
      service.id !== undefined &&
      service.id !== null &&
      service.is_active !== false
  );
};

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
    employer_service_id: "",
    employer_description: "",
  });

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const attemptVersionRef = useRef(0);
  const servicesRequestVersionRef = useRef(0);
  const mountedRef = useRef(false);

  const setField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadServices = useCallback(async () => {
    const requestVersion = servicesRequestVersionRef.current + 1;
    servicesRequestVersionRef.current = requestVersion;

    setServicesLoading(true);
    setServicesError("");

    try {
      const data = await serviceAPI.list();

      if (
        !mountedRef.current ||
        servicesRequestVersionRef.current !== requestVersion
      ) {
        return;
      }

      setServices(normalizeServices(data));
    } catch (err) {
      if (
        !mountedRef.current ||
        servicesRequestVersionRef.current !== requestVersion ||
        isStaleSessionError(err)
      ) {
        return;
      }

      setServices([]);
      setServicesError(
        err?.message || "Impossible de charger le catalogue des services."
      );
    } finally {
      if (
        mountedRef.current &&
        servicesRequestVersionRef.current === requestVersion
      ) {
        setServicesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadServices();

    return () => {
      mountedRef.current = false;
      attemptVersionRef.current += 1;
      servicesRequestVersionRef.current += 1;
    };
  }, [loadServices]);

  const onSubmit = async (e) => {
    e.preventDefault();

    const attemptVersion = attemptVersionRef.current + 1;
    attemptVersionRef.current = attemptVersion;

    setErrorMsg("");

    let employerServiceId = null;

    if (form.is_employer) {
      employerServiceId = Number(form.employer_service_id);

      const selectedServiceExists =
        Number.isInteger(employerServiceId) &&
        services.some(
          (service) => Number(service.id) === employerServiceId
        );

      if (!selectedServiceExists) {
        setErrorMsg("Veuillez sélectionner un service valide dans le catalogue.");
        return;
      }
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      password: form.password,
      role: form.is_employer ? "employer" : "client",
      create_client_profile: !form.is_employer,
      create_employer_profile: form.is_employer,
    };

    if (form.is_employer) {
      payload.employer_service_id = employerServiceId;
      payload.employer_description = form.employer_description.trim();
    }

    setLoading(true);

    try {
      await register(payload);

      if (attemptVersionRef.current !== attemptVersion) {
        return;
      }

      attemptVersionRef.current += 1;
      navigate("/", { replace: true });
    } catch (err) {
      if (
        attemptVersionRef.current !== attemptVersion ||
        isStaleSessionError(err)
      ) {
        return;
      }

      setErrorMsg(err?.message || "Inscription impossible.");
    } finally {
      if (
        mountedRef.current &&
        attemptVersionRef.current === attemptVersion
      ) {
        setLoading(false);
      }
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
          <Chip
            label={
              form.is_employer
                ? "Compte professionnel"
                : "Compte client"
            }
            color="primary"
          />
        </Stack>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
            >
              <TextField
                label="Prénom"
                value={form.first_name}
                onChange={(e) =>
                  setField("first_name", e.target.value)
                }
                fullWidth
                required
              />

              <TextField
                label="Nom"
                value={form.last_name}
                onChange={(e) =>
                  setField("last_name", e.target.value)
                }
                fullWidth
                required
              />
            </Stack>

            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Téléphone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              fullWidth
            />

            <TextField
              label="Adresse"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              fullWidth
            />

            <TextField
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              inputProps={{ minLength: 8 }}
              helperText="Le mot de passe doit contenir au moins 8 caractères."
              fullWidth
              required
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_employer}
                  onChange={(e) =>
                    setField("is_employer", e.target.checked)
                  }
                />
              }
              label="Je suis un prestataire de service (compte professionnel)"
            />

            {form.is_employer && (
              <>
                {servicesError && (
                  <Alert
                    severity="error"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={loadServices}
                        disabled={servicesLoading}
                      >
                        Réessayer
                      </Button>
                    }
                  >
                    {servicesError}
                  </Alert>
                )}

                <TextField
                  select
                  label="Service"
                  value={form.employer_service_id}
                  onChange={(e) =>
                    setField(
                      "employer_service_id",
                      e.target.value
                    )
                  }
                  disabled={
                    servicesLoading ||
                    Boolean(servicesError) ||
                    services.length === 0
                  }
                  helperText={
                    servicesLoading
                      ? "Chargement du catalogue des services..."
                      : services.length === 0 && !servicesError
                        ? "Aucun service actif n’est disponible."
                        : "Sélectionnez le service proposé."
                  }
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: servicesLoading ? (
                      <CircularProgress
                        color="inherit"
                        size={20}
                        sx={{ mr: 3 }}
                      />
                    ) : undefined,
                  }}
                >
                  {services.map((service) => (
                    <MenuItem
                      key={service.id}
                      value={String(service.id)}
                    >
                      {service.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Description de votre service"
                  value={form.employer_description}
                  onChange={(e) =>
                    setField(
                      "employer_description",
                      e.target.value
                    )
                  }
                  fullWidth
                  multiline
                  minRows={3}
                />
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                (
                  form.is_employer &&
                  (
                    servicesLoading ||
                    Boolean(servicesError) ||
                    services.length === 0
                  )
                )
              }
            >
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