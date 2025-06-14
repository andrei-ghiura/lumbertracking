import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export const getAppTheme = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: {
            main: '#1976d2', // Blue
          },
          secondary: {
            main: '#dc004e', // Pink
          },
          background: {
            default: '#f4f6f8',
            paper: '#ffffff',
          },
        }
      : {
          // palette values for dark mode
          primary: {
            main: '#90caf9', // Lighter blue for dark mode
          },
          secondary: {
            main: '#f48fb1', // Lighter pink for dark mode
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e', // Slightly lighter than default dark for cards etc.
          },
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
          }
        }),
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.primary.main,
        }),
      }
    }
    // You can add more component overrides here
  }
});