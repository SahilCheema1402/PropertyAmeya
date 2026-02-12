import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import User from './../../../_model/user/user.model';
import leadModel from './../../../_model/LeadModel/lead.model';
import { map } from 'p-iteration';
import { DateTime } from 'luxon';
import { Notification_Create } from '../notification/notificationUtils';
import QueryModels from '@app/_model/LeadModel/Query.models';

/**
 * Helper function to check if adding a subordinate would create a circular reference
 * @param managerId - The manager's ID
 * @param newSubordinateId - The new subordinate's ID to be added
 * @param users - All users in the system (optional, will fetch if not provided)
 * @returns Promise<boolean> - true if circular reference would be created
 */
async function wouldCreateCircularReference(
  managerId: string,
  newSubordinateId: string,
  users?: any[]
): Promise<boolean> {
  // If manager and subordinate are the same, it's circular
  if (managerId === newSubordinateId) {
    return true;
  }

  // Fetch all users if not provided
  if (!users) {
    users = await User.find({ isActive: true }).select('_id subordinate').lean();
  }

  // Helper function to check if managerId is a subordinate of newSubordinateId
  const isSubordinateOf = (parentId: string, childId: string, visited: Set<string> = new Set()): boolean => {
    // Prevent infinite loops
    if (visited.has(parentId)) {
      return false;
    }
    visited.add(parentId);

    // Find the parent user
    const parentUser = users.find(u => u._id.toString() === parentId);
    if (!parentUser || !parentUser.subordinate || parentUser.subordinate.length === 0) {
      return false;
    }

    // Check direct subordinates
    for (const subId of parentUser.subordinate) {
      if (subId.toString() === childId) {
        return true;
      }

      // Check indirect subordinates (recursive)
      if (isSubordinateOf(subId.toString(), childId, new Set(visited))) {
        return true;
      }
    }

    return false;
  };

  // Check if the manager is already a subordinate of the new subordinate
  // This would create a circular reference
  return isSubordinateOf(newSubordinateId, managerId);
}

/**
 * @swagger
 * tags:  
 *   - name: User Management
 *     description: Operations related to user management
 * 
 * /api/v1/user:
 *   post:
 *     tags:
 *       - User Management
 *     description: Create a user as admin or staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User added successfully!
 *       400:
 *         description: Bad request
 */
export async function POST(req: Request) {
  try {
    await DB();
    const body = await req.json();
    const user: any = JSON.parse(req.headers.get('user') as string);

    console.log('Received POST body:', JSON.stringify(body, null, 2));

    // Validate manager assignment to prevent circular references
    if (body.manager) {
      const wouldBeCircular = await wouldCreateCircularReference(body.manager, user._id);
      if (wouldBeCircular) {
        return HandleResponse({
          type: "BAD_REQUEST",
          message: "Cannot assign this manager: it would create a circular subordinate relationship."
        });
      }
    }

    // **FIX: Ensure role is properly set from the request body**
    // The frontend sends 'role' field directly, not 'staffRole'
    const userData = {
      ...body,
      role: body.role || body.staffRole, // Use 'role' from body, fallback to 'staffRole' if present
      company: user?.company?._id,
      isActive: true,
      createAt: DateTime.now().setZone('Asia/Kolkata'),
      updateAt: DateTime.now().setZone('Asia/Kolkata'),
      createdBy: user?._id,
    };

    // Remove staffRole if it exists since we're using role
    if (userData.staffRole !== undefined) {
      delete userData.staffRole;
    }

    console.log('Creating user with data:', JSON.stringify(userData, null, 2));

    const staff = new User(userData);

    await staff.save();

    // Update manager's subordinate list
    if (body.manager) {
      const ManagerUpdate = await User.findByIdAndUpdate(
        body.manager,
        { $push: { subordinate: staff._id } },
        { new: true }
      );
      ManagerUpdate?.save();
    }

    // Update creator's staff list
    const updatedData = await User.findByIdAndUpdate(
      user?._id,
      { $push: { staff: staff._id } },
      { new: true }
    );
    updatedData?.save();

    // **FIX: Handle subordinates assignment for the newly created staff**
    if (body.subordinate && Array.isArray(body.subordinate) && body.subordinate.length > 0) {
      // Update each subordinate to have this new staff as their manager
      await Promise.all(body.subordinate.map(async (subordinateId: string) => {
        await User.findByIdAndUpdate(
          subordinateId,
          { manager: staff._id },
          { new: true }
        );
      }));

      console.log(`Updated ${body.subordinate.length} subordinates with new manager: ${staff._id}`);
    }

    return HandleResponse({
      type: "SUCCESS",
      message: "Staff Created successfully",
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return HandleResponse({
        type: "BAD_REQUEST",
        message: `Duplicate key error. ${error.keyValue[duplicateField]} already exists.`,
      });
    } else {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: error?.message
      });
    }
  }
}

export async function GET(req: Request) {
  try {
    await DB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const bypassHierarchy = searchParams.get('bypassHierarchy') === 'true';

    if (!userId) {
      return HandleResponse({
        type: "SUCCESS",
        message: "All staff fetched",
        data: await User.find({ isActive: true })
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return HandleResponse({
        type: "NOT_FOUND",
        message: "User not found"
      });
    }

    // For admin/superadmin - return all staff
    if (user.role <= 2) {
      return HandleResponse({
        type: "SUCCESS",
        message: "All staff fetched",
        data: await User.find({ isActive: true })
      });
    }

    // NEW: For role 31 with bypass hierarchy flag - return all staff
    if (user.role === 31 && bypassHierarchy) {
      return HandleResponse({
        type: "SUCCESS",
        message: "All staff fetched (Role 31 special assignment)",
        data: await User.find({ isActive: true })
      });
    }

    // For other roles (3,4,5,31 without bypass) - return self + subordinates
    const staffList = await User.find({
      $or: [
        { _id: userId },
        { _id: { $in: user.subordinate } }
      ],
      isActive: true
    });

    return HandleResponse({
      type: "SUCCESS",
      message: "Staff fetched",
      data: staffList
    });

  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error.message
    });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { _id, ...data } = body.body;
    const user: any = JSON.parse(req.headers.get('user') as string);

    console.log('Received PUT body:', JSON.stringify(body, null, 2));

    const existingUser = await User.findById(_id);
    if (!existingUser) {
      return HandleResponse({ type: "BAD_REQUEST", message: "User Not Found" });
    }

    // Check if manager is being updated and validate circular reference
    if (data.manager && data.manager !== existingUser.manager?.toString()) {
      const wouldBeCircular = await wouldCreateCircularReference(data.manager, _id);
      if (wouldBeCircular) {
        return HandleResponse({
          type: "BAD_REQUEST",
          message: "Cannot assign this manager: it would create a circular subordinate relationship."
        });
      }

      // Remove user from old manager's subordinate list
      if (existingUser.manager) {
        await User.findByIdAndUpdate(
          existingUser.manager,
          { $pull: { subordinate: _id } },
          { new: true }
        );
      }

      // Add user to new manager's subordinate list
      await User.findByIdAndUpdate(
        data.manager,
        { $push: { subordinate: _id } },
        { new: true }
      );
    }

    // If manager is being removed (set to null/undefined)
    if ((data.hasOwnProperty('manager') && !data.manager) && existingUser.manager) {
      await User.findByIdAndUpdate(
        existingUser.manager,
        { $pull: { subordinate: _id } },
        { new: true }
      );
    }

    // **FIX: Handle subordinate updates**
    if (data.hasOwnProperty('subordinate')) {
      const newSubordinates = data.subordinate || [];
      const currentSubordinates = existingUser.subordinate || [];

      // Find subordinates to remove (were in current but not in new)
      const subordinatesToRemove = currentSubordinates.filter(
        sub => !newSubordinates.includes(sub.toString())
      );

      // Find subordinates to add (are in new but not in current)
      const subordinatesToAdd = newSubordinates.filter(
        (sub: { toString: () => string; }) => !currentSubordinates.some(current => current.toString() === sub.toString())
      );

      console.log('Subordinates to remove:', subordinatesToRemove);
      console.log('Subordinates to add:', subordinatesToAdd);

      // Remove manager relationship from removed subordinates
      if (subordinatesToRemove.length > 0) {
        await Promise.all(subordinatesToRemove.map(async (subId: any) => {
          await User.findByIdAndUpdate(
            subId.toString(),
            { $unset: { manager: "" } },
            { new: true }
          );
        }));
      }

      // Add manager relationship to new subordinates
      if (subordinatesToAdd.length > 0) {
        await Promise.all(subordinatesToAdd.map(async (subId: string) => {
          await User.findByIdAndUpdate(
            subId,
            { manager: _id },
            { new: true }
          );
        }));
      }
    }

    // **FIX: Map staffRole to role field and ensure proper role handling**
    const updateData = { ...data };
    if (data.staffRole !== undefined) {
      updateData.role = data.staffRole;
      // Remove staffRole from updateData since it's not a database field
      delete updateData.staffRole;
    }

    // Ensure role is properly set if it comes directly
    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    console.log('Final update data:', JSON.stringify(updateData, null, 2));

    await User.findByIdAndUpdate(_id, {
      ...updateData,
      updateAt: DateTime.now().setZone('Asia/Kolkata')
    }, { new: true });

    return HandleResponse({
      type: "SUCCESS",
      message: "Staff updated successfully.",
    });
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: "User Update Error: " + error.message,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { _id } = body.body;

    const userData = await User.findById(_id);
    if (!userData) {
      return HandleResponse({ message: "User is not present", type: "BAD_REQUEST" });
    }

    // Remove user from their manager's subordinate list
    if (userData.manager) {
      await User.findByIdAndUpdate(
        userData.manager,
        { $pull: { subordinate: _id } },
        { new: true }
      );
    }

    // Handle subordinates - either reassign them or remove the relationship
    if (userData.subordinate && userData.subordinate.length > 0) {
      // Option 1: Remove manager relationship from subordinates (they become orphaned)
      await User.updateMany(
        { _id: { $in: userData.subordinate } },
        { $unset: { manager: "" } }
      );

      // Option 2: Reassign subordinates to deleted user's manager
      // if (userData.manager) {
      //     await User.updateMany(
      //         { _id: { $in: userData.subordinate } },
      //         { $set: { manager: userData.manager } }
      //     );
      //     
      //     await User.findByIdAndUpdate(
      //         userData.manager,
      //         { $push: { subordinate: { $each: userData.subordinate } } }
      //     );
      // }
    }

    await User.findByIdAndDelete(_id);

    return HandleResponse({ message: "User deleted successfully", type: "SUCCESS" });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: "Delete user error: " + error.message,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { staffId, selectedUserIds } = body;
    const user: any = JSON.parse(req.headers.get('user') as string);
    const userDetails: any = await User.findById(user._id);
    const staffDetails: any = await User.findById(staffId);
    if (!staffDetails) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Staff not found"
      });
    }

    // Validation: Role 31 can only assign 'fresh' leads of other employees
    if (userDetails?.role === 31 && Array.isArray(selectedUserIds) && selectedUserIds.length > 0) {
      const leadsToAssign = await leadModel.find({ _id: { $in: selectedUserIds } }).select('assign leadStatus').lean();
      const invalidLead = leadsToAssign.find((lead: any) => {
        const currentOwner = Array.isArray(lead.assign) && lead.assign.length > 0 ? lead.assign[lead.assign.length - 1]?.toString() : null;
        const isOthersLead = currentOwner && currentOwner !== user._id.toString();
        return isOthersLead && lead.leadStatus !== 'fresh';
      });
      if (invalidLead) {
        return HandleResponse({
          type: "BAD_REQUEST",
          message: "Role 31 can assign only 'fresh' leads of other employees."
        });
      }
    }

    // Remove selectedUserIds from other staff
    const allStaff = await User.find({ _id: { $ne: staffId } });
    await Promise.all(
      allStaff.map(async (staff) => {
        if (staff.Lead) {
          staff.Lead = staff.Lead.filter(
            (leadId: any) => !selectedUserIds.includes(leadId.toString())
          );
          await staff.save();
        }
      })
    );
    // Assign selectedUserIds to current staff
    if (!Array.isArray(staffDetails.Lead)) {
      staffDetails.Lead = [];
    }
    const existingLeads = new Set(staffDetails.Lead.map((id: any) => id.toString()));

    const uniqueUserIds = selectedUserIds.filter((id: any) => !existingLeads.has(id.toString()));

    if (uniqueUserIds.length > 0) {
      staffDetails.Lead.push(...uniqueUserIds);
      // Fetch lead details for notification messages
      const leads = await leadModel.find({ _id: { $in: uniqueUserIds } });
      const leadNames = leads.map((lead) => lead.name).join(", "); // Get all lead names
      // Notification to staff member
      await Notification_Create(
        staffDetails._id,
        `New Lead Assigned Successfully`,
        `Congratulations, ${staffDetails.userName}! You have been assigned a new lead: ${leadNames}, assigned by ${userDetails.userName || "the system"}. Keep up the great work!`
      );
      // Notification to admin
      await Notification_Create(
        user._id,
        `Lead Transfer Successful`,
        `The lead(s) ${leadNames} has been successfully transferred to ${staffDetails.userName}, assigned by ${userDetails.userName || "the system"}. Please take note of the update. Thank you!`
      );
    }

    await Promise.all(
      uniqueUserIds.map(async (id: any) => {
        const lead = await leadModel.findById(id);
        if (lead) {
          const isAlreadyAssigned = lead.assign.some(
            (existingId: any) => existingId.toString() === staffId.toString()
          );
          if (!isAlreadyAssigned) {
            // Notify previous staff (if any)
            const previousStaffId =
              lead.assign.length > 0 ? lead.assign[lead.assign.length - 1] : null;
            if (previousStaffId && previousStaffId.toString() !== staffId.toString()) {
              await Notification_Create(
                previousStaffId,
                `Lead Transfer Successful`,
                `Hello, Your lead ${lead.name} has been successfully transferred to a new team member, ${staffDetails.userName}. The transfer was made by ${userDetails.userName || "the system"}. Please take note of the update and reach out if you have any questions.`
              );
            }

            // Assign staff
            lead.assign = lead.assign.filter(
              (existingId: any) => existingId.toString() == staffId.toString()
            );
            lead.assign.push(staffId);
            lead.assignAt = DateTime.now().setZone("Asia/Kolkata");

            // 🔹 Reset fields as per your requirement
            lead.call_status = "";
            lead.leadStatus = "fresh";

            await lead.save();
          } else {
            return HandleResponse({
              type: "BAD_REQUEST",
              message: `Already assigned this lead`,
            });
          }
        }
      })
    );

    await staffDetails.save();
    return HandleResponse({
      type: "SUCCESS",
      message: "Staff assigned to lead successfully.",
    });

  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: "Error: " + error.message,
    });
  }
}

export async function OPTIONS(req: Request) {
  try {
    const body = await req.json();
    const { assignId, selectedUserIds } = body;
    const user: any = JSON.parse(req.headers.get('user') as string);
    const userDetails: any = await User.findById(user._id);
    // Fetch staff details
    const staffDetails: any = await User.findById(assignId);
    if (!staffDetails) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Staff not found" });
    }

    // Validation: Role 31 can only assign 'fresh' leads of other employees
    if (userDetails?.role === 31 && Array.isArray(selectedUserIds) && selectedUserIds.length > 0) {
      const leadsToAssign = await leadModel.find({ _id: { $in: selectedUserIds } }).select('assign leadStatus').lean();
      const invalidLead = leadsToAssign.find((lead: any) => {
        const currentOwner = Array.isArray(lead.assign) && lead.assign.length > 0 ? lead.assign[lead.assign.length - 1]?.toString() : null;
        const isOthersLead = currentOwner && currentOwner !== user._id.toString();
        return isOthersLead && lead.leadStatus !== 'fresh';
      });
      if (invalidLead) {
        return HandleResponse({
          type: "BAD_REQUEST",
          message: "Role 31 can assign only 'fresh' leads of other employees."
        });
      }
    }

    // Remove selectedUserIds from other staff
    const allStaff = await User.find({ _id: { $ne: assignId } });
    await Promise.all(
      allStaff.map(async (staff) => {
        if (staff.Lead) {
          staff.Lead = staff.Lead.filter(
            (leadId: any) => !selectedUserIds.includes(leadId.toString())
          );
          await staff.save();
        }
      })
    );
    // Assign selectedUserIds to current staff
    if (!Array.isArray(staffDetails.Lead)) {
      staffDetails.Lead = [];
    }
    const existingLeads = new Set(staffDetails.Lead.map((id: any) => id.toString()));

    const uniqueUserIds = selectedUserIds.filter((id: any) => !existingLeads.has(id.toString()));

    if (uniqueUserIds.length > 0) {
      // Fetch lead details for notification messages
      const leads = await leadModel.find({ _id: { $in: uniqueUserIds } });
      const leadNames = leads.map((lead) => lead.name).join(", ");

      // Notification to staff member
      await Notification_Create(
        staffDetails._id,
        `New Lead Assigned Successfully`,
        `Congratulations, ${staffDetails.userName}! You have been assigned a new lead: ${leadNames}, assigned by ${userDetails.userName || "the system"}. Keep up the great work!`
      );
      // Notification to admin
      await Notification_Create(
        user._id,
        `Lead Transfer Successful`,
        `The lead(s) ${leadNames} has been successfully transferred to ${staffDetails.userName}, assigned by ${userDetails.userName || "the system"}. Please take note of the update. Thank you!`
      );

      // Assign leads to the current staff member
      staffDetails.Lead.push(...uniqueUserIds);
      await staffDetails.save();
    }
    await Promise.all(
      uniqueUserIds.map(async (id: any) => {
        const lead = await leadModel.findById(id);
        if (lead) {
          // Check if the lead is already assigned to the same staff member
          const isAlreadyAssigned = lead.assign.some((existingId: any) => existingId.toString() === assignId.toString());
          if (!isAlreadyAssigned) {
            // Find the most recent previous staff member (if any)
            const previousStaffId = lead.assign.length > 0 ? lead.assign[lead.assign.length - 1] : null;
            // Send notification to the previous staff member (if applicable)
            if (previousStaffId && previousStaffId.toString() !== assignId.toString()) {
              await Notification_Create(
                previousStaffId,
                `Lead Transfer Successful`,
                `Hello, Your lead ${lead.name} has been successfully transferred to a new team member, ${staffDetails.userName}. The transfer was made by ${userDetails.userName || "the system"}. Please take note of the update and reach out if you have any questions.`
              );
            }
            lead.assign = lead.assign.filter((existingId: any) => existingId.toString() == assignId.toString());
            lead.assign.push(assignId);
            if (lead.leadStatus !== "deal-done") {
              lead.leadStatus = "fresh";
              if (lead.query && lead.query.length > 0) {
                await QueryModels.updateMany(
                  { _id: { $in: lead.query } },
                  { $set: { call_status: "" } }
                );
              }
            }
            lead.assignAt = DateTime.now().setZone('Asia/Kolkata');
            await lead.save();
          }
          else {
            return HandleResponse({
              type: "BAD_REQUEST",
              message: `Already assigned this lead`,
            });
          }
        }
      })
    );
    return HandleResponse({
      type: "SUCCESS",
      message: "Staff assigned to lead(s) successfully.",
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: `Error: ${error.message}`,
    });
  }
}