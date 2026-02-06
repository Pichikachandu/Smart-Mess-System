import { useState, useContext, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCodeIcon from '@mui/icons-material/QrCode';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AuthContext from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileBottomNav from './MobileBottomNav';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: `-${drawerWidth}px`,
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        }),
        [theme.breakpoints.down('md')]: {
            marginLeft: '0 !important',
            width: '100% !important',
            padding: theme.spacing(2),
            paddingBottom: theme.spacing(8), // Add padding for bottom nav
            overflowX: 'hidden'
        },
    }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        }),
        [theme.breakpoints.down('md')]: {
            width: '100% !important',
            marginLeft: '0 !important',
            display: 'none', // Hide app bar on mobile for students
        }
    }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

const DashboardLayout = ({ children, title }) => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [open, setOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Automatically open sidebar on desktop load
    useEffect(() => {
        setOpen(isDesktop);
    }, [isDesktop]);

    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleDrawerToggle = () => {
        if (isDesktop) {
            setOpen(!open);
        } else {
            setMobileOpen(!mobileOpen);
        }
    };

    const menuItems = [];
    if (user?.role === 'ADMIN') {
        menuItems.push({ text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' });
    } else if (user?.role === 'STUDENT') {
        menuItems.push({ text: 'My Token', icon: <QrCodeIcon />, path: '/student' });
    } else if (user?.role === 'SUPERVISOR') {
        menuItems.push({ text: 'Scanner', icon: <QrCodeScannerIcon />, path: '/supervisor' });
    }

    const drawerContent = (
        <>
            <DrawerHeader sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="subtitle1" sx={{ width: '100%', ml: 2, fontWeight: 700, color: 'white' }}>
                    T.J.S MESS
                </Typography>
                {isDesktop && (
                    <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </DrawerHeader>
            <List sx={{ px: 1, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            onClick={() => {
                                navigate(item.path);
                                if (!isDesktop) setMobileOpen(false);
                            }}
                            selected={location.pathname === item.path}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(59, 130, 246, 0.15)', // Blue tint
                                    color: '#60A5FA', // Blue 400
                                    '& .MuiListItemIcon-root': { color: '#60A5FA' }
                                },
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ px: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton onClick={logout} sx={{ borderRadius: 2 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <LogoutIcon sx={{ color: '#F87171' }} />
                        </ListItemIcon>
                        <ListItemText primary="Sign Out" sx={{ color: '#F87171' }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Desktop AppBar */}
            {isDesktop && (
                <AppBarStyled
                    position="fixed"
                    open={isDesktop && open}
                    elevation={0}
                    sx={{
                        bgcolor: 'white',
                        color: 'text.primary',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        width: isDesktop && open ? `calc(100% - ${drawerWidth}px)` : '100%',
                        ml: isDesktop && open ? `${drawerWidth}px` : 0
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerToggle}
                            edge="start"
                            sx={{ mr: 2, ...(isDesktop && open && { display: 'none' }) }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                            {title || 'T.J.S Engineering College'}
                        </Typography>

                        <div>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <AccountCircleIcon />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                        mt: 1.5,
                                    },
                                }}
                            >
                                <MenuItem disabled sx={{ fontWeight: 600 }}>{user?.name}</MenuItem>
                                <MenuItem onClick={logout}>Sign Out</MenuItem>
                            </Menu>
                        </div>
                    </Toolbar>
                </AppBarStyled>
            )}

            {/* Desktop Persistent Drawer */}
            {isDesktop ? (
                <Drawer
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderRight: 'none'
                        },
                    }}
                    variant="persistent"
                    anchor="left"
                    open={open}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                /* No sidebar on mobile for students */
                user?.role !== 'STUDENT' && (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                            },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                )
            )}

            <Main open={isDesktop && open}>
                {isDesktop && <DrawerHeader />}
                {children}
            </Main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </Box>
    );
};

export default DashboardLayout;
