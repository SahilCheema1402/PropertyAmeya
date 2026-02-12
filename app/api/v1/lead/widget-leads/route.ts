// C:\Users\Nezuko\Desktop\Ameya projects\Property360WebBackend\app\api\v1\lead\widget-leads\route.ts

import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { NextRequest } from '@node_modules/next/server';

export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const staffId: any = searchParams.get('staffId');
        const leadType = searchParams.get("leadType");
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const user: any = JSON.parse(req.headers.get('user') as string);

        // Get today's date range (start and end of today)
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // Helper function to get date range condition based on status (matches home API)
        const getDateRangeCondition = (status: string) => {
            if (!startDate && !endDate) return {};

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            // Adjust end date to include the entire day
            if (end) {
                end.setHours(23, 59, 59, 999);
            }

            const dateCondition: any = {};

            if (start && end) {
                dateCondition.$gte = start;
                dateCondition.$lte = end;
            } else if (start) {
                dateCondition.$gte = start;
            } else if (end) {
                dateCondition.$lte = end;
            }

            switch (status) {
                case 'fresh':
                    return {
                        $or: [
                            { createAt: dateCondition },
                            { assignAt: dateCondition }
                        ]
                    };
                case 'followup':
                    return { firstFollowupDate: dateCondition };
                case 'todaysfollowup':
                    // For today's followup, ignore date range filters and use today's date
                    return {
                        followup_date: {
                            $gte: startOfToday,
                            $lte: endOfToday
                        }
                    };
                case 'visitdone':
                    return { visit_done_date: dateCondition };
                case 'meetingdone':
                    return { meeting_done_date: dateCondition };
                case 'deal-done':
                    return { deal_done_date: dateCondition };
                case 'ringing':
                    return { ringing_date: dateCondition };
                case 'switchoff':
                    return { switch_off_date: dateCondition };
                case 'wrongno':
                    return { wrong_no_date: dateCondition };
                case 'notInterest':
                    return { not_interested_date: dateCondition };
                case 'callback':
                    return {
                        call_date: dateCondition,
                        call_status: "Call Back"
                    };
                case 'hotprospects':
                case 'suspects':
                    return { createAt: dateCondition };
                default:
                    return { createAt: dateCondition };
            }
        };

        // Helper function to get status conditions (same as home API)
        const getStatusConditions = (status: string) => {
            const baseCondition = {
                $or: [
                    { query: { $exists: false } },
                    { query: { $size: 0 } },
                    {
                        $and: [
                            { query: { $exists: true, $ne: [] } },
                            {
                                $or: [
                                    { leadStatus: { $exists: false } },
                                    { leadStatus: null },
                                    { leadStatus: "" },
                                    { leadStatus: "fresh" }
                                ]
                            },
                            {
                                $or: [
                                    { call_status: { $exists: false } },
                                    { call_status: null },
                                    { call_status: "" }
                                ]
                            }
                        ]
                    }
                ]
            };

            switch (status) {
                case 'fresh':
                    return baseCondition;
                case 'followup':
                    return {
                        leadStatus: "followup",
                        call_status: "Call Picked"
                    };
                    case 'todaysfollowup':
                    return {
                        followup_date: {
                            $gte: startOfToday,
                            $lte: endOfToday
                        }
                    };
                case 'notInterest':
                    return {
                        leadStatus: "notInterest",
                        call_status: { $in: ["Visit Done", "Meeting Done", "Call Picked", "Ringing", "Call Back", "Wrong No", "Switch Off"] }
                    };
                case 'deal-done':
                    return {
                        leadStatus: "deal-done",
                        call_status: { $in: ["Visit Done", "Meeting Done"] }
                    };
                case 'ringing':
                    return {
                        call_status: "Ringing",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'callback':
                    return {
                        call_status: "Call Back",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'wrongno':
                    return {
                        call_status: "Wrong No",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'switchoff':
                    return {
                        call_status: "Switch Off",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'visitdone':
                    return {
                        leadStatus: "followup",
                        call_status: "Visit Done"
                    };
                case 'meetingdone':
                    return {
                        leadStatus: "followup",
                        call_status: "Meeting Done"
                    };
                case 'hotprospects':
                    return {
                        isHotProspect: true
                    };
                case 'suspects':
                    return {
                        isSuspect: true
                    };
                default:
                    return {};
            }
        };

        const companyId = new mongoose.Types.ObjectId(user?.company?._id);

        // Build base condition
        const baseMatchCondition: any = {
            company: companyId,
        };

        // Staff filter condition
        let staffFilter = {};
        if (staffId && staffId !== "undefined") {
            if (staffId === '678642d40797483103969bc5') {
                // Special staff - no additional filter
            } else if (user.role === 1 || user.role === 2) {
                // Admin users can view any staff's data
                staffFilter = { assign: new mongoose.Types.ObjectId(staffId) };
            } else {
                // For non-admin users, use the provided staffId
                staffFilter = { assign: new mongoose.Types.ObjectId(staffId) };
            }
        } else {
            // If no staffId provided, filter by user role
            if (user.role !== 1 && user.role !== 2 && user._id !== "678642d40797483103969bc5") {
                staffFilter = { assign: new mongoose.Types.ObjectId(user._id) };
            }
        }

        const statusCondition = getStatusConditions(status ?? "");
        const dateRangeCondition = getDateRangeCondition(status ?? "");

        let pipeline: any[] = [
            {
                $match: {
                    ...baseMatchCondition,
                    ...staffFilter,
                    ...statusCondition,
                    ...dateRangeCondition
                }
            }
        ];

        // Add lookup for query details
        pipeline.push(
            {
                $lookup: {
                    from: "querys",
                    localField: "query",
                    foreignField: "_id",
                    as: "queryDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "remarks",
                                localField: "remarks",
                                foreignField: "_id",
                                as: "remarksDetails"
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    queryDetails: {
                        $cond: {
                            if: { $gt: [{ $size: "$queryDetails" }, 0] },
                            then: { $arrayElemAt: ["$queryDetails", -1] },
                            else: null
                        }
                    }
                }
            }
        );

        // Add leadType filter if provided
        if (leadType && leadType !== "all") {
            pipeline.push({
                $match: {
                    "queryDetails.leadType": { $regex: leadType, $options: 'i' }
                }
            });
        }

        // Add lookup for assigned users
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "assign",
                foreignField: "_id",
                as: "assignedUsers",
                pipeline: [
                    { $project: { userName: 1, _id: 1 } }
                ]
            }
        });

        // Add sorting
        pipeline.push({ $sort: { createAt: -1 } });

        const leads = await Lead.aggregate(pipeline);

        return HandleResponse({
            type: "SUCCESS",
            message: "Widget leads fetched successfully",
            data: leads
        });

    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}