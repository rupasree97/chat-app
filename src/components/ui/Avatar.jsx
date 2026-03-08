import React from 'react';
import { cn } from '../../lib/utils';

/* ── Deterministic color from username ── */
const avatarColors = [
    '#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245',
    '#3BA55D', '#FAA61A', '#9B59B6', '#1ABC9C', '#E74C3C',
    '#2ECC71', '#E67E22', '#F39C12', '#11806A', '#7289DA',
];

function hashUsername(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function getColorFromUsername(username) {
    return avatarColors[hashUsername(username) % avatarColors.length];
}

function getInitials(username = '') {
    return username.substring(0, 2).toUpperCase();
}

/* ── Size presets ── */
const sizeMap = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-14 h-14 text-lg',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl',
};

const statusColorMap = {
    online: 'bg-[#3BA55D]',
    idle: 'bg-[#FAA61A]',
    dnd: 'bg-[#ED4245]',
    offline: 'bg-[#747F8D]',
};

const statusDotSize = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border',
    md: 'w-2.5 h-2.5 border-[1.5px]',
    lg: 'w-3 h-3 border-2',
    xl: 'w-3.5 h-3.5 border-2',
    '2xl': 'w-4 h-4 border-2',
    '3xl': 'w-5 h-5 border-[3px]',
};

/**
 * Global Avatar component — used across the entire application.
 *
 * @param {string}  src       - Image URL (optional)
 * @param {string}  username  - Username for initials + color fallback
 * @param {string}  size      - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
 * @param {string}  status    - 'online' | 'idle' | 'dnd' | 'offline' | null
 * @param {string}  className - Extra classes
 * @param {func}    onClick   - Click handler
 * @param {boolean} isNitro   - Whether the user has Nitro features unlocked
 * @param {object}  profileEffects - The user's profile effects object
 */
const Avatar = ({ src, username = '', size = 'lg', status, className, onClick, isNitro = false, profileEffects = {} }) => {
    const hasImage = src && (src.startsWith('http') || src.startsWith('data:'));
    const bg = getColorFromUsername(username);

    // Apply Nitro effects
    const glowClass = isNitro && profileEffects.profileGlow ? 'shadow-[0_0_15px_#FF73FA]' : '';
    const animClass = isNitro && profileEffects.animatedAvatar && hasImage ? 'animate-pulse' : '';

    return (
        <div
            className={cn('relative inline-flex flex-shrink-0', glowClass, onClick && 'cursor-pointer')}
            onClick={onClick}
        >
            {/* Sparkle Effect Area */}
            {isNitro && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <style>
                        {`
                        @keyframes sparkle-rotate {
                            0% { transform: rotate(0deg); opacity: 0; scale: 0.5; }
                            50% { opacity: 0.8; scale: 1.2; }
                            100% { transform: rotate(180deg); opacity: 0; scale: 0.5; }
                        }
                        .nitro-sparkle {
                            position: absolute;
                            background: white;
                            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
                            animation: sparkle-rotate 3s infinite linear;
                        }
                        `}
                    </style>
                    <div className="nitro-sparkle w-2 h-2 top-0 left-1/4" style={{ animationDelay: '0s' }} />
                    <div className="nitro-sparkle w-1.5 h-1.5 bottom-1/4 right-0" style={{ animationDelay: '1s' }} />
                    <div className="nitro-sparkle w-2.5 h-2.5 top-1/2 -left-1" style={{ animationDelay: '2s' }} />
                </div>
            )}

            {hasImage ? (
                <img
                    src={src}
                    alt={username}
                    className={cn(
                        sizeMap[size],
                        'rounded-full object-cover',
                        animClass,
                        className
                    )}
                    draggable={false}
                />
            ) : (
                <div
                    className={cn(
                        sizeMap[size],
                        'rounded-full flex items-center justify-center font-bold text-white select-none',
                        className
                    )}
                    style={{ backgroundColor: bg }}
                >
                    {getInitials(username)}
                </div>
            )}

            {/* Status dot */}
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full border-[#1e1f22]',
                        statusDotSize[size],
                        statusColorMap[status] || statusColorMap.offline
                    )}
                />
            )}
        </div>
    );
};

export { getColorFromUsername, getInitials };
export default Avatar;
