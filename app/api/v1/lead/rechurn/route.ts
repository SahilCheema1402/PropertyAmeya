// api/lead/rechurn/route.ts
import DB from '@app/_Database/db'
import { NextRequest } from 'next/server';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import { NextApiRequest, NextApiResponse } from 'next';
import { map } from 'p-iteration';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';
import RemarksModel from '@app/_model/LeadModel/Remarks.model';
import QueryModels from '@app/_model/LeadModel/Query.models';
import userModel from '@app/_model/user/user.model';
import { DateTime } from 'luxon';
import { createSaleNotification } from '@app/_utils/saleNotificationUtils';

// GET - Fetch rechurn leads
export async function GET(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const user: any = JSON.parse(req.headers.get('user') as string);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const lastAssignedToFilter = searchParams.get('lastAssignedTo') || '';

        // Only allow admin access (role 1 or 2)
        if (user.role !== 1 && user.role !== 2) {
            return HandleResponse({
                type: "UNAUTHORIZED",
                message: "Only admin can access rechurn leads"
            });
        }

        // Base match conditions for rechurn leads
        const matchStage: any = {
            company: new mongoose.Types.ObjectId(user?.company?._id),
            isRechurn: true,
            $or: [
                { assign: { $exists: false } },
                { assign: [] }
            ],
            leadStatus: 'fresh'
        };

        // Add lastAssignedTo filter if provided
        if (lastAssignedToFilter) {
            matchStage.lastAssignedTo = new mongoose.Types.ObjectId(lastAssignedToFilter);
        }

        // Add search filter if provided
        if (search) {
            matchStage.$and = matchStage.$and || [];
            matchStage.$and.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { source: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Updated aggregation pipeline with lastAssignedTo lookup
        const pipeline: mongoose.PipelineStage[] = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "querys",
                    localField: "query",
                    foreignField: "_id",
                    as: "queryDetails"
                }
            },
            { $unwind: { path: "$queryDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "assign",
                    foreignField: "_id",
                    as: "assignedUser"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "lastAssignedTo",
                    foreignField: "_id",
                    as: "lastAssignedUserData"
                }
            },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    email: 1,
                    source: 1,
                    leadStatus: 1,
                    createAt: 1,
                    updateAt: 1,
                    isRechurn: 1,
                    queryDetails: 1,
                    lastAssignedAt: 1,
                    lastAssignedToId: "$lastAssignedTo", // Keep the original ID
                    lastAssignedTo: { 
                        $cond: {
                            if: { $gt: [{ $size: "$lastAssignedUserData" }, 0] },
                            then: { $arrayElemAt: ["$lastAssignedUserData.userName", 0] },
                            else: null
                        }
                    },
                    assignedTo: { $arrayElemAt: ["$assignedUser.userName", 0] }
                }
            },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        // Get total count and paginated results
        const [fields_, total] = await Promise.all([
            Lead.aggregate(pipeline).allowDiskUse(true),
            Lead.countDocuments(matchStage)
        ]);
         
        const totalRechurn = await Lead.countDocuments({
            company: new mongoose.Types.ObjectId(user?.company?._id),
            isRechurn: true,
            leadStatus: 'fresh'
        });

        return HandleResponse({
            type: "SUCCESS",
            message: "",
            data: {
                fields_,
                total,
                totalRechurn 
            }
        });

    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}

// Updated POST method for manual rechurn moves
export async function POST(req: NextRequest) {
  try {
    await DB();
    const { leadIds, thresholdDays } = await req.json();
    const user: any = JSON.parse(req.headers.get('user') as string);
    const threshold = Number(thresholdDays) || 30;

    if (!leadIds || !Array.isArray(leadIds)) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Invalid lead IDs" });
    }

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - threshold);

    // First get the leads to preserve their current assignment info
    const leadsToUpdate = await Lead.find({
      _id: { $in: leadIds.map(id => new mongoose.Types.ObjectId(id)) },
      company: new mongoose.Types.ObjectId(user?.company?._id),
      leadStatus: 'fresh'
    }).select('_id assign assignAt');

    // Update each lead to preserve lastAssignedTo
    const updatePromises = leadsToUpdate.map(lead => {
      const updateData: any = {
        assign: [],
        assignAt: null,
        isRechurn: true,
        updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
      };

      // Store current assignment as last assignment if it exists
      if (lead.assign && lead.assign.length > 0) {
        updateData.lastAssignedTo = lead.assign[0];
        updateData.lastAssignedAt = lead.assignAt;
      }

      return Lead.findByIdAndUpdate(lead._id, { $set: updateData });
    });

    await Promise.all(updatePromises);

    return HandleResponse({
      type: "SUCCESS",
      message: `${leadsToUpdate.length} inactive leads moved to rechurn`,
      data: { modifiedCount: leadsToUpdate.length }
    });
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}

export async function PATCH(req: NextRequest) {
    try {
        await DB();
        const { leadIds, staffId } = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);

        // Validation
        if (!leadIds || !Array.isArray(leadIds)) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Invalid lead IDs" });
        }
        if (!staffId) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Staff ID is required" });
        }

        const result = await Lead.updateMany(
            {
                _id: { $in: leadIds.map(id => new mongoose.Types.ObjectId(id)) },
                company: new mongoose.Types.ObjectId(user?.company?._id),
                isRechurn: true
            },
            {
                $set: {
                    assign: [new mongoose.Types.ObjectId(staffId)],
                    isRechurn: false,
                    assignAt: DateTime.now().setZone('Asia/Kolkata').toJSDate(),
                    updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
                    // Note: We don't clear lastAssignedTo/lastAssignedAt here - they remain as history
                }
            }
        );

        return HandleResponse({
            type: "SUCCESS",
            message: `${result.modifiedCount} leads assigned successfully`,
            data: result
        });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}

// PUT - Single assignment of rechurn lead to staff
export async function PUT(req: NextRequest) {
    try {
        await DB();
        const { leadId, staffId } = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);

        // Validation
        if (!leadId) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Lead ID is required" });
        }
        if (!staffId) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Staff ID is required" });
        }

        const result = await Lead.findByIdAndUpdate(
            new mongoose.Types.ObjectId(leadId),
            {
                $set: {
                    assign: [new mongoose.Types.ObjectId(staffId)],
                    isRechurn: false,
                    assignAt: DateTime.now().setZone('Asia/Kolkata').toJSDate(),
                    updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
                    // Note: We don't clear lastAssignedTo/lastAssignedAt here - they remain as history
                }
            },
            { new: true }
        );

        if (!result) {
            return HandleResponse({ type: "NOT_FOUND", message: "Lead not found" });
        }

        return HandleResponse({
            type: "SUCCESS",
            message: "Lead assigned successfully",
            data: result
        });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}