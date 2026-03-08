import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';

const ContactSection = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate submission
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', message: '' });
        }, 3000);
    };

    const inputClasses =
        'w-full px-4 py-3.5 rounded-xl bg-[#1e2330]/80 border border-white/10 text-white placeholder:text-gray-500 font-sans text-sm focus:outline-none focus:border-[#00f3ff] focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300';

    return (
        <section
            id="contact"
            className="relative w-full py-28 bg-[#0a0e17] overflow-hidden"
        >
            {/* Background effects */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%] bg-[#00f3ff]/8 blur-[150px] rounded-full"></div>
            <div className="absolute top-0 right-0 w-[25%] h-[25%] bg-[#5865F2]/10 blur-[120px] rounded-full"></div>

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
                        Contact{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#5865F2]">
                            Us
                        </span>
                    </h2>
                    <p className="text-lg text-gray-300 max-w-xl mx-auto leading-relaxed font-light">
                        Got a question, feedback, or just want to say hi? Drop us a message
                        and we'll get back to you at light speed.
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="relative rounded-2xl p-8 bg-[#1e2330]/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Corner glow accents */}
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#00f3ff]/10 blur-[60px] rounded-full"></div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#5865F2]/10 blur-[60px] rounded-full"></div>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-12 gap-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-[#3DF2C6]/20 flex items-center justify-center">
                                    <CheckCircle size={32} className="text-[#3DF2C6]" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                                <p className="text-gray-400 text-sm text-center">
                                    Thanks for reaching out. We'll respond faster than a ping.
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-300 mb-2 ml-1"
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-300 mb-2 ml-1"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="message"
                                        className="block text-sm font-medium text-gray-300 mb-2 ml-1"
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        placeholder="What's on your mind?"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        className={`${inputClasses} resize-none`}
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-[#5865F2] text-white font-bold text-base flex items-center justify-center gap-3 hover:bg-[#4752c4] hover:shadow-[0_0_30px_rgba(88,101,242,0.5)] transition-all duration-300"
                                >
                                    Send Message
                                    <Send size={18} />
                                </motion.button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ContactSection;
