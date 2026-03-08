import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSmoothScroll = (e, targetId) => {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0e17]/80 backdrop-blur-md shadow-lg border-b border-[#00f3ff]/10' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between font-sans">
                {/* Logo - Left */}
                <Link to="/" className="flex items-center gap-2 group">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="text-white font-black text-2xl tracking-tighter flex items-center gap-1"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00f3ff] to-[#5865F2]">CyberChat</span>
                        <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse"></span>
                    </motion.div>
                </Link>

                {/* Center Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a
                        href="#about"
                        onClick={(e) => handleSmoothScroll(e, 'about')}
                        className="text-gray-300 font-semibold text-sm uppercase tracking-wider hover:text-[#00f3ff] transition-all duration-300 relative group cursor-pointer"
                    >
                        About Us
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#00f3ff] transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#00f3ff]"></span>
                    </a>
                    <a
                        href="#contact"
                        onClick={(e) => handleSmoothScroll(e, 'contact')}
                        className="text-gray-300 font-semibold text-sm uppercase tracking-wider hover:text-[#00f3ff] transition-all duration-300 relative group cursor-pointer"
                    >
                        Contact Us
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#00f3ff] transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#00f3ff]"></span>
                    </a>
                </div>

                {/* Right - Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        to="/login"
                        className="px-6 py-2.5 rounded-full text-[#00f3ff] text-sm font-bold border border-[#00f3ff]/40 hover:border-[#00f3ff] hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
                    >
                        Login
                    </Link>
                    <Link
                        to="/signup"
                        className="px-6 py-2.5 rounded-full bg-[#5865F2] text-white text-sm font-bold hover:bg-[#4752c4] hover:shadow-[0_0_25px_rgba(88,101,242,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[#0a0e17]/95 backdrop-blur-xl border-b border-[#00f3ff]/20 overflow-hidden"
                    >
                        <div className="p-6 flex flex-col gap-4">
                            <a
                                href="#about"
                                onClick={(e) => handleSmoothScroll(e, 'about')}
                                className="text-gray-300 font-bold text-lg hover:text-[#00f3ff] transition-colors"
                            >
                                About Us
                            </a>
                            <a
                                href="#contact"
                                onClick={(e) => handleSmoothScroll(e, 'contact')}
                                className="text-gray-300 font-bold text-lg hover:text-[#00f3ff] transition-colors"
                            >
                                Contact Us
                            </a>
                            <div className="h-px bg-white/10 my-2"></div>
                            <Link
                                to="/login"
                                className="w-full py-3 rounded-full border border-[#00f3ff]/40 text-[#00f3ff] font-bold text-center hover:border-[#00f3ff] hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="w-full py-3 rounded-full bg-[#5865F2] text-white font-bold text-center hover:bg-[#4752c4] hover:shadow-[0_0_15px_rgba(88,101,242,0.4)] transition-all"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
