import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
    className?: string;
    children?: ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionText,
    onAction,
    className = '',
    children
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in ${className}`}>
            <div className="w-20 h-20 mb-6 rounded-full bg-gray-50 flex items-center justify-center shadow-sm">
                <Icon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {actionText && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 shadow-warm transition-transform hover:-translate-y-0.5"
                >
                    {actionText}
                </Button>
            )}
            {children}
        </div>
    );
}
