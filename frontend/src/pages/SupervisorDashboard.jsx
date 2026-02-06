import { useState, useContext, useEffect } from 'react';
import {
    Container, Paper, Typography, Button, Box, CircularProgress,
    Card, CardContent, Divider, Chip, MenuItem, Select, FormControl,
    InputLabel, TextField, Grid, Alert, Stack
} from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import TimerIcon from '@mui/icons-material/Timer';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const SupervisorDashboard = () => {
    // Session State
    const [session, setSession] = useState(null);
    const [mealType, setMealType] = useState('BREAKFAST');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [settingSession, setSettingSession] = useState(false);

    // Scan State
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastScannedQR, setLastScannedQR] = useState(null);
    const [resultAnimation, setResultAnimation] = useState(false);

    useEffect(() => {
        fetchActiveSession();
    }, []);

    const fetchActiveSession = async () => {
        try {
            const { data } = await api.get('/supervisor/session');
            if (data) {
                setSession(data);
                setMealType(data.mealType);
                // Convert back to local datetime-local format
                setStartTime(new Date(data.startTime).toISOString().slice(0, 16));
                setEndTime(new Date(data.endTime).toISOString().slice(0, 16));
            }
        } catch (error) {
            console.error('Error fetching session:', error);
        }
    };

    const handleSetSession = async () => {
        if (!startTime || !endTime) return;
        setSettingSession(true);
        try {
            const { data } = await api.post('/supervisor/session', {
                mealType,
                startTime,
                endTime
            });
            setSession(data);
        } catch (error) {
            console.error('Error setting session:', error);
        } finally {
            setSettingSession(false);
        }
    };

    const handleScan = async (results) => {
        if (!session || loading || !results || results.length === 0) return;

        const rawValue = results[0].rawValue;
        if (!rawValue || rawValue === lastScannedQR) return;

        setLastScannedQR(rawValue);
        setLoading(true);
        try {
            const { data } = await api.post('/supervisor/scan', { qrPayload: rawValue });
            setScanResult(data);
            setResultAnimation(true);
        } catch (error) {
            setScanResult({
                status: 'DENIED',
                reason: error.response?.data?.reason || 'Validation Failed'
            });
            setResultAnimation(true);
        } finally {
            setLoading(false);
        }
    };

    const resetScan = () => {
        setResultAnimation(false);
        setScanResult(null);
        setLastScannedQR(null);
    };

    const isSessionActive = session && new Date() >= new Date(session.startTime) && new Date() <= new Date(session.endTime);

    return (
        <DashboardLayout title="Supervisor Portal">
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={4}>
                    {/* Session Management Panel */}
                    <Grid item xs={12} md={5}>
                        <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RestaurantIcon color="primary" /> Meal Session Control
                                </Typography>
                                <Divider sx={{ my: 2 }} />

                                <Stack spacing={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Meal Type</InputLabel>
                                        <Select
                                            value={mealType}
                                            label="Meal Type"
                                            onChange={(e) => setMealType(e.target.value)}
                                        >
                                            <MenuItem value="BREAKFAST">BREAKFAST</MenuItem>
                                            <MenuItem value="LUNCH">LUNCH</MenuItem>
                                            <MenuItem value="DINNER">DINNER</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Start Time"
                                        type="datetime-local"
                                        fullWidth
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />

                                    <TextField
                                        label="End Time"
                                        type="datetime-local"
                                        fullWidth
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />

                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleSetSession}
                                        disabled={settingSession}
                                        sx={{
                                            borderRadius: 2,
                                            py: 1.5,
                                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                                        }}
                                    >
                                        {settingSession ? <CircularProgress size={24} color="inherit" /> : 'START MEAL SESSION'}
                                    </Button>
                                </Stack>

                                {session && (
                                    <Box sx={{ mt: 4, p: 2, bgcolor: isSessionActive ? 'success.50' : 'error.50', borderRadius: 2, border: '1px solid', borderColor: isSessionActive ? 'success.100' : 'error.100' }}>
                                        <Typography variant="overline" color={isSessionActive ? 'success.main' : 'error.main'} fontWeight={700}>
                                            CURRENT STATUS: {isSessionActive ? 'SESSION OPEN' : 'SESSION CLOSED'}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800}>
                                            {session.mealType}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Ends at: {new Date(session.endTime).toLocaleTimeString()}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Scanner Section */}
                    <Grid item xs={12} md={7}>
                        {!scanResult ? (
                            <Card sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                bgcolor: '#0f172a',
                                color: 'white',
                                height: '100%',
                                minHeight: 500,
                                opacity: isSessionActive ? 1 : 0.5,
                                pointerEvents: isSessionActive ? 'auto' : 'none'
                            }}>
                                <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="h6" fontWeight={700}>
                                        {isSessionActive ? 'DEVICE READY' : 'SESSION CLOSED'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                        {isSessionActive ? 'Point camera at student QR code' : 'Start a session to enable scanning'}
                                    </Typography>
                                </Box>

                                <Box sx={{ position: 'relative', height: 400, bgcolor: '#000' }}>
                                    {isSessionActive && (
                                        <>
                                            {loading ? (
                                                <Box sx={{
                                                    position: 'absolute', inset: 0, zIndex: 10,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
                                                }}>
                                                    <CircularProgress color="primary" />
                                                </Box>
                                            ) : (
                                                <Scanner
                                                    onError={(error) => console.error(error)}
                                                    onScan={handleScan}
                                                    scanDelay={10}
                                                    components={{ audio: false, finder: false, torch: true }}
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Custom Viewfinder Overlay (only if active) */}
                                    {isSessionActive && (
                                        <Box sx={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            width: 250, height: 250, pointerEvents: 'none'
                                        }}>
                                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderRadius: '8px 0 0 0' }} />
                                            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderRadius: '0 8px 0 0' }} />
                                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderRadius: '0 0 0 8px' }} />
                                            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderRadius: '0 0 8px 0' }} />
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        ) : (
                            <Card sx={{
                                borderRadius: 4,
                                height: '100%',
                                minHeight: 500,
                                textAlign: 'center',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '@keyframes popIn': {
                                    '0%': { opacity: 0, transform: 'scale(0.9) translateY(20px)' },
                                    '100%': { opacity: 1, transform: 'scale(1) translateY(0)' }
                                }
                            }}>
                                <Box sx={{
                                    bgcolor: scanResult.status === 'ALLOWED' ? 'success.main' : 'error.main',
                                    color: 'white',
                                    p: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2
                                }}>
                                    {scanResult.status === 'ALLOWED' ? <CheckCircleIcon sx={{ fontSize: 80 }} /> : <CancelIcon sx={{ fontSize: 80 }} />}
                                    <Typography variant="h3" fontWeight={900}>
                                        {scanResult.status === 'ALLOWED' ? 'GRANTED' : 'DENIED'}
                                    </Typography>
                                </Box>

                                <CardContent sx={{ p: 4 }}>
                                    {scanResult.status === 'ALLOWED' ? (
                                        <Box>
                                            <Typography variant="h4" fontWeight={800}>{scanResult.student.name}</Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, my: 2 }}>
                                                <Chip label={scanResult.student.id} />
                                                <Chip label={scanResult.student.meal} color="primary" />
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography variant="h5" color="error" fontWeight={700}>{scanResult.reason}</Typography>
                                    )}
                                    <Button fullWidth variant="contained" size="large" onClick={resetScan} sx={{ mt: 4, py: 2, borderRadius: 3, bgcolor: '#1e293b' }}>
                                        SCAN NEXT STUDENT
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </DashboardLayout>
    );
};

export default SupervisorDashboard;

