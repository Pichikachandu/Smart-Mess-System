import React, { useState } from 'react';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction, 
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const MobileBottomNav = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [value, setValue] = useState(0);

  if (!isMobile || user?.role !== 'STUDENT') {
    return null;
  }

  const handleNavigation = (newValue, path) => {
    setValue(newValue);
    navigate(path);
  };

  const handleHistoryClick = () => {
    const historyButton = document.querySelector('[data-testid="history-button"]');
    if (historyButton) {
      historyButton.click();
    }
  };

  const handleMyTicketClick = () => {
    // Check if there's an active QR token first
    const qrCodeArea = document.querySelector('[data-testid="qr-code-area"]');
    if (qrCodeArea) {
      const qrData = qrCodeArea.getAttribute('data-qr-active');
      if (qrData === 'true' || qrCodeArea.querySelector('canvas')) {
        // If active QR exists, open the active token dialog
        qrCodeArea.click();
        return;
      }
    }
    
    // If no active QR, open the most recent ticket from history
    const historyButton = document.querySelector('[data-testid="history-button"]');
    if (historyButton) {
      historyButton.click();
      
      // Wait a moment for history dialog to open, then click the first ticket
      setTimeout(() => {
        const firstTicketButton = document.querySelector('[data-testid="ticket-button-0"]');
        if (firstTicketButton) {
          firstTicketButton.click();
        }
      }, 500);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000,
      display: { xs: 'block', md: 'none' }
    }}>
      <BottomNavigation
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        sx={{
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
            '& .MuiSvgIcon-root': {
              fontSize: '1.5rem'
            }
          }
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<HomeIcon />}
          onClick={() => handleNavigation(0, '/student')}
          sx={{
            color: location.pathname === '/student' ? 'primary.main' : 'text.secondary'
          }}
        />
        <BottomNavigationAction
          label="My Ticket"
          icon={<ConfirmationNumberIcon />}
          onClick={handleMyTicketClick}
          sx={{
            color: 'text.secondary'
          }}
        />
        <BottomNavigationAction
          label="History"
          icon={<HistoryIcon />}
          onClick={handleHistoryClick}
          sx={{
            color: 'text.secondary'
          }}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<AccountCircleIcon />}
          onClick={() => handleNavigation(3, '/student/profile')}
          sx={{
            color: location.pathname === '/student/profile' ? 'primary.main' : 'text.secondary'
          }}
        />
      </BottomNavigation>

      {/* Floating Logout Button */}
      <Fab
        size="small"
        color="error"
        sx={{
          position: 'absolute',
          top: -20,
          right: 16,
          width: 40,
          height: 40,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }
        }}
        onClick={handleLogout}
      >
        <LogoutIcon fontSize="small" />
      </Fab>
    </Box>
  );
};

export default MobileBottomNav;
