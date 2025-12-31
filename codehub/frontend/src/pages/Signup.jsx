import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, RocketLaunchIcon, LockClosedIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await register(username, email, password);
            if (data.requiresVerification) {
                navigate('/verify-otp', { state: { userId: data.userId, email: data.email } });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-dark-bg relative overflow-hidden p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-5xl grid md:grid-cols-2 bg-dark-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
                {/* Left Side - Hero */}
                <div className="hidden md:flex flex-col justify-between p-12 relative bg-gradient-to-br from-primary-900/40 via-dark-bg to-accent-900/40">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="z-10"
                    >
                        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-2 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <RocketLaunchIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Future</span>
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Join millions of developers building widely, innovating rapidly, and shipping securely.
                        </p>
                    </motion.div>

                    <div className="z-10 mt-12 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                            <h3 className="text-2xl font-bold text-white mb-1">10M+</h3>
                            <p className="text-sm text-gray-400">Developers</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                            <h3 className="text-2xl font-bold text-white mb-1">100M+</h3>
                            <p className="text-sm text-gray-400">Repositories</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center bg-dark-card/40">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-gray-400">Enter your details to get started.</p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"
                        >
                            <span className="bg-red-500/20 p-1 rounded-full"><SparklesIcon className="w-4 h-4" /></span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="glass-input !pl-12 w-full text-white"
                                    placeholder="monalisa"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
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

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 transition-all"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign Up</span>
                                    <SparklesIcon className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-400 font-medium hover:text-primary-300 transition-colors hover:underline decoration-primary-400/30 underline-offset-4">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
