import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CodeBracketIcon, SparklesIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await login(email, password);
            if (data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setIsLoading(true);
            const data = await googleLogin(credentialResponse.credential);
            if (data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || "Google Login Failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google Login Failed");
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
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="z-10 text-center"
                    >
                        <motion.div
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            className="w-24 h-24 bg-gradient-to-tr from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30 ring-1 ring-white/20"
                        >
                            <CodeBracketIcon className="w-12 h-12 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-4">Welcome Back</h1>
                        <p className="text-gray-400 font-light text-lg leading-relaxed">
                            Collaborate, manage, and deploy your code with <span className="text-primary-400 font-semibold">CodeHub</span>.
                        </p>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center bg-dark-card/40">
                    <div className="text-center md:text-left mb-8">
                        <h2 className="text-2xl font-bold text-white">Sign In</h2>
                        <p className="text-sm text-gray-400 mt-2">Enter your credentials to access your account.</p>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                            <div className="relative group">
                                <EnvelopeIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="glass-input !pl-12 w-full text-white"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm ml-1">
                                <label className="font-medium text-gray-300">Password</label>
                                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors hover:underline decoration-primary-400/30">Forgot?</a>
                            </div>
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
                                    <span>Sign In</span>
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
