import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, Camera, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────
   Avatar initials helper — never renders "?" or empty
───────────────────────────────────────────────────────────────────────── */
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ src, username, className = '' }) => {
    const [failed, setFailed] = useState(false);
    const initials = getInitials(username);
    return (
        <div className={`rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center flex-shrink-0 ${className}`}>
            {src && !failed ? (
                <img src={src} alt={username} className="w-full h-full object-cover" onError={() => setFailed(true)} />
            ) : (
                <span className="font-semibold text-white select-none">{initials}</span>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────
   Hidden media elements
───────────────────────────────────────────────────────────────────────── */
const VideoEl = ({ stream, isLocal, isSpeakerOn = true, className }) => {
    const ref = useRef(null);
    useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
    if (!stream) return null;
    return <video ref={ref} autoPlay playsInline muted={isLocal || !isSpeakerOn} className={className} />;
};

const AudioEl = ({ stream, isSpeakerOn = true }) => {
    const ref = useRef(null);
    useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
    return <audio ref={ref} autoPlay muted={!isSpeakerOn} />;
};

const useTimer = (active) => {
    const [sec, setSec] = useState(0);
    useEffect(() => {
        if (!active) { setSec(0); return; }
        const id = setInterval(() => setSec(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [active]);
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
};

/* ─────────────────────────────────────────────────────────────────────────
   WhatsApp-style circular control button
───────────────────────────────────────────────────────────────────────── */
const CtrlBtn = ({ icon: Icon, label, danger, active = true, large, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 group"
        title={label}
    >
        <div className={[
            'flex items-center justify-center rounded-full transition-all duration-200 shadow-md',
            large ? 'w-16 h-16' : 'w-12 h-12',
            danger
                ? 'bg-[#f02849] hover:bg-[#d4213f] text-white'
                : active
                    ? 'bg-[#374045] hover:bg-[#4a555c] text-white border border-white/10'
                    : 'bg-[#f02849]/90 hover:bg-[#f02849] text-white',
        ].join(' ')}>
            <Icon className={large ? 'w-7 h-7' : 'w-5 h-5'} />
        </div>
        {label && (
            <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors select-none">{label}</span>
        )}
    </motion.button>
);

/* WhatsApp pill control bar */
const ControlBar = ({ children }) => (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-end gap-6 px-8 py-4 rounded-full bg-[#202c33] border border-white/5 shadow-2xl backdrop-blur-sm">
        {children}
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────────────── */
const DMCallScreen = ({
    callType,
    localStream,
    remoteStreams,
    peers,
    speakingUsers,
    peerStates,
    isMuted,
    isVideoOn,
    currentUser,
    onToggleMute,
    onToggleVideo,
    onLeaveCall,
}) => {
    const remotePeer = peers[0] ?? null;
    const remoteStream = remotePeer ? remoteStreams[remotePeer.socketId] : null;
    const remotePeerState = remotePeer ? (peerStates[remotePeer.socketId] ?? {}) : {};
    const isAudioOnly = callType === 'audio';
    const isConnected = !!remotePeer;
    const isRemoteSpeaking = speakingUsers[remotePeer?.id];
    const isLocalSpeaking = speakingUsers[currentUser?.id];
    const timer = useTimer(isConnected);

    // Local speaker state (mutes incoming audio when false)
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const toggleSpeaker = () => setIsSpeakerOn(prev => !prev);

    /* ══════════════════════════════════════════════════
       AUDIO CALL — WhatsApp Desktop voice call style
    ══════════════════════════════════════════════════ */
    if (isAudioOnly) {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between"
                style={{ background: 'linear-gradient(160deg, #111b21 0%, #0d1518 60%, #0a1014 100%)' }}>

                {/* Subtle ambient glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
                        style={{ background: 'radial-gradient(ellipse, rgba(0,168,132,0.07) 0%, transparent 70%)' }} />
                </div>

                <AnimatePresence mode="wait">
                    {/* ── CALLING state ─────────────────────────── */}
                    {!isConnected ? (
                        <motion.div
                            key="audio-calling"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="flex-1 flex flex-col items-center justify-center gap-6 w-full pb-24"
                        >
                            {/* Pulsing avatar rings */}
                            <div className="relative flex items-center justify-center">
                                {/* Outer ring */}
                                <motion.div
                                    animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0, 0.15] }}
                                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                                    className="absolute rounded-full border border-[#00a884]/40"
                                    style={{ width: 240, height: 240 }}
                                />
                                {/* Mid ring */}
                                <motion.div
                                    animate={{ scale: [1, 1.22, 1], opacity: [0.22, 0.05, 0.22] }}
                                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut', delay: 0.4 }}
                                    className="absolute rounded-full border border-[#00a884]/30"
                                    style={{ width: 196, height: 196 }}
                                />
                                <UserAvatar
                                    src={remotePeer?.avatar}
                                    username={remotePeer?.username ?? 'Connecting...'}
                                    className="w-36 h-36 text-4xl shadow-2xl ring-4 ring-[#00a884]/20"
                                />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <h2 className="text-2xl font-semibold text-white tracking-tight">
                                    {remotePeer?.username ?? 'Connecting...'}
                                </h2>
                                <motion.p
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.8 }}
                                    className="text-sm text-white/50"
                                >
                                    Calling…
                                </motion.p>
                            </div>
                        </motion.div>
                    ) : (
                        /* ── CONNECTED state ───────────────────── */
                        <motion.div
                            key="audio-connected"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 flex flex-col items-center justify-center gap-8 w-full pb-24"
                        >
                            {/* Speaking ring + avatar */}
                            <div className="relative flex items-center justify-center">
                                {/* Breathing ambient rings */}
                                <motion.div
                                    animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.02, 0.1] }}
                                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                                    className="absolute rounded-full"
                                    style={{ width: 260, height: 260, background: 'radial-gradient(circle, rgba(0,168,132,0.15) 0%, transparent 70%)' }}
                                />
                                {/* Speaking indicator */}
                                <AnimatePresence>
                                    {isRemoteSpeaking && (
                                        <motion.div
                                            key="speaking-ring"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute rounded-full border-[3px] border-[#00a884]"
                                            style={{ width: 180, height: 180 }}
                                        />
                                    )}
                                </AnimatePresence>
                                <UserAvatar
                                    src={remotePeer.avatar}
                                    username={remotePeer.username}
                                    className="w-40 h-40 text-5xl shadow-2xl"
                                />
                                {/* Muted badge */}
                                {remotePeerState.isMuted && (
                                    <div className="absolute bottom-1 right-1 bg-[#f02849] rounded-full p-1 shadow-lg">
                                        <MicOff size={12} className="text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <h2 className="text-2xl font-semibold text-white tracking-tight">
                                    {remotePeer.username}
                                </h2>
                                <span className="text-sm tabular-nums text-[#00a884] font-medium">
                                    {timer}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── WhatsApp-style bottom pill control bar ── */}
                <ControlBar>
                    <CtrlBtn
                        icon={isMuted ? MicOff : Mic}
                        label={isMuted ? 'Unmute' : 'Mute'}
                        active={!isMuted}
                        onClick={onToggleMute}
                    />
                    <CtrlBtn
                        icon={isSpeakerOn ? Volume2 : VolumeX}
                        label={isSpeakerOn ? 'Speaker' : 'Muted'}
                        active={isSpeakerOn}
                        onClick={toggleSpeaker}
                    />
                    <CtrlBtn icon={PhoneOff} label="End" danger onClick={onLeaveCall} />
                </ControlBar>

                {remoteStream && <AudioEl stream={remoteStream} isSpeakerOn={isSpeakerOn} />}
            </div>
        );
    }

    /* ══════════════════════════════════════════════════
       VIDEO CALL — WhatsApp Desktop video call style
    ══════════════════════════════════════════════════ */
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0d1214]">

            {/* ── Remote video / camera-off background ── */}
            <AnimatePresence>
                {remoteStream && remotePeerState.isVideoOn ? (
                    /* Remote video full bleed */
                    <motion.div
                        key="remote-video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                    >
                        <VideoEl
                            stream={remoteStream}
                            isLocal={false}
                            isSpeakerOn={isSpeakerOn}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Subtle vignette */}
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)' }} />
                    </motion.div>
                ) : (
                    /* Camera off / waiting state */
                    <motion.div
                        key="remote-off"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                        style={{ background: 'linear-gradient(160deg, #111b21 0%, #0a1014 100%)' }}
                    >
                        {/* Ambient glow */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20"
                                style={{ background: 'radial-gradient(ellipse, rgba(0,168,132,0.3) 0%, transparent 70%)' }} />
                        </div>

                        {/* Pulsing ring when waiting, speaking ring when connected */}
                        <div className="relative flex items-center justify-center z-10">
                            {!remotePeer ? (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.35, 1], opacity: [0.12, 0, 0.12] }}
                                        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                                        className="absolute rounded-full border border-[#00a884]/30"
                                        style={{ width: 220, height: 220 }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.04, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut', delay: 0.5 }}
                                        className="absolute rounded-full border border-[#00a884]/20"
                                        style={{ width: 176, height: 176 }}
                                    />
                                </>
                            ) : (
                                <AnimatePresence>
                                    {isRemoteSpeaking && (
                                        <motion.div
                                            key="video-speaking"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute rounded-full border-[3px] border-[#00a884]"
                                            style={{ width: 172, height: 172 }}
                                        />
                                    )}
                                </AnimatePresence>
                            )}
                            <UserAvatar
                                src={remotePeer?.avatar}
                                username={remotePeer?.username ?? 'Connecting...'}
                                className="w-36 h-36 text-4xl shadow-2xl"
                            />
                            {remotePeerState.isMuted && (
                                <div className="absolute bottom-0.5 right-0.5 bg-[#f02849] rounded-full p-1.5 shadow-lg z-20">
                                    <MicOff size={11} className="text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-1 z-10">
                            <p className="text-xl font-semibold text-white tracking-tight">
                                {remotePeer?.username ?? 'Connecting...'}
                            </p>
                            <p className="text-sm text-white/45">
                                {!remotePeer ? (
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                                        Calling…
                                    </motion.span>
                                ) : 'Camera is off'}
                            </p>
                            {isConnected && (
                                <span className="text-sm tabular-nums text-[#00a884] font-medium mt-0.5">{timer}</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Remote name + timer chip (top-left, when video on) ── */}
            {remotePeer && remotePeerState.isVideoOn && (
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm text-white font-medium shadow-lg">
                    {remotePeerState.isMuted && <MicOff size={12} className="text-[#f02849]" />}
                    <span>{remotePeer.username}</span>
                    {isConnected && <span className="text-[#00a884] tabular-nums text-xs ml-1">{timer}</span>}
                </div>
            )}

            {/* ── Local self-view PiP ── */}
            <AnimatePresence>
                {localStream && (
                    <motion.div
                        key="pip"
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        drag
                        dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
                        className={[
                            'absolute bottom-28 right-5 z-30 cursor-grab active:cursor-grabbing',
                            'w-[120px] h-[170px] md:w-[150px] md:h-[210px] lg:w-[160px] lg:h-[225px]',
                            'rounded-2xl overflow-hidden bg-[#1a2126] shadow-2xl border border-white/10',
                            'hover:border-white/20 transition-[border-color] duration-200',
                            isLocalSpeaking ? 'ring-2 ring-[#00a884]' : '',
                        ].join(' ')}
                    >
                        {isVideoOn ? (
                            <VideoEl
                                stream={localStream}
                                isLocal
                                className="w-full h-full object-cover -scale-x-100"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#1a2126]">
                                <UserAvatar
                                    src={currentUser?.avatar}
                                    username={currentUser?.username}
                                    className="w-14 h-14 text-xl"
                                />
                                <CameraOff size={13} className="text-white/30" />
                            </div>
                        )}

                        {/* "You" label + mute indicator */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                            {isMuted && <MicOff size={9} className="text-[#f02849]" />}
                            <span className="text-[10px] text-white/80 font-medium">You</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── WhatsApp-style bottom pill control bar ── */}
            <ControlBar>
                <CtrlBtn
                    icon={isMuted ? MicOff : Mic}
                    label={isMuted ? 'Unmute' : 'Mute'}
                    active={!isMuted}
                    onClick={onToggleMute}
                />
                <CtrlBtn
                    icon={isVideoOn ? Camera : CameraOff}
                    label={isVideoOn ? 'Camera' : 'Camera'}
                    active={isVideoOn}
                    onClick={onToggleVideo}
                />
                <CtrlBtn
                    icon={isSpeakerOn ? Volume2 : VolumeX}
                    label={isSpeakerOn ? 'Speaker' : 'Muted'}
                    active={isSpeakerOn}
                    onClick={toggleSpeaker}
                />
                <CtrlBtn icon={PhoneOff} label="End" danger onClick={onLeaveCall} />
            </ControlBar>

            {remoteStream && <AudioEl stream={remoteStream} isSpeakerOn={isSpeakerOn} />}
        </div>
    );
};

export default DMCallScreen;
