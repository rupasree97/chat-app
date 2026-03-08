import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mic, MicOff, Settings, Sparkles, Wallet } from 'lucide-react';
import Avatar from '../ui/Avatar';
import WalletPanel from './WalletPanel';

/**
 * Standalone User Controls panel — always visible at bottom-left.
 * Separated from ChannelSidebar so it renders on every Dashboard view,
 * even when no community is selected.
 */
const UserControls = ({ toggleMute, width = 'w-60', onOpenSettings }) => {
    const { currentUser } = useAuth();
    const [isMuted, setIsMuted] = useState(false);
    const [walletOpen, setWalletOpen] = useState(false);
    const walletBtnRef = useRef(null);

    if (!currentUser) return null;

    const handleMute = () => {
        if (toggleMute) {
            const muted = toggleMute();
            setIsMuted(muted);
        }
    };

    const walletBalance = currentUser?.walletBalance || 0;

    return (
        <>
            <div className={`${width} h-[52px] bg-[#232428] flex items-center justify-between px-2 border-t border-[#1e1f22] flex-shrink-0`}>
                <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                        src={currentUser?.avatar}
                        username={currentUser?.username}
                        size="md"
                        status={currentUser?.status || 'online'}
                        isNitro={currentUser?.nitro?.isActive}
                        profileEffects={currentUser?.profileEffects}
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-white truncate max-w-[80px] leading-tight">{currentUser?.username}</span>
                            {currentUser?.nitro?.isActive && (
                                <Sparkles size={12} className="text-[#FF73FA] shrink-0" />
                            )}
                        </div>
                        <span className="text-xs text-[#949ba4] leading-tight">#{currentUser?.id?.slice(-4)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* Wallet Button */}
                    <button
                        ref={walletBtnRef}
                        onClick={() => setWalletOpen(prev => !prev)}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${walletOpen
                            ? 'bg-[#5865F2] text-white'
                            : 'hover:bg-[#35373c] text-[#949ba4] hover:text-white'
                            }`}
                        title="Wallet"
                    >
                        <Wallet size={14} />
                        {walletBalance > 0 && (
                            <span className="text-[10px] font-bold leading-none">{walletBalance}</span>
                        )}
                    </button>
                    <button onClick={handleMute} className="p-1.5 hover:bg-[#35373c] rounded-lg text-[#949ba4] hover:text-white transition-colors relative">
                        {isMuted ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} />}
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 hover:bg-[#35373c] rounded-lg text-[#949ba4] hover:text-white transition-colors"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            <WalletPanel
                isOpen={walletOpen}
                onClose={() => setWalletOpen(false)}
                walletBalance={walletBalance}
                anchorRef={walletBtnRef}
            />
        </>
    );
};

export default UserControls;
