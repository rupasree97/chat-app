import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';

const CreateCommunityModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { createCommunity } = useData();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newCommunity = await createCommunity(name, description);
        onClose();
        setName('');
        setDescription('');

        // Auto-navigate to the newly created server
        if (newCommunity?.id) {
            navigate(`/dashboard/${newCommunity.id}`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md bg-brand-navy border border-glass-border">
            <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white z-10">
                <X size={20} />
            </button>

            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Create Your Server</h2>
                <p className="text-text-secondary text-sm mb-6">
                    Give your new community a personality with a name and an icon.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-text-muted flex flex-col items-center justify-center text-text-muted hover:border-accent-primary hover:text-accent-primary cursor-pointer transition-colors bg-glass">
                            <Upload size={24} />
                            <span className="text-xs font-bold mt-1">UPLOAD</span>
                        </div>
                    </div>

                    <Input
                        label="SERVER NAME"
                        placeholder="My Awesome Community"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-brand-dark/50"
                    />
                    <Input
                        label="DESCRIPTION (Optional)"
                        placeholder="What's this server about?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-brand-dark/50"
                    />

                    <div className="flex justify-between items-center mt-8 pt-4">
                        <Button variant="ghost" onClick={onClose} className="text-sm">Back</Button>
                        <Button type="submit" variant="primary" disabled={!name}>Create</Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default CreateCommunityModal;
