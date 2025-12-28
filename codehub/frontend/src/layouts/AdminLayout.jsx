import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminLayout() {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen dark:bg-black bg-gray-50 dark:text-white text-gray-900 font-sans transition-colors duration-200">
            {/* Left Sidebar */}
            <div className="w-64 border-r dark:border-gray-800 border-gray-200 flex-shrink-0 dark:bg-black bg-white">
                <AdminSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Bar (Optional specific admin search/notifications) */}
                <header className="h-16 border-b dark:border-gray-800 border-gray-200 dark:bg-gray-900 bg-white flex items-center px-8 justify-between">
                    <h2 className="font-semibold dark:text-gray-200 text-gray-800">Admin Panel</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.75 9.75 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-gray-100 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                        >
                            Log Out
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8 dark:bg-[#0d1117] bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
