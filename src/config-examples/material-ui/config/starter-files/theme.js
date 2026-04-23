import { createTheme } from "@mui/material/styles";

/**
 * Base MUI theme. Tune the palette, typography, and shape tokens for your
 * brand — the agent will pick up the values through `<ThemeProvider>` in
 * `/App.jsx` without having to re-read this file every turn.
 */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
    background: { default: "#fafafa", paper: "#ffffff" },
  },
  typography: {
    fontFamily:
      "Roboto, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontSize: "2.5rem", fontWeight: 600 },
    h2: { fontSize: "2rem", fontWeight: 600 },
    h3: { fontSize: "1.5rem", fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
});
