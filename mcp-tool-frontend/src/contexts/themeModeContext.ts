import { createContext } from 'react';
import type { PaletteMode } from '@mui/material';

export interface ThemeModeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextType>({} as ThemeModeContextType);

export default ThemeModeContext;
