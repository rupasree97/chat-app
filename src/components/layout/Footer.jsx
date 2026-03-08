import React from 'react';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-10 bg-brand-navy/50 backdrop-blur-lg border-t border-glass-border pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                                <span className="text-white font-bold">S</span>
                            </div>
                            <span className="text-xl font-bold text-white">Sync</span>
                        </div>
                        <p className="text-text-muted mb-6">
                            The future of community communication. Real-time, secure, and beautiful.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-glass flex items-center justify-center text-text-secondary hover:bg-accent-primary hover:text-white transition-all duration-300">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Product</h4>
                        <ul className="space-y-4 text-text-muted">
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Integrations</a></li>
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Resources</h4>
                        <ul className="space-y-4 text-text-muted">
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Community</a></li>
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-accent-secondary transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Stay Updated</h4>
                        <p className="text-text-muted mb-4">Subscribe to our newsletter for updates.</p>
                        <div className="flex bg-glass rounded-lg p-1 border border-glass-border">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-transparent border-none outline-none text-text-main px-3 w-full"
                            />
                            <button className="bg-accent-primary hover:bg-accent-primaryDeep text-white px-4 py-2 rounded-md transition-colors">
                                &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-glass-border pt-8 text-center text-text-muted text-sm">
                    &copy; {new Date().getFullYear()} Sync Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
