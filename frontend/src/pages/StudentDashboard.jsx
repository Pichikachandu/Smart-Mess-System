import { useState, useEffect, useContext } from 'react';
import { Container, Grid, Paper, Typography, Button, Box, Table, TableBody, TableCell, TableHead, TableRow, Chip, CircularProgress, Card, CardContent, Divider, Dialog, IconButton, Tooltip } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import HistoryIcon from '@mui/icons-material/History';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [qrData, setQrData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showActiveTokenDialog, setShowActiveTokenDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    const [windowSize, setWindowSize] = useState(window.innerWidth);
    const [error, setError] = useState('');

    const getCurrentMealType = () => {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const time = hour + minutes / 60;

        if (time >= 5.0 && time < 10.0) return 'BREAKFAST';
        if (time >= 10.0 && time < 16.0) return 'LUNCH'; // Extended to 4PM
        if (time >= 16.0 && time < 22.0) return 'DINNER'; // Starts at 4PM
        return null; // Outside meal hours
    };

    const isMealTimeExpired = (mealType) => {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const time = hour + minutes / 60;

        if (mealType === 'BREAKFAST' && time >= 10.0) return true;
        if (mealType === 'LUNCH' && time >= 16.0) return true; // Updated to 4PM
        if (mealType === 'DINNER' && time >= 22.0) return true;
        return false;
    };

    const isTicketExpired = (ticket) => {
        if (!ticket) return false;
        const ticketDate = new Date(ticket.timestamp);
        const now = new Date();
        if (ticketDate.toDateString() !== now.toDateString()) return true;
        
        return isMealTimeExpired(ticket.mealType);
    };

    const isExpired = isTicketExpired(selectedTicket);

    useEffect(() => {
        fetchHistory();

        // Initialize socket connection for real-time updates
        const token = sessionStorage.getItem('token');
        if (token) {
            const socket = initializeSocket(token);

            // Add connection state logging
            socket.on('connect', () => {
                console.log('✅ Socket connected successfully, ID:', socket.id);
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
            });

            // Listen for meal log creation events
            socket.on('mealLogCreated', (mealLog) => {
                console.log('🎫 New meal log received:', mealLog);
                // Immediately add the new ticket to history
                setHistory(prevHistory => [mealLog, ...prevHistory]);
            });

            // Cleanup on unmount
            return () => {
                socket.off('connect');
                socket.off('connect_error');
                socket.off('mealLogCreated');
                disconnectSocket();
            };
        }
    }, []);

    // Handle window resize for responsive QR code
    useEffect(() => {
        const handleResize = () => {
            setWindowSize(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let interval;
        if (qrData && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setQrData(null);
        }
        return () => clearInterval(interval);
    }, [qrData, timeLeft]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/student/history');
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const generateQr = async () => {
        try {
            setError('');
            const currentMealType = getCurrentMealType();
            
            if (!currentMealType) {
                setError('No meal service available at this time. Meal timings: Breakfast (5AM-10AM), Lunch (10AM-4PM), Dinner (4PM-10PM)');
                return;
            }

            const { data } = await api.get('/student/generate-qr', { 
                params: { mealType: currentMealType } 
            });
            
            // Check if the returned ticket is already expired
            if (isMealTimeExpired(data.mealType)) {
                setError(`${data.mealType} service has ended. Please try again during the next meal time.`);
                return;
            }

            setQrData(data.payload);
            const expires = new Date(data.expiresAt).getTime();
            const now = new Date().getTime();
            setTimeLeft(Math.floor((expires - now) / 1000));
            setError(''); // Clear any existing errors on success
        } catch (error) {
            console.error('Failed to generate QR:', error);
            setError(error.response?.data?.message || 'Failed to generate QR code. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Keyboard navigation for history dialog
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showHistoryDialog) return;

            if (e.key === 'ArrowLeft' && currentHistoryIndex > 0) {
                setCurrentHistoryIndex(prev => prev - 1);
            } else if (e.key === 'ArrowRight' && currentHistoryIndex < history.length - 1) {
                setCurrentHistoryIndex(prev => prev + 1);
            } else if (e.key === 'Escape') {
                setShowHistoryDialog(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showHistoryDialog, currentHistoryIndex, history.length]);

    return (
        <DashboardLayout title="Student Portal">
            <Container maxWidth="lg" sx={{ mb: { xs: 8, md: 0 } }}>
                <Grid container spacing={{ xs: 2, md: 4 }}>
                {/* Access Pass Section */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ overflow: 'visible' }}>
                    <Box sx={{
                        position: { xs: 'relative', md: 'sticky' },
                        top: { md: 24 },
                        zIndex: 10,
                        height: 'fit-content'
                    }}>
                        {/* Premium Access Pass Card */}
                        <Card sx={{
                            height: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'visible',
                            borderRadius: { xs: 2, md: 3 },
                            boxShadow: { 
                                xs: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                md: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            },
                            mb: { xs: 3, md: 0 },
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)'
                        }}>
                            {/* Pass Header */}
                            <Box sx={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                                backdropFilter: 'blur(15px)',
                                p: { xs: 2, sm: 3 },
                                borderTopLeftRadius: { xs: 2, md: 3 },
                                borderTopRightRadius: { xs: 2, md: 3 },
                                color: 'white',
                                textAlign: 'center',
                                position: 'relative',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <Typography 
                                    variant="h5" 
                                    component="h2" 
                                    sx={{ 
                                        fontWeight: 800,
                                        mb: 0.5,
                                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    Meal Access Pass
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                    opacity: 0.9, 
                                    letterSpacing: 3,
                                    fontWeight: 600,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                }}>
                                    SMART MESS SYSTEM
                                </Typography>
                            </Box>

                            {/* Pass Body */}
                            <CardContent sx={{ 
                                flexGrow: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                p: { xs: 3, sm: 4 }, 
                                pt: { xs: 3, sm: 5 },
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)'
                            }}>
                                {/* User Info Compact */}
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <Typography 
                                        variant="h5" 
                                        fontWeight={800} 
                                        sx={{
                                            background: 'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            mb: 1
                                        }}
                                    >
                                        {user?.name}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        fontWeight={600} 
                                        sx={{ 
                                            letterSpacing: '0.05em',
                                            color: '#64748b'
                                        }}
                                    >
                                        {user?.userId} • {user?.department}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1.5 }}>
                                        <Chip 
                                            label={user?.residentType} 
                                            size="small" 
                                            sx={{ 
                                                height: 24, 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                                color: '#1e40af',
                                                border: '1px solid #93c5fd'
                                            }} 
                                        />
                                        <Chip 
                                            label={user?.mealType} 
                                            size="small" 
                                            sx={{ 
                                                height: 24, 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                                                color: '#c2410c',
                                                border: '1px solid #fb923c'
                                            }} 
                                        />
                                    </Box>
                                    
                                    {/* Current Meal Service Indicator */}
                                    {(() => {
                                        const currentMeal = getCurrentMealType();
                                        if (currentMeal) {
                                            return (
                                                <Box sx={{ mt: 2 }}>
                                                    <Chip 
                                                        label={`${currentMeal} Service Active`}
                                                        size="small"
                                                        sx={{ 
                                                            height: 28, 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 700,
                                                            px: 2,
                                                            background: currentMeal === 'BREAKFAST' 
                                                                ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                                                                : currentMeal === 'LUNCH' 
                                                                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                                                    : 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                                                            color: currentMeal === 'BREAKFAST' 
                                                                ? '#b45309'
                                                                : currentMeal === 'LUNCH' 
                                                                    ? '#065f46'
                                                                    : '#5b21b6',
                                                            border: '1px solid',
                                                            borderColor: currentMeal === 'BREAKFAST' 
                                                                ? '#f59e0b'
                                                                : currentMeal === 'LUNCH' 
                                                                    ? '#10b981'
                                                                    : '#8b5cf6',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }} 
                                                    />
                                                </Box>
                                            );
                                        } else {
                                            return (
                                                <Box sx={{ mt: 2 }}>
                                                    <Chip 
                                                        label="No Meal Service"
                                                        size="small"
                                                        sx={{ 
                                                            height: 28, 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 700,
                                                            px: 2,
                                                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                                            color: '#475569',
                                                            border: '1px solid #cbd5e1',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }} 
                                                    />
                                                </Box>
                                            );
                                        }
                                    })()}
                                </Box>

                                {/* QR Code Area */}
                                <Box
                                    data-testid="qr-code-area"
                                    data-qr-active={qrData ? 'true' : 'false'}
                                    onClick={() => qrData && setShowActiveTokenDialog(true)}
                                    sx={{
                                        p: 3,
                                        border: '2px dashed',
                                        borderColor: qrData ? '#8b5cf6' : '#cbd5e1',
                                        borderRadius: 3,
                                        bgcolor: qrData 
                                            ? 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' 
                                            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        position: 'relative',
                                        cursor: qrData ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease',
                                        '&:hover': qrData ? { 
                                            borderColor: '#7c3aed',
                                            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.15)',
                                            transform: 'translateY(-2px)'
                                        } : {}
                                    }}
                                >
                                    {qrData ? (
                                        <>
                                            <QRCodeCanvas 
                                                value={qrData} 
                                                size={Math.min(180, windowSize * 0.4)} 
                                                level="H"
                                                includeMargin={true}
                                            />
                                            <Tooltip title="Click to view full size">
                                                <IconButton
                                                    sx={{ 
                                                        position: 'absolute', 
                                                        top: 12, 
                                                        right: 12, 
                                                        bgcolor: 'white', 
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                                                        '&:hover': { 
                                                            bgcolor: '#f3e8ff',
                                                            color: '#7c3aed'
                                                        } 
                                                    }}
                                                    size="small"
                                                >
                                                    <FullscreenIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Box sx={{
                                                position: 'absolute', 
                                                bottom: -20, 
                                                left: '50%', 
                                                transform: 'translateX(-50%)',
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                color: 'white', 
                                                px: 2, 
                                                py: 1, 
                                                borderRadius: 2,
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 0.5, 
                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                                fontWeight: 700,
                                                fontSize: '0.8rem'
                                            }}>
                                                <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                {formatTime(timeLeft)}
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{ 
                                            width: Math.min(180, windowSize * 0.4), 
                                            height: Math.min(180, windowSize * 0.4), 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#94a3b8'
                                        }}>
                                            <QrCodeScannerIcon sx={{ fontSize: 56, mb: 2, opacity: 0.6 }} />
                                            <Typography variant="body2" fontWeight={600} sx={{ color: '#64748b' }}>
                                                Ready to Generate
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ flexGrow: 1 }} />

                                {/* Error Display */}
                                {error && (
                                    <Box sx={{ 
                                        mt: 3, 
                                        p: 3, 
                                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                        border: '1px solid #fecaca',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        color: '#b91c1c',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                                    }}>
                                        {error}
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={generateQr}
                                    disabled={!!qrData}
                                    startIcon={!qrData ? <QrCodeScannerIcon /> : <CheckCircleIcon />}
                                    sx={{
                                        mt: error ? 3 : 5,
                                        borderRadius: 3,
                                        py: 2,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        background: qrData 
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                        color: 'white',
                                        boxShadow: qrData 
                                            ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                                            : '0 6px 20px rgba(139, 92, 246, 0.3)',
                                        '&:hover': { 
                                            background: qrData 
                                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                                : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: qrData 
                                                ? '0 8px 20px rgba(16, 185, 129, 0.4)'
                                                : '0 10px 25px rgba(139, 92, 246, 0.4)'
                                        },
                                        '&:disabled': {
                                            background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                                            boxShadow: 'none',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {qrData ? 'Token Active' : 'Generate Token'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>

                {/* History Section */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ 
                        width: '100%', 
                        overflowX: 'auto', 
                        borderRadius: { xs: 2, md: 3 }, 
                        border: 1, 
                        borderColor: 'divider', 
                        boxShadow: { 
                            xs: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            md: 'none'
                        }
                    }}>
                        <Box sx={{ 
                            p: { xs: 2, sm: 3 }, 
                            borderBottom: 1, 
                            borderColor: 'divider', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            bgcolor: 'grey.50', 
                            flexWrap: 'wrap', 
                            gap: 1 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HistoryIcon color="action" />
                                <Typography 
                                    variant="subtitle1" 
                                    fontWeight={700} 
                                    color="text.primary"
                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Recent Activity
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip 
                                    label={`${history.length} Records`} 
                                    size="small" 
                                    sx={{ 
                                        fontWeight: 600,
                                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                        color: '#4338ca',
                                        border: '1px solid #a5b4fc'
                                    }} 
                                />
                                {history.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setCurrentHistoryIndex(0);
                                            setShowHistoryDialog(true);
                                        }}
                                        data-testid="history-button"
                                        startIcon={<HistoryIcon />}
                                        sx={{ 
                                            minWidth: 'auto',
                                            display: { xs: 'none', sm: 'flex' } // Hide on mobile since it's accessible via bottom nav
                                        }}
                                    >
                                        Browse
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {loadingHistory ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                        ) : (
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'white' }}>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>DATE</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>MEAL</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>TIME</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>STATUS</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }} align="right">ACTION</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                                No meal records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.map((log, index) => (
                                            <TableRow key={log._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ fontWeight: 500 }}>{log.date}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.mealType}
                                                        size="small"
                                                        variant="outlined"
                                                        color={log.mealType === 'NON_VEG' ? 'error' : 'default'}
                                                        sx={{ height: 24, fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.status}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            fontWeight: 600,
                                                            borderRadius: '6px',
                                                            bgcolor: log.status === 'ALLOWED' ? 'success.light' : 'error.light',
                                                            color: log.status === 'ALLOWED' ? 'success.contrastText' : 'error.contrastText'
                                                        }}
                                                    />
                                                    {log.status === 'DENIED' && (
                                                        <Typography variant="caption" display="block" color="error.main" fontWeight={600} sx={{ mt: 0.5 }}>
                                                            {log.reason}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {log.status === 'ALLOWED' && (
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => setSelectedTicket(log)}
                                                            data-testid={`ticket-button-${index}`}
                                                            sx={{
                                                                minWidth: 80,
                                                                borderColor: 'divider',
                                                                color: 'text.primary',
                                                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                                                            }}
                                                        >
                                                            View Ticket
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            </Container>

            {/* Ticket Dialog */}
            <Dialog
                open={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                PaperProps={{
                    sx: {
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'visible'
                    }
                }}
            >
                {selectedTicket && (
                    <Box sx={{
                        width: '100%',
                        maxWidth: 420,
                        minHeight: 240,
                        bgcolor: '#f8f4e6',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        // Transportation ticket style with tear effect
                        backgroundImage: `
                            linear-gradient(to right, transparent 0%, transparent 45px, #fff 45px, #fff 55%, transparent 55%, transparent 100%),
                            repeating-linear-gradient(to bottom, #ddd 0px, #ddd 1px, transparent 1px, transparent 20px)
                        `,
                        backgroundSize: '100% 100%, 100% 20px',
                        fontFamily: "'Courier New', monospace",
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        {/* Expiration Overlay */}
                        {isExpired && (
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                bgcolor: 'rgba(255,255,255,0.8)',
                                backdropFilter: 'grayscale(100%) blur(1px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none'
                            }}>
                                <Box sx={{
                                    border: '3px dashed #dc2626',
                                    color: '#dc2626',
                                    p: 2,
                                    transform: 'rotate(-15deg)',
                                    borderRadius: 1,
                                    bgcolor: 'rgba(255, 255, 255, 0.95)'
                                }}>
                                    <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: 1 }}>EXPIRED</Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Ticket Header */}
                        <Box sx={{
                            p: 2,
                            pb: 1,
                            bgcolor: selectedTicket.mealType === 'DINNER'
                                ? '#1e40af' // Blue for Dinner
                                : selectedTicket.mealType === 'LUNCH'
                                    ? '#059669' // Green for Lunch
                                    : '#ea580c', // Orange for Breakfast
                            color: 'white',
                            borderBottom: '2px dashed rgba(255,255,255,0.3)',
                            position: 'relative'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                    T.J.S ENGINEERING COLLEGE
                                </Typography>
                                <IconButton
                                    onClick={() => setSelectedTicket(null)}
                                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                    size="small"
                                    autoFocus
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.9, letterSpacing: 2, fontWeight: 600 }}>
                                SMART MESS SYSTEM • MEAL PASS
                            </Typography>
                        </Box>

                        {/* Ticket Body */}
                        <Box sx={{ p: 3, pb: 2 }}>
                            {/* Meal Type Badge */}
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Box sx={{
                                    display: 'inline-block',
                                    px: 3,
                                    py: 1,
                                    bgcolor: selectedTicket.mealType === 'DINNER'
                                        ? '#dbeafe'
                                        : selectedTicket.mealType === 'LUNCH'
                                            ? '#d1fae5'
                                            : '#fed7aa',
                                    color: selectedTicket.mealType === 'DINNER'
                                        ? '#1e40af'
                                        : selectedTicket.mealType === 'LUNCH'
                                            ? '#059669'
                                            : '#ea580c',
                                    borderRadius: 1,
                                    fontWeight: 800,
                                    fontSize: '0.875rem',
                                    letterSpacing: 1,
                                    border: '2px solid',
                                    borderColor: selectedTicket.mealType === 'DINNER'
                                        ? '#1e40af'
                                        : selectedTicket.mealType === 'LUNCH'
                                            ? '#059669'
                                            : '#ea580c'
                                }}>
                                    {selectedTicket.mealType}
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3, borderColor: '#ccc' }} />

                            {/* Date & Time */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 6 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>DATE</Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {new Date(selectedTicket.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            {new Date(selectedTicket.timestamp).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>TIME</Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {new Date(selectedTicket.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">VALIDATED</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Student & Supervisor Info */}
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: '#f9fafb', 
                                        borderRadius: 1, 
                                        border: '1px solid #e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>STUDENT</Typography>
                                            <Typography variant="body1" fontWeight={800} color="text.primary">{user?.name}</Typography>
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">{user?.userId}</Typography>
                                        </Box>
                                        <Chip 
                                            label={`YEAR ${user?.year}`} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: 'white', 
                                                fontWeight: 700, 
                                                border: '1px solid #d1d5db',
                                                color: '#1f2937'
                                            }} 
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: '#f0f9ff', 
                                        borderRadius: 1, 
                                        border: '1px dashed #0ea5e9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <Box sx={{ p: 1, bgcolor: '#3b82f6', borderRadius: '50%', color: 'white' }}>
                                            <QrCodeScannerIcon fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">VERIFIED BY</Typography>
                                            <Typography variant="body2" fontWeight={700} color="text.primary">
                                                {selectedTicket.supervisorId?.name || 'SUPERVISOR'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Ticket Footer */}
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: '#1f2937', 
                            color: 'white', 
                            textAlign: 'center',
                            borderTop: '2px dashed rgba(255,255,255,0.2)'
                        }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.8, letterSpacing: 1 }}>
                                TICKET ID: {selectedTicket._id?.slice(-8).toUpperCase()}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.6, mt: 0.5 }}>
                                • AUTHORIZED MEAL ACCESS • NOT TRANSFERABLE • VOID IF DETACHED •
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Dialog>

            {/* Active Token Dialog */}
            <Dialog
                open={showActiveTokenDialog}
                onClose={() => setShowActiveTokenDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden',
                        margin: { xs: 1, sm: 2 },
                        maxHeight: '95vh'
                    }
                }}
            >
                <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>Active Token</Typography>
                    <IconButton onClick={() => setShowActiveTokenDialog(false)} sx={{ color: 'white' }} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {qrData && (
                    <Box sx={{ 
                        p: { xs: 2, sm: 4 }, 
                        textAlign: 'center', 
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{
                                p: { xs: 2, sm: 3 },
                                bgcolor: 'white',
                                borderRadius: 2,
                                border: '3px solid',
                                borderColor: 'primary.main',
                                boxShadow: 4,
                                maxWidth: '100%',
                                display: 'inline-block'
                            }}>
                                <QRCodeCanvas 
                                    value={qrData} 
                                    size={Math.min(300, windowSize * 0.8)} 
                                    level="H"
                                    includeMargin={true}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 2, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ color: 'error.main' }} />
                            <Typography variant="h5" fontWeight={700} color="error.main">
                                {formatTime(timeLeft)}
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Scan this code at the entrance
                        </Typography>
                    </Box>
                )}
            </Dialog>

            {/* Token History Dialog */}
            <Dialog
                open={showHistoryDialog}
                onClose={() => setShowHistoryDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>Token History</Typography>
                    <IconButton onClick={() => setShowHistoryDialog(false)} sx={{ color: 'white' }} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {history.length > 0 && (
                    <>
                        {/* Navigation Bar */}
                        <Box sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                            <IconButton
                                onClick={() => setCurrentHistoryIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentHistoryIndex === 0}
                                size="small"
                            >
                                <ArrowBackIcon />
                            </IconButton>

                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                                Token {currentHistoryIndex + 1} of {history.length}
                            </Typography>

                            <IconButton
                                onClick={() => setCurrentHistoryIndex(prev => Math.min(history.length - 1, prev + 1))}
                                disabled={currentHistoryIndex === history.length - 1}
                                size="small"
                            >
                                <ArrowForwardIcon />
                            </IconButton>
                        </Box>

                        {/* Token Details */}
                        {history[currentHistoryIndex] && (
                            <Box sx={{ p: 4 }}>
                                {/* Meal Type Header */}
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Chip
                                        label={history[currentHistoryIndex].mealType}
                                        size="medium"
                                        sx={{
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            px: 2,
                                            py: 2.5,
                                            bgcolor: history[currentHistoryIndex].mealType === 'BREAKFAST'
                                                ? 'orange.100'
                                                : history[currentHistoryIndex].mealType === 'LUNCH'
                                                    ? 'blue.100'
                                                    : 'indigo.100',
                                            color: history[currentHistoryIndex].mealType === 'BREAKFAST'
                                                ? 'orange.900'
                                                : history[currentHistoryIndex].mealType === 'LUNCH'
                                                    ? 'blue.900'
                                                    : 'indigo.900'
                                        }}
                                    />
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Date & Time */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>DATE</Typography>
                                            <Typography variant="body1" fontWeight={700}>
                                                {history[currentHistoryIndex].date}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>TIME</Typography>
                                            <Typography variant="body1" fontWeight={700}>
                                                {new Date(history[currentHistoryIndex].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Status */}
                                <Box sx={{ p: 2, bgcolor: history[currentHistoryIndex].status === 'ALLOWED' ? 'success.light' : 'error.light', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>STATUS</Typography>
                                    <Typography variant="h6" fontWeight={800} color={history[currentHistoryIndex].status === 'ALLOWED' ? 'success.dark' : 'error.dark'}>
                                        {history[currentHistoryIndex].status}
                                    </Typography>
                                    {history[currentHistoryIndex].status === 'DENIED' && history[currentHistoryIndex].reason && (
                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                            {history[currentHistoryIndex].reason}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Expiration Status */}
                                {isTicketExpired(history[currentHistoryIndex]) && (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" fontWeight={600} color="warning.dark">
                                            ⚠️ This token has expired
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </Dialog>
        </DashboardLayout>
    );
};

export default StudentDashboard;
