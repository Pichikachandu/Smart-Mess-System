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
                            borderRadius: 3,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            mb: { xs: 4, md: 0 } // Add margin bottom on mobile
                        }}>
                            {/* Pass Header */}
                            <Box sx={{
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                p: 3,
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                                color: 'white',
                                textAlign: 'center',
                                position: 'relative'
                            }}>
                                <Box sx={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    bgcolor: 'secondary.main', color: 'white', px: 2, py: 0.5, borderRadius: 20,
                                    fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', boxShadow: 3
                                }}>
                                    DIGITAL ACCESS PASS
                                </Box>
                                <Typography variant="h6" fontWeight={700} sx={{ mt: 1, letterSpacing: 1 }}>
                                    T.J.S ENGINEERING COLLEGE
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 2 }}>SMART MESS SYSTEM</Typography>
                            </Box>

                            {/* Pass Body */}
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, pt: 5 }}>
                                {/* User Info Compact */}
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <Typography variant="h5" fontWeight={800} color="text.primary">
                                        {user?.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ letterSpacing: '0.05em' }}>
                                        {user?.userId} • {user?.department}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1.5 }}>
                                        <Chip label={user?.residentType} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'primary.50', color: 'primary.700' }} />
                                        <Chip label={user?.mealType} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'orange.50', color: 'orange.800' }} />
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
                                                            height: 24, 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 700,
                                                            bgcolor: currentMeal === 'BREAKFAST' ? 'orange.100' : 
                                                                      currentMeal === 'LUNCH' ? 'blue.100' : 'indigo.100',
                                                            color: currentMeal === 'BREAKFAST' ? 'orange.800' : 
                                                                   currentMeal === 'LUNCH' ? 'blue.800' : 'indigo.800'
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
                                                            height: 24, 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 700,
                                                            bgcolor: 'grey.100',
                                                            color: 'grey.600'
                                                        }} 
                                                    />
                                                </Box>
                                            );
                                        }
                                    })()}
                                </Box>

                                {/* QR Code Area */}
                                <Box
                                    onClick={() => qrData && setShowActiveTokenDialog(true)}
                                    sx={{
                                        p: 2,
                                        border: '2px dashed',
                                        borderColor: qrData ? 'primary.main' : 'divider',
                                        borderRadius: 2,
                                        bgcolor: qrData ? 'white' : 'grey.50',
                                        position: 'relative',
                                        cursor: qrData ? 'pointer' : 'default',
                                        '&:hover': qrData ? { borderColor: 'primary.dark', boxShadow: 2 } : {}
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
                                                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.100' } }}
                                                    size="small"
                                                >
                                                    <FullscreenIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Box sx={{
                                                position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
                                                bgcolor: 'error.main', color: 'white', px: 1.5, py: 0.25, borderRadius: 1,
                                                display: 'flex', alignItems: 'center', gap: 0.5, boxShadow: 2
                                            }}>
                                                <AccessTimeIcon sx={{ fontSize: 14 }} />
                                                <Typography variant="caption" fontWeight={700}>{formatTime(timeLeft)}</Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{ width: Math.min(180, windowSize * 0.4), height: Math.min(180, windowSize * 0.4), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                                            <QrCodeScannerIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                            <Typography variant="caption" fontWeight={500}>Ready to Generate</Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ flexGrow: 1 }} />

                                {/* Error Display */}
                                {error && (
                                    <Box sx={{ 
                                        mt: 2, 
                                        p: 2, 
                                        bgcolor: 'error.light', 
                                        color: 'error.dark',
                                        borderRadius: 2,
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        textAlign: 'center'
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
                                        mt: error ? 2 : 5,
                                        borderRadius: 2,
                                        py: 1.5,
                                        bgcolor: qrData ? 'success.main' : 'primary.main',
                                        boxShadow: qrData ? 'none' : 4,
                                        '&:hover': { bgcolor: qrData ? 'success.dark' : 'primary.dark' }
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
                    <Paper sx={{ width: '100%', overflowX: 'auto', borderRadius: 2, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HistoryIcon color="action" />
                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                    Recent Activity
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={`${history.length} Records`} size="small" sx={{ fontWeight: 600 }} />
                                {history.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setCurrentHistoryIndex(0);
                                            setShowHistoryDialog(true);
                                        }}
                                        startIcon={<HistoryIcon />}
                                        sx={{ minWidth: 'auto' }}
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
                                        history.map((log) => (
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
                        maxWidth: 400,
                        bgcolor: '#fff',
                        borderRadius: 3,
                        position: 'relative',
                        // Ticket Shape with Side Notches
                        background: 'radial-gradient(circle at 0 130px, transparent 12px, #fff 13px), radial-gradient(circle at 100% 130px, transparent 12px, #fff 13px)',
                        // Shadow follows the shape
                        filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.2))',
                        fontFamily: "'Courier Prime', monospace"
                    }}>
                        {/* Expiration Overlay */}
                        {isExpired && (
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                bgcolor: 'rgba(255,255,255,0.6)',
                                backdropFilter: 'grayscale(100%) blur(1px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none'
                            }}>
                                <Box sx={{
                                    border: '4px solid #ef4444',
                                    color: '#ef4444',
                                    p: 2,
                                    transform: 'rotate(-15deg)',
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255, 255, 255, 0.9)'
                                }}>
                                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: 2 }}>EXPIRED</Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Colored Header */}
                        <Box sx={{
                            p: 3,
                            pb: 4,
                            textAlign: 'center',
                            background: selectedTicket.mealType === 'DINNER'
                                ? 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' // Indigo for Dinner
                                : selectedTicket.mealType === 'LUNCH'
                                    ? 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)' // Sky Blue for Lunch
                                    : 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)', // Orange/Brown for Breakfast
                            color: 'white',
                            position: 'relative',
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12
                        }}>
                            {/* Decorative Circles */}
                            <Box sx={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                            <Box sx={{ position: 'absolute', bottom: -10, right: -10, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />

                            <IconButton
                                onClick={() => setSelectedTicket(null)}
                                sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' } }}
                                size="small"
                                autoFocus
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>

                            <Typography variant="overline" sx={{ letterSpacing: 3, opacity: 0.9, fontWeight: 700 }}>T.J.S.E.C MESS</Typography>
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 28, color: '#4ade80', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>AUTHORIZED</Typography>
                            </Box>
                        </Box>

                        {/* Dashed Tear Line */}
                        <Box sx={{
                            position: 'absolute',
                            top: 130,
                            left: 12,
                            right: 12,
                            zIndex: 5,
                            borderTop: '2px dashed #e2e8f0'
                        }} />

                        {/* Receipt Body */}
                        <Box sx={{ p: 4, pt: 3 }}>
                            {/* Meal Type - Center Focus (Colored) */}
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2, fontWeight: 600 }}>MEAL SERVICE</Typography>
                                <Typography variant="h3" fontWeight={900} sx={{
                                    textTransform: 'uppercase',
                                    mt: 0.5,
                                    background: selectedTicket.mealType === 'DINNER'
                                        ? 'linear-gradient(45deg, #1e1b4b, #4338ca)'
                                        : selectedTicket.mealType === 'LUNCH'
                                            ? 'linear-gradient(45deg, #0c4a6e, #0284c7)'
                                            : 'linear-gradient(45deg, #7c2d12, #ea580c)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {selectedTicket.mealType}
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 3, borderStyle: 'dashed', borderColor: 'grey.300' }} />

                            {/* Date & Time Block */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 6 }}>
                                    <Box sx={{ pl: 1, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>DATE</Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {new Date(selectedTicket.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600} color="primary.main">
                                            {new Date(selectedTicket.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                                    <Box sx={{ pr: 1, borderRight: '3px solid', borderColor: 'secondary.light' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>TIME</Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {new Date(selectedTicket.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600} color="secondary.main">checked-in</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Info Grid */}
                            <Grid container spacing={2}>
                                {/* Student Details */}
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>STUDENT</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={800} color="text.primary">{user?.name}</Typography>
                                                <Typography variant="caption" fontWeight={600} color="text.secondary">{user?.userId}</Typography>
                                            </Box>
                                            <Chip label={`Year ${user?.year}`} size="small" sx={{ bgcolor: 'white', fontWeight: 700, border: '1px solid #e2e8f0' }} />
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Supervisor Details */}
                                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                                    <Box sx={{ p: 1.5, border: '1px dashed #cbd5e1', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: '50%', color: 'primary.main' }}>
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

                        {/* Receipt Footer */}
                        <Box sx={{ p: 2, bgcolor: '#0f172a', color: 'white', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.7, letterSpacing: 2 }}>
                                #{selectedTicket._id?.slice(-8).toUpperCase()}
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
