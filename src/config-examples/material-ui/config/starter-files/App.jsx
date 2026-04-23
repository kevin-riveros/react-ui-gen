import { ThemeProvider, CssBaseline, Box, Typography } from "@mui/material";
import { theme } from "./theme";

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          Your MUI app
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Describe what you want to build in the chat, and the model will
          replace this placeholder with real components.
        </Typography>
      </Box>
    </ThemeProvider>
  );
};
