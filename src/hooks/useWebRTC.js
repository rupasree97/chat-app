import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const useWebRTC = (channelId) => {
    const socket = useSocket();
    const { currentUser } = useAuth();
    const [peers, setPeers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    // Refs
    const localStreamRef = useRef(null);
    const peersRef = useRef({});       // { socketId: RTCPeerConnection }
    const peerUsersRef = useRef({});    // { socketId: User }

    const [remoteStreams, setRemoteStreams] = useState({});
    const [speakingUsers, setSpeakingUsers] = useState({});
    const [peerStates, setPeerStates] = useState({}); // { socketId: { isMuted, isVideoOn } }

    // Create peer connection
    const createPeerConnection = useCallback((peerSocketId, peerUser, initiator = false) => {
        if (peersRef.current[peerSocketId]) return peersRef.current[peerSocketId];

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current[peerSocketId] = pc;
        peerUsersRef.current[peerSocketId] = peerUser;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    targetSocketId: peerSocketId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setRemoteStreams(prev => ({
                ...prev,
                [peerSocketId]: remoteStream
            }));
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.warn(`Peer ${peerSocketId} connection state: ${pc.connectionState}`);
            }
        };

        if (initiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socket.emit('offer', {
                        targetSocketId: peerSocketId,
                        offer: pc.localDescription
                    });
                })
                .catch(e => console.error("Error creating offer", e));
        }

        return pc;
    }, [socket]);

    // Join channel — request audio + video
    const joinChannel = useCallback(async (callType = 'video') => {
        if (!socket || !channelId || !currentUser) return;

        try {
            let stream;
            if (callType === 'audio') {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                setIsVideoOn(false);
            } else {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                    setIsVideoOn(true);
                } catch {
                    // Fallback to audio only if camera denied
                    console.warn("Camera denied, falling back to audio only");
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    setIsVideoOn(false);
                }
            }

            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsMuted(false);

            socket.emit('join-voice', { channelId, user: currentUser });
            setIsConnected(true);
        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    }, [socket, channelId, currentUser]);

    // Leave channel
    const leaveChannel = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        Object.values(peersRef.current).forEach(pc => pc.close());
        peersRef.current = {};
        peerUsersRef.current = {};
        setRemoteStreams({});
        setPeers([]);
        setPeerStates({});
        setSpeakingUsers({});
        setIsConnected(false);
        setLocalStream(null);
        setIsMuted(false);
        setIsVideoOn(false);

        if (socket) {
            socket.emit('leave-voice');
        }
    }, [socket]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const muted = !audioTrack.enabled;
                setIsMuted(muted);
                if (socket && channelId) {
                    socket.emit('toggle-mute', { channelId, isMuted: muted });
                }
                return muted;
            }
        }
        return false;
    }, [socket, channelId]);

    // Toggle video — uses sender.replaceTrack() for proper lifecycle
    const toggleVideo = useCallback(async () => {
        if (!localStreamRef.current) return;

        const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

        if (isVideoOn && currentVideoTrack) {
            // TURNING OFF: stop the track, remove from stream
            currentVideoTrack.stop();
            localStreamRef.current.removeTrack(currentVideoTrack);

            // Replace track with null in all peer connections
            Object.values(peersRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(null).catch(e => console.warn('replaceTrack(null) error:', e));
                }
            });

            setIsVideoOn(false);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            if (socket && channelId) {
                socket.emit('toggle-video', { channelId, isVideoOn: false });
            }
        } else {
            // TURNING ON: get new video track, add to stream, replace in peer connections
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = videoStream.getVideoTracks()[0];

                // Add new track to local stream
                localStreamRef.current.addTrack(newVideoTrack);

                // Replace track (or add sender) in all peer connections
                Object.values(peersRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track === null || (s.track && s.track.kind === 'video'));
                    if (sender) {
                        sender.replaceTrack(newVideoTrack).catch(e => console.warn('replaceTrack error:', e));
                    } else {
                        pc.addTrack(newVideoTrack, localStreamRef.current);
                    }
                });

                setIsVideoOn(true);
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                if (socket && channelId) {
                    socket.emit('toggle-video', { channelId, isVideoOn: true });
                }
            } catch (err) {
                console.warn("Could not enable video:", err);
            }
        }
    }, [socket, channelId, isVideoOn]);

    // Speaking detection
    useEffect(() => {
        if (!localStreamRef.current || !socket || !isConnected) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const mediaStreamSource = audioContext.createMediaStreamSource(localStreamRef.current);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        mediaStreamSource.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let isSpeaking = false;
        let speakTimeout;
        let animId;

        const checkAudio = () => {
            if (!localStreamRef.current) return;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const speakingThreshold = 15;

            if (average > speakingThreshold) {
                if (!isSpeaking) {
                    isSpeaking = true;
                    socket.emit('speaking', { channelId, isSpeaking: true });
                    if (currentUser) {
                        setSpeakingUsers(prev => ({ ...prev, [currentUser.id]: true }));
                    }
                }

                clearTimeout(speakTimeout);
                speakTimeout = setTimeout(() => {
                    isSpeaking = false;
                    socket.emit('speaking', { channelId, isSpeaking: false });
                    if (currentUser) {
                        setSpeakingUsers(prev => ({ ...prev, [currentUser.id]: false }));
                    }
                }, 800);
            }

            animId = requestAnimationFrame(checkAudio);
        };

        checkAudio();

        return () => {
            cancelAnimationFrame(animId);
            clearTimeout(speakTimeout);
            audioContext.close();
        };
    }, [isConnected, socket, channelId, currentUser]);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        // New user joined
        socket.on('user-joined-voice', ({ user, socketId, isMuted: peerMuted, isVideoOn: peerVideo }) => {
            console.log("User joined voice:", user.username);
            setPeers(prev => {
                if (prev.find(p => p.socketId === socketId)) return prev;
                return [...prev, { ...user, socketId }];
            });
            setPeerStates(prev => ({
                ...prev,
                [socketId]: { isMuted: peerMuted || false, isVideoOn: peerVideo || false }
            }));
        });

        // User left
        socket.on('user-left-voice', ({ socketId }) => {
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].close();
                delete peersRef.current[socketId];
                delete peerUsersRef.current[socketId];
            }
            setRemoteStreams(prev => {
                const newStreams = { ...prev };
                delete newStreams[socketId];
                return newStreams;
            });
            setPeers(prev => prev.filter(p => p.socketId !== socketId));
            setPeerStates(prev => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
        });

        // Peer toggled mute
        socket.on('user-toggled-mute', ({ socketId, isMuted: peerMuted }) => {
            setPeerStates(prev => ({
                ...prev,
                [socketId]: { ...prev[socketId], isMuted: peerMuted }
            }));
        });

        // Peer toggled video
        socket.on('user-toggled-video', ({ socketId, isVideoOn: peerVideo }) => {
            setPeerStates(prev => ({
                ...prev,
                [socketId]: { ...prev[socketId], isVideoOn: peerVideo }
            }));
        });

        // Speaking event
        socket.on('user-speaking', ({ userId, isSpeaking }) => {
            setSpeakingUsers(prev => ({ ...prev, [userId]: isSpeaking }));
        });

        // Offer
        socket.on('offer', async ({ senderSocketId, offer, user }) => {
            const pc = createPeerConnection(senderSocketId, user, false);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { targetSocketId: senderSocketId, answer });

                setPeers(prev => {
                    if (prev.find(p => p.socketId === senderSocketId)) return prev;
                    return [...prev, { ...user, socketId: senderSocketId }];
                });
            } catch (e) {
                console.error("Error handling offer", e);
            }
        });

        // Answer
        socket.on('answer', async ({ senderSocketId, answer }) => {
            const pc = peersRef.current[senderSocketId];
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (e) {
                    console.error("Error handling answer", e);
                }
            }
        });

        // ICE Candidate
        socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
            const pc = peersRef.current[senderSocketId];
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ICE candidate", e);
                }
            }
        });

        return () => {
            socket.off('voice-users');
            socket.off('user-joined-voice');
            socket.off('user-left-voice');
            socket.off('user-toggled-mute');
            socket.off('user-toggled-video');
            socket.off('user-speaking');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, [socket, isConnected, createPeerConnection]);

    // Handle initial voice-users list (initiate connections)
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleVoiceUsers = (initialPeers) => {
            console.log("Received existing peers:", initialPeers);
            setPeers(initialPeers);

            // Set initial peer states
            const states = {};
            initialPeers.forEach(peer => {
                states[peer.socketId] = {
                    isMuted: peer.isMuted || false,
                    isVideoOn: peer.isVideoOn || false
                };
                // Initiate connection to each peer
                if (peer.socketId) {
                    createPeerConnection(peer.socketId, peer, true);
                }
            });
            setPeerStates(states);
        };

        socket.on('voice-users', handleVoiceUsers);
        return () => socket.off('voice-users', handleVoiceUsers);
    }, [socket, isConnected, createPeerConnection]);

    return {
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
    };
};

