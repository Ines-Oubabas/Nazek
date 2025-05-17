import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import api from '@/services/api';

const PaymentSelector = ({ value, onChange, error, helperText }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await api.get('/api/v1/payment-methods/');
      setCards(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setEditMode(false);
    setSelectedCard(null);
    setFormData({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
    setDialogOpen(true);
  };

  const handleEditCard = (card) => {
    setEditMode(true);
    setSelectedCard(card);
    setFormData({
      cardNumber: '', // Pas de numéro complet pour des raisons de sécurité
      expiryDate: card.expiryDate,
      cvv: '',
      cardholderName: card.cardholderName,
    });
    setDialogOpen(true);
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/api/v1/payment-methods/${cardId}/`);
      setSnackbar({ open: true, message: 'Carte supprimée avec succès', severity: 'success' });
      fetchCards();
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression de la carte', severity: 'error' });
    }
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await api.patch(`/api/v1/payment-methods/${selectedCard.id}/`, formData);
        setSnackbar({ open: true, message: 'Carte mise à jour avec succès', severity: 'success' });
      } else {
        const response = await api.post('/api/v1/payment-methods/', formData);
        setSnackbar({ open: true, message: 'Carte ajoutée avec succès', severity: 'success' });
        onChange(response.data);
      }
      setDialogOpen(false);
      fetchCards();
    } catch (error) {
      setSnackbar({ open: true, message: "Erreur lors de l'enregistrement de la carte", severity: 'error' });
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setFormData({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Moyens de paiement</Typography>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: value?.id === card.id ? '2px solid' : 'none',
                borderColor: 'primary.main',
              }}
              onClick={() => onChange(card)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CreditCardIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">•••• {card.last4}</Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditCard(card); }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Expire le {card.expiryDate}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.cardholderName}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Button startIcon={<AddIcon />} onClick={handleAddCard} sx={{ mt: 2 }}>
        Ajouter une carte
      </Button>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Modifier la carte' : 'Ajouter une carte'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Numéro de carte"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              fullWidth
              placeholder="1234 5678 9012 3456"
              disabled={editMode}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Date d'expiration"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  fullWidth
                  placeholder="MM/AA"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="CVV"
                  value={formData.cvv}
                  onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                  fullWidth
                  type="password"
                  placeholder="123"
                />
              </Grid>
            </Grid>
            <TextField
              label="Nom du titulaire"
              value={formData.cardholderName}
              onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName}
          >
            {editMode ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentSelector;