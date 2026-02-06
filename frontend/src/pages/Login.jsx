import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Grid, Paper, Typography, TextField, Button, Box, Alert, CircularProgress, InputAdornment, useTheme, useMediaQuery } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SchoolIcon from '@mui/icons-material/School';

const Login = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(userId, password);
            if (data.role === 'ADMIN') navigate('/admin');
            else if (data.role === 'STUDENT') navigate('/student');
            else if (data.role === 'SUPERVISOR') navigate('/supervisor');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container style={{ minHeight: '100vh' }}>
            {/* Left Side - Hero Image */}
            <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2560&auto=format&fit=crop)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                minHeight: { xs: 200, md: '100vh' } // Mobile: 200px header, Desktop: Full height
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    p: { xs: 4, md: 8 }, // Responsive padding
                    color: 'white'
                }}>
                    <Box sx={{ maxWidth: 600 }}>
                        <Typography variant="h2" sx={{ mb: 2, fontWeight: 800, fontSize: { xs: '2rem', md: '3.75rem' } }}>
                            Excellence in Campus Dining
                        </Typography>
                        <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                            Streamlined mess management for a smarter campus experience.
                        </Typography>
                    </Box>
                </Box>
            </Grid>

            {/* Right Side - Login Form */}
            <Grid size={{ xs: 12, md: 5, lg: 4 }} component={Paper} elevation={0} square sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}>
                <Box sx={{
                    mx: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 400,
                    width: '100%'
                }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        bgcolor: 'secondary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}>
                        <SchoolIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>

                    <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        T.J.S Engineering College
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Sign in to Smart Mess Portal
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>{error}</Alert>}

                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="userId"
                            label="User ID"
                            name="userId"
                            autoComplete="userId"
                            autoFocus
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ py: 1.5, mb: 2, fontSize: '1rem' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>

                        <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mt: 4 }}>
                            © 2026 T.J.S Engineering College
                        </Typography>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Login;
