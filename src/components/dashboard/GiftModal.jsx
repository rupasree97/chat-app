import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';

export const AVAILABLE_GIFTS = [
    { id: 'gift-box', name: 'Mystery Box', emoji: '🎁', color: '#FF73FA', bg: 'bg-[#FF73FA]/20', border: 'border-[#FF73FA]/50' },
    { id: 'sparkles', name: 'Magic Sparkles', emoji: '✨', color: '#FEE75C', bg: 'bg-[#FEE75C]/20', border: 'border-[#FEE75C]/50' },
    { id: 'heart', name: 'Sending Love', emoji: '💖', color: '#ED4245', bg: 'bg-[#ED4245]/20', border: 'border-[#ED4245]/50' },
    { id: 'star', name: 'Super Star', emoji: '⭐', color: '#F1C40F', bg: 'bg-[#F1C40F]/20', border: 'border-[#F1C40F]/50' },
    { id: 'pizza', name: 'Pizza Party', emoji: '🍕', color: '#E67E22', bg: 'bg-[#E67E22]/20', border: 'border-[#E67E22]/50' },
    { id: 'coffee', name: 'Coffee Break', emoji: '☕', color: '#8B4513', bg: 'bg-[#8B4513]/20', border: 'border-[#8B4513]/50' },
    { id: 'music', name: 'Good Vibes', emoji: '🎵', color: '#9B59B6', bg: 'bg-[#9B59B6]/20', border: 'border-[#9B59B6]/50' },
    { id: 'zap', name: 'High Energy', emoji: '⚡', color: '#F39C12', bg: 'bg-[#F39C12]/20', border: 'border-[#F39C12]/50' },
    { id: 'flame', name: 'On Fire', emoji: '🔥', color: '#E74C3C', bg: 'bg-[#E74C3C]/20', border: 'border-[#E74C3C]/50' },
    { id: 'crown', name: 'Crown', emoji: '👑', color: '#F1C40F', bg: 'bg-[#F1C40F]/20', border: 'border-[#F1C40F]/50' },
    { id: 'diamond', name: 'Diamond Bearer', emoji: '💎', color: '#00FFFF', bg: 'bg-[#00FFFF]/20', border: 'border-[#00FFFF]/50' },
    { id: 'rocket', name: 'To The Moon', emoji: '🌙', color: '#3498DB', bg: 'bg-[#3498DB]/20', border: 'border-[#3498DB]/50' },
];

const GiftModal = ({ isOpen, onClose, onSelectGift }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-[#313338] rounded-xl shadow-2xl w-full max-w-2xl border border-[#1e1f22] overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[#1e1f22] bg-[#2b2d31] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                                <Gift size={22} className="text-[#5865F2]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#f2f3f5]">Send a Gift</h2>
                                <p className="text-sm text-[#b5bac1]">Choose a specialized animated gift to send in the chat!</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-transparent hover:bg-[#404249] text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Gift Grid */}
                    <div className="p-6 overflow-y-auto no-scrollbar custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {AVAILABLE_GIFTS.map((gift, index) => {
                                return (
                                    <motion.button
                                        key={gift.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            onSelectGift(gift);
                                            onClose();
                                        }}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${gift.bg} ${gift.border} hover:shadow-lg hover:shadow-[${gift.color}]/20`}
                                        style={{ borderColor: 'transparent' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = gift.color;
                                            e.currentTarget.style.boxShadow = `0 4px 20px ${gift.color}33`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div className="relative mb-3 flex items-center justify-center w-12 h-12">
                                            <span className="text-4xl drop-shadow-md select-none">{gift.emoji}</span>
                                            {/* Sparkle effects on hover target */}
                                            <motion.div
                                                className="absolute inset-0 bg-white/20 rounded-full mix-blend-overlay"
                                                initial={{ scale: 0, opacity: 0 }}
                                                whileHover={{ scale: 1.5, opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <span className="text-[13px] font-bold text-[#f2f3f5] text-center mt-1">{gift.name}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#2b2d31] border-t border-[#1e1f22] text-center shrink-0">
                        <p className="text-xs text-[#949ba4]">Gifts are purely decorative and sent instantly to the chat.</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GiftModal;
