import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
    if (socket && socket.connected) {
        return socket;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    socket = io(BACKEND_URL, {
        auth: {
            token
        },
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
