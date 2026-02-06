import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0F172A', // Slate 900
            light: '#334155', // Slate 700
            dark: '#020617', // Slate 950
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#2563EB', // Blue 600
            light: '#60A5FA', // Blue 400
            dark: '#1D4ED8', // Blue 700
            contrastText: '#ffffff',
        },
        background: {
            default: '#F1F5F9', // Slate 100 - Slightly darker for better card contrast
            paper: '#FFFFFF',
        },
        text: {
            primary: '#0F172A', // Slate 900
            secondary: '#64748B', // Slate 500
        },
        divider: '#E2E8F0', // Slate 200
        action: {
            hover: '#F8FAFC', // Slate 50
            selected: '#F1F5F9', // Slate 100
        },
        success: {
            main: '#10B981', // Emerald 500
            light: '#D1FAE5', // Emerald 100
            contrastText: '#064E3B', // Emerald 900
        },
        error: {
            main: '#EF4444', // Red 500
            light: '#FEE2E2', // Red 100
            contrastText: '#7F1D1D', // Red 900
        },
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        h1: { fontWeight: 700, letterSpacing: '-0.025em', fontSize: '2.5rem' },
        h2: { fontWeight: 700, letterSpacing: '-0.025em', fontSize: '2rem' },
        h3: { fontWeight: 600, letterSpacing: '-0.025em', fontSize: '1.75rem' },
        h4: { fontWeight: 600, letterSpacing: '-0.025em', fontSize: '1.5rem' },
        h5: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        subtitle1: { fontSize: '1rem', fontWeight: 500, color: '#475569' }, // Slate 600
        subtitle2: { fontSize: '0.875rem', fontWeight: 500, color: '#64748B' }, // Slate 500
        body1: { fontSize: '1rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.5 },
        button: { textTransform: 'none', fontWeight: 600 },
        overline: { fontWeight: 700, letterSpacing: '0.1em' },
    },
    shape: {
        borderRadius: 8, // Tighter corner radius for "Pro" feel
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        // ... fill rest with standard MU shadows if needed, usually simplified for custom systems
        ...Array(20).fill('none') // Placeholder for brevity, in real enterprise system we define all 25
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '6px',
                    padding: '8px 16px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#0F172A',
                    '&:hover': { backgroundColor: '#1E293B' },
                },
                containedSecondary: {
                    backgroundColor: '#2563EB',
                    '&:hover': { backgroundColor: '#1D4ED8' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Subtle card shadow
                    border: '1px solid #E2E8F0', // Slate 200 border
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                    padding: '12px 16px',
                    borderBottom: '1px solid #F1F5F9',
                },
                head: {
                    fontWeight: 600,
                    color: '#64748B', // Slate 500
                    backgroundColor: '#F8FAFC', // Slate 50
                    borderBottom: '1px solid #E2E8F0',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    fontSize: '0.75rem',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    minHeight: '48px',
                    '&.Mui-selected': {
                        fontWeight: 600,
                        color: '#2563EB',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // Deep shadow for modal
                },
            },
        },
    },
});

export default theme;
