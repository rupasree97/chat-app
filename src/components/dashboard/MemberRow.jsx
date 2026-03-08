import React, { useState, useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import { MoreVertical, UserMinus, Rocket, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MemberRow = ({ member, role, isOwner, isBooster, onRemoveClick, onProfileClick }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prevent removing yourself
    const canRemove = isOwner && role !== "MODERATOR";

    return (
        <div
            className="relative group flex items-center gap-3 px-2 py-1.5 hover:bg-[#35373c] rounded-[4px] cursor-pointer transition-colors block mx-2"
            onClick={(e) => {
                if (onProfileClick) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onProfileClick(member, { top: rect.bottom + 4, left: rect.left - 300 }); // open to the left of the side panel
                }
            }}
        >
            <div className="relative flex-shrink-0">
                <Avatar
                    src={member.profilePicture || member.avatar}
                    username={member.username}
                    size="sm"
                    isNitro={member.nitro?.isActive}
                    profileEffects={member.profileEffects}
                />
                {member.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#23a559] border-2 border-[#2b2d31] group-hover:border-[#35373c] rounded-full transition-colors"></div>
                )}
                {member.status === 'idle' && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#f0b232] border-2 border-[#2b2d31] group-hover:border-[#35373c] rounded-full transition-colors"></div>
                )}
                {member.status === 'dnd' && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#f23f43] border-2 border-[#2b2d31] group-hover:border-[#35373c] rounded-full flex items-center justify-center transition-colors">
                        <div className="w-1.5 h-0.5 bg-[#2b2d31] group-hover:bg-[#35373c] rounded-full transition-colors"></div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 line-clamp-1 truncate">
                    <span className={`font-medium truncate text-[15px] ${role === 'MODERATOR' ? 'text-[#f2f3f5]' : 'text-[#dbdee1]'}`}>
                        {member.username}
                    </span>
                    {role === 'MODERATOR' && (
                        <span className="shrink-0 flex items-center justify-center text-[#dbdee1]" title="Server Owner">
                            <svg className="w-4 h-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.69 13.9 11 15h2l-.69-1.1c-.2-.3-.59-.3-.72 0z" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 10.36V16h-2v-3.64l-2.06 3.3L8.1 15l2.76-4.42c.16-.25.5-.32.76-.16.03.02.05.04.08.08L12 11l.3.4zM16 15l-.83.65-2.07-3.32c-.16-.25-.09-.58.15-.74.02-.02.05-.03.08-.04L16 15z" />
                            </svg>
                        </span>
                    )}
                    {member.nitro?.isActive && (
                        <span className="shrink-0 flex items-center justify-center text-[#FF73FA] shrink-0" title="Nitro Subscriber">
                            <Sparkles size={14} />
                        </span>
                    )}
                    {isBooster && (
                        <span className="shrink-0 flex items-center justify-center text-[#FF73FA] animate-pulse" title="Server Booster">
                            <Rocket size={14} />
                        </span>
                    )}
                </div>
            </div>

            {canRemove && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1 rounded bg-transparent hover:bg-[#404249] text-[#b5bac1] hover:text-[#dbdee1]"
                    >
                        <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-10 w-48 bg-[#111214] border border-[#1e1f22] rounded shadow-xl py-1 z-50"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onRemoveClick(member);
                                    }}
                                    className="w-full text-left px-3 py-1.5 flex items-center justify-between text-[#da373c] hover:bg-[#da373c] hover:text-white transition-colors"
                                >
                                    <span className="text-sm font-medium">Remove from Server</span>
                                    <UserMinus size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default MemberRow;
