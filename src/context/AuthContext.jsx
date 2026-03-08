import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/axios";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to process user data from backend (map profilePicture to avatar)
    const normalizeUser = (u) => {
        if (!u) return null;
        return {
            id: u._id || u.id,
            username: u.username,
            avatar: u.profilePicture || u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
            bio: u.bio || '',
            status: u.status || 'online',
            bannerColor: u.bannerColor || '#5865F2',
            nitro: u.nitro || { isActive: false, planType: 'none' },
            profileEffects: u.profileEffects || {},
            selectedProfileTheme: u.selectedProfileTheme || 'none',
            walletBalance: u.walletBalance || 0,
        };
    };

    // Initial hydration — fetch FRESH user from DB, not stale localStorage
    useEffect(() => {
        const hydrate = async () => {
            const storedUser = localStorage.getItem("chat_user");
            const storedToken = localStorage.getItem("chat_token");

            if (storedUser && storedToken) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    const userId = parsedUser._id || parsedUser.id;

                    // Fetch fresh user data from backend
                    const res = await api.get(`/auth/me?userId=${userId}`);
                    const freshData = res.data;
                    const normalizedUser = normalizeUser(freshData);
                    setCurrentUser(normalizedUser);
                    localStorage.setItem("chat_user", JSON.stringify(normalizedUser));
                } catch (e) {
                    // Network error — use stored data as fallback
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        setCurrentUser(normalizeUser(parsedUser));
                    } catch {
                        localStorage.removeItem("chat_user");
                        localStorage.removeItem("chat_token");
                    }
                }
            }
        };

        const fetchAllUsers = async () => {
            try {
                const usersRes = await api.get('/auth/users');
                const mappedUsers = usersRes.data.map(normalizeUser);
                setAllUsers(mappedUsers);
            } catch (e) {
                console.error("Failed to fetch all users", e);
            }
        };

        const init = async () => {
            await hydrate();
            await fetchAllUsers();
            setLoading(false);
        };

        init();
    }, []);

    const signup = async (username, email, password, bio = '', avatar = null) => {
        try {
            const res = await api.post('/auth/register', {
                username,
                email,
                password,
                profilePicture: avatar
            });
            const data = res.data;

            const normalizedUser = normalizeUser(data);

            setCurrentUser(normalizedUser);
            localStorage.setItem("chat_user", JSON.stringify(normalizedUser));
            if (data.token) localStorage.setItem("chat_token", data.token);

            return normalizedUser;
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            const data = res.data;

            // Immediately fetch fresh user data from /me using the returned ID
            const userId = data._id || data.id;
            const freshRes = await api.get(`/auth/me?userId=${userId}`);
            const freshData = freshRes.data;
            const finalUser = normalizeUser(freshData);

            setCurrentUser(finalUser);
            localStorage.setItem("chat_user", JSON.stringify(finalUser));
            if (data.token) localStorage.setItem("chat_token", data.token);

            return finalUser;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("chat_user");
        localStorage.removeItem("chat_token");
    };

    const updateProfile = async (updates) => {
        if (!currentUser) return;

        try {
            const res = await api.put('/auth/profile', {
                userId: currentUser.id,
                username: updates.username,
                bio: updates.bio,
                profilePicture: updates.avatar, // frontend uses 'avatar', backend uses 'profilePicture'
                bannerColor: updates.bannerColor,
                status: updates.status,
                profileEffects: updates.profileEffects,
            });

            const data = res.data;
            const normalizedUser = normalizeUser(data);
            setCurrentUser(normalizedUser);
            localStorage.setItem("chat_user", JSON.stringify(normalizedUser));
        } catch (error) {
            console.error("Profile update error:", error);
        }
    };

    const getAllUsers = () => allUsers;

    const handleUserUpdated = useCallback((updatedUserData) => {
        const normalized = normalizeUser(updatedUserData);
        setAllUsers(prev => prev.map(u => (u.id === normalized.id || u._id === normalized.id) ? normalized : u));

        if (currentUser && (currentUser.id === normalized.id || currentUser._id === normalized.id)) {
            setCurrentUser(normalized);
            localStorage.setItem("chat_user", JSON.stringify(normalized));
        }
    }, [currentUser]);

    const value = {
        currentUser,
        allUsers,
        getAllUsers,
        signup,
        login,
        logout,
        updateProfile,
        loading,
        handleUserUpdated
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
