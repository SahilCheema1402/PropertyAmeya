// app/(pages)/Hierarchy/page.tsx
"use client";
import React from "react";
import Sidebar from "../../_components/Sidebar";
import dynamic from "next/dynamic";

const HierarchyChart = dynamic(() => import("../../_components/HierarchyChart"), { ssr: false });

const HierarchyPage = () => (
  <div className="flex h-screen bg-gray-100">
    <Sidebar />
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Employees</h1>
      <HierarchyChart />
    </div>
  </div>
);

export default HierarchyPage;
