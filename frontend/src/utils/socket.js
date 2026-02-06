import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
    if (socket && socket.connected) {
        return socket;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Extract the base domain from the URL (removes /api or any trailing slashes)
    const socketUrl = BACKEND_URL.includes('/api')
        ? BACKEND_URL.split('/api')[0]
        : BACKEND_URL.replace(/\/$/, "");

    console.log('🔌 Attempting Socket connection to:', socketUrl);
    console.log('📍 With path:', '/socket.io');

    socket = io(socketUrl, {
        auth: {
            token
        },
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        secure: socketUrl.startsWith('https'),
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        autoConnect: true
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export default { initializeSocket, getSocket, disconnectSocket };
