import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { MessageSquare, Users, Shield, Zap } from 'lucide-react';

const FloatingCard = ({ icon: Icon, title, delay, x, y, rotate }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{
            opacity: 1,
            y: [0, -20, 0],
            rotate: [rotate - 2, rotate + 2, rotate - 2]
        }}
        transition={{
            opacity: { duration: 1, delay },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay },
            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", delay }
        }}
        className="absolute hidden lg:flex flex-col items-center gap-3 p-6 rounded-2xl bg-glass backdrop-blur-xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        style={{ top: y, left: x, right: x ? 'auto' : undefined }}
    >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white shadow-lg">
            <Icon size={24} />
        </div>
        <div className="text-center">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <div className="h-1 w-12 bg-accent-secondary rounded-full mx-auto mt-2" />
        </div>
    </motion.div>
);

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-secondary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-glass border border-accent-secondary/30 text-accent-secondary text-sm font-medium backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                        🚀 The Future of Messaging
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Connect with your <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-mint animate-gradient-x">
                            Community in Real-time
                        </span>
                    </h1>

                    <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
                        Experience a new era of communication with glassmorphic design,
                        3D interactions, and secure, instant messaging.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/signup">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-[0_0_30px_rgba(124,124,255,0.4)]">
                                Get Started
                            </Button>
                        </Link>
                        <Link to="/signup">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Floating Elements (Decorative) */}
            <FloatingCard icon={MessageSquare} title="Instant Chat" delay={0} x="10%" y="20%" rotate={-6} />
            <FloatingCard icon={Users} title="Communities" delay={1} x="15%" y="70%" rotate={4} />
            <FloatingCard icon={Shield} title="Secure & Private" delay={0.5} x="auto" y="25%" rotate={6} style={{ right: '10%' }} />
            <div className="absolute right-[10%] top-[25%] hidden lg:block">
                <FloatingCard icon={Shield} title="Secure" delay={0.5} rotate={6} />
            </div>
            <div className="absolute right-[15%] bottom-[20%] hidden lg:block">
                <FloatingCard icon={Zap} title="Fast" delay={1.5} rotate={-3} />
            </div>

        </section>
    );
};

export default Hero;
