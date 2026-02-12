import React from "react";

interface HeaderProps {
  header?: string;
}

export default function Header({ header }: HeaderProps) {
  return (
    <header className="w-full flex items-center justify-center py-2 px-4 bg-white shadow-md rounded-md">
      <h1 className="font-medium text-lg text-gray-900 dark:text-white">
        {header || "Property 360"}
      </h1>
    </header>
  );
}
