import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAppTheme } from './hooks/useTheme'; // Assuming useAppTheme now returns [mode, toggleMode, themeObject]
import { getAppTheme } from './theme'; // Import the theme generation function

const RootComponent: React.FC = () => {
  // useAppTheme should ideally just return mode and toggleMode.
  // The theme object itself should be created here based on the mode.
  const [mode, , ] = useAppTheme(); // We only need mode here for the initial theme.
                                   // The toggle function will be used by UI components.
                                   // The theme object from useAppTheme is not used here; 
                                   // we construct a new one for ThemeProvider.

  const theme = React.useMemo(() => responsiveFontSizes(createTheme(getAppTheme(mode))), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);