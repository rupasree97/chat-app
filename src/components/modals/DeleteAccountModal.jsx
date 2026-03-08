import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

const DeleteAccountModal = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [understood, setUnderstood] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setUnderstood(false);
            setError('');
            setShowPassword(false);
        }
    }, [isOpen]);

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!understood || !password) return;

        setIsLoading(true);
        setError('');

        try {
            await api.delete('/auth/me', {
                data: { password }
            });

            // Post-deletion flow
            if (socket) {
                socket.disconnect();
            }
            logout();

            // Redirect and clear everything
            navigate('/login', { replace: true });

            // Optional: force reload to clean all caches/React states
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to delete account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
            >
                {/* Backdrop overlay */}
                <div className="absolute inset-0 bg-black/70" onClick={onClose} />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#313338] rounded-xl shadow-2xl border border-[#3f4147] overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="text-[#da373c]" size={24} />
                                Delete Account
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-[#b5bac1] hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-[#da373c]/10 border border-[#da373c]/20 rounded-md p-3 mb-6">
                            <p className="text-sm text-[#f23f43] font-medium leading-relaxed">
                                This action is permanent and cannot be undone. All your messages, servers, and data will be permanently wiped from our servers.
                            </p>
                        </div>

                        <form onSubmit={handleDelete} className="space-y-4">
                            {error && (
                                <div className="text-xs text-[#f23f43] bg-[#f23f43]/10 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">
                                    Confirm Password <span className="text-[#da373c]">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#da373c] border border-[#1e1f22] focus:border-[#da373c] transition-colors pr-10"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                                <div className="flex-shrink-0 mt-0.5 relative flex items-center justify-center w-5 h-5 rounded border border-[#da373c] bg-transparent group-hover:border-[#f23f43] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={understood}
                                        onChange={(e) => setUnderstood(e.target.checked)}
                                        disabled={isLoading}
                                        className="absolute w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {understood && (
                                        <div className="w-3 h-3 bg-[#da373c] rounded-sm" />
                                    )}
                                </div>
                                <span className="text-sm text-[#dbdee1] select-none">
                                    I understand this action cannot be undone.
                                </span>
                            </label>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-[#dbdee1] bg-transparent hover:underline transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!understood || !password || isLoading}
                                    className="px-5 py-2 rounded-md bg-[#da373c] hover:bg-[#a12828] text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default DeleteAccountModal;
