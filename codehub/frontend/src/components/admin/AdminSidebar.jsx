import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Squares2X2Icon,
    UsersIcon,
    ServerIcon,
    ShieldCheckIcon,
    Cog6ToothIcon,
    ClipboardDocumentListIcon,
    ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: Squares2X2Icon },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Repositories', path: '/admin/repositories', icon: ServerIcon },
    { name: 'Pull Requests', path: '/admin/pull-requests', icon: ArrowsRightLeftIcon },
    { name: 'Moderation', path: '/admin/reports', icon: ShieldCheckIcon },
    { name: 'Audit Logs', path: '/admin/logs', icon: ClipboardDocumentListIcon },
    { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminSidebar() {
    return (
        <div className="h-full dark:bg-gray-900 bg-white flex flex-col transition-colors duration-200">
            <div className="p-6 border-b dark:border-gray-800 border-gray-200">
                <h1 className="text-xl font-bold dark:text-white text-gray-900 flex items-center gap-2">
                    <span className="text-red-500">🛡️</span> CodeHub Admin
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t dark:border-gray-800 border-gray-200">
                <div className="flex items-center gap-3 px-4 py-3">
                    <img
                        src="https://github.com/identicons/admin.png"
                        alt="Admin"
                        className="w-8 h-8 rounded-full bg-gray-700"
                    />
                    <div>
                        <p className="text-sm font-medium dark:text-white text-gray-900">Administrator</p>
                        <p className="text-xs text-gray-500">Super Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
