import { useState } from 'react';
import { Compass, Search, Users, Menu } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

const WelcomePanel = ({ onOpenServerDrawer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { allCommunities, joinCommunity } = useData();
    const { currentUser } = useAuth();

    // Filter from all public communities, excluding ones the user already joined
    const discoverableCommunities = allCommunities.filter(c =>
        !c.members.includes(currentUser?.id) &&
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleJoin = (communityId) => {
        joinCommunity(communityId);
    };

    return (
        <div className="flex-1 h-screen bg-brand-dark flex flex-col relative min-w-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

            {/* Mobile Header (Hamburger) */}
            <div className="h-14 md:hidden flex items-center px-4 border-b border-[#1e1f22] bg-[#313338] shadow-sm z-20 shrink-0">
                <button
                    onClick={onOpenServerDrawer}
                    className="text-[#b5bac1] hover:text-[#dbdee1] transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="ml-3 font-semibold text-white">Discover & Play</div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-smooth z-10 pb-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#202225 #313338' }}>
                {/* Header */}
                <div className="py-12 md:py-20 relative flex flex-col items-center justify-center bg-gradient-to-b from-brand-navy/80 to-brand-dark/0 backdrop-blur-sm px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center w-full"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Find your Community</h1>
                        <div className="relative w-full max-w-md mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                            <input
                                type="text"
                                placeholder="Explore communities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-[300px] md:w-[500px] bg-brand-dark/80 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-accent-primary shadow-lg backdrop-blur-md"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto relative">
                    {discoverableCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {discoverableCommunities.map((community, idx) => (
                                <motion.div
                                    key={community.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-glass backdrop-blur-xl border border-glass-border rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 group hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                                >
                                    <div className="h-24 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 relative">
                                        {community.banner && <img src={community.banner} alt="banner" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="p-4 relative">
                                        <div className="w-12 h-12 rounded-xl bg-brand-dark border-4 border-brand-dark absolute -top-8 left-4 flex items-center justify-center overflow-hidden">
                                            {community.icon ? (
                                                <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white font-bold">{community.name.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="mt-4 flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                    {community.name}
                                                    <span className="p-0.5 rounded-full bg-accent-success/20 text-accent-success"><Users size={12} /></span>
                                                </h3>
                                                <p className="text-text-muted text-sm mt-1 line-clamp-2">
                                                    {community.description || "No description provided."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                                            <span>{community.members.length} Members</span>
                                            <Button size="sm" variant="secondary" onClick={() => handleJoin(community.id)}>
                                                Join Server
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center mt-20 opacity-50">
                            <Compass size={64} className="mx-auto mb-4 text-text-muted" />
                            <h3 className="text-xl font-bold text-white">No communities found</h3>
                            <p className="text-text-secondary">Try searching for something else or create your own!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WelcomePanel;
