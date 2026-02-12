import React from "react";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl shadow-lg sticky top-0">
      {/* Add Lead Button */}
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
        Add Lead
        <span className="text-xs">&#9662;</span> {/* Downward arrow */}
      </button>

      {/* Search Input */}
      <div className="flex items-center bg-gradient-to-r from-purple-500 to-purple-700 rounded-full px-4 py-2 w-80 shadow-inner">
        <span className="text-white text-xl mr-2">&#128269;</span> {/* Search Icon */}
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent w-full text-white text-lg outline-none placeholder-white placeholder-opacity-70"
        />
      </div>
    </div>
  );
};

export default Navbar;
