import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Sample Data for the charts
const DataSets = [
    [
        { label: "CRM Software", value: 40, color: "#004aad" },
        { label: "Custom App", value: 60, color: "#83bcfb" },
    ],
    [
        { label: "E-commerce", value: 70, color: "#ff5722" },
        { label: "Sale Product", value: 30, color: "#4caf50" },
    ],
    [
        { label: "Payroll", value: 50, color: "#9c27b0" },
        { label: "Attendance", value: 50, color: "#2196f3" },
    ],
    [
        { label: "Task", value: 50, color: "#9c2700" },
        { label: "Status", value: 50, color: "#2196f3" },
    ],
    [
        { label: "Appointment", value: 50, color: "#9c27ff" },
        { label: "Meeting", value: 50, color: "#2196ff" },
    ],
];

const ChartSlider: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                (prevIndex + 1) % DataSets.length
            );
        }, 3000); // Change slides every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full max-w-md mx-auto">
            <div className="relative h-[200px] overflow-hidden">
                <AnimatePresence>
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        transition={{ duration: 0.5 }}
                        className="absolute w-full h-full"
                    >
                        <div className="h-full py-4 w-full rounded-xl backdrop-blur-sm bg-[#bae5ee]/40 dark:bg-zinc-300/10 flex flex-row justify-start">
                            <div className="basis-2/3 relative">
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <h3 className="font-semibold text-lg text-black dark:text-white text-center">
                                        Services
                                    </h3>
                                </div>
                                {/* SVG Pie Chart Placeholder */}
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {DataSets[currentIndex].map((item, index) => {
                                        const total = DataSets[currentIndex].reduce((sum, d) => sum + d.value, 0);
                                        const percentage = (item.value / total) * 100;
                                        const startAngle = index === 0 ? 0 : 
                                            DataSets[currentIndex]
                                                .slice(0, index)
                                                .reduce((sum, d) => sum + (d.value / total) * 360, 0);
                                        
                                        return (
                                            <path
                                                key={index}
                                                d={describeArc(50, 50, 40, startAngle, startAngle + (percentage / 100) * 360)}
                                                fill={item.color}
                                                stroke="white"
                                                strokeWidth="2"
                                            />
                                        );
                                    })}
                                    <circle cx="50" cy="50" r="20" fill="white" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-y-2 justify-center pr-4">
                                {DataSets[currentIndex].map((item, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <div 
                                            className="w-6 h-6" 
                                            style={{ backgroundColor: item.color }} 
                                        />
                                        <span className="font-semibold text-black dark:text-white">
                                            {item.label} {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 space-x-2">
                {DataSets.map((_, index) => (
                    <button
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                            index === currentIndex 
                                ? 'bg-black dark:bg-white' 
                                : 'bg-gray-300'
                        }`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
};

// Utility function to describe an arc path
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", x, y, 
        "Z"
    ].join(" ");
}

// Utility function to convert polar coordinates to Cartesian
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

export default ChartSlider;