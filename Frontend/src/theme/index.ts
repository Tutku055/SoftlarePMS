import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, fontSize: '2.5rem' },
  h2: { fontWeight: 600, fontSize: '2rem' },
  h3: { fontWeight: 600, fontSize: '1.75rem' },
  h4: { fontWeight: 600, fontSize: '1.5rem' },
  h5: { fontWeight: 500, fontSize: '1.25rem' },
  h6: { fontWeight: 500, fontSize: '1rem' },
  button: { textTransform: 'none' as const, fontWeight: 500 },
};

const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#4F46E5', // Indigo 600
    light: '#818CF8',
    dark: '#3730A3',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#10B981', // Emerald 500
    light: '#34D399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  background: {
    default: '#F3F4F6', // Gray 100
    paper: '#ffffff',
  },
  text: {
    primary: '#111827', // Gray 900
    secondary: '#4B5563', // Gray 600
  },
  divider: '#E5E7EB',
};

const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#6366F1', // Indigo 500
    light: '#818CF8',
    dark: '#4338CA',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#34D399', // Emerald 400
    light: '#6EE7B7',
    dark: '#10B981',
    contrastText: '#111827',
  },
  background: {
    default: '#111827', // Gray 900
    paper: '#1F2937', // Gray 800
  },
  text: {
    primary: '#F9FAFB', // Gray 50
    secondary: '#9CA3AF', // Gray 400
  },
  divider: '#374151',
};

export const getTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'light' ? lightPalette : darkPalette;

  return createTheme({
    palette,
    typography,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            colorScheme: mode,
          },
          '*::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.18)',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.32)',
            },
          },
          'input[type="date"]::-webkit-calendar-picker-indicator, input[type="datetime-local"]::-webkit-calendar-picker-indicator, input[type="month"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator': {
            filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 1,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            backgroundImage: 'none', // Remove default MUI dark mode overlay
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
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&[type="date"], &[type="datetime-local"], &[type="month"], &[type="time"]': {
              colorScheme: mode,
              '&::-webkit-calendar-picker-indicator': {
                filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
                cursor: 'pointer',
                opacity: 0.8,
                transition: 'opacity 0.2s ease',
                '&:hover': {
                  opacity: 1,
                },
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& input[type="date"], & input[type="datetime-local"], & input[type="month"], & input[type="time"]': {
              colorScheme: mode,
              '&::-webkit-calendar-picker-indicator': {
                filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
                cursor: 'pointer',
                opacity: 0.8,
                transition: 'opacity 0.2s ease',
                '&:hover': {
                  opacity: 1,
                },
              },
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            height: 6,
            padding: '13px 0',
          },
          thumb: {
            height: 16,
            width: 16,
            backgroundColor: palette.primary.main,
            border: `2px solid ${palette.background.paper}`,
            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px ${mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.16)'}`,
            },
          },
          track: {
            height: 6,
            borderRadius: 3,
            backgroundColor: palette.primary.main,
            border: 'none',
          },
          rail: {
            height: 6,
            borderRadius: 3,
            opacity: 1,
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          },
          valueLabel: {
            lineHeight: 1.2,
            fontSize: 12,
            background: 'unset',
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: '50% 50% 50% 0',
            backgroundColor: palette.primary.main,
            transformOrigin: 'bottom left',
            transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
            '&::before': { display: 'none' },
            '&.MuiSlider-valueLabelOpen': {
              transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
            },
            '& > *': {
              transform: 'rotate(45deg)',
            },
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
  } as ThemeOptions);
};
