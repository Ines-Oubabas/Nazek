import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🎯 Simulation temporaire de messages (à remplacer par appel API réel plus tard)
        const dummy = [
          {
            id: 1,
            sender: { name: 'Amine B.', avatar: '/images/user1.jpg' },
            content: 'Bonjour ! J’aimerais prendre un rendez-vous pour samedi.',
            created_at: new Date(),
          },
        ];
        setMessages(dummy);
      } catch (err) {
        setError('Erreur lors du chargement des messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Vos Messages
      </Typography>

      <Paper elevation={2}>
        {messages.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Vous n’avez pas encore reçu de message.
            </Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar
                      alt={message.sender.name}
                      src={message.sender.avatar}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={message.sender.name}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {message.content}
                        </Typography>
                        <Box
                          component="span"
                          sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
                        >
                          {new Date(message.created_at).toLocaleString()}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                {index < messages.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Messages;