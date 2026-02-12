// components/HierarchyDashboard.tsx
"use client";

import React, { useState } from 'react';
import { useHierarchy, useRolePermissions, useFilteredUsers } from '../hooks/useHierarchy';
import { FaUser, FaUsers, FaChevronDown, FaChevronUp, FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const HierarchyDashboard: React.FC = () => {
  const hierarchy = useHierarchy();
  const permissions = useRolePermissions();
  const filteredUsers = useFilteredUsers();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    managers: true,
    subordinates: true,
    roleMap: false,
    permissions: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // if (!hierarchy.isLoaded) {
  //   return (
  //     <div className="p-6 bg-gray-100 min-h-screen">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="text-center py-8">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
  //           <p className="mt-4 text-gray-600">Loading hierarchy data...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  const UserCard: React.FC<{ user: any, showActions?: boolean }> = ({ user, showActions = false }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <FaUser className="text-white text-sm" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{user.userName}</h3>
            <p className="text-sm text-gray-600">{user.designation}</p>
            <p className="text-xs text-gray-500">Role: {user.role}</p>
          </div>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <button className="p-2 text-blue-500 hover:bg-blue-50 rounded">
              <FaEye size={14} />
            </button>
            {hierarchy.canManageUser(user._id) && (
              <>
                <button className="p-2 text-green-500 hover:bg-green-50 rounded">
                  <FaEdit size={14} />
                </button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded">
                  <FaTrash size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const SectionHeader: React.FC<{ title: string, count: number, section: string }> = ({ title, count, section }) => (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center space-x-3">
        <FaUsers className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">{count}</span>
      </div>
      {expandedSections[section] ? <FaChevronUp /> : <FaChevronDown />}
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Hierarchy Dashboard</h1>
          
          {/* Current User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Current User</h2>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{hierarchy.currentUser?.userName}</h3>
                <p className="text-sm text-gray-600">{hierarchy.currentUser?.designation}</p>
                <p className="text-xs text-gray-500">Role: {hierarchy.currentUser?.role}</p>
              </div>
            </div>
          </div>
          
          {/* Hierarchy Path */}
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Hierarchy Path</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {hierarchy.getHierarchyPath().map((name, index) => (
                <React.Fragment key={index}>
                  <span className={index === hierarchy.getHierarchyPath().length - 1 ? 'font-semibold text-blue-600' : ''}>
                    {name}
                  </span>
                  {index < hierarchy.getHierarchyPath().length - 1 && <span>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <FaUsers className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Subordinates</p>
                <p className="text-2xl font-bold text-gray-800">{hierarchy.totalSubordinates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Direct Reports</p>
                <p className="text-2xl font-bold text-gray-800">{hierarchy.directReports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <FaUsers className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Managers</p>
                <p className="text-2xl font-bold text-gray-800">{hierarchy.totalManagers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white text-sm" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hierarchy Depth</p>
                <p className="text-2xl font-bold text-gray-800">{hierarchy.hierarchyDepth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Managers Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <SectionHeader title="Managers" count={hierarchy.allManagers.length} section="managers" />
          {expandedSections.managers && (
            <div className="p-4">
              {hierarchy.immediateManager && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Immediate Manager</h3>
                  <UserCard user={hierarchy.immediateManager} />
                </div>
              )}
              
              {hierarchy.allManagers.length > 1 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">All Managers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hierarchy.allManagers.map((manager) => (
                      <UserCard key={manager._id} user={manager} />
                    ))}
                  </div>
                </div>
              )}
              
              {hierarchy.allManagers.length === 0 && (
                <p className="text-gray-500 text-center py-8">No managers found</p>
              )}
            </div>
          )}
        </div>

        {/* Subordinates Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <SectionHeader title="Subordinates" count={hierarchy.allSubordinates.length} section="subordinates" />
          {expandedSections.subordinates && (
            <div className="p-4">
              {hierarchy.immediateSubordinates.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Direct Reports</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hierarchy.immediateSubordinates.map((subordinate) => (
                      <UserCard key={subordinate._id} user={subordinate} showActions={true} />
                    ))}
                  </div>
                </div>
              )}
              
              {hierarchy.allSubordinates.length > hierarchy.immediateSubordinates.length && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">All Subordinates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hierarchy.allSubordinates.map((subordinate) => (
                      <UserCard key={subordinate._id} user={subordinate} showActions={true} />
                    ))}
                  </div>
                </div>
              )}
              
              {hierarchy.allSubordinates.length === 0 && (
                <p className="text-gray-500 text-center py-8">No subordinates found</p>
              )}
            </div>
          )}
        </div>

        {/* Role-based Hierarchy Map */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <SectionHeader title="Role-based Hierarchy" count={Object.keys(hierarchy.hierarchyMap).length} section="roleMap" />
          {expandedSections.roleMap && (
            <div className="p-4">
              {Object.entries(hierarchy.hierarchyMap).map(([role, users]) => (
                <div key={role} className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">{role} ({users.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <UserCard key={user._id} user={user} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <SectionHeader title="User Permissions" count={Object.values(permissions).filter(Boolean).length} section="permissions" />
          {expandedSections.permissions && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(permissions).map(([permission, hasPermission]) => (
                  <div key={permission} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${hasPermission ? 'text-green-700' : 'text-red-700'}`}>
                      {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HierarchyDashboard;