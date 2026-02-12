import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import User from '@app/_model/user/user.model';

export async function GET(req: Request) {
  try {
    await DB();
    
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "companyId is a required parameter."
      });
    }

    // Get all active users in the company
    const users = await User.find({ 
      company: companyId,
      isActive: true 
    })
    .select('userName email role designation subordinate _id')
    .lean();

    // Find Property 360 (company)
    const property360 = users.find(user => 
      user.userName.toLowerCase().includes('property 360')
    );

    if (!property360) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "No company found in the organization."
      });
    }

    // Find Mukesh Gupta (CEO) - the top of the hierarchy
    const mukeshGupta = users.find(user => 
      user.userName.toLowerCase().includes('mukesh gupta')
    );

    if (!mukeshGupta) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "No CEO found in the organization."
      });
    }

    // Define role hierarchy (higher number = higher in hierarchy)
    const roleHierarchy = {
      '1': { level: 7, name: 'Super Admin' },      // Super Admin (highest)
      '2': { level: 6, name: 'Admin' },            // Admin
      '3': { level: 5, name: 'VP Sales' },         // VP Sales
      '31': { level: 4, name: 'Sales Coordinator' }, // Sales Coordinator
      '4': { level: 3, name: 'Area Manager' },     // Area Manager
      '7': { level: 2, name: 'Sales Manager' },    // Sales Manager
      '6': { level: 1, name: 'Team Lead' },        // Team Lead
      '5': { level: 0, name: 'Sales Executive' }   // Sales Executive (lowest)
    };

    // Define the type for hierarchy node
    interface HierarchyNode {
      userName: string;
      designation: string;
      role: string;
      _id: string;
      children: HierarchyNode[];
    }

    // Helper function to get user's role level
    const getRoleLevel = (role: string): number => {
      return roleHierarchy[role as keyof typeof roleHierarchy]?.level ?? -1;
    };

    // Helper function to check if a user can be subordinate of another based on role hierarchy
    const canBeSubordinate = (parentRole: string, childRole: string): boolean => {
      const parentLevel = getRoleLevel(parentRole);
      const childLevel = getRoleLevel(childRole);
      
      // Define valid parent-child relationships
      const validRelations = {
        '2': ['3', '31'], // Admin -> VP Sales, Sales Coordinator
        '3': ['4'],       // VP Sales -> Area Manager
        '31': ['4'],      // Sales Coordinator -> Area Manager
        '4': ['7'],       // Area Manager -> Sales Manager
        '7': ['6', '5'],  // Sales Manager -> Team Lead, Sales Executive (if no team lead)
        '6': ['5']        // Team Lead -> Sales Executive
      };

      return validRelations[parentRole as keyof typeof validRelations]?.includes(childRole) || false;
    };

    // FIXED: Function to check if user is in the subordinate chain with circular reference prevention
    const isInSubordinateChain = (parentUser: any, targetUserId: string, visited: Set<string> = new Set()): boolean => {
      // Prevent infinite recursion by tracking visited users
      if (visited.has(parentUser._id.toString())) {
        return false;
      }
      
      if (!parentUser.subordinate || parentUser.subordinate.length === 0) {
        return false;
      }

      // Add current user to visited set
      visited.add(parentUser._id.toString());

      // Direct subordinate check
      if (parentUser.subordinate.some((subId: { toString: () => string; }) => subId.toString() === targetUserId)) {
        return true;
      }

      // Check indirect subordinates with visited tracking
      for (const subId of parentUser.subordinate) {
        const subordinate = users.find(u => u._id.toString() === subId.toString());
        if (subordinate && !visited.has(subordinate._id.toString())) {
          if (isInSubordinateChain(subordinate, targetUserId, new Set(visited))) {
            return true;
          }
        }
      }

      return false;
    };

    // Function to find the best parent for a user based on hierarchy rules with fallback
    const findBestParent = (user: any, allUsers: any[]): any | null => {
      const userRole = String(user.role);
      const userRoleLevel = getRoleLevel(userRole);
      
      // Define the ideal hierarchy chain for each role (from most preferred to least)
      const hierarchyChain = {
        '5': ['6', '7', '4', '3', '31', '2'], // Sales Executive -> Team Lead -> Sales Manager -> Area Manager -> VP Sales -> Sales Coordinator -> Admin
        '6': ['7', '4', '3', '31', '2'],     // Team Lead -> Sales Manager -> Area Manager -> VP Sales -> Sales Coordinator -> Admin
        '7': ['4', '3', '31', '2'],          // Sales Manager -> Area Manager -> VP Sales -> Sales Coordinator -> Admin
        '4': ['3', '31', '2'],               // Area Manager -> VP Sales -> Sales Coordinator -> Admin
        '3': ['2'],                          // VP Sales -> Admin
        '31': ['2']                          // Sales Coordinator -> Admin
      };

      // Get the hierarchy chain for this user's role
      const preferredParentRoles = hierarchyChain[userRole as keyof typeof hierarchyChain] || [];

      // Find all users who have this user in their subordinate chain
      const potentialParents = allUsers.filter(potentialParent => 
        potentialParent._id.toString() !== user._id.toString() && 
        isInSubordinateChain(potentialParent, user._id.toString())
      );

      // Try to find the best parent following the hierarchy chain
      for (const preferredRole of preferredParentRoles) {
        const parentWithRole = potentialParents.find(parent => 
          String(parent.role) === preferredRole
        );
        if (parentWithRole) {
          return parentWithRole;
        }
      }

      // Fallback: if no parent found in chain, find the highest-level parent available
      if (potentialParents.length > 0) {
        return potentialParents.sort((a, b) => 
          getRoleLevel(String(b.role)) - getRoleLevel(String(a.role))
        )[0];
      }

      return null;
    };

    // FIXED: Build hierarchy with improved circular reference prevention
    const buildRoleBasedHierarchy = (userId: string, processedUsers: Set<string> = new Set(), allUsers: any[] = users): HierarchyNode | null => {
      if (processedUsers.has(userId)) {
        return null; // Prevent circular references
      }

      const user = allUsers.find(u => u._id.toString() === userId);
      if (!user) return null;

      // Create a new Set for this branch to avoid modifying the parent's set
      const currentProcessed = new Set(processedUsers);
      currentProcessed.add(userId);

      // Get all users that are in this user's subordinate chain
      const allSubordinates = allUsers.filter(u => 
        u._id.toString() !== userId && 
        !currentProcessed.has(u._id.toString()) && // Don't include already processed users
        isInSubordinateChain(user, u._id.toString())
      );

      // For each subordinate, check if this user is their best parent
      const directChildren: any[] = [];
      
      allSubordinates.forEach(subordinate => {
        if (!currentProcessed.has(subordinate._id.toString())) {
          const bestParent = findBestParent(subordinate, allUsers);
          if (bestParent && bestParent._id.toString() === userId) {
            directChildren.push(subordinate);
          }
        }
      });

      // Remove duplicates
      const uniqueChildren = directChildren.filter((child, index, self) => 
        self.findIndex(c => c._id.toString() === child._id.toString()) === index
      );

      // Build children recursively with proper visited tracking
      const children = uniqueChildren
        .map(child => buildRoleBasedHierarchy(child._id.toString(), currentProcessed, allUsers))
        .filter((node): node is HierarchyNode => Boolean(node));

      return {
        userName: user.userName,
        designation: user.designation || '',
        role: String(user.role),
        _id: user._id.toString(),
        children: children
      };
    };

    // Build the complete hierarchy structure
    const mukeshHierarchy = buildRoleBasedHierarchy(mukeshGupta._id.toString());

    // Create the final structure with company at top
    const hierarchyData = {
      userName: property360.userName,
      designation: property360.designation || 'Company',
      role: String(property360.role),
      _id: property360._id.toString(),
      children: mukeshHierarchy ? [mukeshHierarchy] : []
    };

    return HandleResponse({
      type: "SUCCESS",
      message: "Organizational hierarchy retrieved successfully.",
      data: hierarchyData,
    });

  } catch (error: any) {
    console.error("Error fetching organizational hierarchy:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || "An error occurred while fetching organizational hierarchy."
    });
  }
}