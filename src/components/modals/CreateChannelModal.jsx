import React, { useState, useRef, useEffect } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';

const CreateChannelModal = ({ isOpen, onClose, channelType = 'text' }) => {
    const [name, setName] = useState('');
    const { createChannel } = useData();
    const { serverId } = useParams();
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const isVoice = channelType === 'voice';
    const Icon = isVoice ? Volume2 : Hash;

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setName('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        // For text channels: lowercase + dashes (preserve emoji)
        // For voice channels: keep original casing + spaces (preserve emoji)
        const formatted = isVoice
            ? trimmed
            : trimmed.toLowerCase().replace(/\s+/g, '-');

        const newChannel = await createChannel(serverId, formatted, channelType);

        if (newChannel && newChannel.id) {
            navigate(`/dashboard/${serverId}/${newChannel.id}`);
        }

        onClose();
        setName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[440px]">
            {/* Header */}
            <div className="px-4 pt-5 pb-0 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        Create {isVoice ? 'Voice' : 'Text'} Channel
                    </h2>
                    <p className="text-[#b5bac1] text-sm mt-1">
                        {isVoice
                            ? 'Hang out together with voice, video, and screen share'
                            : 'Send messages, images, GIFs, and emoji'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#b5bac1] hover:text-white hover:bg-[#404249] transition-colors mt-0.5"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-4 pb-4 pt-5">
                {/* Channel type indicator */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2b2d31] mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isVoice
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-[#5865F2]/15 text-[#5865F2]'
                        }`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {isVoice ? 'Voice Channel' : 'Text Channel'}
                        </p>
                        <p className="text-[11px] text-[#949ba4]">
                            {isVoice
                                ? 'Members can talk, stream, and share their screen'
                                : 'Members can send messages and share files'}
                        </p>
                    </div>
                </div>

                {/* Name input */}
                <div>
                    <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wide mb-2">
                        Channel Name
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]">
                            <Icon size={16} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isVoice ? 'General Voice' : 'new-channel'}
                            maxLength={50}
                            className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-md pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5865F2] border border-transparent focus:border-[#5865F2] transition-colors placeholder:text-[#6d6f78]"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-2 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-[#b5bac1] hover:text-white hover:underline transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="px-5 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#5865F2]/50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
                    >
                        Create Channel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateChannelModal;
