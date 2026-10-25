import { useContext } from 'react';
import ThemeModeContext, { type ThemeModeContextType } from '../contexts/themeModeContext.ts';

const useThemeMode = () => useContext<ThemeModeContextType>(ThemeModeContext);

export default useThemeMode;
