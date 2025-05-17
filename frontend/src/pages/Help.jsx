import React from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Help = () => {
  const faqs = [
    {
      question: 'Comment réserver un service ?',
      answer:
        'Pour réserver un service, allez dans la page de recherche, sélectionnez un service, une date et suivez les étapes de réservation.',
    },
    {
      question: 'Comment annuler un rendez-vous ?',
      answer:
        'Rendez-vous dans la page "Mes rendez-vous", cliquez sur le rendez-vous concerné et utilisez le bouton "Annuler".',
    },
    {
      question: 'Comment modifier mes informations personnelles ?',
      answer:
        'Accédez à votre profil, cliquez sur "Modifier le profil" et mettez à jour vos informations.',
    },
    {
      question: 'Comment contacter le support ?',
      answer:
        'Via le formulaire de contact ou par email à support@example.com.',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Centre d’aide
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" paragraph>
          Vous trouverez ici les réponses aux questions les plus fréquentes.
        </Typography>

        <Box sx={{ mt: 4 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default Help;
