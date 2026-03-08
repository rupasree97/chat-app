import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';
import ServerSidebar from '../components/dashboard/ServerSidebar';
import ChannelSidebar from '../components/dashboard/ChannelSidebar';
import CreateCommunityModal from '../components/modals/CreateCommunityModal';
import SettingsModal from '../components/modals/SettingsModal';
import WelcomePanel from '../components/dashboard/WelcomePanel';
import UserControls from '../components/dashboard/UserControls';
import ChatArea from '../components/dashboard/ChatArea';
import VoiceCallScreen from '../components/dashboard/VoiceCallScreen';
import DMCallScreen from '../components/dashboard/DMCallScreen';
import DMSidebar from '../components/dashboard/DMSidebar';
import FriendsPage from '../components/dashboard/FriendsPage';
import DMChatArea from '../components/dashboard/DMChatArea';
import IncomingCallModal from '../components/modals/IncomingCallModal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

const Dashboard = () => {
    const { serverId, channelId } = useParams();

    // Add debugging logs for Phase 2 Param Validation
    console.log("[Dashboard] Server:", serverId);
    console.log("[Dashboard] Channel:", channelId);

    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeVoiceChannelId, setActiveVoiceChannelId] = useState(null);
    const [activeCallType, setActiveCallType] = useState('video'); // 'audio' or 'video'
    const [isServerDrawerOpen, setIsServerDrawerOpen] = useState(false);
    const [isChannelDrawerOpen, setIsChannelDrawerOpen] = useState(false);

    const { communities, loading: dataLoading } = useData();
    const { currentUser } = useAuth();

    const community = React.useMemo(() => communities.find(c => c.id === serverId), [communities, serverId]);
    const voiceChannel = community?.channels.find(c => c.id === activeVoiceChannelId);

    // Protect against stale route IDs or deleted communities.
    // Wait until communities are FULLY loaded (not empty). If they're loaded
    // and the serverId still isn't found, then we are legitimately on a bad URL.
    useEffect(() => {
        if (!dataLoading && communities.length > 0 && serverId && serverId !== '@me' && !community) {
            navigate('/dashboard', { replace: true });
        }
    }, [serverId, community, dataLoading, communities.length, navigate]);

    // Check for Stripe Checkout Redirects
    const location = useLocation();
    useEffect(() => {
        const query = new URLSearchParams(location.search);

        if (query.get('nitro_success')) {
            toast.success("Payment Received! Activating Nitro features...");
            setShowSettings(true);
            // Clean up the URL
            navigate(location.pathname, { replace: true });
        }

        if (query.get('nitro_cancelled')) {
            toast.error("Checkout was cancelled.");
            setShowSettings(true);
            // Clean up the URL
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, navigate, location.pathname]);

    // Force fetch communities on auth change (currently just ensures we have data)
    // In a real backend scenario, this would trigger an API call.
    // Since we use localStorage, useData hook handles initialization, 
    // but the user panel needs to know auth state is ready.

    // WebRTC hook — driven by activeVoiceChannelId
    const {
        joinChannel,
        leaveChannel,
        toggleMute,
        toggleVideo,
        isConnected,
        isMuted,
        isVideoOn,
        localStream,
        peers,
        remoteStreams,
        speakingUsers,
        peerStates
    } = useWebRTC(activeVoiceChannelId);

    const handleJoinVoice = (voiceId, type = 'video') => {
        if (activeVoiceChannelId === voiceId && activeCallType === type) return;
        if (isConnected) leaveChannel();
        setActiveCallType(type);
        setActiveVoiceChannelId(voiceId);
    };

    const handleLeaveCall = () => {
        leaveChannel();
        setActiveVoiceChannelId(null);
        setActiveCallType('video');
    };

    // Auto-join when voice channel is set
    React.useEffect(() => {
        if (activeVoiceChannelId && !isConnected) {
            joinChannel(activeCallType);
        }
    }, [activeVoiceChannelId, joinChannel, isConnected, activeCallType]);

    // Strict guard against broken auth state mounting
    if (!currentUser) return null;

    // Initial loading screen
    if (dataLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#1e1f22]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[#949ba4] font-medium animate-pulse">Initializing CyberChat...</div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-brand-dark text-white font-sans selection:bg-accent-primary selection:text-white">

            {/* Mobile Overlay for Drawers */}
            {(isServerDrawerOpen || isChannelDrawerOpen) && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => {
                        setIsServerDrawerOpen(false);
                        setIsChannelDrawerOpen(false);
                    }}
                />
            )}

            {/* Dashboard Layout: ServerSidebar | (ChannelSidebar + UserControls) | MainContent */}

            <div className={`
                fixed inset-y-0 left-0 z-40 md:z-20 md:relative flex flex-shrink-0
                transform transition-transform duration-300 ease-in-out bg-[#1e1f22]
                ${isServerDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <ServerSidebar
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    onCloseDrawer={() => setIsServerDrawerOpen(false)}
                />
            </div>

            {/* Sidebar Column: Channels + UserControls */}
            <div className={`
                fixed inset-y-0 left-0 z-40 md:z-10 md:relative flex flex-col flex-shrink-0
                w-64 md:w-56 lg:w-64 bg-[#2b2d31] h-screen border-r border-[#1e1f22]
                transform transition-transform duration-300 ease-in-out
                ${isChannelDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Top section: Header + Channels OR Empty Spacer */}
                {serverId && serverId !== '@me' ? (
                    <ChannelSidebar
                        activeVoiceChannelId={activeVoiceChannelId}
                        isVoiceConnected={isConnected}
                        voicePeers={peers}
                        speakingUsers={speakingUsers}
                        onJoinVoice={handleJoinVoice}
                        onLeaveVoice={handleLeaveCall}
                        onToggleMute={toggleMute}
                        onCloseDrawer={() => setIsChannelDrawerOpen(false)}
                    />
                ) : (
                    <DMSidebar onCloseDrawer={() => setIsChannelDrawerOpen(false)} />
                )}

                {/* User Controls - Always Visible */}
                <UserControls toggleMute={toggleMute} width="w-full" onOpenSettings={() => setShowSettings(true)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#313338] h-screen relative">
                {activeVoiceChannelId && isConnected ? (
                    serverId === '@me' ? (
                        <DMCallScreen
                            callType={activeCallType}
                            localStream={localStream}
                            remoteStreams={remoteStreams}
                            peers={peers}
                            speakingUsers={speakingUsers}
                            peerStates={peerStates}
                            isMuted={isMuted}
                            isVideoOn={isVideoOn}
                            currentUser={currentUser}
                            onToggleMute={toggleMute}
                            onToggleVideo={toggleVideo}
                            onLeaveCall={handleLeaveCall}
                        />
                    ) : (
                        <VoiceCallScreen
                            channelName={voiceChannel?.name || 'Voice'}
                            communityName={community?.name || ''}
                            localStream={localStream}
                            remoteStreams={remoteStreams}
                            peers={peers}
                            speakingUsers={speakingUsers}
                            peerStates={peerStates}
                            isMuted={isMuted}
                            isVideoOn={isVideoOn}
                            currentUser={currentUser}
                            onToggleMute={toggleMute}
                            onToggleVideo={toggleVideo}
                            onLeaveCall={handleLeaveCall}
                        />
                    )
                ) : serverId && serverId !== '@me' && channelId ? (
                    <ChatArea onOpenDrawer={() => setIsChannelDrawerOpen(true)} />
                ) : serverId === '@me' && channelId ? (
                    <DMChatArea
                        onOpenDrawer={() => setIsChannelDrawerOpen(true)}
                        onJoinVoice={(type) => handleJoinVoice(channelId, type)}
                    />
                ) : (!serverId || serverId === '@me') && !channelId ? (
                    <FriendsPage onJoinVoice={handleJoinVoice} />
                ) : (
                    <WelcomePanel onOpenServerDrawer={() => setIsServerDrawerOpen(true)} onOpenChannelDrawer={() => setIsChannelDrawerOpen(true)} />
                )}
            </div>

            <CreateCommunityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />

            <IncomingCallModal
                onAccept={(conversationId, callType) => {
                    navigate(`/dashboard/@me/${conversationId}`);
                    // Use a slight delay to let the route render before activating WebRTC
                    setTimeout(() => handleJoinVoice(conversationId, callType), 300);
                }}
            />
        </div >
    );
};

export default Dashboard;
