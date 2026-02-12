// services/hierarchyService.ts
import { UserRoles } from '../_enums/enums';

export interface User {
  _id: string;
  userName: string;
  email: string;
  role: number;
  designation: string;
  manager?: string[];
  subordinate?: string[];
  isActive: boolean;
  createdBy?: string;
}

export interface HierarchyData {
  currentUser: User;
  immediateManager: User | null;
  allManagers: User[];
  immediateSubordinates: User[];
  allSubordinates: User[];
  hierarchyMap: Record<string, User[]>;
}

export class HierarchyService {
  private static roleHierarchy = {
    [UserRoles.SuperAdmin]: 1,
    [UserRoles.Admin]: 2,
    [UserRoles['VP Sales']]: 3, // VP Sales
    [UserRoles['Sales Coordinator']]: 31, //  Sales Coordinator
    [UserRoles['Area Manager']]: 4, // Area Manager
    [UserRoles['Sales Manager']]: 7, // Sales Manager
    [UserRoles['Team Lead']]: 6, // Team Lead
    [UserRoles['Sales Executive']]: 5, // Sales Executive
  };

  private static roleNames: { [key: number]: string } = {
    1: 'SuperAdmin',
    2: 'Admin',
    3: 'VP Sales',
    31: 'Sales Coordinator',
    4: 'Area Manager',
    7: 'Sales Manager',
    6: 'Team Lead',
    5: 'Sales Executive'
  };

  /**
   * Fetch user hierarchy data from the API
   */
  static async fetchUserHierarchy(userId: string, companyId: string): Promise<HierarchyData> {
    try {
      console.log(`Fetching hierarchy for userId: ${userId}, companyId: ${companyId}`);

      const response = await fetch(`/api/v1/user/hierarchy?userId=${userId}&companyId=${companyId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch hierarchy data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      // if (!data.success && data.type !== 'SUCCESS') {
      //   throw new Error(data.message || 'Failed to fetch hierarchy data');
      // }
      if (!data.message || !data.data) {
        throw new Error(data.message || 'Invalid hierarchy data structure');
      }

      return this.processHierarchyData(data.data);
    } catch (error) {
      console.error('Error fetching user hierarchy:', error);
      throw error;
    }
  }

  /**
   * Process raw hierarchy data and structure it properly
   */
  private static processHierarchyData(data: any): HierarchyData {
    console.log('Processing hierarchy data:', data);

    const { currentUser, allUsers } = data;

    if (!currentUser) {
      throw new Error('Current user not found in hierarchy data');
    }

    if (!allUsers || !Array.isArray(allUsers)) {
      throw new Error('All users data is missing or invalid');
    }

    console.log('Current User:', currentUser);
    console.log('All Users:', allUsers);

    // Find immediate manager
    const immediateManager = this.findImmediateManager(currentUser, allUsers);
    console.log('Immediate Manager:', immediateManager);

    // Find all managers in the hierarchy above
    const allManagers = this.findAllManagers(currentUser, allUsers);
    console.log('All Managers:', allManagers);

    // Find immediate subordinates
    const immediateSubordinates = this.findImmediateSubordinates(currentUser, allUsers);
    console.log('Immediate Subordinates:', immediateSubordinates);

    // Find all subordinates in the hierarchy below
    const allSubordinates = this.findAllSubordinates(currentUser, allUsers);
    console.log('All Subordinates:', allSubordinates);

    // Create role-based hierarchy map
    const hierarchyMap = this.createHierarchyMap(allUsers, currentUser);
    console.log('Hierarchy Map:', hierarchyMap);

    const result = {
      currentUser,
      immediateManager,
      allManagers,
      immediateSubordinates,
      allSubordinates,
      hierarchyMap,
    };

    console.log('Processed Hierarchy Data:', result);
    return result;
  }

  /**
   * Find the immediate manager of a user
   */
  private static findImmediateManager(currentUser: User, allUsers: User[]): User | null {
    console.log('Finding immediate manager for:', currentUser.userName);
    console.log('Current user manager array:', currentUser.manager);

    if (!currentUser.manager || currentUser.manager.length === 0) {
      console.log('No manager found for user');
      return null;
    }

    // Find the immediate manager (should be only one)
    const managerId = currentUser.manager[0];
    console.log('Looking for manager with ID:', managerId);

    const manager = allUsers.find(user => user._id === managerId);
    console.log('Found manager:', manager);

    return manager || null;
  }

  /**
   * Find all managers in the hierarchy above the current user
   */
  private static findAllManagers(currentUser: User, allUsers: User[]): User[] {
    const managers: User[] = [];
    const visited = new Set<string>();

    const findManagersRecursive = (user: User) => {
      if (!user.manager || user.manager.length === 0 || visited.has(user._id)) {
        return;
      }

      visited.add(user._id);

      for (const managerId of user.manager) {
        const manager = allUsers.find(u => u._id === managerId);
        if (manager && !managers.some(m => m._id === manager._id)) {
          managers.push(manager);
          findManagersRecursive(manager);
        }
      }
    };

    findManagersRecursive(currentUser);

    // Sort managers by role hierarchy (top to bottom)
    return managers.sort((a, b) => a.role - b.role);
  }

  /**
   * Find immediate subordinates of a user
   */
  private static findImmediateSubordinates(currentUser: User, allUsers: User[]): User[] {
    console.log('Finding immediate subordinates for:', currentUser.userName);
    console.log('Current user subordinate array:', currentUser.subordinate);

    const subordinates = allUsers.filter(user => {
      const isSubordinate = user.manager && user.manager.includes(currentUser._id) && user.isActive;
      if (isSubordinate) {
        console.log('Found subordinate:', user.userName);
      }
      return isSubordinate;
    });

    console.log('Total immediate subordinates found:', subordinates.length);
    return subordinates;
  }

  /**
   * Find all subordinates in the hierarchy below the current user
   */
  private static findAllSubordinates(currentUser: User, allUsers: User[]): User[] {
    const subordinates: User[] = [];
    const visited = new Set<string>();

    const findSubordinatesRecursive = (userId: string) => {
      if (visited.has(userId)) {
        return;
      }

      visited.add(userId);

      const directSubordinates = allUsers.filter(user =>
        user.manager && user.manager.includes(userId) && user.isActive
      );

      for (const subordinate of directSubordinates) {
        if (!subordinates.some(s => s._id === subordinate._id)) {
          subordinates.push(subordinate);
          findSubordinatesRecursive(subordinate._id);
        }
      }
    };

    findSubordinatesRecursive(currentUser._id);

    // Sort subordinates by role hierarchy
    return subordinates.sort((a, b) => a.role - b.role);
  }

  /**
   * Create a role-based hierarchy map
   */
  private static createHierarchyMap(allUsers: User[], currentUser: User): Record<string, User[]> {
    const hierarchyMap: Record<string, User[]> = {};

    // Get all users in the current user's hierarchy (managers + subordinates + self)
    const allManagers = this.findAllManagers(currentUser, allUsers);
    const allSubordinates = this.findAllSubordinates(currentUser, allUsers);
    const relevantUsers = [...allManagers, currentUser, ...allSubordinates];

    // Group by role
    for (const user of relevantUsers) {
      const roleName = this.roleNames[user.role as number] || `Role_${user.role}`;
      if (!hierarchyMap[roleName]) {
        hierarchyMap[roleName] = [];
      }
      hierarchyMap[roleName].push(user);
    }

    return hierarchyMap;
  }

  /**
   * Check if user has permission to access another user's data
   */
  static hasAccessToUser(currentUser: User, targetUserId: string, hierarchy: HierarchyData): boolean {
    // Super Admin and Admin have access to all
    if (currentUser.role <= UserRoles.Admin) {
      return true;
    }

    // Check if target user is in subordinates
    const hasSubordinateAccess = hierarchy.allSubordinates.some(sub => sub._id === targetUserId);

    // Check if target user is self
    const isSelf = currentUser._id === targetUserId;

    // Check if target user is a manager (for viewing purposes)
    const isManager = hierarchy.allManagers.some(manager => manager._id === targetUserId);

    return hasSubordinateAccess || isSelf || isManager;
  }

  /**
   * Get users that the current user can manage (create, edit, delete)
   */
  static getManageableUsers(currentUser: User, hierarchy: HierarchyData): User[] {
    if (currentUser.role <= UserRoles.Admin) {
      return hierarchy.allSubordinates;
    }

    // Return only immediate subordinates for other roles
    return hierarchy.immediateSubordinates;
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: number): string {
    return this.roleNames[role] || `Role_${role}`;
  }
}