import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 w-full glass border-b-0 border-white/5"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.5 }}
                            className="bg-gradient-to-tr from-primary-500 to-accent-500 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20"
                        >
                            C
                        </motion.div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all">
                            CodeHub
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 ml-8">
                        {user && (
                            <Link to="/search" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
                                <MagnifyingGlassIcon className="w-4 h-4" />
                                Explore
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300" />
                            </Link>
                        )}
                    </div>

                    {/* Desktop Auth Section */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:border-primary-500/50 transition-colors cursor-pointer"
                                >
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-200">{user.username}</span>
                                </motion.div>

                                <Link
                                    to="/settings"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                    title="Settings"
                                >
                                    <Cog6ToothIcon className="w-5 h-5" />
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                    title="Sign Out"
                                >
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        to="/signup"
                                        className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-sm font-bold py-2 px-5 rounded-lg shadow-lg shadow-primary-500/20 border border-white/10"
                                    >
                                        Sign Up
                                    </Link>
                                </motion.div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-400 hover:text-white p-2"
                        >
                            {isMobileMenuOpen ? (
                                <XMarkIcon className="w-6 h-6" />
                            ) : (
                                <Bars3Icon className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden overflow-hidden glass border-t border-white/10"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-4">
                            {user && (
                                <Link
                                    to="/search"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 text-gray-300 hover:text-white py-2"
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    Explore
                                </Link>
                            )}

                            <div className="border-t border-white/10 pt-4">
                                {user ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600" />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">{user.username}</span>
                                                <span className="text-xs text-gray-400">Pro Member</span>
                                            </div>
                                        </div>
                                        <Link
                                            to="/settings"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 text-gray-300 hover:text-white w-full"
                                        >
                                            <Cog6ToothIcon className="w-5 h-5" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-center w-full py-2 text-gray-300 hover:text-white font-medium"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-center w-full bg-primary-600 text-white py-2 rounded-lg font-bold"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
