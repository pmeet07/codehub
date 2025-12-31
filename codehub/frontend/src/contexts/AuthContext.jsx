import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await api.get('/auth/user');
                setUser(res.data);
            } catch (err) {
                console.error("Auth check failed", err);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
        }
        return res.data;
    };

    const verifyTwoFactorLogin = async (userId, token, isRecovery) => {
        const res = await api.post('/auth/login-2fa', { userId, token, isRecovery });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
        }
        return res.data;
    };

    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
        }
        return res.data;
    };

    const googleLogin = async (token) => {
        const res = await api.post('/auth/google', { token });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
        }
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, googleLogin, logout, verifyTwoFactorLogin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
