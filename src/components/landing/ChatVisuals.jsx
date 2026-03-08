import React from 'react';
import { motion } from 'framer-motion';

const ChatVisuals = () => {
    // Floating animation variants
    const float = (delay = 0) => ({
        y: [0, -15, 0],
        rotate: [0, 1, -1, 0],
        transition: {
            duration: 6,
            delay: delay,
            repeat: Infinity,
            ease: "easeInOut"
        }
    });

    return (
        <div className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center perspective-[1000px]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#5865F2]/20 to-[#00f3ff]/10 blur-[80px] rounded-full opacity-60"></div>

            {/* Main Desktop Interface */}
            <motion.div
                animate={float(0)}
                className="relative w-[90%] md:w-[600px] h-[350px] md:h-[400px] bg-[#1e2330]/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-10"
            >
                {/* Header */}
                <div className="h-10 bg-[#151921] flex items-center px-4 gap-2 border-b border-white/5">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="w-32 h-4 rounded-full bg-white/5 ml-4"></div>
                </div>

                {/* Body */}
                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-16 bg-[#11141b] flex flex-col items-center py-4 gap-3 border-r border-white/5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-[12px] bg-white/10 hover:bg-[#5865F2] hover:rounded-[8px] transition-all cursor-pointer"></div>
                        ))}
                    </div>
                    {/* Chat Area */}
                    <div className="flex-1 p-4 flex flex-col justify-end gap-3 bg-[#1e2330]/50">
                        {/* Messages */}
                        {[1, 2, 3].map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                                className="flex gap-3 items-start"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f3ff] to-[#5865F2] flex-shrink-0"></div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-3 rounded bg-white/20"></div>
                                        <div className="w-8 h-2 rounded bg-white/10"></div>
                                    </div>
                                    <div className={`h-8 rounded p-2 text-xs text-gray-300 flex items-center ${i === 2 ? 'bg-[#5865F2]/20 border border-[#5865F2]/30' : 'bg-white/5'}`}>
                                        <div className="w-32 h-2 rounded bg-white/20"></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {/* User List */}
                    <div className="w-40 bg-[#151921] border-l border-white/5 hidden sm:flex flex-col p-3 gap-2">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Online — 3</div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2 opacity-80 hover:opacity-100">
                                <div className="w-6 h-6 rounded-full bg-gray-600 relative">
                                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#151921]"></div>
                                </div>
                                <div className="w-16 h-3 rounded bg-white/10"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Floating Phone */}
            <motion.div
                animate={float(1)}
                className="absolute -right-4 md:-right-10 bottom-0 md:bottom-10 w-[180px] md:w-[220px] h-[350px] md:h-[400px] bg-[#0a0e17] rounded-[30px] border-4 border-[#1e2330] shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-20 overflow-hidden flex flex-col"
            >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1e2330] rounded-b-xl z-30"></div>

                {/* Voice Call UI */}
                <div className="flex-1 bg-gradient-to-b from-[#1e2330] to-[#0a0e17] flex flex-col items-center justify-center p-4 relative">
                    <div className="absolute top-4 left-4 text-xs text-white/50">12:30</div>

                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ff0099] to-[#00f3ff] p-[2px]">
                            <div className="w-full h-full rounded-full bg-[#0a0e17] flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-gray-700"></div>
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#5865F2] rounded-full flex items-center justify-center text-white text-[10px]">🎙️</div>
                    </div>

                    <div className="mt-4 text-center">
                        <div className="h-4 w-24 bg-white/20 rounded mx-auto mb-2"></div>
                        <div className="h-3 w-16 bg-white/10 rounded mx-auto"></div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">🎤</div>
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">📞</div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">🔊</div>
                    </div>
                </div>
            </motion.div>

            {/* Floating Elements (Decorations) */}
            <motion.div
                animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 -left-10 w-16 h-16 bg-gradient-to-br from-[#5865F2] to-[#00f3ff] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(88,101,242,0.6)] z-20"
            >
                <span className="text-3xl">🎮</span>
            </motion.div>

            <motion.div
                animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-20 -left-4 w-12 h-12 bg-[#1e2330] border border-white/20 rounded-full flex items-center justify-center z-0"
            >
                <span className="text-xl">💬</span>
            </motion.div>
        </div>
    );
};

export default ChatVisuals;
