import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#07111f',
      paper: '#0d1b2f',
    },
    primary: {
      main: '#3b82f6',
      dark: '#2563eb',
      light: '#60a5fa',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#38bdf8',
      contrastText: '#06101f',
    },
    info: {
      main: '#818cf8',
    },
    success: {
      main: '#22c55e',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
    text: {
      primary: '#e5eefb',
      secondary: '#9fb3c8',
    },
    divider: '#22344f',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    button: {
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#07111f',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: '#22344f',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#13233a',
        },
        notchedOutline: {
          borderColor: '#22344f',
        },
      },
    },
  },
});

export default theme;
