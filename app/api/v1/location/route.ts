// import DB from '@app/_Database/db';
// import HandleResponse from '@app/_utils/response';
// import locationModel from '@app/_model/Location/location.model';
// import userModel from '@app/_model/user/user.model';
// import mongoose from 'mongoose';
// import { DateTime } from 'luxon';
 
// // admin to create terms and conditions.
// export async function POST(req: Request) {
//     try {
//         await DB();
//         const body = await req.json();
//         const user = JSON.parse(req.headers.get('user') as string);
//         const {location,  address } = body;
//         if ( !user) {
//             return HandleResponse({
//                 type: "BAD_REQUEST",
//                 message: "User data is missing"
//             });
//         }
//         if ( !location ) {
//             return HandleResponse({
//                 type: "BAD_REQUEST",
//                 message:  "Missing required fields"
//             });
//         }

//         await locationModel.deleteMany({staffId: new mongoose.Types.ObjectId(user._id)});

//         const staffLocation = new locationModel({
//             staffId:user._id,
//             latitude:location.coords.latitude,
//             longitude:location.coords.longitude,
//             address,
//             createAt: DateTime.now().setZone('Asia/Kolkata'),
//           });

//         const save=await staffLocation.save();
//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Location saved successfully"
//         });

//     } catch (error: any) {
//         console.error("Error handling location request:", error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: error?.message || "Internal server error."
//         });
//     }
// }
// export async function GET(req: Request) {
//     try {
//         await DB(); 
//         const terms = await locationModel.find({}).populate([{ path: 'staffId', model: userModel},]).select('userName address latitude longitude').sort({ timestamp: -1 });

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Location of staff member retrieved successfully.",
//             data: terms
//         });
//     } catch (error: any) {
//         console.error("Error fetching terms and conditions:", error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: error?.message || "Failed to retrieve location."
//         });
//     }
// }

import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import locationModel from '@app/_model/Location/location.model';
import userModel from '@app/_model/user/user.model';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
 
export async function POST(req: Request) {
    try {
        await DB();
        const body = await req.json();
        const user = JSON.parse(req.headers.get('user') as string);
        const { location, address } = body;
        
        
        if (!user) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "User data is missing"
            });
        }
        if (!location) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Missing required fields"
            });
        }

        await locationModel.deleteMany({ staffId: new mongoose.Types.ObjectId(user._id) });

        const staffLocation = new locationModel({
            staffId: user._id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address,
            createAt: DateTime.now().setZone('Asia/Kolkata'),
        });

        await staffLocation.save();
        return HandleResponse({
            type: "SUCCESS",
            message: "Location saved successfully"
        });

    } catch (error: any) {
        console.error("Error handling location request:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Internal server error."
        });
    }
}

export async function GET(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const userIdsParam = searchParams.get('userIds');
        const user: any = JSON.parse(req.headers.get('user') as string);

        // Initial user IDs
        const userIds = userIdsParam ? JSON.parse(userIdsParam) : [user._id];

        // Step 1: Fetch subordinates for each user
        const usersWithSubs = await userModel.find(
            { _id: { $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)) } },
            { subordinate: 1 }
        );

        // Step 2: Flatten subordinate IDs
        const subordinateIds = usersWithSubs
            .map((u: any) => u.subordinate || [])
            .flat()
            .map((id: any) => id.toString());

        // Step 3: Merge all userIds
        const allUserIds = Array.from(new Set([...userIds, ...subordinateIds]));

        // Step 4: Aggregate to fetch the latest location of each user
        const locations = await locationModel.aggregate([
            {
                $match: {
                    staffId: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            { $sort: { createAt: -1 } },
            {
                $group: {
                    _id: "$staffId",
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } },
            {
                $lookup: {
                    from: "users",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staffId"
                }
            },
            { $unwind: "$staffId" },
            { $sort: { "staffId.userName": 1 } }
        ]);

        return HandleResponse({
            type: "SUCCESS",
            message: "Location of staff and subordinates retrieved successfully.",
            data: locations
        });

    } catch (error: any) {
        console.error("Error fetching staff locations:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to retrieve location."
        });
    }
}
