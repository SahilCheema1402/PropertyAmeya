import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import groupModal from './../../../_model/Group/Group.modal';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    await DB();
    const user: any = JSON.parse(req.headers.get('user') as string); 
    const groups = await groupModal.aggregate([
      {
        $match: {
          createdBy:new mongoose.Types.ObjectId(user?._id)
        }
      },
      {
        $lookup: {
          from: 'leads', // Join with the 'users' collection
          localField: 'groupUserId', // Field in 'groups' collection
          foreignField: '_id', // Field in 'users' collection
          as: 'groupUserData' // Store the populated data as 'groupUserData'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          company: 1,
          createdBy: 1,
          groupUserId:1,
          groupId:1,
          groupUserData: 1 // Show the populated 'groupUserData'
        }
      }
    ]);
    return HandleResponse({
      type: "SUCCESS",
      message: "Fetched Group Details successfully.",
      data:  groups
    });

  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}

// Create a new group
export async function POST(req: Request) {
    try {
        await DB();
        const groups = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!groups) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Fields is missing" })
        }
        if (!user || !user._id || !user.company?._id) {
          return HandleResponse({ type: "BAD_REQUEST", message: "User information is missing" });
        }
        const lastGroup = await groupModal.findOne().sort({ groupId: -1 });
        let newGroupId = '00001';
        if (lastGroup && lastGroup.groupId) {
          // Increment the last group ID and format it as a 5-digit string
          const lastIdNum = parseInt(lastGroup.groupId, 10);
          newGroupId = (lastIdNum + 1).toString().padStart(5, '0');
        }
        const { name, description } = groups;
        const group_ = new groupModal({
            description,
            name,
            createdBy: user?._id,
            company: user?.company?._id,
            groupId: newGroupId,
        })
        await group_.save();
        return HandleResponse({ type: "SUCCESS", message: "Group Created Successfully" })
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}

export async function PATCH(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const body = await req.json();
        
        if (!id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "ID is required" });
         }
        await groupModal.findByIdAndUpdate(id, {
            name: body?.userId?.name,
            description: body?.userId?.description
        });
        return HandleResponse({
            type: "SUCCESS",
            message: "Group Update successfully",
        });

    } catch (error: any) {
        // Handle any errors
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error.message
        });
    }
}
// Update add user  by ID
export async function PUT(req: Request) {
  try {
    await DB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    

    if (!id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "ID is required" });
    }

    if (!body?.userId ||body?.userId.length===0 || !Array.isArray(body.userId)) {
      return HandleResponse({ type: "BAD_REQUEST", message: "userId is required" });
    }

    // Find the group by ID
    const group = await groupModal.findById(id);

    if (!group) {
      return HandleResponse({ type: "NOT_FOUND", message: "Group not found" });
    }

    // Check for duplicate user IDs
    const existingUserIds = group.groupUserId.map((userId: any) => userId.toString());
   // Filter out duplicate user IDs from the request body
   const newUserIds = body.userId.filter((userId: any) => !existingUserIds.includes(userId));

   if (newUserIds.length === 0) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: "All provided user IDs are already present in the group",
    });
  }

    // Add only new user IDs to the group
    await groupModal.findByIdAndUpdate(
      { _id: id },
      { $addToSet: { groupUserId: { $each: newUserIds } } }  
    );

    return HandleResponse({
      type: "SUCCESS",
      message: "New users added to the group successfully",
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || 'Something went wrong',
    });
  }
}



//Update remove user by ID
export async function OPTIONS(req: Request) {
  try {
    await DB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return HandleResponse({ type: "BAD_REQUEST", message: "ID is required" });
    }

    const { userId } = body;

    if (!Array.isArray(userId) || userId.length === 0) {
      return HandleResponse({ type: "BAD_REQUEST", message: "User IDs are required" });
    }

    // Find the group by ID
    const group = await groupModal.findById(id);
    if (!group) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Group not found" });
    }

    // Check if all user IDs exist in the group
    const nonExistentUserIds = userId.filter(user => !group.groupUserId.includes(user));

    // If there are user IDs that don't exist in the group, send an error
    if (nonExistentUserIds.length > 0) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: `User IDs not present: ${nonExistentUserIds.join(', ')}`,
      });
    }

    // Proceed to remove existing user IDs from the group
    await groupModal.findByIdAndUpdate(id, {
      $pull: { groupUserId: { $in: userId } }
    });

    return HandleResponse({
      type: "SUCCESS",
      message: "Users removed from group successfully",
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || 'Something went wrong',
    });
  }
}


// Delete a group by ID
export async function DELETE(req: Request) {
    try {
        await  DB();
  
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) {
        return HandleResponse({ type: "BAD_REQUEST", message: "Group ID is missing" });
      }
  
      await groupModal.findByIdAndDelete(id);
  
      return HandleResponse({
        type: "SUCCESS",
        message: "Deleted successfully",
      });
    } catch (error: any) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: error?.message
      });
    }
  }
  
