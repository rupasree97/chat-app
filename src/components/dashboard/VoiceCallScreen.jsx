import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

/* ── Video Tile ─────────────────────────────────────────────────── */

const VideoTile = ({ stream, username, avatar, isSpeaking, isMuted, isVideoOn, isLocal }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const initials = username
        ? username.substring(0, 2).toUpperCase()
        : '??';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`
                relative flex flex-col items-center justify-center
                aspect-video bg-gray-800 rounded-lg overflow-hidden
                transition-all duration-300 border-2
                ${isSpeaking ? 'border-green-500' : 'border-transparent hover:border-gray-600'}
            `}
        >
            {/* Video or Avatar */}
            {isVideoOn && stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center z-10 overflow-hidden shadow-md">
                    <Avatar
                        src={avatar}
                        username={username}
                        size="2xl"
                    />
                </div>
            )}

            {/* Overlay for video mode — bottom gradient + name */}
            {isVideoOn && stream && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                    <span className="text-sm font-medium text-white">{username}{isLocal ? ' (You)' : ''}</span>
                </div>
            )}

            {/* Username (non-video mode) */}
            {(!isVideoOn || !stream) && (
                <span className="mt-3 text-sm font-medium text-[#a6b0d6] z-10">
                    {username}{isLocal ? ' (You)' : ''}
                </span>
            )}

            {/* Muted icon overlay */}
            {isMuted && (
                <div className="absolute top-3 right-3 bg-red-500/90 rounded-full p-1.5 z-20">
                    <MicOff size={12} className="text-white" />
                </div>
            )}

            {/* Camera off overlay */}
            {!isVideoOn && (
                <div className="absolute top-3 left-3 bg-[#2a2e47] rounded-full p-1.5 z-20">
                    <VideoOff size={12} className="text-[#6F7AB0]" />
                </div>
            )}
        </motion.div>
    );
};

/* ── Audio Player (hidden) ──────────────────────────────────────── */

const AudioPlayer = ({ stream }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay />;
};

/* ── Control Button ─────────────────────────────────────────────── */

const ControlButton = ({ icon: Icon, label, active, danger, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="group relative flex flex-col items-center gap-1.5"
        title={label}
    >
        <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200
            ${danger
                ? 'bg-[#ea4335] hover:bg-[#d33426] text-white'
                : active
                    ? 'bg-[#3c4043] hover:bg-[#4a4e52] text-white'
                    : 'bg-[#ea4335]/90 hover:bg-[#ea4335] text-white'
            }
        `}>
            <Icon size={20} />
        </div>
        <span className="text-[10px] text-[#9aa0a6] group-hover:text-[#e8eaed] transition-colors">{label}</span>
    </motion.button>
);

/* ── Main VoiceCallScreen ───────────────────────────────────────── */

const VoiceCallScreen = ({
    channelName,
    communityName,
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
    onLeaveCall
}) => {
    // Determine grid columns based on participant count
    const totalParticipants = 1 + peers.length; // self + peers

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#0f1120] relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7C7CFF]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a1d35] bg-[#0f1120]/80 backdrop-blur-sm z-20 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <div>
                        <h2 className="text-white font-semibold text-sm">{channelName || 'Voice Channel'}</h2>
                        <p className="text-[#6F7AB0] text-xs">{communityName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[#6F7AB0]">
                    <Users size={16} />
                    <span className="text-sm font-medium">{totalParticipants}</span>
                </div>
            </div>

            {/* Participants Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 flex flex-col items-center">
                <div className="w-full max-w-7xl grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max pb-24">
                    <AnimatePresence mode="popLayout">
                        {/* Local user tile */}
                        <VideoTile
                            key="local"
                            stream={localStream}
                            username={currentUser?.username}
                            avatar={currentUser?.avatar}
                            isSpeaking={speakingUsers[currentUser?.id]}
                            isMuted={isMuted}
                            isVideoOn={isVideoOn}
                            isLocal={true}
                        />

                        {/* Remote peer tiles */}
                        {peers.map(peer => {
                            const peerState = peerStates[peer.socketId] || {};
                            return (
                                <VideoTile
                                    key={peer.socketId}
                                    stream={remoteStreams[peer.socketId]}
                                    username={peer.username}
                                    avatar={peer.avatar}
                                    isSpeaking={speakingUsers[peer.id]}
                                    isMuted={peerState.isMuted}
                                    isVideoOn={peerState.isVideoOn}
                                    isLocal={false}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50 bg-[#202124] px-6 py-3 rounded-2xl border border-[#3c4043]/50 shadow-xl items-center">
                <ControlButton
                    icon={isMuted ? MicOff : Mic}
                    label={isMuted ? 'Unmute' : 'Mute'}
                    active={!isMuted}
                    onClick={onToggleMute}
                />
                <ControlButton
                    icon={isVideoOn ? Video : VideoOff}
                    label={isVideoOn ? 'Stop Video' : 'Start Video'}
                    active={isVideoOn}
                    onClick={onToggleVideo}
                />
                <ControlButton
                    icon={PhoneOff}
                    label="Leave"
                    danger
                    onClick={onLeaveCall}
                />
            </div>

            {/* Hidden audio elements for remote streams */}
            {Object.entries(remoteStreams).map(([socketId, stream]) => (
                <AudioPlayer key={socketId} stream={stream} />
            ))}
        </div>
    );
};

export default VoiceCallScreen;
