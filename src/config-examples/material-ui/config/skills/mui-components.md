---
name: mui-components
description: MUI component cheat sheet — Button, TextField, Card, Dialog, AppBar, DataGrid, and theming.
---

# Material UI Components

Imports always from `@mui/material`:

```jsx
import {
  Button, IconButton, TextField, Select, MenuItem, FormControl, InputLabel,
  Card, CardContent, CardActions, CardHeader,
  Dialog, DialogTitle, DialogContent, DialogActions,
  AppBar, Toolbar, Typography,
  Tabs, Tab, List, ListItem, ListItemText,
  Box, Stack, Grid, Container, Paper, Divider,
  Alert, Snackbar, Chip, Badge, Avatar, Tooltip, CircularProgress,
} from "@mui/material";
```

## Theme + CssBaseline setup

Put this at the root of `/App.jsx`:

```jsx
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
const theme = createTheme({
  palette: { mode: "light", primary: { main: "#1976d2" } },
  shape: { borderRadius: 8 },
});
export const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {/* your components */}
  </ThemeProvider>
);
```

## Most-used primitives

### Button
```jsx
<Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />}>Save</Button>
<Button variant="outlined">Cancel</Button>
<Button variant="text">Learn more</Button>
```

### TextField
```jsx
<TextField label="Email" variant="outlined" type="email" fullWidth helperText="We never share." />
<TextField label="Message" multiline rows={4} />
```

### Card
```jsx
<Card>
  <CardHeader title="Project alpha" subheader="Last updated today" />
  <CardContent><Typography variant="body2">Body copy goes here.</Typography></CardContent>
  <CardActions><Button size="small">View</Button></CardActions>
</Card>
```

### Dialog
```jsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Confirm</DialogTitle>
  <DialogContent>Are you sure?</DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="contained" onClick={handleConfirm}>Delete</Button>
  </DialogActions>
</Dialog>
```

### Layout
```jsx
<Stack direction="row" spacing={2} alignItems="center"><A /><B /></Stack>
<Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2 }}>...</Box>
<Container maxWidth="lg"><Grid container spacing={3}>...</Grid></Container>
```

## sx prop

Theme-aware shorthand for styling:

```jsx
<Box sx={{
  p: 2,                      // theme.spacing(2) → 16px
  color: "text.secondary",   // theme.palette.text.secondary
  bgcolor: "primary.light",
  borderRadius: 1,
  display: { xs: "block", md: "flex" }, // responsive
}} />
```

## Icons

```jsx
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
```

(Install `@mui/icons-material` if you want icons: `pnpm add @mui/icons-material`, and add it to `ds.packages` with `outName: "mui-icons-material"`.)
