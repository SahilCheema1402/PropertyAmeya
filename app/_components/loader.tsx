"use client";
import * as React from 'react';
import Image from 'next/image';
import Logo from '@assets/images/Ameya Innovex Logo.png';
import { useSelector_ } from '@store';

export default function Loader() {
    const loader = useSelector_((state: any) => state.store.loader);

    if (!loader) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative flex flex-col items-center space-y-4">
                {/* Spinner Container */}
                <div className="relative h-24 w-24">
                    {/* Outer Spinner Ring */}
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-transparent border-primary-500"></div>
                    
                    {/* Inner Spinner Ring */}
                    <div className="absolute inset-2 animate-spin-reverse rounded-full border-4 border-t-transparent border-primary-300/80"></div>
                    
                    {/* Logo Center */}
                    <div className="absolute inset-0 flex items-center rounded-full justify-center">
                        <Image
                            src={Logo}
                            alt="Loading"
                            className="h-12 w-12 animate-pulse rounded-full"
                            width={60}
                            height={60}
                        />
                    </div>
                </div>

                {/* Loading Text */}
                <div className="flex flex-col items-center space-y-2">
                    <span className="animate-pulse text-lg font-semibold tracking-wider text-primary-100">
                        Loading
                    </span>
                    <div className="flex space-x-1.5">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="h-2 w-2 animate-bounce rounded-full bg-primary-300"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}