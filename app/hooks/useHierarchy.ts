// hooks/useHierarchy.ts
import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';
import { HierarchyService } from '../services/hierarchyService';
import { setUserHierarchy, clearHierarchy } from '../_api_query/store';

export interface User {
  _id: string;
  userName: string;
  email: string;
  role: number;
  designation: string;
  manager?: string[];
  subordinate?: string[];
  isActive: boolean;
}

export interface HierarchyState {
  currentUser: User | null;
  immediateManager: User | null;
  allManagers: User[];
  immediateSubordinates: User[];
  allSubordinates: User[];
  hierarchyMap: Record<string, User[]>;
}

export const useHierarchy = () => {
  const dispatch = useDispatch();
  const hierarchy = useSelector((state: any) => state.store.hierarchy) as HierarchyState;

  // Memoized computed values
  const computedHierarchy = useMemo(() => {
    const {
      currentUser,
      immediateManager,
      allManagers,
      immediateSubordinates,
      allSubordinates,
      hierarchyMap
    } = hierarchy;

    return {
      // Basic hierarchy data
      currentUser,
      immediateManager,
      allManagers,
      immediateSubordinates,
      allSubordinates,
      hierarchyMap,

      // Computed boolean flags
      hasManager: immediateManager !== null,
      hasSubordinates: immediateSubordinates.length > 0,
      isTopLevel: allManagers.length === 0,
      isBottomLevel: allSubordinates.length === 0,

      // Role-based access
      isSuperAdmin: currentUser?.role === 1,
      isAdmin: currentUser?.role === 2,
      isVPSales: currentUser?.role === 3,
      isAreaManager: currentUser?.role === 4,
      isSalesManager: currentUser?.role === 5,
      isTeamLead: currentUser?.role === 6,

      // Hierarchy statistics
      totalSubordinates: allSubordinates.length,
      totalManagers: allManagers.length,
      directReports: immediateSubordinates.length,
      hierarchyDepth: allManagers.length + 1,

      // Role-specific user lists
      superAdmins: hierarchyMap['SuperAdmin'] || [],
      admins: hierarchyMap['Admin'] || [],
      vpSales: hierarchyMap['VP Sales'] || [],
      areaManagers: hierarchyMap['Area Manager'] || [],
      salesManagers: hierarchyMap['Sales Manager'] || [],
      teamLeads: hierarchyMap['Team Lead/Sales Executive'] || [],
    };
  }, [hierarchy]);

  // Utility functions
  const refreshHierarchy = async (userId: string, companyId: string) => {
    try {
      const hierarchyData = await HierarchyService.fetchUserHierarchy(userId, companyId);
      dispatch(setUserHierarchy(hierarchyData));
      return hierarchyData;
    } catch (error) {
      console.error('Error refreshing hierarchy:', error);
      throw error;
    }
  };

  const clearHierarchyData = () => {
    dispatch(clearHierarchy());
  };

  const hasAccessToUser = (targetUserId: string): boolean => {
    if (!computedHierarchy.currentUser || !hierarchy.currentUser) return false;
    return HierarchyService.hasAccessToUser(
      computedHierarchy.currentUser,
      targetUserId,
      hierarchy as any // or cast to HierarchyData if you have the type imported
    );
  };

  const getManageableUsers = (): User[] => {
    if (!computedHierarchy.currentUser) return [];
    return HierarchyService.getManageableUsers(
      computedHierarchy.currentUser,
      hierarchy as any
    );
  };

  const getUsersByRole = (role: number): User[] => {
    const roleName = HierarchyService.getRoleDisplayName(role);
    return computedHierarchy.hierarchyMap[roleName] || [];
  };

  const canManageUser = (targetUserId: string): boolean => {
    return getManageableUsers().some(user => user._id === targetUserId);
  };

  const getHierarchyPath = (): string[] => {
    const path = [];
    
    // Add all managers from top to bottom
    const sortedManagers = [...computedHierarchy.allManagers].sort((a, b) => a.role - b.role);
    path.push(...sortedManagers.map(manager => manager.userName));
    
    // Add current user
    if (computedHierarchy.currentUser) {
      path.push(computedHierarchy.currentUser.userName);
    }
    
    return path;
  };

  const getSubordinatesByLevel = (): Record<number, User[]> => {
    const subordinatesByLevel: Record<number, User[]> = {};
    
    if (!computedHierarchy.currentUser) return subordinatesByLevel;
    
    const currentUserRole = computedHierarchy.currentUser.role;
    
    computedHierarchy.allSubordinates.forEach(subordinate => {
      const level = subordinate.role - currentUserRole;
      if (!subordinatesByLevel[level]) {
        subordinatesByLevel[level] = [];
      }
      subordinatesByLevel[level].push(subordinate);
    });
    
    return subordinatesByLevel;
  };

  return {
    ...computedHierarchy,
    
    // Utility functions
    refreshHierarchy,
    clearHierarchyData,
    hasAccessToUser,
    getManageableUsers,
    getUsersByRole,
    canManageUser,
    getHierarchyPath,
    getSubordinatesByLevel,
    
    // Helper methods
    isLoaded: computedHierarchy.currentUser !== null,
    isEmpty: computedHierarchy.currentUser === null,
  };
};

// Hook for specific role-based permissions
export const useRolePermissions = () => {
  const hierarchy = useHierarchy();
  
  const permissions = useMemo(() => {
    const { currentUser, isSuperAdmin, isAdmin } = hierarchy;
    
    if (!currentUser) {
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageRoles: false,
        canViewReports: false,
        canExportData: false,
        canManageCompany: false,
      };
    }
    
    return {
      canCreateUser: isSuperAdmin || isAdmin,
      canEditUser: isSuperAdmin || isAdmin,
      canDeleteUser: isSuperAdmin || isAdmin,
      canViewAllUsers: isSuperAdmin || isAdmin,
      canManageRoles: isSuperAdmin || isAdmin,
      canViewReports: currentUser.role <= 4, // Up to Area Manager
      canExportData: currentUser.role <= 3, // Up to VP Sales
      canManageCompany: isSuperAdmin,
    };
  }, [hierarchy]);
  
  return permissions;
};

// Hook for getting filtered user lists based on current user's permissions
export const useFilteredUsers = () => {
  const hierarchy = useHierarchy();
  
  const filteredUsers = useMemo(() => {
    const {
      currentUser,
      allManagers,
      immediateSubordinates,
      allSubordinates,
      isSuperAdmin,
      isAdmin
    } = hierarchy;
    
    if (!currentUser) {
      return {
        viewableUsers: [],
        editableUsers: [],
        assignableManagers: [],
        assignableSubordinates: [],
      };
    }
    
    // Users that can be viewed
    const viewableUsers = isSuperAdmin || isAdmin 
      ? [...allManagers, currentUser, ...allSubordinates]
      : [...allManagers, currentUser, ...allSubordinates];
    
    // Users that can be edited
    const editableUsers = isSuperAdmin || isAdmin
      ? allSubordinates
      : immediateSubordinates;
    
    // Potential managers that can be assigned
    const assignableManagers = allManagers.filter(manager => 
      manager.role < currentUser.role
    );
    
    // Potential subordinates that can be assigned
    const assignableSubordinates = allSubordinates.filter(subordinate =>
      subordinate.role > currentUser.role
    );
    
    return {
      viewableUsers,
      editableUsers,
      assignableManagers,
      assignableSubordinates,
    };
  }, [hierarchy]);
  
  return filteredUsers;
};