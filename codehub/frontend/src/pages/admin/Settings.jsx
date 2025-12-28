import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        allowRegistration: true,
        maintenanceMode: false,
        maxRepoSizeMB: 500
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/admin/settings').then(res => setSettings(res.data));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.put('/admin/settings', settings);
            alert('Settings saved successfully');
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">System Settings</h1>

            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6 shadow-sm">

                {/* Registration Control */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">New User Registration</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow new users to sign up to the platform.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="allowRegistration"
                            checked={settings.allowRegistration}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Maintenance Mode</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Disable all write operations and show maintenance banner.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={settings.maintenanceMode}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Max Repo Size */}
                <div>
                    <label className="block font-bold text-gray-900 dark:text-white mb-2">Max Repository Size (MB)</label>
                    <input
                        type="number"
                        name="maxRepoSizeMB"
                        value={settings.maxRepoSizeMB}
                        onChange={handleChange}
                        className="bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum allowed size for a single repository push.</p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={save}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
}
