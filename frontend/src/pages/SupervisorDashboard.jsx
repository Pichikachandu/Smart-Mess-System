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
import { useNavigate } from 'react-router-dom';

const SupervisorDashboard = () => {
    // Session State
    const [session, setSession] = useState(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Scan State
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastScannedQR, setLastScannedQR] = useState(null);
    const [resultAnimation, setResultAnimation] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchActiveSession();
        // Check session status every minute
        const interval = setInterval(fetchActiveSession, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveSession = async () => {
        try {
            const { data } = await api.get('/supervisor/session');
            if (data) {
                setSession(data);
                const active = new Date() >= new Date(data.startTime) && new Date() <= new Date(data.endTime);
                setIsSessionActive(active);
            } else {
                setSession(null);
                setIsSessionActive(false);
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            setIsSessionActive(false);
        }
    };

    const handleScan = async (results) => {
        if (!isSessionActive || loading || !results || results.length === 0) return;

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

    return (
        <DashboardLayout title="Entrance Scanner">
            <Container maxWidth="sm" sx={{ py: 4 }}>
                {!isSessionActive ? (
                    <Card sx={{ borderRadius: 4, p: 4, textAlign: 'center', boxShadow: 3 }}>
                        <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>No Active Session</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            A meal session must be started before you can begin scanning tokens.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/supervisor/settings')}
                            sx={{ borderRadius: 3, px: 4, py: 1.5, bgcolor: '#1e293b' }}
                        >
                            GO TO MEAL SETTINGS
                        </Button>
                    </Card>
                ) : !scanResult ? (
                    <Card sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        bgcolor: '#0f172a',
                        color: 'white'
                    }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>DEVICE READY</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.6 }}>Scanning {session?.mealType}</Typography>
                            </Box>
                            <Chip
                                label="LIVE"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 800, px: 1, borderRadius: 1 }}
                            />
                        </Box>

                        <Box sx={{ position: 'relative', height: 400, bgcolor: '#000' }}>
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
                                    components={{ audio: false, finder: false }}
                                />
                            )}

                            {/* Custom Viewfinder Overlay */}
                            <Box sx={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 250, height: 250, pointerEvents: 'none'
                            }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderRadius: '8px 0 0 0' }} />
                                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderRadius: '0 8px 0 0' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderRadius: '0 0 0 8px' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderRadius: '0 0 8px 0' }} />
                            </Box>
                        </Box>
                    </Card>
                ) : (
                    <Card sx={{
                        borderRadius: 4,
                        textAlign: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
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
            </Container>
        </DashboardLayout>
    );
};

export default SupervisorDashboard;

