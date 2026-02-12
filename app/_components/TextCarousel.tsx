"use client"

import React, { useState, useEffect } from "react";

const TextCarousel: React.FC = () => {
    const fisrtUL = [
        "CRM Software 40",
        "Ecomerce 70",
        "Payroll 50",
        "Task 50",
        "Appointment 50"
    ];

    const secondUL = [
        "Custom App 60",
        "Sale Product 30",
        "Attendance 50",
        "Status 50",
        "Meeting 50"
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % fisrtUL.length);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [fisrtUL.length]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % secondUL.length);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [secondUL.length]);

    return (
        <div className="carousel-container gap-6">
            <div className="relative w-[120px] h-[120px] rounded-full border-[10px] border-blue-500 bg-transparent">
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <span className="text-lg font-semibold text-gray-800 z-0">Services</span>
                </div>
            </div>
            <ul className="mt-6 text-sm space-y-2 text-gray-700">
                <li className="flex items-center space-x-2">
                    <div className="w-2 h-4 bg-blue-500"></div>
                    <span>{fisrtUL[currentIndex]}</span>
                </li>
                <li className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-300"></div>
                    <span>{secondUL[currentIndex]}</span>
                </li>
            </ul>
            {/* <p className="carousel-text">{texts[currentIndex]}</p> */}
        </div>
    );
};

export default TextCarousel;
