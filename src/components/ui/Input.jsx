import React from 'react';
import { cn } from '../../lib/utils';

const Input = ({
    label,
    id,
    type = "text",
    placeholder,
    error,
    className,
    ...props
}) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-text-secondary ml-1">
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                className={cn(
                    "w-full px-4 py-3 rounded-xl bg-glass border border-glass-border text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all duration-300",
                    error && "border-accent-error focus:border-accent-error focus:ring-accent-error",
                    className
                )}
                placeholder={placeholder}
                {...props}
            />
            {error && (
                <span className="text-xs text-accent-error ml-1">{error}</span>
            )}
        </div>
    );
};

export default Input;
