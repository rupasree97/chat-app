import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🥳', '🤠', '😎', '🤓', '🧐'],
    'Gestures': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤝', '👏', '🙌', '👐', '🤲', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '🫶', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💤'],
    'Objects': ['🔥', '⭐', '🌟', '✨', '💡', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎮', '🎯', '🎵', '🎶', '🔔', '📌', '📎', '🔗', '💎', '🚀', '⚡', '☁️', '🌈', '☀️', '🌙', '⏰', '🔒', '🔑', '💰'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

/**
 * EmojiPicker rendered via React Portal so it is never clipped by
 * overflow:hidden parents. Position is computed from the anchorRef
 * that the caller supplies.
 */
const EmojiPicker = ({ onSelect, onClose, anchorRef, align = 'right' }) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('Smileys');
    const pickerRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    /* ── compute position from anchor ── */
    useEffect(() => {
        if (!anchorRef?.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        const pickerW = 352;
        const pickerH = 310;

        let top = rect.top - pickerH - 8;              // above the anchor
        if (top < 8) top = rect.bottom + 8;             // flip below if no room

        let left = align === 'right'
            ? rect.right - pickerW                       // align right edge
            : rect.left;                                 // align left edge
        if (left < 8) left = 8;
        if (left + pickerW > window.innerWidth - 8) left = window.innerWidth - pickerW - 8;

        setPos({ top, left });
    }, [anchorRef, align]);

    /* ── click-outside handler ── */
    const handleClickOutside = useCallback((e) => {
        if (
            pickerRef.current && !pickerRef.current.contains(e.target) &&
            anchorRef?.current && !anchorRef.current.contains(e.target)
        ) {
            onClose();
        }
    }, [onClose, anchorRef]);

    useEffect(() => {
        // Use setTimeout to defer listener attachment so the opening click
        // doesn't immediately trigger outside detection
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    const filteredEmojis = search
        ? ALL_EMOJIS.filter(e => e.includes(search))
        : EMOJI_CATEGORIES[activeTab] || [];

    const tabs = Object.keys(EMOJI_CATEGORIES);
    const tabIcons = { 'Smileys': '😀', 'Gestures': '👍', 'Hearts': '❤️', 'Objects': '🔥' };

    return createPortal(
        <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            className="w-[352px] bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Search */}
            <div className="p-3 pb-2">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search emoji"
                        className="w-full bg-[#1e1f22] text-[#dbdee1] text-sm rounded-md py-1.5 pl-8 pr-3 placeholder:text-[#949ba4] focus:outline-none"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            {!search && (
                <div className="flex items-center gap-1 px-3 pb-1 border-b border-[#1e1f22]">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2 py-1 text-lg rounded transition-colors ${activeTab === tab ? 'bg-[#404249]' : 'hover:bg-[#36373d]'
                                }`}
                            title={tab}
                        >
                            {tabIcons[tab]}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji Grid */}
            <div className="h-[200px] overflow-y-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 #2b2d31' }}>
                {!search && (
                    <div className="text-[10px] font-bold text-[#949ba4] uppercase tracking-wider px-1 mb-1">
                        {activeTab}
                    </div>
                )}
                <div className="grid grid-cols-8 gap-0.5">
                    {filteredEmojis.map((emoji, i) => (
                        <button
                            key={`${emoji}-${i}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onSelect(emoji);
                                onClose();
                            }}
                            className="w-10 h-10 flex items-center justify-center text-xl rounded hover:bg-[#404249] transition-colors cursor-pointer active:scale-90"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                {filteredEmojis.length === 0 && (
                    <div className="text-center text-[#949ba4] text-sm py-8">No emojis found</div>
                )}
            </div>
        </motion.div>,
        document.body
    );
};

export default EmojiPicker;
