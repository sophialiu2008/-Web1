import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackClassName?: string;
    fallbackIcon?: React.ReactNode;
    fallbackText?: string;
}

export function ImageFallback({
    src,
    alt,
    className,
    fallbackClassName,
    fallbackIcon,
    fallbackText = '暂无图片',
    ...props
}: ImageFallbackProps) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div
                className={cn(
                    'w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400',
                    fallbackClassName,
                    className
                )}
            >
                {fallbackIcon || <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />}
                <span className="text-sm font-medium">{fallbackText}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
}
