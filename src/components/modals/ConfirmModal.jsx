import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[440px]">
            <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                    {danger && (
                        <div className="w-10 h-10 rounded-full bg-[#da373c]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle size={20} className="text-[#da373c]" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        {message && (
                            <p className="text-sm text-[#b5bac1] mt-1 leading-relaxed">{message}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center gap-2 px-4 py-3 bg-[#2b2d31]">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-[#b5bac1] hover:text-white hover:underline transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => { onConfirm(); onClose(); }}
                    className={`px-5 py-2 rounded-md text-sm font-medium text-white transition-colors ${danger
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-[#5865F2] hover:bg-[#4752C4]'
                        }`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
