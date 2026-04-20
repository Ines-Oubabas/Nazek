import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

const ServiceCard = ({
  service,
  onFavoriteClick,
  isFavorite,
  showRating = true,
  showLocation = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/services/${service.id}`);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/placeholder.jpg";
  };

  return (
    <Fade in timeout={450}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          backgroundColor: "background.paper",
          transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            borderColor: alpha(theme.palette.primary.main, 0.45),
            boxShadow: "0 18px 34px rgba(0,0,0,.30)",
          },
        }}
        onClick={handleClick}
      >
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            height={isMobile ? 150 : 185}
            image={service.image || "/images/placeholder.jpg"}
            alt={service.name}
            onError={handleImageError}
            sx={{
              filter: "saturate(0.9) contrast(1.04)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(15,17,21,0.08) 0%, rgba(15,17,21,0.72) 90%)",
            }}
          />

          <IconButton
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "white",
              zIndex: 2,
              bgcolor: "rgba(0,0,0,.28)",
              "&:hover": {
                bgcolor: "rgba(0,0,0,.45)",
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteClick(service.id);
            }}
          >
            {isFavorite ? <FavoriteIcon sx={{ color: "#ff8a1c" }} /> : <FavoriteBorderIcon />}
          </IconButton>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2.2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 760, color: "text.primary", mb: 0.8 }}
          >
            {service.name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{
              mb: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "40px",
            }}
          >
            {service.description || "Description non disponible."}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.1 }}>
            {showRating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <StarIcon sx={{ color: "#ff8a1c", fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                  {service.rating?.toFixed?.(1) || "N/A"}
                </Typography>
              </Box>
            )}

            {showLocation && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                <LocationIcon sx={{ color: "info.main", fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                  {service.location || "—"}
                </Typography>
              </Box>
            )}
          </Box>

          {!!service.tags?.length && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 1.3 }}>
              {service.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.light",
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.26),
                  }}
                />
              ))}
            </Box>
          )}

          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "primary.main",
              mt: "auto",
            }}
          >
            {service.price ? `${service.price}€/h` : "Tarif sur demande"}
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ServiceCard;