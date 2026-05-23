import React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const Favorites = () => {
  const navigate = useNavigate();

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
              bgcolor: alpha("#ff6f78", 0.14),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <FavoriteBorderIcon />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Mes favoris
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
            Vous n’avez pas encore de prestataires favoris. Ajoutez-en depuis la page
            de recherche pour les retrouver rapidement ici.
          </Typography>

          <Button variant="contained" onClick={() => navigate("/search")}>
            Rechercher des prestataires
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Favorites;