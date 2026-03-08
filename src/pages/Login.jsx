import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogIn, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            setError("Please enter both username/email and password");
            return;
        }

        setLoading(true);
        try {
            await login(formData.username, formData.password);
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data || (typeof err === 'string' ? err : err.message);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const inputClasses =
        'w-full px-4 py-3.5 rounded-xl bg-[#1e2330]/80 border border-white/10 text-white placeholder:text-gray-500 font-sans text-sm focus:outline-none focus:border-[#00f3ff] focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300';

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#5865F2]/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#00f3ff]/10 rounded-full blur-[120px]" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5865F2]/5 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                <div className="rounded-2xl p-8 bg-[#1e2330]/40 backdrop-blur-xl border border-[#00f3ff]/15 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative">
                    {/* Card inner glow accents */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#00f3ff]/10 blur-[50px] rounded-full"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#5865F2]/10 blur-[50px] rounded-full"></div>

                    <Link to="/" className="inline-flex items-center text-gray-400 hover:text-[#00f3ff] mb-8 transition-colors text-sm group">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter uppercase">
                            Welcome{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#5865F2]">Back</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-light">Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#FF5C7C]/10 border border-[#FF5C7C]/30 text-[#FF5C7C] p-3 rounded-xl mb-6 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                                Username or Email
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={handleChange}
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`${inputClasses} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00f3ff] transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 rounded-xl bg-[#5865F2] text-white font-bold text-base flex items-center justify-center gap-3 hover:bg-[#4752c4] hover:shadow-[0_0_30px_rgba(88,101,242,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Logging in...
                                </span>
                            ) : (
                                <>
                                    Log In <LogIn size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p className="mt-6 text-center text-gray-500 text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-[#00f3ff] hover:text-[#00f3ff]/80 font-semibold transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
