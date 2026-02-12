import React from "react";

const ScrollArea = ({ children, className }: any) => {
    return (
        <div className={`overflow-y-auto ${className}`}>
            {children}
        </div>
    );
};

export default ScrollArea;