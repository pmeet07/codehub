import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CodeBracketIcon, SparklesIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 6-Digit OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const [step, setStep] = useState(1); // 1: Login, 2: 2FA
    const [tempUserId, setTempUserId] = useState(null);
    const [twoFactorMethod, setTwoFactorMethod] = useState('authenticator'); // 'authenticator' or 'email'
    const [targetEmail, setTargetEmail] = useState('');
    const [isRecovery, setIsRecovery] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Resend Timer State
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { login, googleLogin, setUser } = useAuth();
    const navigate = useNavigate();

    // Timer Logic
    useEffect(() => {
        if (step === 2 && timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        } else if (timer === 0) {
            setCanResend(true);
        }
    }, [timer, step]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (step === 1) {
                const data = await login(email, password);
                if (data.message === '2FA required') {
                    setStep(2);
                    setTempUserId(data.userId);
                    setTwoFactorMethod(data.method || 'authenticator');
                    if (data.email) setTargetEmail(data.email);

                    // Reset Timer on Step Change
                    setTimer(60);
                    setCanResend(false);

                    if (data.devOtp) {
                        // For Dev Mode, Fill the OTP
                        const otpArray = data.devOtp.toString().split('');
                        setOtp([...otpArray, ...Array(6 - otpArray.length).fill('')]);
                        setError(`DEV MODE: Code auto-filled (${data.devOtp})`);
                    } else {
                        setError('Code sent to your email!');
                        setOtp(['', '', '', '', '', '']);
                    }

                    setIsLoading(false);
                    return;
                }

                if (data.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // UNIVERSAL VERIFY
                const code = otp.join('');
                if (code.length !== 6) {
                    setError('Please enter a 6-digit code');
                    setIsLoading(false);
                    return;
                }

                const { data } = await api.post('/auth/verify-login-any', {
                    userId: tempUserId,
                    token: code
                });

                if (data.token) {
                    localStorage.setItem('token', data.token);
                    setUser(data.user);

                    if (data.user.role === 'admin') {
                        navigate('/admin/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (err) {
            if (err.response?.data?.requiresVerification) {
                navigate('/verify-otp', {
                    state: {
                        userId: err.response.data.userId,
                        email: err.response.data.email
                    }
                });
                return;
            }
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            if (step !== 1 || error) setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setIsLoading(true);
            const data = await googleLogin(credentialResponse.credential);

            if (data.message === '2FA required') {
                setTempUserId(data.userId);
                setTwoFactorMethod(data.method || 'authenticator');
                if (data.email) setTargetEmail(data.email);
                setStep(2);

                // Reset Timer on Step Change
                setTimer(60);
                setCanResend(false);

                if (data.devOtp) {
                    const otpArray = data.devOtp.toString().split('');
                    setOtp([...otpArray, ...Array(6 - otpArray.length).fill('')]);
                    if (data.emailConfigured === false) {
                        setError(`⚠ Email Service Not Configured! Code: ${data.devOtp}`);
                    } else {
                        setError(`DEV MODE: Code auto-filled (${data.devOtp})`);
                    }
                }
                setIsLoading(false);
                return;
            }

            if (data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
            setIsLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Google Login Failed");
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google Login Failed");
    };

    const handleResend = async () => {
        setError('');
        try {
            const { data } = await api.post('/auth/resend-login-otp', { email: targetEmail || email });

            // Re-populate dev OTP if returned (for dev mode)
            if (data.devOtp) {
                const otpArray = data.devOtp.toString().split('');
                setOtp([...otpArray, ...Array(6 - otpArray.length).fill('')]);
                setError(`DEV MODE: New Code (${data.devOtp})`);
            } else {
                setError('New code sent to your email!');
            }

            setTimer(60);
            setCanResend(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code');
        }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-dark-bg relative overflow-hidden p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-4xl grid md:grid-cols-2 bg-dark-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
                {/* Left Side - Hero */}
                <div className="hidden md:flex flex-col justify-center items-center p-12 relative bg-gradient-to-br from-gray-900 via-dark-bg to-primary-900/40 border-r border-white/5">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                    <motion.div
                        key={step}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="z-10 text-center"
                    >
                        <motion.div
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            className="w-24 h-24 bg-gradient-to-tr from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30 ring-1 ring-white/20"
                        >
                            {step === 1 ? (
                                <CodeBracketIcon className="w-12 h-12 text-white" />
                            ) : (
                                <LockClosedIcon className="w-12 h-12 text-white" />
                            )}
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-4">
                            {step === 1 ? 'Welcome Back' : 'Two-Factor Auth'}
                        </h1>
                        <p className="text-gray-400 font-light text-lg leading-relaxed">
                            {step === 1
                                ? <>Collaborate, manage, and deploy your code with <span className="text-primary-400 font-semibold">CodeHub</span>.</>
                                : <>Enter the verification code from your {twoFactorMethod === 'email' ? 'email address' : 'authenticator app (or backup email)'}.</>
                            }
                        </p>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center bg-dark-card/40">
                    <div className="text-center md:text-left mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            {step === 1 ? 'Sign In' : 'Verification'}
                        </h2>
                        <p className="text-sm text-gray-400 mt-2">
                            {step === 1 ? 'Enter your credentials to access your account.' : 'Secure your account with 2FA.'}
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"
                        >
                            <span className="bg-red-500/20 p-1 rounded-full flex-shrink-0">
                                <SparklesIcon className="w-4 h-4" />
                            </span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 ? (
                            <>
                                {/* Email and Password fields */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <EnvelopeIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            className="glass-input !pl-12 w-full text-white"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                                    <div className="relative group">
                                        <LockClosedIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            className="glass-input !pl-12 w-full text-white"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="inline-flex p-3 rounded-full bg-blue-500/10 mb-3">
                                        <ShieldCheckIcon className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Security Check</h3>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Enter the verification code sent to your {twoFactorMethod === 'email' ? 'email address' : 'Authenticator app (a backup code was also emailed)'}.
                                    </p>

                                    {/* DEV MODE OTP DISPLAY */}
                                    {error && error.includes('DEV MODE') && (
                                        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg animate-pulse">
                                            <p className="text-yellow-200 font-mono text-lg font-bold">
                                                {error.replace('DEV MODE: Code auto-filled ', 'CODE: ')}
                                            </p>
                                            <p className="text-xs text-yellow-400/70 mt-1 uppercase tracking-wider">Test Mode Active</p>
                                        </div>
                                    )}
                                </div>

                                {/* Professional 6-Digit OTP Input */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength="1"
                                            className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-primary-500 focus:bg-white/10 transition-all"
                                            value={digit}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (isNaN(val)) return;
                                                const newOtp = [...otp];
                                                newOtp[index] = val;
                                                setOtp(newOtp);
                                                if (val && index < 5) document.getElementById(`otp-${index + 1}`).focus();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                                    document.getElementById(`otp-${index - 1}`).focus();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pastedData = e.clipboardData.getData('text').slice(0, 6);
                                                if (/^\d+$/.test(pastedData)) {
                                                    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
                                                    setOtp(newOtp.slice(0, 6));
                                                }
                                            }}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>

                                {/* Resend Logic */}
                                <div className="text-center mb-6">
                                    <button
                                        type="button"
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

                                <div className="text-center">
                                    {twoFactorMethod !== 'email' && (
                                        <button
                                            type="button"
                                            onClick={() => { setIsRecovery(!isRecovery); setOtp(['', '', '', '', '', '']); setError(''); }}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            {isRecovery ? 'Use Authenticator Code' : 'Use a recovery code'}
                                        </button>
                                    )}
                                </div>
                                {/* Trust device checkbox functionality pending backend implementation, added for UI completeness */}
                                {!isRecovery && (
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <input type="checkbox" id="trust" className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                                        <label htmlFor="trust" className="text-sm text-gray-400">Trust this device for 30 days</label>
                                    </div>
                                )}
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group transition-all"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{step === 1 ? 'Sign In' : 'Verify'}</span>
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#0d1117] text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center w-full overflow-hidden">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="filled_black"
                                shape="pill"
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary-400 font-medium hover:text-primary-300 transition-colors hover:underline decoration-primary-400/30 underline-offset-4">
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
