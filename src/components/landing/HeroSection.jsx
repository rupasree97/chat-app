import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatVisuals from './ChatVisuals';

const HeroSection = () => {
    return (
        <section className="relative w-full min-h-screen flex items-center pt-20 overflow-hidden bg-[#0a0e17]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                {/* Radial gradient imitating the "light" from top center */}
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-[#5865F2]/20 blur-[120px] rounded-full"></div>

                {/* Decorative shapes */}
                <div className="absolute top-[20%] left-[10%] w-20 h-20 bg-[#00f3ff]/10 blur-xl rounded-full"></div>
                <div className="absolute bottom-[20%] right-[10%] w-32 h-32 bg-[#5865F2]/10 blur-xl rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
                {/* Left Column: Text */}
                <div className="flex flex-col gap-8 text-center lg:text-left">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter uppercase"
                    >
                        Group Chat <br />
                        That's All <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#5865F2]">Fun & Games</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0 font-light"
                    >
                        A futuristic community-driven chat platform built for real-time communication, voice, and collaboration. Customize your own space to talk, play, and hang out in a <span className="text-[#00f3ff] font-medium">Cyber-Future</span>.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                    >
                        <Link
                            to="/signup"
                            className="px-8 py-4 rounded-full bg-[#5865F2] text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#4752c4] hover:shadow-[0_0_30px_rgba(88,101,242,0.5)] hover:-translate-y-1 transition-all duration-300 group"
                        >
                            Get Started
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#about"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-8 py-4 rounded-full bg-[#1e2330] text-white font-bold text-lg hover:bg-[#2b303d] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 border border-white/10 text-center"
                        >
                            Learn More
                        </a>
                    </motion.div>
                </div>

                {/* Right Column: Visuals */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="relative"
                >
                    <ChatVisuals />
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
