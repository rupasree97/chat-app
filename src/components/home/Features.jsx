import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Hash, ShieldCheck } from 'lucide-react';

// Simple Tilt Card using framer-motion (simulated with hover)
const FeatureCard = ({ icon: Icon, title, description, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={{
                scale: 1.05,
                rotateX: 5,
                rotateY: 5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}
            className="p-8 rounded-3xl bg-glass backdrop-blur-xl border border-glass-border group transition-all duration-300"
        >
            <div className="w-14 h-14 rounded-2xl bg-brand-soft/50 flex items-center justify-center mb-6 text-accent-secondary group-hover:bg-accent-primary group-hover:text-white transition-colors duration-300 shadow-[0_0_20px_rgba(0,0,0,0.1)] group-hover:shadow-[0_0_20px_rgba(124,124,255,0.4)]">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-secondary transition-colors">{title}</h3>
            <p className="text-text-secondary leading-relaxed group-hover:text-text-main transition-colors">
                {description}
            </p>
        </motion.div>
    );
};

const Features = () => {
    const features = [
        {
            icon: MessageCircle,
            title: "Real-time Chat",
            description: "Instant messaging with glassmorphic bubbles and smooth animations. Experience zero latency."
        },
        {
            icon: Users,
            title: "Communities",
            description: "Join or create communities. Organize your conversations and connect with like-minded people."
        },
        {
            icon: Hash,
            title: "Channels",
            description: "Structured conversations with dedicated channels for every topic. Keep discussions focused."
        },
        {
            icon: ShieldCheck,
            title: "Secure Login",
            description: "Your data is safe with us. We use advanced encryption (simulated) to protect your privacy."
        }
    ];

    return (
        <section id="features" className="py-24 relative bg-brand-navy/30">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Why Choose <span className="text-accent-secondary">Sync</span>?
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto text-lg">
                        More than just a chat app. It's a digital space designed for the future of community interaction.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <FeatureCard key={idx} {...feature} delay={idx * 0.1} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
