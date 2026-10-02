import { createTheme, alpha } from "@mui/material/styles";

const tokens = {
  brand: {
    primary: "#F59E42",
    primarySoft: "#FFB366",
    primaryDeep: "#DB7D1C",
    accent: "#5DA8FF",
  },
  neutral: {
    900: "#0F131A",
    850: "#141A23",
    800: "#1A2230",
    700: "#243041",
    600: "#314158",
    500: "#6D7B91",
    400: "#9EACC0",
    300: "#C8D2E0",
    200: "#DEE5F0",
    100: "#F3F6FA",
  },
  feedback: {
    success: "#34C38F",
    info: "#4DA3FF",
    warning: "#FFC36B",
    error: "#FF6B7A",
  },
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: tokens.brand.primary,
      light: tokens.brand.primarySoft,
      dark: tokens.brand.primaryDeep,
      contrastText: "#131822",
    },
    secondary: {
      main: tokens.brand.accent,
    },
    background: {
      default: tokens.neutral[900],
      paper: tokens.neutral[850],
    },
    text: {
      primary: "#F5F7FB",
      secondary: tokens.neutral[400],
    },
    divider: alpha(tokens.neutral[300], 0.16),
    success: { main: tokens.feedback.success },
    info: { main: tokens.feedback.info },
    warning: { main: tokens.feedback.warning },
    error: { main: tokens.feedback.error },
  },

  shape: {
    borderRadius: 14,
  },

  spacing: 8,

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontWeight: 780, letterSpacing: "-0.02em" },
    h4: { fontWeight: 760, letterSpacing: "-0.02em" },
    h5: { fontWeight: 720 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          colorScheme: "dark",
        },
        body: {
          backgroundColor: tokens.neutral[900],
          backgroundImage: `
            radial-gradient(circle at 12% -10%, rgba(245, 158, 66, 0.18), transparent 32%),
            radial-gradient(circle at 88% 8%, rgba(93, 168, 255, 0.12), transparent 28%),
            linear-gradient(180deg, #10161f 0%, #0f131a 100%)
          `,
          minHeight: "100vh",
        },
        a: {
          color: "inherit",
          textDecoration: "none",
        },
        "*::-webkit-scrollbar": { width: "10px", height: "10px" },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: alpha(tokens.neutral[400], 0.3),
          borderRadius: "999px",
        },
        "*::-webkit-scrollbar-track": {
          backgroundColor: tokens.neutral[900],
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${alpha(tokens.neutral[200], 0.12)}`,
          boxShadow: "0 12px 34px rgba(0,0,0,.28)",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(tokens.neutral[200], 0.12)}`,
          boxShadow: "0 12px 30px rgba(0,0,0,.24)",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          paddingBlock: 9,
          transition: "all 180ms ease",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.primarySoft} 100%)`,
          color: "#10161f",
          boxShadow: "0 10px 24px rgba(245, 158, 66, .35)",
          "&:hover": {
            background: "linear-gradient(135deg, #f7aa58 0%, #ffc383 100%)",
            boxShadow: "0 12px 28px rgba(245, 158, 66, .42)",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          borderColor: alpha(tokens.neutral[100], 0.2),
          "&:hover": {
            borderColor: alpha(tokens.brand.primary, 0.6),
            backgroundColor: alpha(tokens.brand.primary, 0.08),
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        size: "medium",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: alpha("#FFFFFF", 0.02),
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(tokens.neutral[100], 0.16),
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(tokens.neutral[100], 0.28),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(tokens.brand.primary, 0.65),
            boxShadow: `0 0 0 3px ${alpha(tokens.brand.primary, 0.16)}`,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${alpha(tokens.neutral[100], 0.15)}`,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;