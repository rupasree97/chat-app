import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Rocket } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '../../context/AuthContext';

const statusLabels = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
};

const PremiumNitroOverlay = ({ theme }) => {
    // Only render the requested themes. "none" or undefined will return null.
    if (!["dinosaur", "unicorn", "alien", "blackhole"].includes(theme)) return null;

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-b-[16px] theme-${theme}`}>
            <style>{`
                /* =========================================
                   DINOSAUR THEME
                   ========================================= */
                .theme-dinosaur::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, #0f1c13, #1a3320);
                    opacity: 0.9;
                }
                .theme-dinosaur::after {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0; right: 0; height: 100%;
                    background: radial-gradient(circle at 50% 120%, rgba(74, 222, 128, 0.15) 0%, transparent 60%);
                }
                .dino-mist {
                    position: absolute; inset: 0;
                    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.05"/></svg>');
                    animation: mistMove 30s linear infinite;
                    mix-blend-mode: soft-light;
                }
                @keyframes mistMove {
                    0% { transform: translateX(0) translateY(0); }
                    100% { transform: translateX(-50px) translateY(50px); }
                }
                .leaf {
                    position: absolute;
                    background: rgba(74, 222, 128, 0.4);
                    border-radius: 0 10px 0 10px;
                    filter: blur(1px);
                    animation: leafFall linear infinite;
                }
                @keyframes leafFall {
                    0% { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translate(var(--end-x), 400px) rotate(var(--end-rot)); opacity: 0; }
                }

                /* =========================================
                   UNICORN THEME
                   ========================================= */
                .theme-unicorn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(230,200,250,0.1), rgba(180,220,255,0.1), rgba(255,190,220,0.1));
                    background-size: 200% 200%;
                    animation: unicornWave 8s ease flex-wrap infinite alternate;
                }
                @keyframes unicornWave {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .unicorn-star {
                    position: absolute;
                    background: white;
                    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                    animation: starTwinkle ease-in-out infinite;
                }
                @keyframes starTwinkle {
                    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                    50% { opacity: 0.8; transform: scale(1.2) rotate(45deg); box-shadow: 0 0 10px rgba(255,255,255,0.8); }
                }

                /* =========================================
                   ALIEN THEME
                   ========================================= */
                .theme-alien::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: #0a0a0c;
                }
                .theme-alien::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: 
                        linear-gradient(90deg, rgba(0, 255, 128, 0.03) 1px, transparent 1px),
                        linear-gradient(rgba(0, 255, 128, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                    opacity: 0.5;
                }
                .alien-scanline {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 2px;
                    background: rgba(0, 255, 128, 0.5);
                    box-shadow: 0 0 10px rgba(0,255,128,0.8);
                    animation: scan 4s linear infinite;
                }
                @keyframes scan {
                    0% { transform: translateY(-10px); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(420px); opacity: 0; }
                }
                .ufo-beam {
                    position: absolute;
                    top: -50px;
                    width: 100px;
                    height: 200px;
                    background: linear-gradient(to bottom, rgba(0,255,128,0.2), transparent);
                    clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
                    animation: beamSweep 10s ease-in-out infinite alternate;
                    filter: blur(4px);
                }
                @keyframes beamSweep {
                    0% { transform: translateX(-50px) rotate(-15deg); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(250px) rotate(15deg); opacity: 0; }
                }

                /* =========================================
                   BLACK HOLE THEME
                   ========================================= */
                .theme-blackhole::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 40%, #050510 0%, #000000 100%);
                }
                .bh-vortex {
                    position: absolute;
                    top: 20%; left: 50%;
                    width: 300px; height: 300px;
                    margin-left: -150px;
                    border-radius: 50%;
                    background: conic-gradient(from 0deg at 50% 50%, rgba(60,20,120,0), rgba(60,20,120,0.2), rgba(20,60,180,0.5), rgba(60,20,120,0));
                    filter: blur(10px);
                    animation: swirl 10s linear infinite;
                }
                .bh-center {
                    position: absolute;
                    top: 35px; left: 35px; right: 35px; bottom: 35px;
                    background: black;
                    border-radius: 50%;
                    box-shadow: inset 0 0 30px rgba(100,50,200,0.5), 0 0 20px rgba(0,0,0,1);
                }
                @keyframes swirl {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.05); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                .bh-star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    animation: orbit 8s linear infinite;
                }
                @keyframes orbit {
                    0% { transform: rotate(var(--start-angle)) translateX(var(--radius)) rotate(calc(var(--start-angle) * -1)); opacity: 0; }
                    10% { opacity: var(--max-opacity); }
                    90% { opacity: var(--max-opacity); }
                    100% { transform: rotate(calc(var(--start-angle) + 360deg)) translateX(10px) rotate(calc((var(--start-angle) + 360deg) * -1)); opacity: 0; }
                }
            `}</style>

            {/* DINOSAUR RENDER */}
            {theme === 'dinosaur' && (
                <>
                    <div className="dino-mist" />
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="leaf" style={{
                            width: `${Math.random() * 15 + 10}px`,
                            height: `${Math.random() * 10 + 5}px`,
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 5 + 5}s`,
                            animationDelay: `${Math.random() * 5}s`,
                            '--end-x': `${(Math.random() - 0.5) * 100}px`,
                            '--end-rot': `${Math.random() * 360}deg`
                        }} />
                    ))}
                    {/* Distant dino silhouette */}
                    <svg className="absolute bottom-4 opacity-10" width="40" height="20" viewBox="0 0 100 50" style={{ animation: 'mistMove 25s linear infinite alternate' }}>
                        <path d="M10,40 Q15,10 30,15 Q35,5 45,5 Q55,5 50,15 Q60,20 80,15 Q90,15 95,25 Q90,30 80,25 Q70,40 60,40 L60,50 L50,50 L50,45 Q40,45 35,50 L25,50 L25,40 Q15,45 10,40 Z" fill="#4ADE80" />
                    </svg>
                </>
            )}

            {/* UNICORN RENDER */}
            {theme === 'unicorn' && (
                <>
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="unicorn-star" style={{
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 3 + 2}s`,
                            animationDelay: `${Math.random() * 4}s`,
                            opacity: 0
                        }} />
                    ))}
                </>
            )}

            {/* ALIEN RENDER */}
            {theme === 'alien' && (
                <>
                    <div className="alien-scanline" />
                    <div className="ufo-beam" />
                    {[...Array(20)].map((_, i) => (
                        <div key={`data-${i}`} className="absolute bg-[#00ff80]" style={{
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 10 + 2}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.5,
                            boxShadow: '0 0 5px #00ff80',
                            animation: `starTwinkle ${Math.random() * 2 + 1}s infinite alternate`
                        }} />
                    ))}
                </>
            )}

            {/* BLACK HOLE RENDER */}
            {theme === 'blackhole' && (
                <>
                    <div className="bh-vortex">
                        <div className="bh-center" />
                    </div>
                    {[...Array(40)].map((_, i) => {
                        const radius = Math.random() * 150 + 40;
                        const angle = Math.random() * 360;
                        return (
                            <div key={i} className="bh-star" style={{
                                width: `${Math.random() * 3 + 1}px`,
                                height: `${Math.random() * 3 + 1}px`,
                                top: '50%', left: '50%',
                                '--start-angle': `${angle}deg`,
                                '--radius': `${radius}px`,
                                '--max-opacity': Math.random() * 0.8 + 0.2,
                                animationDuration: `${Math.random() * 10 + 5}s`,
                                animationDelay: `-${Math.random() * 10}s`
                            }} />
                        );
                    })}
                </>
            )}
        </div>
    );
};

const ProfilePopCard = ({ user, position, onClose, onEditProfile, communityId }) => {
    const cardRef = useRef(null);
    const { currentUser } = useAuth();

    // Normalize ID to safely check ownership
    const currentUserId = currentUser?.id || currentUser?._id;
    const profileUserId = user?.id || user?._id;
    const isOwnProfile = currentUserId === profileUserId;

    // Merge with current user data if it's their own profile to ensure freshest state
    const displayUser = isOwnProfile
        ? { ...user, ...currentUser, profileEffects: currentUser.profileEffects, nitro: currentUser.nitro }
        : user;

    useEffect(() => {
        const handleClick = (e) => {
            if (cardRef.current && !cardRef.current.contains(e.target)) onClose();
        };
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!user) return null;

    const tag = `#${(displayUser.id || displayUser._id || '0000').slice(-4)}`;
    const bannerColor = displayUser.bannerColor || '#5865F2';
    const status = displayUser.status || 'offline';

    // Feature flags
    const isNitro = displayUser.nitro?.isActive === true;
    const animationEnabled = displayUser.profileEffects?.animationEnabled !== false; // Default true if not explicitly false
    const theme = displayUser.selectedProfileTheme && displayUser.selectedProfileTheme !== 'none'
        ? displayUser.selectedProfileTheme
        : 'none';

    const isBooster = communityId
        ? displayUser.boostedServers?.some(b =>
            b.serverId === communityId ||
            (b.serverId && b.serverId._id === communityId) ||
            (typeof b === 'string' && b === communityId) ||
            b === communityId
        )
        : displayUser.boostedServers?.length > 0;

    // Use specific strict flags
    const showNitroAnimations = isNitro && animationEnabled;

    return (
        <AnimatePresence>
            <>
                {/* Backdrop (Darkens background slightly) */}
                <div
                    className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-[1px]"
                    onClick={onClose}
                />

                <motion.div
                    ref={cardRef}
                    initial={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                    animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    // Strict Card Dimensions: 340px width, 420px height exactly.
                    // 16px outer boundary, clean Discord-like shadow.
                    className="fixed top-1/2 left-1/2 w-[340px] h-[420px] rounded-[16px] shadow-2xl z-[9999] flex flex-col bg-[#111214] border border-[#1e1f22]"
                >
                    {/* 1️⃣ STRICT STATIC BANNER */}
                    <div
                        className="w-full h-[100px] md:h-[120px] flex-shrink-0 rounded-t-[16px] overflow-hidden"
                        style={{
                            backgroundColor: bannerColor,
                            // If user has a custom banner image, it would go here. No animations allowed.
                            // backgroundImage: displayUser.bannerImage ? `url(${displayUser.bannerImage})` : 'none',
                        }}
                    />

                    {/* 2️⃣ LOWER PROFILE CARD CONTAINER */}
                    <div className="flex-1 relative flex flex-col pb-[16px] overflow-hidden rounded-b-[16px]">

                        {/* Subtle Premium Nitro Background Glow (Only plays in lower body, z-0) */}
                        {showNitroAnimations && <PremiumNitroOverlay theme={theme} />}

                        {/* Dark Overlay for readability when themes are active (z-1) */}
                        {showNitroAnimations && theme !== 'none' && (
                            <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />
                        )}

                        {/* 3️⃣ AVATAR (50% Overlap) 
                            Avatar 3xl is 96px width. 
                            6px border * 2 = 12px. Total width = 108px.
                            50% overlap = 54px negative margin.
                        */}
                        <div className="relative -mt-[54px] ml-[16px] w-[108px] h-[108px] rounded-full border-[6px] border-[#111214] bg-[#111214] z-[10] flex items-center justify-center">
                            <Avatar
                                src={displayUser.avatar || displayUser.profilePicture}
                                username={displayUser.username}
                                size="3xl"
                                status={status}
                                isNitro={isNitro}
                                profileEffects={displayUser.profileEffects || {}}
                            />
                        </div>

                        {/* Content Body */}
                        <div className="relative z-[10] px-[16px] pt-[12px] flex-1 overflow-y-auto profile-body-scroll">
                            <style>{`
                                .profile-body-scroll::-webkit-scrollbar { width: 4px; }
                                .profile-body-scroll::-webkit-scrollbar-track { background: transparent; }
                                .profile-body-scroll::-webkit-scrollbar-thumb { background: #2b2d31; border-radius: 10px; }
                            `}</style>

                            {/* Display Name & Badges (Inline Alignment) */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                <h3 className="text-[20px] font-bold text-[#f2f3f5] leading-tight">
                                    {displayUser.username}
                                </h3>
                                <span className="text-[14px] text-[#949ba4] font-medium mr-1">{tag}</span>

                                {/* Badges Inline */}
                                <div className="flex items-center gap-1.5 h-full">
                                    {isNitro && (
                                        <div className="group relative">
                                            <div className="bg-[#2b2d31] p-1.5 rounded-md flex items-center justify-center tooltip-trigger relative cursor-pointer z-10 overflow-hidden">
                                                {/* Sparkle badge with hover glow animation */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF73FA]/0 via-[#FF73FA]/20 to-[#FF73FA]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <Sparkles className="text-[#FF73FA] relative z-10 drop-shadow-[0_0_8px_rgba(255,115,250,0.5)] group-hover:scale-110 transition-transform duration-300" size={14} />
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#111214] text-[#f2f3f5] text-[12px] font-bold py-1 px-2.5 rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                                Nitro
                                            </div>
                                        </div>
                                    )}
                                    {isBooster && (
                                        <div className="bg-[#2b2d31] p-1.5 rounded-md flex items-center justify-center tooltip-trigger relative cursor-pointer group">
                                            <Rocket className="text-[#FF73FA]" size={14} />
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#111214] text-[#f2f3f5] text-[12px] font-bold py-1 px-2.5 rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-50">
                                                Server Booster
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status text */}
                            <div className="flex items-center gap-2 mb-[12px]">
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${status === 'online' ? 'bg-[#23a559]'
                                    : status === 'idle' ? 'bg-[#f0b232]'
                                        : status === 'dnd' ? 'bg-[#f23f43]'
                                            : 'bg-[#80848e]'
                                    }`} />
                                <span className="text-[14px] text-[#dbdee1] font-medium">{statusLabels[status]}</span>
                            </div>

                            <div className="h-[1px] bg-[#2b2d31] mb-[12px]" />

                            {/* About Me */}
                            {displayUser.bio && (
                                <div className="mb-[12px]">
                                    <h4 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wide mb-[8px]">
                                        About Me
                                    </h4>
                                    <p className="text-[14px] text-[#dbdee1] leading-relaxed whitespace-pre-wrap word-break">
                                        {displayUser.bio}
                                    </p>
                                </div>
                            )}

                            {/* Member Since */}
                            <div className="mb-[12px]">
                                <h4 className="text-[12px] font-bold text-[#b5bac1] uppercase tracking-wide mb-[8px]">
                                    Member Since
                                </h4>
                                <p className="text-[14px] text-[#dbdee1]">
                                    {displayUser.createdAt
                                        ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'Oct 15, 2023'
                                    }
                                </p>
                            </div>

                            {/* Action Buttons */}
                            {isOwnProfile && onEditProfile && (
                                <button
                                    onClick={() => { onClose(); onEditProfile(); }}
                                    className="w-full mt-[4px] py-2 rounded-[3px] bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-[14px] font-semibold text-white transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};

export { PremiumNitroOverlay };
export default ProfilePopCard;
