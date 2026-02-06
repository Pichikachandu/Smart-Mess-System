import { useState, useContext } from 'react';
import { Container, Paper, Typography, Button, Box, CircularProgress, Card, CardContent, Divider, Chip, IconButton } from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';

const SupervisorDashboard = () => {
    const [scanResult, setScanResult] = useState(null); // { status: 'ALLOWED'|'DENIED', student: {...}, reason: '' }
    const [loading, setLoading] = useState(false);
    const [lastScannedQR, setLastScannedQR] = useState(null); // Track last scanned QR to prevent duplicates
    const [resultAnimation, setResultAnimation] = useState(false); // For transition effect

    const handleScan = async (results) => {
        if (loading || !results || results.length === 0) return;

        const rawValue = results[0].rawValue;
        if (!rawValue || rawValue === lastScannedQR) return; // Prevent duplicate scans

        setLastScannedQR(rawValue);
        setLoading(true);
        try {
            const { data } = await api.post('/supervisor/scan', { qrPayload: rawValue });
            setScanResult(data);
            setResultAnimation(true);
        } catch (error) {
            console.error(error);
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
        setLastScannedQR(null); // Allow scanning new QR codes
    };

    return (
        <DashboardLayout title="Entrance Scanner">
            <Container maxWidth="sm" sx={{ py: 4 }}>
                {!scanResult ? (
                    <Card sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        bgcolor: '#0f172a', // Dark theme for scanner
                        color: 'white'
                    }}>
                        <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 1 }}>DEVICE READY</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>Point camera at student QR code</Typography>
                        </Box>

                        <Box sx={{ position: 'relative', height: 400, bgcolor: '#000' }}>
                            {loading && (
                                <Box sx={{
                                    position: 'absolute', inset: 0, zIndex: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
                                }}>
                                    <CircularProgress color="primary" />
                                </Box>
                            )}

                            {!loading && (
                                <Scanner
                                    onError={(error) => console.error(error)}
                                    onScan={handleScan}
                                    components={{ audio: false, finder: false }}
                                    constraints={{ facingMode: 'environment' }}
                                    styles={{ container: { width: '100%', height: '100%' } }}
                                />
                            )}

                            {/* Custom Viewfinder Overlay */}
                            <Box sx={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 250, height: 250, pointerEvents: 'none'
                            }}>
                                {/* Corners */}
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderRadius: '8px 0 0 0' }} />
                                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderRadius: '0 8px 0 0' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6', borderRadius: '0 0 0 8px' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6', borderRadius: '0 0 8px 0' }} />

                                {/* Scanning Line Animation */}
                                {!loading && (
                                    <Box sx={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                                        bgcolor: '#3b82f6',
                                        boxShadow: '0 0 10px #3b82f6',
                                        animation: 'scan 2s linear infinite',
                                        '@keyframes scan': {
                                            '0%': { top: '10%', opacity: 0 },
                                            '20%': { opacity: 1 },
                                            '80%': { opacity: 1 },
                                            '100%': { top: '90%', opacity: 0 }
                                        }
                                    }} />
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ p: 2, textAlign: 'center', opacity: 0.7 }}>
                            <QrCodeScannerIcon sx={{ fontSize: 32, mb: 1 }} />
                            <Typography variant="body2">Keep device steady</Typography>
                        </Box>
                    </Card>
                ) : (
                    // Result Card
                    <Card sx={{
                        borderRadius: 4,
                        textAlign: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: resultAnimation ? 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                        '@keyframes popIn': {
                            '0%': { opacity: 0, transform: 'scale(0.9) translateY(20px)' },
                            '100%': { opacity: 1, transform: 'scale(1) translateY(0)' }
                        }
                    }}>
                        <Box sx={{
                            bgcolor: scanResult.status === 'ALLOWED' ? 'success.main' : 'error.main',
                            color: 'white',
                            p: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2
                        }}>
                            {scanResult.status === 'ALLOWED' ? (
                                <CheckCircleIcon sx={{ fontSize: 96, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
                            ) : (
                                <CancelIcon sx={{ fontSize: 96, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
                            )}
                            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {scanResult.status === 'ALLOWED' ? 'GRANTED' : 'DENIED'}
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 4 }}>
                            {scanResult.status === 'ALLOWED' ? (
                                <Box>
                                    <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                                        {scanResult.student.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                        <Chip label={scanResult.student.id} variant="outlined" sx={{ fontWeight: 600 }} />
                                        <Chip label={scanResult.student.department} variant="outlined" sx={{ fontWeight: 600 }} />
                                    </Box>

                                    <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.100' }}>
                                        <Typography variant="caption" color="primary" fontWeight={700} sx={{ letterSpacing: 1 }}>ASSIGNED MEAL</Typography>
                                        <Typography variant="h4" fontWeight={800} color="primary">
                                            {scanResult.student.meal}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ py: 2 }}>
                                    <Typography variant="h5" color="error.main" fontWeight={700}>
                                        {scanResult.reason}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                        Please contact administration if this is an error.
                                    </Typography>
                                </Box>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={resetScan}
                                autoFocus
                                sx={{
                                    mt: 4,
                                    py: 2,
                                    borderRadius: 3,
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    bgcolor: '#1e293b',
                                    '&:hover': { bgcolor: '#0f172a' },
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                SCAN NEXT GUEST
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </Container>
        </DashboardLayout>
    );
};

export default SupervisorDashboard;
