import { Routes, Route } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import CreateProject from './components/CreateProject';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AnimatePresence } from 'framer-motion';
import ProjectTemplateManager from './components/ProjectTemplateManager';

// Create dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={4000}
      >
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/create" element={<CreateProject />} />
            <Route path="/templates" element={<ProjectTemplateManager />} />
          </Routes>
        </AnimatePresence>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;