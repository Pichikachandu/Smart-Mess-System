import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            try {
                // Determine user details from stored data if possible or just use token decoding
                // Ideally we might want to fetch profile, but for now use stored user info
                const userData = JSON.parse(sessionStorage.getItem('userInfo'));
                if (userData) {
                    setUser(userData);
                }
            } catch (error) {
                console.error('Auth restore failed', error);
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userInfo');
            }
        }
        setLoading(false);
    }, []);

    const login = async (userId, password) => {
        const { data } = await api.post('/auth/login', { userId, password });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
