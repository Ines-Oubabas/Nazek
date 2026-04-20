import React from "react";
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const SUPPORT_EMAIL = "support@example.com";

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Comment réserver un service ?",
      answer:
        "Accédez à la page de recherche, sélectionnez le service souhaité, puis choisissez un créneau disponible et confirmez la demande.",
    },
    {
      question: "Comment annuler un rendez-vous ?",
      answer:
        'Depuis la page "Mes rendez-vous", ouvrez le rendez-vous concerné puis utilisez l’action d’annulation si elle est disponible.',
    },
    {
      question: "Comment modifier mes informations personnelles ?",
      answer:
        "Rendez-vous dans votre profil pour mettre à jour vos informations personnelles et vos préférences.",
    },
    {
      question: "Comment contacter le support ?",
      answer:
        "Utilisez le formulaire de contact ou écrivez-nous directement par email pour une assistance rapide.",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3.2 },
          borderRadius: 4,
          mb: 2.2,
          background: "radial-gradient(circle at 10% -30%, rgba(243,139,42,.14), transparent 38%), #171b22",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Chip icon={<HelpOutlineIcon />} label="Support & FAQ" color="primary" sx={{ mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Centre d’aide
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.6 }}>
              Trouvez rapidement des réponses fiables aux questions fréquentes.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip label={`${faqs.length} questions fréquentes`} variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2.2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 1.2, borderRadius: 3.5 }}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                disableGutters
                sx={{
                  bgcolor: "transparent",
                  boxShadow: "none",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 1,
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    backgroundColor: alpha("#232935", 0.35),
                  },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.2, borderRadius: 3.5, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.1 }}>
              Contacter le support
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Besoin d’aide personnalisée ? Notre équipe peut vous répondre rapidement.
            </Typography>

            <Stack spacing={1.1}>
              <Button variant="outlined" startIcon={<SupportAgentIcon />} fullWidth onClick={() => navigate("/messages")}>
                Ouvrir un ticket
              </Button>
              <Button
                variant="contained"
                startIcon={<MailOutlineIcon />}
                fullWidth
                component="a"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.2, borderRadius: 3.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Accès rapide
            </Typography>
            <Stack spacing={1}>
              <Button variant="text" startIcon={<SearchIcon />} onClick={() => navigate("/search")}>
                Rechercher un service
              </Button>
              <Button variant="text" startIcon={<CalendarMonthIcon />} onClick={() => navigate("/appointments")}>
                Voir mes rendez-vous
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Help;