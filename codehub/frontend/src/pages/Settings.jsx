import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const Settings = () => {
    const { user, setUser } = useAuth();

    // Steps: 0=Intro, 1=Scan, 2=Verify, 3=Recovery, 4=Success
    const [setupStep, setSetupStep] = useState(0);

    const [secret, setSecret] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);

    const isEnabled = user?.isTwoFactorEnabled;

    const handleStartSetup = async () => {
        try {
            setError('');
            const res = await api.post('/auth/setup-2fa');
            setSecret(res.data.secret);
            setQrCode(res.data.qrcode);
            setSetupStep(1);
        } catch (err) {
            setError('Failed to start setup. Please try again.');
        }
    };

    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyParams = async () => {
        try {
            setError('');
            setIsLoading(true);
            const res = await api.post('/auth/verify-2fa', { token });
            // Success
            setUser({ ...user, isTwoFactorEnabled: true });
            setRecoveryCodes(res.data.recoveryCodes || []);
            setSetupStep(3); // Go to Recovery Codes
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired code. Please try scanning the QR code again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!confirm('Disabling 2FA will reduce your account security. Are you sure you want to continue?')) return;
        try {
            setError('');
            await api.post('/auth/disable-2fa');
            setUser({ ...user, isTwoFactorEnabled: false });
            setSetupStep(0);
            setMessage('Two-Factor Authentication Disabled');
        } catch (err) {
            setError('Error disabling 2FA');
        }
    };

    const handleDownloadCodes = () => {
        if (!recoveryCodes.length) return;
        const element = document.createElement("a");
        const file = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "codehub-recovery-codes.txt";
        document.body.appendChild(element);
        element.click();
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            <div className="max-w-3xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <ShieldCheckIcon className="w-9 h-9 text-green-500" />
                    Security Settings
                </h1>

                <div className="bg-[#161b22] border border-gray-700 rounded-lg p-8 shadow-xl">

                    {/* Header Status */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-700">
                        <div>
                            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {isEnabled
                                    ? "Your account is secured with 2FA."
                                    : "Add an extra layer of security to your account."}
                            </p>
                        </div>
                        <div className={`px-4 py-1 rounded-full text-sm font-medium border ${isEnabled ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="mb-6 bg-green-900/20 border border-green-800 text-green-200 px-4 py-3 rounded flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            {message}
                        </div>
                    )}

                    {/* Logic Flow */}
                    {isEnabled && setupStep === 0 ? (
                        <div>
                            <div className="bg-green-900/10 border border-green-900/50 rounded-lg p-4 mb-6">
                                <h3 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    2FA is Active
                                </h3>
                                <p className="text-sm text-gray-300">
                                    You will be asked for a verification code from your authenticator app each time you log in.
                                </p>
                            </div>
                            <button
                                onClick={handleDisable}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors text-sm"
                            >
                                Disable 2FA
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Step 0: Intro */}
                            {setupStep === 0 && (
                                <div className="space-y-4">
                                    <p className="text-gray-300">
                                        Protect your CodeHub account with an extra layer of security.
                                        After enabling 2FA, you’ll need a verification code from your authenticator app every time you log in.
                                    </p>
                                    <div className="pt-2">
                                        <button
                                            onClick={handleStartSetup}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors"
                                        >
                                            Enable 2FA
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1 & 2: QR and Verify */}
                            {(setupStep === 1 || setupStep === 2) && (
                                <div className="space-y-6">
                                    {/* Prompt 2 */}
                                    <div className="bg-[#0d1117] p-6 rounded-lg border border-gray-700 text-center">
                                        <h3 className="text-lg font-semibold text-white mb-4">Set up your authenticator app</h3>
                                        {qrCode && (
                                            <div className="flex justify-center mb-4">
                                                <div className="bg-white p-2 rounded">
                                                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-gray-400 text-sm mb-2">
                                            Scan the QR code using Google Authenticator, Authy, or Microsoft Authenticator.
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            If you can’t scan the QR code, enter the setup key manually.
                                        </p>
                                        <div className="mt-4 flex flex-col items-center">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Secret Key</span>
                                            <code className="bg-gray-800 px-3 py-1 rounded text-gray-300 font-mono text-sm border border-gray-600 select-all">
                                                {secret}
                                            </code>
                                        </div>
                                    </div>

                                    {/* Prompt 3 */}
                                    <div className="bg-[#0d1117] p-6 rounded-lg border border-gray-700">
                                        <h3 className="text-lg font-semibold text-white mb-4">Verify your authentication code</h3>
                                        <p className="text-sm text-gray-400 mb-4">
                                            Enter the 6-digit code generated by your authenticator app.
                                        </p>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="bg-[#161b22] border border-gray-600 text-white px-4 py-2.5 rounded-md outline-none focus:border-blue-500 w-40 tracking-widest text-center text-lg shadow-inner"
                                                maxLength={6}
                                            />
                                            <button
                                                onClick={handleVerifyParams}
                                                disabled={token.length < 6 || isLoading}
                                                className={`px-6 py-2.5 rounded-md font-medium transition-colors ${token.length < 6 || isLoading ? 'bg-blue-600/50 cursor-not-allowed text-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                            >
                                                {isLoading ? 'Verifying...' : 'Verify'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSetupStep(0)}
                                        className="text-sm text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* Step 3: Recovery Codes */}
                            {setupStep === 3 && (
                                <div className="space-y-6">
                                    <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg flex items-start gap-3">
                                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 shrink-0" />
                                        <div>
                                            <h3 className="text-yellow-400 font-bold mb-1">Save your recovery codes</h3>
                                            <p className="text-yellow-200/80 text-sm">
                                                These recovery codes can be used if you lose access to your authenticator app.
                                                Store these codes in a safe place. <strong>We won’t show them again.</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-lg border border-gray-700 font-mono text-center">
                                        {recoveryCodes.map((code, i) => (
                                            <div key={i} className="bg-gray-800/50 py-1.5 rounded text-gray-300 text-sm tracking-wider select-all">
                                                {code}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={handleDownloadCodes}
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium border border-gray-600"
                                        >
                                            Download Codes
                                        </button>
                                        <button
                                            onClick={() => setSetupStep(4)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                                        >
                                            I have saved them
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Success */}
                            {setupStep === 4 && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 text-green-500 mb-6 border border-green-900/50">
                                        <CheckCircleIcon className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Success!</h2>
                                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                                        Two-Factor Authentication has been successfully enabled on your account.
                                    </p>
                                    <button
                                        onClick={() => setSetupStep(0)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md font-medium"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
