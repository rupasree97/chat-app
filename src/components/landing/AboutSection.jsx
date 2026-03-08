import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mic, Server, User } from 'lucide-react';

const features = [
    {
        icon: <MessageCircle size={28} />,
        title: 'Real-Time Chat',
        description: 'Crystal-clear messaging with instant delivery. Share text, media, and reactions in real time.',
        color: '#00f3ff',
    },
    {
        icon: <Mic size={28} />,
        title: 'Voice Channels',
        description: 'HD voice calls that bring your community to life. Drop in anytime, no ringing required.',
        color: '#5865F2',
    },
    {
        icon: <Server size={28} />,
        title: 'Custom Servers',
        description: 'Build your own universe. Create channels, set roles, and organize your community your way.',
        color: '#3DF2C6',
    },
    {
        icon: <User size={28} />,
        title: 'Rich Profiles',
        description: 'Express yourself with custom avatars, bios, and status. Stand out in the crowd.',
        color: '#ff0099',
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.15,
            duration: 0.6,
            ease: 'easeOut',
        },
    }),
};

const AboutSection = () => {
    return (
        <section
            id="about"
            className="relative w-full py-28 bg-[#0a0e17] overflow-hidden"
        >
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-[#5865F2]/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-[30%] h-[30%] bg-[#00f3ff]/8 blur-[120px] rounded-full"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                        About{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#5865F2]">
                            Us
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
                        We're building the next generation of digital hangouts — a{' '}
                        <span className="text-[#00f3ff] font-medium">futuristic, community-driven</span>{' '}
                        platform designed for real-time communication, voice collaboration,
                        and seamless connection across the globe.
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={cardVariants}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="relative group rounded-2xl p-6 border border-white/10 bg-[#1e2330]/60 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-opacity-40"
                            style={{
                                '--card-color': feature.color,
                            }}
                        >
                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                style={{
                                    background: `radial-gradient(circle at 50% 50%, ${feature.color}15, transparent 70%)`,
                                }}
                            ></div>

                            {/* Icon */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 relative z-10 transition-all duration-300"
                                style={{
                                    background: `${feature.color}15`,
                                    color: feature.color,
                                    boxShadow: `0 0 20px ${feature.color}20`,
                                }}
                            >
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <h3
                                className="text-lg font-bold text-white mb-2 relative z-10"
                            >
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed relative z-10">
                                {feature.description}
                            </p>

                            {/* Bottom glow line */}
                            <div
                                className="absolute bottom-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)`,
                                }}
                            ></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
