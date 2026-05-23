import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha } from "@mui/material/styles";

const faqs = [
  {
    q: "Comment réserver un rendez-vous ?",
    a: "Allez sur Rechercher, choisissez un service, sélectionnez un prestataire puis confirmez la date et l'heure.",
  },
  {
    q: "Comment payer un rendez-vous ?",
    a: "Dans Mes rendez-vous, cliquez sur Payer sur la ligne concernée.",
  },
  {
    q: "Comment modifier mon profil ?",
    a: "Ouvrez Mon profil depuis le menu utilisateur, modifiez vos informations puis enregistrez.",
  },
  {
    q: "Je suis prestataire : comment gérer mes disponibilités ?",
    a: "Depuis votre espace prestataire, vous pouvez renseigner vos créneaux de disponibilité.",
  },
];

const Help = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: 3,
          background: alpha("#171b22", 0.9),
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Centre d’aide
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Retrouvez les réponses aux questions fréquentes.
        </Typography>

        <Stack spacing={1}>
          {faqs.map((f) => (
            <Accordion key={f.q} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{f.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Paper>
    </Container>
  );
};

export default Help;