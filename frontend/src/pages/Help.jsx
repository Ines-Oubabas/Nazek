import React from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Help = () => {
  const faqs = [
    {
      question: 'Comment réserver un service ?',
      answer: 'Pour réserver un service, naviguez vers la page de recherche, sélectionnez le service souhaité, choisissez une date et une heure disponibles, puis suivez les étapes de réservation.',
    },
    {
      question: 'Comment annuler un rendez-vous ?',
      answer: 'Vous pouvez annuler un rendez-vous depuis la page "Mes rendez-vous". Cliquez sur le rendez-vous concerné et utilisez le bouton "Annuler".',
    },
    {
      question: 'Comment modifier mes informations personnelles ?',
      answer: 'Accédez à votre profil via le menu utilisateur, puis cliquez sur "Modifier le profil". Vous pourrez alors mettre à jour vos informations.',
    },
    {
      question: 'Comment contacter le support ?',
      answer: 'Vous pouvez nous contacter via le formulaire de contact ou par email à support@example.com.',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Centre d'aide
        </Typography>
        <Typography variant="body1" paragraph>
          Trouvez rapidement les réponses à vos questions fréquentes.
        </Typography>

        <Box sx={{ mt: 4 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default Help; 