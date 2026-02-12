// app/api/v1/user/hierarchy/route.ts
import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import User from '@app/_model/user/user.model';
import Company from '@app/_model/Companay/company.model';
import { IUser } from '@app/_interface/user.interface';

/**
 * @swagger
 * /api/v1/user/hierarchy:
 *   get:
 *     tags:
 *       - User Management
 *     description: Get user hierarchy data including managers and subordinates
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *       - name: companyId
 *         in: query
 *         required: true
 *         description: ID of the company
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hierarchy data retrieved successfully
 *       400:
 *         description: Bad request
 */
export async function GET(req: Request) {
  try {
    await DB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    
    if (!userId || !companyId) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "userId and companyId are required parameters."
      });
    }

    // Get the current user with populated data
    const currentUser = await User.findById(userId)
      .populate([{ path: 'company', model: Company }])
      .select('userName email role designation manager subordinate isActive createdBy')
      .lean();

    if (!currentUser) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "User not found."
      });
    }

    // Get all users in the same company
    const allUsers = await User.find({ 
      company: companyId,
      isActive: true 
    })
      .select('userName email role designation manager subordinate isActive createdBy')
      .lean();

    // Build the hierarchy data
    const hierarchyData = {
      currentUser,
      allUsers,
    };

    return HandleResponse({
      type: "SUCCESS",
      message: "User hierarchy retrieved successfully.",
      data: hierarchyData,
    });

  } catch (error: any) {
    console.error("Error fetching user hierarchy:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || "An error occurred while fetching user hierarchy."
    });
  }
}

/**
 * @swagger
 * /api/v1/user/hierarchy:
 *   post:
 *     tags:
 *       - User Management
 *     description: Update user hierarchy relationships
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to update
 *               managerId:
 *                 type: string
 *                 description: ID of the manager to assign
 *               action:
 *                 type: string
 *                 enum: [assign_manager, remove_manager]
 *                 description: Action to perform
 *     responses:
 *       200:
 *         description: Hierarchy updated successfully
 *       400:
 *         description: Bad request
 */
export async function POST(req: Request) {
  try {
    await DB();
    
    const { userId, managerId, action } = await req.json();
    
    if (!userId || !action) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "userId and action are required."
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "User not found."
      });
    }

    switch (action) {
      case 'assign_manager':
        if (!managerId) {
          return HandleResponse({
            type: "BAD_REQUEST",
            message: "managerId is required for assign_manager action."
          });
        }

        const manager = await User.findById(managerId);
        if (!manager) {
          return HandleResponse({
            type: "BAD_REQUEST",
            message: "Manager not found."
          });
        }

        // Check if user already has this manager
        if (user.manager && user.manager.includes(managerId)) {
          return HandleResponse({
            type: "BAD_REQUEST",
            message: "User already has this manager assigned."
          });
        }

        // Remove existing manager and assign new one (only one manager allowed)
        user.manager = [managerId];
        await user.save();

        // Add user to manager's subordinates
        if (!manager.subordinate) {
          manager.subordinate = [];
        }
        if (!manager.subordinate.includes(userId)) {
          manager.subordinate.push(userId);
          await manager.save();
        }

        break;

      case 'remove_manager':
        if (!managerId) {
          return HandleResponse({
            type: "BAD_REQUEST",
            message: "managerId is required for remove_manager action."
          });
        }

        // Remove manager from user
        if (user.manager) {
          user.manager = user.manager.filter((id: { toString: () => any; }) => id.toString() !== managerId) as typeof user.manager;
          await user.save();
        }

        // Remove user from manager's subordinates
        const formerManager = await User.findById(managerId);
        if (formerManager && formerManager.subordinate) {
          formerManager.subordinate = formerManager.subordinate.filter(id => id.toString() !== userId);
          await formerManager.save();
        }

        break;

      default:
        return HandleResponse({
          type: "BAD_REQUEST",
          message: "Invalid action. Use 'assign_manager' or 'remove_manager'."
        });
    }

    return HandleResponse({
      type: "SUCCESS",
      message: "User hierarchy updated successfully.",
    });

  } catch (error: any) {
    console.error("Error updating user hierarchy:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || "An error occurred while updating user hierarchy."
    });
  }
}