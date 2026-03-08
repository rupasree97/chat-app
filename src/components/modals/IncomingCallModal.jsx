import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { useNotifications, useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const IncomingCallModal = ({ onAccept }) => {
    const { incomingCall, setIncomingCall } = useNotifications();
    const socket = useSocket();
    const navigate = useNavigate();

    // Auto-decline if no response after 30 seconds
    useEffect(() => {
        if (!incomingCall) return;

        const timer = setTimeout(() => {
            handleDecline();
        }, 30000);

        return () => clearTimeout(timer);
    }, [incomingCall]);

    const handleAccept = () => {
        if (!incomingCall || !socket) return;

        socket.emit("call-accepted", { callerSocketId: incomingCall.callerSocketId });

        // Let Dashboard handle the WebRTC join logic
        onAccept(incomingCall.conversationId, incomingCall.callType);

        setIncomingCall(null);
    };

    const handleDecline = () => {
        if (!incomingCall || !socket) return;

        socket.emit("call-declined", { callerSocketId: incomingCall.callerSocketId });
        setIncomingCall(null);
    };

    if (!incomingCall) return null;

    const { caller, callType } = incomingCall;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-[340px] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 relative"
                    style={{ background: 'linear-gradient(160deg, #111b21 0%, #0d1518 60%, #0a1014 100%)' }}
                >
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                            style={{ background: 'radial-gradient(ellipse, rgba(0,168,132,0.1) 0%, transparent 70%)' }} />
                    </div>

                    {/* Ringing Avatar */}
                    <div className="relative flex items-center justify-center mb-6">
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                            className="absolute rounded-full border border-[#00a884]/40"
                            style={{ width: 180, height: 180 }}
                        />
                        <motion.div
                            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.05, 0.25] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.3 }}
                            className="absolute rounded-full border border-[#00a884]/30"
                            style={{ width: 140, height: 140 }}
                        />
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center relative z-10 shadow-xl border-2 border-[#00a884]/30">
                            {caller?.avatar || caller?.profilePicture ? (
                                <img src={caller.avatar || caller.profilePicture} alt={caller.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-semibold text-white text-3xl select-none">{getInitials(caller?.username)}</span>
                            )}
                        </div>
                    </div>

                    {/* Text Info */}
                    <div className="flex flex-col items-center gap-1.5 z-10 text-center mb-10 w-full">
                        <h2 className="text-2xl font-semibold text-white tracking-tight truncate w-full px-2">
                            {caller?.username || 'Unknown Caller'}
                        </h2>
                        <motion.p
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[13px] text-[#00a884] font-medium"
                        >
                            Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...
                        </motion.p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-12 z-10">
                        {/* Decline */}
                        <motion.button
                            onClick={handleDecline}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f02849] hover:bg-[#d4213f] text-white shadow-lg transition-colors"
                            title="Decline"
                        >
                            <PhoneOff size={24} />
                        </motion.button>

                        {/* Accept */}
                        <motion.button
                            onClick={handleAccept}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white shadow-lg transition-colors"
                            title="Accept"
                        >
                            {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default IncomingCallModal;
