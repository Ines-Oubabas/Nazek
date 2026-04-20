import React, { useEffect, useMemo, useState } from "react";
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
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // TODO backend: remplace ici par l'appel API réel
    try {
      setLoading(true);
      setError("");
      setMessages([]);
    } catch (err) {
      setError(err.message || "Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  const unreadCount = useMemo(() => messages.filter((m) => !m.is_read).length, [messages]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
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
    <Container maxWidth="lg" sx={{ mt: 2, mb: 7 }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          mb: 2.2,
          background: "radial-gradient(circle at 10% -30%, rgba(243,139,42,.14), transparent 38%), #171b22",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Messages
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6 }}>
              Centralise tes échanges avec les prestataires dans un espace propre.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip
              icon={<NotificationsActiveIcon />}
              label={`${unreadCount} non lu(s)`}
              color="primary"
              sx={{ fontWeight: 700 }}
            />
            <Chip
              icon={<MarkChatReadIcon />}
              label={`${messages.length} conversation(s)`}
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
          Connecté : <b style={{ color: "#f2f4f8" }}>{user?.email || user?.username || "Utilisateur"}</b>
        </Typography>
      </Paper>

      <Paper sx={{ borderRadius: 3.5, overflow: "hidden" }}>
        {messages.length === 0 ? (
          <Box
            sx={{
              p: 5,
              textAlign: "center",
              bgcolor: alpha("#232935", 0.52),
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 52, color: "primary.main", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Aucun message pour l’instant
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.8, mb: 2.1 }}>
              Tes conversations apparaîtront ici dès que tu démarres un échange.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button variant="contained" startIcon={<SearchIcon />} onClick={() => navigate("/search")}>
                Trouver un service
              </Button>
              <Button variant="outlined" onClick={() => navigate("/appointments")}>
                Mes rendez-vous
              </Button>
            </Stack>
          </Box>
        ) : (
          <List>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                <ListItem alignItems="flex-start" sx={{ py: 1.6 }}>
                  <ListItemAvatar>
                    <Avatar alt={message.sender?.name || "Utilisateur"} src={message.sender?.avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={message.sender?.name || "Utilisateur"}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {message.content}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1 }}
                        >
                          {message.created_at ? new Date(message.created_at).toLocaleString() : "Date inconnue"}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < messages.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Messages;