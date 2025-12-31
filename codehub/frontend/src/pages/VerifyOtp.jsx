import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const VerifyOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth(); // We might use this to manually set user if verified, or just redirect
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState('');
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(60);

    // Get userId and email from navigation state
    useEffect(() => {
        if (location.state?.userId) {
            setUserId(location.state.userId);
            setEmail(location.state.email);
        } else {
            // Redirect if accessed directly without state
            navigate('/login');
        }
    }, [location, navigate]);

    // Timer for Resend
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Auto-focus next
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
            setOtp(newOtp.slice(0, 6));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a valid 6-digit code');
            setIsLoading(false);
            return;
        }

        try {
            const { data } = await api.post('/auth/verify-account', {
                userId,
                otp: otpString
            });

            setSuccess('Verification successful! logging you in...');

            // Store token
            localStorage.setItem('token', data.token);
            // Optionally update context if needed, but simpler to reload or navigate
            // Assuming AuthContext reads from localStorage on mount
            window.location.href = '/dashboard';

        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/resend-otp', { email });
            setSuccess('New code sent to your email.');
            setTimer(60);
            setCanResend(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-dark-bg relative overflow-hidden p-4">
            {/* Background Blob */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-dark-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheckIcon className="w-8 h-8 text-primary-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Verify Account</h2>
                    <p className="text-gray-400 text-sm">
                        Enter the 6-digit code sent to <br />
                        <span className="text-white font-medium">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-200 p-3 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-4 h-4" /> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between gap-2 mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-primary-500 focus:bg-white/10 transition-all"
                                value={digit}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                            />
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={handleResend}
                        disabled={!canResend}
                        className={`text-sm flex items-center justify-center gap-2 mx-auto ${canResend
                                ? 'text-primary-400 hover:text-primary-300 cursor-pointer'
                                : 'text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${!canResend && 'animate-spin'}`} />
                        {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyOtp;
