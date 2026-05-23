import React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { alpha } from "@mui/material/styles";

const Messages = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          background: alpha("#171b22", 0.9),
        }}
      >
        <Stack spacing={1.6} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: alpha("#56a9ff", 0.14),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <ChatBubbleOutlineIcon />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Messagerie
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
            Cette section sera connectée à une vraie conversation client/prestataire
            (threads, pièces jointes, statut lu/non lu) dans la prochaine version.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained">Nouveau message</Button>
            <Button variant="outlined">Voir mes contacts</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Messages;