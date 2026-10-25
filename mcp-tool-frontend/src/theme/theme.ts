import { alpha, createTheme, type PaletteMode, type Theme } from '@mui/material/styles';
import { mkMK } from '@mui/material/locale';
import { fabricBackground } from '../ui/embroidery/fabric.ts';

declare module '@mui/material/styles' {
  interface TypeText {
    /** Quiet labels: overlines, metadata, captions. */
    tertiary: string;
  }

  interface TypeBackground {
    /** Slightly sunk surface for code and quoted text. */
    sunk: string;
  }
}

/**
 * The app's visual identity: an editorial "printed sheet". Warm paper, ink
 * text, hairline rules and a single madder-red accent borrowed from Macedonian
 * folk embroidery (везилка = embroiderer), with gold kept for small details.
 * Headings use Literata (a book serif with full Cyrillic support and optical
 * sizes), body text uses Geist.
 */
const tokens = {
  light: {
    paper: '#FAF8F2',
    surface: '#FFFFFF',
    sunk: '#F2EFE6',
    ink: '#22251E',
    ink2: '#4C5243',
    ink3: '#6A7060',
    inkSoft: '#8B9080',
    line: '#DDD9CB',
    lineSoft: '#EAE7DC',
    accent: '#A8241A',
    accentDark: '#86190F',
    accentLight: '#C9473A',
    gold: '#A9792B'
  },
  dark: {
    paper: '#14181C',
    surface: '#1A1F24',
    sunk: '#101317',
    ink: '#ECEAE2',
    ink2: '#B9BCB2',
    ink3: '#8B9188',
    inkSoft: '#6B7168',
    line: '#2E343A',
    lineSoft: '#23282D',
    accent: '#EF7A52',
    accentDark: '#D4551D',
    accentLight: '#F59A79',
    gold: '#D9AE5C'
  }
} as const;

export const HEADING_FONT = '"Literata Variable", "Literata", Georgia, "Times New Roman", serif';
export const BODY_FONT = '"Geist Variable", "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
export const MONO_FONT = 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

export const createAppTheme = (mode: PaletteMode): Theme => {
  const t = tokens[mode];

  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent, dark: t.accentDark, light: t.accentLight, contrastText: mode === 'light' ? '#FFFFFF' : '#1A0E09' },
      secondary: { main: t.gold, contrastText: mode === 'light' ? '#FFFFFF' : '#1A1F24' },
      background: { default: t.paper, paper: t.surface, sunk: t.sunk },
      text: { primary: t.ink, secondary: t.ink2, tertiary: t.ink3, disabled: t.inkSoft },
      divider: t.line,
      success: { main: mode === 'light' ? '#3F7A4A' : '#7CC08A' },
      warning: { main: mode === 'light' ? '#B26A00' : '#E8A84A' },
      error: { main: mode === 'light' ? '#B3261E' : '#F2867C' },
      info: { main: mode === 'light' ? '#3B6A8F' : '#86B4D8' },
      action: { hover: alpha(t.ink, 0.04), selected: alpha(t.accent, 0.08) }
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: BODY_FONT,
      fontSize: 14,
      h1: { fontFamily: HEADING_FONT, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 },
      h2: { fontFamily: HEADING_FONT, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.08 },
      h3: { fontFamily: HEADING_FONT, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.12 },
      h4: { fontFamily: HEADING_FONT, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.15 },
      h5: { fontFamily: HEADING_FONT, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.2 },
      h6: { fontFamily: HEADING_FONT, fontWeight: 450, letterSpacing: '-0.005em', lineHeight: 1.3, fontSize: '1.15rem' },
      subtitle1: { letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 500, letterSpacing: '-0.005em' },
      body1: { letterSpacing: '-0.01em', lineHeight: 1.6 },
      body2: { letterSpacing: '-0.01em', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: '-0.01em' },
      caption: { letterSpacing: '-0.005em' },
      overline: { fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.14em', lineHeight: 1.6 }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // The whole page is squared embroidery fabric, anchored at the page's
          // top-left so it lines up with the stitched canvases (8px / 10px stitches).
          body: {
            backgroundColor: t.paper,
            ...fabricBackground(t.ink, mode, 8),
            '@media (min-width: 900px)': { backgroundSize: fabricBackground(t.ink, mode, 10).backgroundSize },
            WebkitFontSmoothing: 'antialiased',
            fontOpticalSizing: 'auto'
          },
          '::selection': { backgroundColor: alpha(t.accent, 0.18) },
          'code, pre': { fontFamily: MONO_FONT }
        }
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: { backgroundColor: alpha(t.paper, 0.95), backdropFilter: 'saturate(1.4) blur(12px)', boxShadow: `inset 0 -1px 0 ${alpha(t.line, 0.6)}` }
        }
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: t.surface,
            border: `1px solid ${t.line}`,
            borderRadius: 12,
            transition: 'border-color 160ms ease',
            '&:hover': { borderColor: mode === 'light' ? t.inkSoft : t.ink3 }
          }
        }
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } }
      },
      MuiCardActions: {
        defaultProps: { disableSpacing: true },
        styleOverrides: { root: { padding: '10px 14px', borderTop: `1px solid ${t.lineSoft}`, gap: 4 } }
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: t.line, borderRadius: 12 }
        }
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: 14 },
          sizeSmall: { fontSize: '0.8rem', paddingInline: 10 },
          sizeLarge: { fontSize: '0.95rem', paddingBlock: 9, paddingInline: 20 },
          outlined: {
            borderColor: t.line,
            color: t.ink,
            backgroundColor: t.surface,
            '&:hover': { borderColor: t.inkSoft, backgroundColor: t.surface }
          }
        },
        variants: [
          {
            props: { variant: 'text', color: 'primary' },
            style: { color: t.ink2, '&:hover': { color: t.ink, backgroundColor: alpha(t.ink, 0.05) } }
          }
        ]
      },
      MuiIconButton: {
        styleOverrides: { root: { color: t.ink2, borderRadius: 8 } }
      },
      MuiChip: {
        styleOverrides: {
          root: ({ ownerState, theme }) => {
            const base = { fontWeight: 500, borderRadius: 6, letterSpacing: '-0.005em' };
            const color = ownerState.color;
            if (ownerState.variant !== 'outlined' && color && color !== 'default') {
              const main = theme.palette[color].main;
              return { ...base, backgroundColor: alpha(main, mode === 'light' ? 0.1 : 0.16), color: mode === 'light' ? theme.palette[color].dark : main };
            }
            return base;
          },
          sizeSmall: { height: 22, fontSize: '0.72rem' },
          outlined: { borderColor: t.line, color: t.ink2 },
          filled: { backgroundColor: alpha(t.ink, 0.06), color: t.ink2 }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: t.surface,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.line },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.inkSoft }
          }
        }
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' }
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 500, color: t.ink3, borderColor: t.line, paddingInline: 12,
            '&.Mui-selected': { color: t.ink, backgroundColor: alpha(t.ink, 0.07) }
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 14, border: `1px solid ${t.line}`, backgroundColor: t.surface, boxShadow: `0 24px 64px ${alpha('#000', mode === 'light' ? 0.14 : 0.5)}` }
        }
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: HEADING_FONT, fontWeight: 400, fontSize: '1.6rem', letterSpacing: '-0.015em', paddingTop: 24 } }
      },
      MuiDialogContent: {
        styleOverrides: { dividers: { borderColor: t.lineSoft } }
      },
      MuiBackdrop: {
        styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: alpha(mode === 'light' ? '#13140F' : '#000', 0.4) } } }
      },
      MuiLink: {
        defaultProps: { underline: 'always' },
        styleOverrides: {
          root: {
            color: 'inherit',
            textDecorationColor: alpha(t.ink, 0.3),
            textUnderlineOffset: '0.2em',
            transition: 'color 120ms ease, text-decoration-color 120ms ease',
            '&:hover': { color: t.accent, textDecorationColor: t.accent }
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': { backgroundColor: alpha(t.accent, 0.07), boxShadow: `inset 2px 0 0 ${t.accent}` },
            '&.Mui-selected:hover': { backgroundColor: alpha(t.accent, 0.1) }
          }
        }
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: t.line } }
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 10 } }
      },
      MuiSlider: {
        styleOverrides: { thumb: { boxShadow: 'none', '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 6px ${alpha(t.accent, 0.14)}` } } }
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: { backgroundColor: t.ink, color: t.paper, fontSize: '0.72rem', fontWeight: 500 },
          arrow: { color: t.ink }
        }
      },
      MuiAvatar: {
        styleOverrides: { root: { fontFamily: HEADING_FONT } }
      }
    }
  }, mkMK);
};
