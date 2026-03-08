import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils'; // Adjust path if needed

const variants = {
    primary: "bg-accent-primary hover:bg-accent-primaryDeep text-white shadow-[0_0_15px_rgba(124,124,255,0.5)] border-transparent",
    secondary: "bg-glass hover:bg-glass-hover text-text-main border-glass-border backdrop-blur-md",
    outline: "bg-transparent border-accent-secondary text-accent-secondary hover:bg-accent-secondary/10 shadow-[0_0_10px_rgba(0,229,255,0.3)]",
    ghost: "bg-transparent hover:bg-white/5 text-text-secondary hover:text-white border-transparent",
    danger: "bg-accent-error/20 text-accent-error border-accent-error/50 hover:bg-accent-error/30"
};

const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg font-semibold"
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    onClick,
    disabled,
    type = 'button',
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative rounded-xl border transition-all duration-300 flex items-center justify-center gap-2",
                variants[variant],
                sizes[size],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            onClick={onClick}
            disabled={disabled}
            type={type}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
