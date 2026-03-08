import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const RemoveMemberModal = ({ isOpen, onClose, onConfirm, memberName, isRemoving }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-full max-w-md bg-[#313338] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 pb-4">
                            <h2 className="text-xl font-bold text-[#f2f3f5] mb-2 flex items-center gap-2">
                                Remove '{memberName}'
                            </h2>
                            <p className="text-[#dbdee1] leading-relaxed text-[15px]">
                                Are you sure you want to remove <strong className="text-white font-semibold">@{memberName}</strong> from the server? They will be able to rejoin if they receive a new invite.
                            </p>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 bg-[#2b2d31] flex flex-row-reverse items-center gap-3">
                            <button
                                onClick={onConfirm}
                                disabled={isRemoving}
                                className="px-6 py-2.5 bg-[#da373c] hover:bg-[#c93338] active:bg-[#a1282d] text-white rounded-[3px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                            >
                                {isRemoving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Remove"
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isRemoving}
                                className="px-6 py-2.5 text-[#dbdee1] hover:underline rounded-[3px] font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RemoveMemberModal;
