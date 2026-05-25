import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { messagingAPI } from "../services/api";

const REFRESH_MS = 10000;

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

const formatTimeOnly = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const getParticipantInfo = (conversation, isClient) => {
  if (!conversation) return { title: "Conversation", subtitle: "" };

  if (isClient) {
    const employer = conversation.employer || {};
    return {
      title: employer.name || "Prestataire",
      subtitle: employer.service?.name || employer.email || "",
    };
  }

  const client = conversation.client || {};
  return {
    title: client.name || "Client",
    subtitle: client.email || client.phone || "",
  };
};

const getLastMessagePreview = (conversation) => {
  const msg =
    conversation?.last_message_content ||
    conversation?.last_message?.content ||
    conversation?.latest_message?.content ||
    "";
  if (!msg) return "Aucun message";
  if (msg.length <= 55) return msg;
  return `${msg.slice(0, 55)}…`;
};

const getLastMessageDate = (conversation) => {
  return (
    conversation?.last_message_at ||
    conversation?.updated_at ||
    conversation?.last_message?.created_at ||
    conversation?.latest_message?.created_at ||
    ""
  );
};

const Messages = () => {
  const { user, isClient, isEmployer } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState("");

  const [selectedConversationId, setSelectedConversationId] = useState(
    searchParams.get("conversationId") ? Number(searchParams.get("conversationId")) : null
  );

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [markingRead, setMarkingRead] = useState(false);

  const bottomRef = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const selectedParticipant = useMemo(
    () => getParticipantInfo(selectedConversation, isClient),
    [selectedConversation, isClient]
  );

  const canUseMessaging = isClient || isEmployer;

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + Number(c?.unread_count || 0), 0),
    [conversations]
  );

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const da = new Date(getLastMessageDate(a)).getTime() || 0;
      const db = new Date(getLastMessageDate(b)).getTime() || 0;
      return db - da;
    });
  }, [conversations]);

  const scrollToBottom = (smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  };

  const loadConversations = async (silent = false) => {
    if (!silent) {
      setLoadingConversations(true);
    }
    setConversationsError("");

    try {
      const data = await messagingAPI.listConversations();
      const list = Array.isArray(data) ? data : data?.results || [];
      setConversations(list);

      if (list.length > 0) {
        setSelectedConversationId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev;
          const fromUrl = searchParams.get("conversationId");
          if (fromUrl && list.some((c) => c.id === Number(fromUrl))) return Number(fromUrl);
          return list[0].id;
        });
      } else {
        setSelectedConversationId(null);
      }
    } catch (err) {
      setConversationsError(err?.message || "Impossible de charger les conversations.");
      if (!silent) {
        setConversations([]);
        setSelectedConversationId(null);
      }
    } finally {
      if (!silent) {
        setLoadingConversations(false);
      }
    }
  };

  const markConversationReadSafe = async (conversationId) => {
    if (!conversationId) return;
    try {
      setMarkingRead(true);
      await messagingAPI.markConversationRead(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      // no-op volontaire: ne pas bloquer l'UX
    } finally {
      setMarkingRead(false);
    }
  };

  const loadMessages = async (conversationId, silent = false) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (!silent) setLoadingMessages(true);
    setMessagesError("");

    try {
      const data = await messagingAPI.listMessages(conversationId);
      const list = Array.isArray(data) ? data : data?.results || [];
      const sorted = [...list].sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return ta - tb;
      });
      setMessages(sorted);

      await markConversationReadSafe(conversationId);
    } catch (err) {
      if (!silent) setMessagesError(err?.message || "Impossible de charger les messages.");
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoadingMessages(false);
      setTimeout(() => scrollToBottom(!silent), 0);
    }
  };

  useEffect(() => {
    if (!canUseMessaging) {
      setLoadingConversations(false);
      return;
    }
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseMessaging]);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  useEffect(() => {
    if (!canUseMessaging) return undefined;

    const timer = setInterval(async () => {
      await loadConversations(true);
      if (selectedConversationId) {
        await loadMessages(selectedConversationId, true);
      }
    }, REFRESH_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseMessaging, selectedConversationId]);

  const handleSend = async (e) => {
    e.preventDefault();

    const content = newMessage.trim();
    if (!selectedConversationId || !content || sending) return;

    setSending(true);
    setMessagesError("");

    try {
      await messagingAPI.sendMessage(selectedConversationId, content);
      setNewMessage("");

      await loadMessages(selectedConversationId, true);
      await loadConversations(true);
    } catch (err) {
      setMessagesError(err?.message || "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 0);
    }
  };

  const isOwnMessage = (msg) => msg?.sender_user?.id === user?.id;

  const lastMessageAt = getLastMessageDate(selectedConversation);
  const selectedUnread = Number(selectedConversation?.unread_count || 0);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        sx={{
          p: { xs: 1.5, md: 2.2 },
          borderRadius: 4,
          background:
            "radial-gradient(circle at 8% -25%, rgba(86,169,255,.12), transparent 38%), #171b22",
        }}
      >
        <Stack
          direction="row"
          spacing={1.2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha("#56a9ff", 0.16),
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <ChatBubbleOutlineIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Messagerie
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography color="text.secondary" variant="body2">
                  Conversations client / prestataire (actualisation auto: 10s)
                </Typography>
                {totalUnread > 0 && (
                  <Chip
                    size="small"
                    color="error"
                    label={`${totalUnread} non lu${totalUnread > 1 ? "s" : ""}`}
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadConversations(false)}
            disabled={loadingConversations}
          >
            Actualiser
          </Button>
        </Stack>

        {!canUseMessaging && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            La messagerie est disponible pour les comptes client et prestataire.
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ minHeight: { xs: "auto", md: 600 } }}
        >
          {/* Conversations list */}
          <Paper
            sx={{
              width: { xs: "100%", md: 360 },
              p: 1,
              borderRadius: 3,
              bgcolor: alpha("#111318", 0.5),
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1, py: 0.8 }}>
              <Typography sx={{ fontWeight: 700 }}>Conversations</Typography>
              {markingRead ? <Typography variant="caption" color="text.secondary">Sync…</Typography> : null}
            </Stack>
            <Divider sx={{ mb: 1 }} />

            {loadingConversations ? (
              <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : conversationsError ? (
              <Alert severity="error">{conversationsError}</Alert>
            ) : sortedConversations.length === 0 ? (
              <Alert severity="info">Aucune conversation pour le moment.</Alert>
            ) : (
              <List dense disablePadding>
                {sortedConversations.map((c) => {
                  const p = getParticipantInfo(c, isClient);
                  const unread = Number(c?.unread_count || 0);
                  const lastPreview = getLastMessagePreview(c);
                  const lastAt = getLastMessageDate(c);

                  return (
                    <ListItemButton
                      key={c.id}
                      selected={c.id === selectedConversationId}
                      onClick={() => setSelectedConversationId(c.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.6,
                        alignItems: "flex-start",
                        "&.Mui-selected": {
                          bgcolor: alpha("#56a9ff", 0.14),
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          mr: 1.1,
                          mt: 0.2,
                          bgcolor: alpha("#f38b2a", 0.22),
                          color: "text.primary",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {(p.title || "?").slice(0, 1).toUpperCase()}
                      </Avatar>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {p.title}
                          </Typography>

                          {unread > 0 ? (
                            <Badge
                              color="error"
                              badgeContent={unread}
                              sx={{ "& .MuiBadge-badge": { fontSize: 10 } }}
                            />
                          ) : (
                            <Tooltip title="Tout lu">
                              <MarkEmailReadIcon sx={{ fontSize: 16, color: "success.main" }} />
                            </Tooltip>
                          )}
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {p.subtitle || "Conversation active"}
                        </Typography>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: unread > 0 ? "text.primary" : "text.secondary",
                              fontWeight: unread > 0 ? 700 : 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "80%",
                            }}
                          >
                            {lastPreview}
                          </Typography>
                          {lastAt ? (
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeOnly(lastAt)}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Paper>

          {/* Message panel */}
          <Paper
            sx={{
              flex: 1,
              p: 1.2,
              borderRadius: 3,
              bgcolor: alpha("#111318", 0.4),
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: 460, md: "auto" },
            }}
          >
            {selectedConversation ? (
              <>
                <Box sx={{ px: 1, py: 0.6 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={0.8}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {selectedParticipant.title}
                      </Typography>
                      {selectedParticipant.subtitle ? (
                        <Typography variant="body2" color="text.secondary">
                          {selectedParticipant.subtitle}
                        </Typography>
                      ) : null}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {selectedUnread > 0 ? (
                        <Chip
                          size="small"
                          color="error"
                          icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                          label={`${selectedUnread} non lu${selectedUnread > 1 ? "s" : ""}`}
                        />
                      ) : (
                        <Chip size="small" color="success" icon={<MarkEmailReadIcon />} label="Lu" />
                      )}
                      {lastMessageAt ? (
                        <Typography variant="caption" color="text.secondary">
                          Dernier message : {formatDateTime(lastMessageAt)}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Stack>
                </Box>

                <Divider sx={{ mb: 1 }} />

                <Box sx={{ flex: 1, overflowY: "auto", px: 0.5, py: 0.5 }}>
                  {loadingMessages ? (
                    <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : messagesError ? (
                    <Alert severity="error">{messagesError}</Alert>
                  ) : messages.length === 0 ? (
                    <Alert severity="info">Aucun message dans cette conversation.</Alert>
                  ) : (
                    <Stack spacing={1}>
                      {messages.map((msg) => {
                        const own = isOwnMessage(msg);
                        return (
                          <Stack
                            key={msg.id}
                            direction="row"
                            justifyContent={own ? "flex-end" : "flex-start"}
                          >
                            <Box
                              sx={{
                                maxWidth: { xs: "90%", sm: "74%" },
                                px: 1.3,
                                py: 1,
                                borderRadius: 2.2,
                                bgcolor: own ? alpha("#f38b2a", 0.26) : alpha("#232935", 0.82),
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                              >
                                {msg.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5, textAlign: "right" }}
                              >
                                {formatDateTime(msg.created_at)}
                              </Typography>
                            </Box>
                          </Stack>
                        );
                      })}
                      <div ref={bottomRef} />
                    </Stack>
                  )}
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box component="form" onSubmit={handleSend}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      multiline
                      minRows={1}
                      maxRows={5}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      endIcon={<SendIcon />}
                      disabled={sending || !newMessage.trim()}
                      sx={{ minWidth: 130 }}
                    >
                      {sending ? "Envoi..." : "Envoyer"}
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 2 }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <ChatBubbleOutlineIcon sx={{ fontSize: 34, color: "text.secondary" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Sélectionnez une conversation
                  </Typography>
                  <Typography color="text.secondary">
                    Choisissez une conversation à gauche pour afficher les messages.
                  </Typography>
                </Stack>
              </Box>
            )}
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Messages;