import { useState, useEffect } from 'react';
import {
    Container, Typography, Button, Box, CircularProgress,
    Card, CardContent, Divider, MenuItem, Select, FormControl,
    InputLabel, TextField, Stack, Alert
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import api from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';

const SupervisorSettings = () => {
    const [mealType, setMealType] = useState('BREAKFAST');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [settingSession, setSettingSession] = useState(false);
    const [session, setSession] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchActiveSession();
    }, []);

    const fetchActiveSession = async () => {
        try {
            const { data } = await api.get('/supervisor/session');
            if (data) {
                setSession(data);
                setMealType(data.mealType);
                setStartTime(new Date(data.startTime).toISOString().slice(0, 16));
                setEndTime(new Date(data.endTime).toISOString().slice(0, 16));
            }
        } catch (err) {
            console.error('Error fetching session:', err);
        }
    };

    const handleSetSession = async () => {
        if (!startTime || !endTime) {
            setError('Please set both start and end times');
            return;
        }
        setSettingSession(true);
        setError('');
        setSuccess('');
        try {
            const { data } = await api.post('/supervisor/session', {
                mealType,
                startTime,
                endTime
            });
            setSession(data);
            setSuccess(`Successfully started ${mealType} session!`);
        } catch (err) {
            console.error('Error setting session:', err);
            setError(err.response?.data?.message || 'Failed to update session');
        } finally {
            setSettingSession(false);
        }
    };

    const isSessionActive = session && new Date() >= new Date(session.startTime) && new Date() <= new Date(session.endTime);

    return (
        <DashboardLayout title="Meal Session Settings">
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#1e293b' }}>
                            <RestaurantIcon color="primary" /> Session Control
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Set the current meal type and the time window for QR scanning.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

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
                                    borderRadius: 3,
                                    py: 1.8,
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    '&:hover': { background: '#000' }
                                }}
                            >
                                {settingSession ? <CircularProgress size={24} color="inherit" /> : 'START MEAL SESSION'}
                            </Button>
                        </Stack>

                        {session && (
                            <Box sx={{
                                mt: 4, p: 3,
                                bgcolor: isSessionActive ? 'success.50' : 'grey.100',
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: isSessionActive ? 'success.100' : 'grey.200'
                            }}>
                                <Typography variant="overline" color={isSessionActive ? 'success.main' : 'text.secondary'} fontWeight={800} sx={{ letterSpacing: 1.2 }}>
                                    CURRENT STATUS: {isSessionActive ? 'ACTIVE' : 'EXPIRED/INACTIVE'}
                                </Typography>
                                <Typography variant="h5" fontWeight={900} color="#1e293b">
                                    {session.mealType}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Valid until: {new Date(session.endTime).toLocaleString()}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </DashboardLayout>
    );
};

export default SupervisorSettings;
