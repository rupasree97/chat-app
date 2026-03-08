import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, UserPlus, Camera, X, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        bio: '',
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: null }));
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, avatar: 'Image must be under 5MB' }));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAvatar = () => {
        setAvatar(null);
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = "Username is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6) newErrors.password = "Must be at least 6 characters";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await signup(formData.username, formData.email, formData.password, formData.bio, avatar);
            navigate('/dashboard');
        } catch (err) {
            setErrors({ form: typeof err === 'string' ? err : err.message });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses =
        'w-full px-4 py-3.5 rounded-xl bg-[#1e2330]/80 border border-white/10 text-white placeholder:text-gray-500 font-sans text-sm focus:outline-none focus:border-[#00f3ff] focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300';

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#00f3ff]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#5865F2]/15 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5865F2]/5 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                <div className="rounded-2xl p-8 bg-[#1e2330]/40 backdrop-blur-xl border border-[#00f3ff]/15 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden relative">
                    {/* Card inner glow accents */}
                    <div className="absolute -top-8 -left-8 w-24 h-24 bg-[#5865F2]/10 blur-[50px] rounded-full"></div>
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#00f3ff]/10 blur-[50px] rounded-full"></div>

                    <Link to="/" className="inline-flex items-center text-gray-400 hover:text-[#00f3ff] mb-6 transition-colors text-sm group">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>

                    <div className="text-center mb-6">
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter uppercase">
                            Create{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#5865F2]">Account</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-light">Join the community today</p>
                    </div>

                    {/* Profile Picture Upload */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 rounded-full bg-[#1e2330] border-2 border-dashed border-[#00f3ff]/30 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#00f3ff]/60 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]"
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={24} className="text-[#00f3ff]/50 group-hover:text-[#00f3ff] transition-colors" />
                                )}
                            </div>
                            {avatarPreview && (
                                <button
                                    onClick={removeAvatar}
                                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF5C7C] flex items-center justify-center hover:bg-[#FF5C7C]/80 transition-colors"
                                >
                                    <X size={12} className="text-white" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                    <p className="text-center text-gray-500 text-xs mb-6 -mt-2">Upload a profile picture (optional)</p>

                    {errors.form && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#FF5C7C]/10 border border-[#FF5C7C]/30 text-[#FF5C7C] p-3 rounded-xl mb-6 text-sm text-center"
                        >
                            {errors.form}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={handleChange}
                                className={`${inputClasses} ${errors.username ? 'border-[#FF5C7C] focus:border-[#FF5C7C] focus:shadow-[0_0_15px_rgba(255,92,124,0.2)]' : ''}`}
                            />
                            {errors.username && <span className="text-xs text-[#FF5C7C] ml-1 mt-1 block">{errors.username}</span>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={`${inputClasses} ${errors.email ? 'border-[#FF5C7C] focus:border-[#FF5C7C] focus:shadow-[0_0_15px_rgba(255,92,124,0.2)]' : ''}`}
                            />
                            {errors.email && <span className="text-xs text-[#FF5C7C] ml-1 mt-1 block">{errors.email}</span>}
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
                                    className={`${inputClasses} pr-12 ${errors.password ? 'border-[#FF5C7C] focus:border-[#FF5C7C] focus:shadow-[0_0_15px_rgba(255,92,124,0.2)]' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00f3ff] transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-xs text-[#FF5C7C] ml-1 mt-1 block">{errors.password}</span>}
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                                Bio <span className="text-gray-500 font-normal">(optional)</span>
                            </label>
                            <textarea
                                id="bio"
                                rows={2}
                                placeholder="Tell us about yourself..."
                                value={formData.bio}
                                onChange={handleChange}
                                className={`${inputClasses} resize-none`}
                            />
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
                                    Creating Account...
                                </span>
                            ) : (
                                <>
                                    Sign Up <UserPlus size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p className="mt-6 text-center text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#00f3ff] hover:text-[#00f3ff]/80 font-semibold transition-colors">
                            Log in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
