/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: "#0B0F1A", // Midnight blue-black
                    navy: "#0F1629", // Deep navy
                    soft: "#141B33", // Soft dark blue
                },
                accent: {
                    primary: "#7C7CFF", // Soft neon indigo
                    primaryDeep: "#5B6CFF", // Slightly deeper
                    secondary: "#00E5FF", // Cyber cyan
                    mint: "#3DF2C6", // Mint neon
                    error: "#FF5C7C", // Soft neon red
                    success: "#3DF2C6",
                },
                text: {
                    main: "#E6ECFF",
                    secondary: "#A6B0D6",
                    muted: "#6F7AB0",
                },
                glass: {
                    DEFAULT: "rgba(255, 255, 255, 0.08)",
                    hover: "rgba(255, 255, 255, 0.12)",
                    border: "rgba(255, 255, 255, 0.18)",
                }
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                },
                speakingGlow: {
                    '0%, 100%': { borderColor: 'rgba(74, 222, 128, 0.6)', boxShadow: '0 0 12px rgba(74, 222, 128, 0.2)' },
                    '50%': { borderColor: 'rgba(74, 222, 128, 1)', boxShadow: '0 0 24px rgba(74, 222, 128, 0.4)' },
                },
                fadeInScale: {
                    from: { opacity: 0, transform: 'scale(0.85)' },
                    to: { opacity: 1, transform: 'scale(1)' },
                }
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                glow: 'glow 2s ease-in-out infinite',
                'speaking-glow': 'speakingGlow 1.5s ease-in-out infinite',
                'fade-in-scale': 'fadeInScale 0.35s ease-out',
            }
        },
    },
    plugins: [],
}
