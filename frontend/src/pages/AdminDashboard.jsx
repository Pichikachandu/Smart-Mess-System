import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Button, Box, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, TextField, MenuItem, Tabs, Tab, Card, CardContent, InputAdornment, Divider, IconButton, Tooltip, CircularProgress } from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

// Enterprise Stat Card - Clean, Numeric focus
const StatCard = ({ title, value, icon, trend }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                    {title}
                </Typography>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'action.hover', color: 'primary.main' }}>
                    {icon}
                </Box>
            </Box>
            <Typography variant="h3" color="text.primary" sx={{ fontWeight: 700 }}>
                {value}
            </Typography>
            {trend && (
                <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1, fontWeight: 500 }}>
                    {trend} <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>vs last week</Typography>
                </Typography>
            )}
        </CardContent>
    </Card>
);

const AdminDashboard = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [viewMode, setViewMode] = useState('grouped'); // 'list' | 'grouped'
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);

    // History Dialog State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLogs, setUserLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        userId: '', name: '', role: 'STUDENT', password: '',
        year: '1', residentType: 'HOSTELER', mealType: 'VEG', department: 'CSE'
    });

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'AIML', 'CS'];

    useEffect(() => {
        fetchData();
        setSelectedDept(null);
    }, [currentTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (currentTab === 0) {
                const { data } = await api.get('/admin/users');
                setUsers(data);
            } else {
                const { data } = await api.get('/admin/logs');
                setLogs(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            const payload = { ...formData };
            if (payload.role !== 'STUDENT') {
                delete payload.year;
                delete payload.residentType;
                delete payload.mealType;
                delete payload.department;
            }
            await api.post('/admin/users', payload);
            setOpenDialog(false);
            fetchData();
            setFormData({
                userId: '', name: '', role: 'STUDENT', password: '',
                year: '1', residentType: 'HOSTELER', mealType: 'VEG', department: 'CSE'
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating user');
        }
    };

    const handleRowClick = async (user) => {
        setSelectedUser(user);
        setHistoryOpen(true);
        setLoadingLogs(true);
        try {
            const { data } = await api.get(`/admin/logs/${user._id}`);
            setUserLogs(data);
        } catch (error) {
            console.error("Failed to fetch user logs", error);
            setUserLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );



    return (
        <DashboardLayout title="Administration">
            {/* Stats Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="TOTAL GUESTS"
                        value={users.length}
                        icon={<PeopleAltIcon />}
                        trend="+12%"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="MEALS SERVED"
                        value={logs.filter(l => l.status === 'ALLOWED').length}
                        icon={<FastfoodIcon />}
                        trend="+5%"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="ACTIVE RESIDENTS"
                        value={users.filter(u => u.role === 'STUDENT' && u.isActive).length}
                        icon={<CheckCircleIcon />}
                    />
                </Grid>
            </Grid>

            {/* Main Content Card */}
            <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden', bgcolor: 'transparent', boxShadow: 'none' }}>
                {/* Custom Toolbar outside Paper for Grouped View aesthetic */}
                <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', border: 1, borderColor: 'divider', gap: 2 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, val) => setCurrentTab(val)}
                        textColor="primary"
                        indicatorColor="primary"
                    >
                        <Tab label="Guest Management" />
                        <Tab label="Dining Logs" />
                    </Tabs>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Filter list">
                            <IconButton>
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh data">
                            <IconButton onClick={fetchData}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>

                {/* Tab Panel 0: Users */}
                {currentTab === 0 && (
                    <Box>
                        {/* Action Bar */}
                        <Box sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                            {viewMode === 'list' && (
                                <Button
                                    startIcon={<Typography variant="body2">←</Typography>}
                                    onClick={() => {
                                        setViewMode('grouped');
                                        setSearchTerm(''); // Clear search when going back
                                    }}
                                    size="small"
                                    sx={{ mr: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}
                                >
                                    Back to Collections
                                </Button>
                            )}

                            <TextField
                                size="small"
                                placeholder="Search guests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                                }}
                                sx={{ width: 300, bgcolor: 'white' }}
                            />

                            {/* View Toggle */}
                            <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: 1, p: 0.5 }}>
                                <Button
                                    size="small"
                                    variant={viewMode === 'list' ? 'white' : 'text'}
                                    sx={{ bgcolor: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? 1 : 0 }}
                                    onClick={() => setViewMode('list')}
                                >
                                    List
                                </Button>
                                <Button
                                    size="small"
                                    variant={viewMode === 'grouped' ? 'white' : 'text'}
                                    sx={{ bgcolor: viewMode === 'grouped' ? 'white' : 'transparent', boxShadow: viewMode === 'grouped' ? 1 : 0 }}
                                    onClick={() => setViewMode('grouped')}
                                >
                                    Cards
                                </Button>
                            </Box>

                            <Box sx={{ flexGrow: 1 }} />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenDialog(true)}
                                size="small"
                            >
                                New Guest
                            </Button>
                        </Box>

                        {/* List View */}
                        {viewMode === 'list' && (
                            <Paper sx={{ width: '100%', overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>User ID</TableCell>
                                            <TableCell>Full Name</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Plan Details</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredUsers.map((u) => (
                                            <TableRow
                                                key={u._id}
                                                hover
                                                onClick={() => handleRowClick(u)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:last-child td, &:last-child th': { border: 0 }
                                                }}
                                            >
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{u.userId}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{u.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={u.role}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            bgcolor: u.role === 'ADMIN' ? 'primary.light' : 'action.hover',
                                                            color: u.role === 'ADMIN' ? 'primary.contrastText' : 'text.primary',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={u.department || '—'} size="small" variant="outlined" sx={{ height: 24 }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            bgcolor: u.isActive ? 'success.main' : 'error.main'
                                                        }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>
                                                    {u.role === 'STUDENT' ? `${u.year} Year • ${u.residentType === 'HOSTELER' ? 'Hostel' : 'Day'} • ${u.mealType}` : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        )}

                        {/* Grouped Card View (Drill-Down) */}
                        {viewMode === 'grouped' && (
                            <Box>
                                {/* Breadcrumb Navigation */}
                                {selectedDept && (
                                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={() => setSelectedDept(null)}
                                            startIcon={<Typography variant="body2">←</Typography>}
                                            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
                                        >
                                            All Departments
                                        </Button>
                                        <Typography color="text.secondary" sx={{ mx: 1 }}>/</Typography>
                                        <Typography variant="h6" fontWeight={700} color="primary" sx={{ lineHeight: 1 }}>
                                            {selectedDept}
                                        </Typography>
                                    </Box>
                                )}

                                {!selectedDept ? (
                                    // Level 1: Departments
                                    <Grid container spacing={3}>
                                        {departments.map((dept) => {
                                            const deptStudents = filteredUsers.filter(u => u.role === 'STUDENT' && u.department === dept);
                                            // Calculate unique active years for this dept
                                            const activeYears = new Set(deptStudents.map(s => s.year)).size;

                                            return (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dept}>
                                                    <Card
                                                        onClick={() => setSelectedDept(dept)}
                                                        sx={{
                                                            height: '100%',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '&:hover': {
                                                                transform: 'translateY(-4px)',
                                                                boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.15)'
                                                            },
                                                            position: 'relative',
                                                            overflow: 'visible',
                                                            border: '1px solid',
                                                            borderColor: 'divider'
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            position: 'absolute', top: -12, left: 24,
                                                            bgcolor: 'primary.main', color: 'white',
                                                            px: 1.5, py: 0.5, borderRadius: '8px',
                                                            fontWeight: 700, fontSize: '0.75rem',
                                                            boxShadow: 2, letterSpacing: '0.05em'
                                                        }}>
                                                            DEPT CODE
                                                        </Box>
                                                        <CardContent sx={{ pt: 4, pb: 2 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                                <Typography variant="h4" fontWeight={800} color="text.primary">
                                                                    {dept}
                                                                </Typography>
                                                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                                                    <PeopleAltIcon />
                                                                </Box>
                                                            </Box>

                                                            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                                                            <Grid container spacing={2}>
                                                                <Grid size={{ xs: 6 }}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">TOTAL STUDENTS</Typography>
                                                                    <Typography variant="h5" fontWeight={700} color="text.primary">{deptStudents.length}</Typography>
                                                                </Grid>
                                                                <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">ACTIVE YEARS</Typography>
                                                                    <Typography variant="h5" fontWeight={700} color="text.primary">{activeYears}</Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                ) : (
                                    // Level 2: Years within Department
                                    <Grid container spacing={3}>
                                        {['1', '2', '3', '4'].map((year) => {
                                            const yearStudents = filteredUsers.filter(u => u.role === 'STUDENT' && u.department === selectedDept && u.year === year);
                                            const hostelers = yearStudents.filter(s => s.residentType === 'HOSTELER').length;
                                            const dayscholars = yearStudents.filter(s => s.residentType === 'DAY_SCHOLAR').length;

                                            // Show all years to maintain consistency

                                            return (
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={year}>
                                                    <Card sx={{
                                                        height: '100%',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}>
                                                        <Box sx={{
                                                            p: 2,
                                                            bgcolor: 'grey.50',
                                                            borderBottom: '1px solid',
                                                            borderColor: 'divider',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}>
                                                            <Typography variant="h6" fontWeight={800} color="text.secondary">
                                                                YEAR {year}
                                                            </Typography>
                                                        </Box>
                                                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                                            <Typography variant="h2" fontWeight={700} color={yearStudents.length > 0 ? "primary.main" : "text.disabled"}>
                                                                {yearStudents.length}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                                                Students Enrolled
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'center' }}>
                                                                <Chip size="small" label={`${hostelers} Hosteler`} sx={{ borderRadius: 1, fontWeight: 600, bgcolor: 'primary.50', color: 'primary.700' }} />
                                                                <Chip size="small" label={`${dayscholars} Day`} sx={{ borderRadius: 1, fontWeight: 600, bgcolor: 'orange.50', color: 'orange.800' }} />
                                                            </Box>
                                                        </CardContent>
                                                        <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                                                            <Button
                                                                fullWidth
                                                                variant="outlined"
                                                                size="small"
                                                                disabled={yearStudents.length === 0}
                                                                onClick={() => {
                                                                    setSearchTerm(selectedDept);
                                                                    setViewMode('list');
                                                                }}
                                                                sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                                            >
                                                                View {yearStudents.length} Students
                                                            </Button>
                                                        </Box>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Tab Panel 1: Logs */}
                {currentTab === 1 && (
                    <Paper sx={{ width: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Guest</TableCell>
                                    <TableCell>Meal</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Outcome</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log._id} hover>
                                        <TableCell sx={{ color: 'text.secondary' }}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <Typography variant="caption" display="block" color="text.disabled">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>{log.userId?.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{log.userId?.userId}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{log.mealType}</TableCell>
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
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.reason || 'Successful Scan'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                )}
            </Paper>

            {/* Registration Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    Register New Guest
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField label="User ID / Reg No" fullWidth value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })} />
                        <TextField label="Full Name" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <TextField label="Password" type="password" fullWidth value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />

                        <TextField select label="Role" fullWidth value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} sx={{ mt: 1 }}>
                            <MenuItem value="STUDENT">Student</MenuItem>
                            <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                            <MenuItem value="ADMIN">Admin</MenuItem>
                        </TextField>

                        {formData.role === 'STUDENT' && (
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField select label="Department" fullWidth value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                        {departments.map(dept => (
                                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField select label="Year" fullWidth value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}>
                                        <MenuItem value="1">1st</MenuItem>
                                        <MenuItem value="2">2nd</MenuItem>
                                        <MenuItem value="3">3rd</MenuItem>
                                        <MenuItem value="4">4th</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField select label="Type" fullWidth value={formData.residentType} onChange={e => setFormData({ ...formData, residentType: e.target.value })}>
                                        <MenuItem value="HOSTELER">Hostel</MenuItem>
                                        <MenuItem value="DAY_SCHOLAR">Day</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField select label="Meal" fullWidth value={formData.mealType} onChange={e => setFormData({ ...formData, mealType: e.target.value })}>
                                        <MenuItem value="VEG">Veg</MenuItem>
                                        <MenuItem value="NON_VEG">Non-Veg</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </DialogContent>
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
                    <Button variant="contained" onClick={handleCreateUser}>Create Account</Button>
                </Box>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>
                            Dining History
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setHistoryOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    {selectedUser && (
                        <Box sx={{ p: 3, bgcolor: 'background.default' }}>
                            <Card variant="outlined" sx={{ mb: 3 }}>
                                <CardContent sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                    <Box sx={{ borderRadius: '50%', width: 64, height: 64, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                                        {selectedUser.name?.charAt(0)}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>{selectedUser.name}</Typography>
                                        <Typography color="text.secondary" variant="body2">{selectedUser.userId} • {selectedUser.department} • Year {selectedUser.year}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Chip size="small" label={selectedUser.residentType} color="primary" variant="outlined" />
                                            <Chip size="small" label={selectedUser.mealType} color="secondary" variant="outlined" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Recent Activity
                            </Typography>

                            {loadingLogs ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : userLogs.length > 0 ? (
                                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                                            <TableRow>
                                                <TableCell>Time</TableCell>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Meal</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {userLogs.map((log) => (
                                                <TableRow key={log._id} hover>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell color="text.secondary">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{log.mealType}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={log.status}
                                                            size="small"
                                                            color={log.status === 'ALLOWED' ? 'success' : 'error'}
                                                            variant="soft"
                                                            sx={{
                                                                bgcolor: log.status === 'ALLOWED' ? 'success.light' : 'error.light',
                                                                color: log.status === 'ALLOWED' ? 'success.contrastText' : 'error.contrastText',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Paper>
                            ) : (
                                <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                                    <FastfoodIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                                    <Typography>No dining history found for this user.</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AdminDashboard;
