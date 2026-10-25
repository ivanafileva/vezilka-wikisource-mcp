import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/literata/opsz.css';
import '@fontsource-variable/literata/opsz-italic.css';
import './index.css';
import App from './App.tsx';
import AuthProvider from './providers/authProvider.tsx';
import SnackbarProvider from './providers/snackbarProvider.tsx';
import ThemeModeProvider from './providers/themeModeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <AuthProvider>
        <SnackbarProvider>
          <App/>
        </SnackbarProvider>
      </AuthProvider>
    </ThemeModeProvider>
  </StrictMode>
);
