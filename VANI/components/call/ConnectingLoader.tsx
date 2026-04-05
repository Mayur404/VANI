'use client';

import { cn } from '@/lib/utils';

interface ConnectingLoaderProps {
    patientInitials?: string;
    className?: string;
}

const ConnectingLoader = ({ patientInitials = 'P', className }: ConnectingLoaderProps) => {
    return (
        <div className={cn('flex flex-col items-center gap-6', className)}>
            {/* Outer ring with patient initials */}
            <div className="relative">
                {/* Expanding ring animation */}
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/50" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />

                {/* Patient avatar circle */}
                <div className="relative w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-teal-500/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-teal-500 font-oxanium">{patientInitials}</span>
                </div>
            </div>

            {/* Three pulsing dots */}
            <div className="flex items-center gap-2">
                <div
                    className="w-2.5 h-2.5 rounded-full bg-green-500"
                    style={{
                        animation: 'pulse-dot 1.5s ease-in-out infinite',
                        animationDelay: '0s'
                    }}
                />
                <div
                    className="w-2.5 h-2.5 rounded-full bg-green-500"
                    style={{
                        animation: 'pulse-dot 1.5s ease-in-out infinite',
                        animationDelay: '0.2s'
                    }}
                />
                <div
                    className="w-2.5 h-2.5 rounded-full bg-green-500"
                    style={{
                        animation: 'pulse-dot 1.5s ease-in-out infinite',
                        animationDelay: '0.4s'
                    }}
                />
            </div>

            <style jsx>{`
                @keyframes pulse-dot {
                    0%, 100% {
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default ConnectingLoader;
