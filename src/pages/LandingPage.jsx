import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import ContactSection from '../components/landing/ContactSection';

const LandingPage = () => {
    return (
        <div className="bg-[#0a0e17] text-white selection:bg-[#5865F2] selection:text-white overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <AboutSection />
            <ContactSection />
        </div>
    );
};

export default LandingPage;
