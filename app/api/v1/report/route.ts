import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import Lead from './../../../_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import userModel from '@app/_model/user/user.model';
import { DateTime } from 'luxon';

export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const staffId: any = searchParams.get('staffId');
        const leadType = searchParams.get("leadType");
        const user: any = JSON.parse(req.headers.get('user') as string);

        if (!startDate || !endDate) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Start Date and End Date are required"
            });
        }

        const start = new Date(DateTime.fromISO(startDate).setZone("Asia/Kolkata").startOf("day").toISO() || "");
        const end = new Date(DateTime.fromISO(endDate).setZone("Asia/Kolkata").endOf("day").toISO() || "");

        // Base query conditions
        const baseQuery: any = {
            company: new mongoose.Types.ObjectId(user?.company?._id),
            // Only include active leads to reduce dataset
            isDeleted: { $ne: true }
        };

        // Add leadType filter if specified
        if (leadType && leadType !== "all") {
            baseQuery["queryDetails.leadType"] = leadType;
        }

        // Handle staff filtering with better role-based logic
        const canViewAllStaff = [1, 2, 3, 4, 5, 31, 7, 6].includes(user.role);
        const isSpecialStaff = staffId === '678642d40797483103969bc5';

        if (!isSpecialStaff && staffId && staffId !== "undefined" && canViewAllStaff) {
            baseQuery.assign = new mongoose.Types.ObjectId(staffId);
        } else if (!canViewAllStaff) {
            baseQuery.assign = new mongoose.Types.ObjectId(user._id);
        }

        // Optimized pipeline with better indexing strategy
        const pipeline = [
            // First stage: Match documents at the Lead level for better index usage
            {
                $match: baseQuery
            },
            // Lookup with specific field selection to reduce data transfer
            {
                $lookup: {
                    from: "querys",
                    localField: "query",
                    foreignField: "_id",
                    as: "queryDetails",
                    pipeline: [
                        {
                            $project: {
                                leadType: 1,
                                call_date: 1,
                                visit_done_date: 1,
                                meeting_done_date: 1,
                                deal_done_date: 1,
                                ringing_date: 1,
                                switch_off_date: 1,
                                wrong_no_date: 1,
                                not_interested_date: 1,
                                interested_date: 1,
                                call_visit_meeting_consider_in_follow_up_date: 1,
                                call_status: 1,
                                // Only include fields that are actually used
                                project: 1,
                                size: 1,
                                budget: 1,
                                bhk: 1,
                                floor: 1,
                                purpose: 1,
                                location: 1,
                                shifting_date: 1,
                                followup_date: 1,
                                exp_visit_date: 1,
                                type: 1,
                                visit_done: 1,
                                meeting_done: 1,
                                status: 1,
                                reason: 1,
                                closing_amount: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$queryDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Apply date range filter after lookup for better performance
            {
                $match: {
                    $or: [
                        { "queryDetails.call_date": { $gte: start, $lte: end } },
                        { "queryDetails.visit_done_date": { $gte: start, $lte: end } },
                        { "queryDetails.meeting_done_date": { $gte: start, $lte: end } },
                        { "queryDetails.deal_done_date": { $gte: start, $lte: end } },
                        { "queryDetails.ringing_date": { $gte: start, $lte: end } },
                        { "queryDetails.switch_off_date": { $gte: start, $lte: end } },
                        { "queryDetails.wrong_no_date": { $gte: start, $lte: end } },
                        { "queryDetails.not_interested_date": { $gte: start, $lte: end } },
                        { "queryDetails.interested_date": { $gte: start, $lte: end } },
                        { "queryDetails.call_visit_meeting_consider_in_follow_up_date": { $gte: start, $lte: end } }
                    ]
                }
            },
            // Project only required fields to reduce data transfer
            {
                $project: {
                    _id: 1,
                    name: 1,
                    phone: 1,
                    source: 1,
                    leadStatus: 1,
                    firstFollowupDate: 1,
                    queryDetails: 1,
                    // Add computed fields for frontend
                    call_date: "$queryDetails.call_date",
                    call_visit_meeting_consider_in_follow_up_date: "$queryDetails.call_visit_meeting_consider_in_follow_up_date",
                    meeting_done_date: "$queryDetails.meeting_done_date",
                    visit_done_date: "$queryDetails.visit_done_date",
                    deal_done_date: "$queryDetails.deal_done_date",
                    interested_date: "$queryDetails.interested_date",
                    not_interested_date: "$queryDetails.not_interested_date",
                    ringing_switch_off_date: "$queryDetails.ringing_date",
                    unique_followup: null // Will be computed on frontend
                }
            }
        ];

        // Execute query with lean() for better performance
        const leads = await Lead.aggregate(pipeline).allowDiskUse(true);

        return HandleResponse({
            type: "SUCCESS",
            message: "Get Report Data Successfully",
            data: leads
        });

    } catch (error: any) {
        console.error('Report GET Error:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}

export async function POST(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const user: any = JSON.parse(req.headers.get('user') as string);
        
        // Get allowed staff IDs from request body
        const body = await req.json();
        const allowedStaffIds = body?.allowedStaffIds || [];

        if (!startDate || !endDate) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Start Date and End Date are required"
            });
        }

        // FIX: Use Luxon with Asia/Kolkata timezone - same as GET endpoint
        const start = new Date(DateTime.fromISO(startDate).setZone("Asia/Kolkata").startOf("day").toISO() || "");
        const end = new Date(DateTime.fromISO(endDate).setZone("Asia/Kolkata").endOf("day").toISO() || "");

        const timeDiff = end.getTime() - start.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Modified user data fetching with hierarchy filtering
        let userQuery: any = { 
            company: user?.company?._id, 
            isActive: true 
        };

        // Apply hierarchy filtering if allowedStaffIds is provided and not empty
        if (allowedStaffIds && allowedStaffIds.length > 0) {
            userQuery._id = { $in: allowedStaffIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
        }

        const userData: any = await userModel
            .find(userQuery)
            .select('userName email company target callTarget followupTarget meetingTarget')
            .lean();

        // Use Promise.all for parallel processing instead of sequential
        const employeeDataPromises = userData.map(async (employee: any) => {
            const {
                target = 0,
                callTarget = 60,
                followupTarget = 0,
                meetingTarget = 0
            } = employee;

            // Get all leads for this employee first (matching frontend approach)
            const pipeline = [
                {
                    $match: {
                        company: new mongoose.Types.ObjectId(user?.company?._id),
                        assign: new mongoose.Types.ObjectId(employee._id),
                        isDeleted: { $ne: true }
                    }
                },
                {
                    $lookup: {
                        from: "querys",
                        localField: "query",
                        foreignField: "_id",
                        as: "queryDetails",
                        pipeline: [
                            {
                                $project: {
                                    call_date: 1,
                                    visit_done_date: 1,
                                    meeting_done_date: 1,
                                    deal_done_date: 1,
                                    ringing_date: 1,
                                    switch_off_date: 1,
                                    wrong_no_date: 1,
                                    not_interested_date: 1,
                                    interested_date: 1,
                                    call_visit_meeting_consider_in_follow_up_date: 1,
                                    call_status: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: "$queryDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $or: [
                            { "queryDetails.call_date": { $gte: start, $lte: end } },
                            { "queryDetails.visit_done_date": { $gte: start, $lte: end } },
                            { "queryDetails.meeting_done_date": { $gte: start, $lte: end } },
                            { "queryDetails.deal_done_date": { $gte: start, $lte: end } },
                            { "queryDetails.ringing_date": { $gte: start, $lte: end } },
                            { "queryDetails.switch_off_date": { $gte: start, $lte: end } },
                            { "queryDetails.wrong_no_date": { $gte: start, $lte: end } },
                            { "queryDetails.not_interested_date": { $gte: start, $lte: end } },
                            { "queryDetails.interested_date": { $gte: start, $lte: end } },
                            { "queryDetails.call_visit_meeting_consider_in_follow_up_date": { $gte: start, $lte: end } }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        phone: 1,
                        source: 1,
                        leadStatus: 1,
                        firstFollowupDate: 1,
                        queryDetails: 1
                    }
                }
            ];

            const employeeLeads = await Lead.aggregate(pipeline).allowDiskUse(true);

            // Now apply the EXACT SAME logic as frontend to calculate metrics
            let callCount = 0;
            let followUpCount = 0;
            let uniqueFollowupCount = 0;
            let visitCount = 0;
            let notInterestedCount = 0;
            let interestedCount = 0;

            employeeLeads.forEach((item: any) => {
                // Call count - exact frontend logic
                if (item?.queryDetails?.call_date) {
                    callCount++;
                }

                // Followup count - exact frontend logic (isFollowup function)
                if (item?.queryDetails?.call_visit_meeting_consider_in_follow_up_date !== null &&
                    item.leadStatus !== "notInterest" &&
                    item.leadStatus !== "fresh") {
                    followUpCount++;
                }

                // Unique followup count - exact frontend logic (isUniqueFollowup function)
                const followupDate = item?.queryDetails?.call_visit_meeting_consider_in_follow_up_date;
                if (followupDate) {
                    const followupDateObj = new Date(followupDate);
                    const startDateObj = new Date(start);
                    const endDateObj = new Date(end);

                    endDateObj.setHours(23, 59, 59, 999);
                    startDateObj.setHours(0, 0, 0, 0);

                    const isInRange = followupDateObj >= startDateObj && followupDateObj <= endDateObj;

                    if (isInRange &&
                        item.leadStatus === "followup" &&
                        item.firstFollowupDate &&
                        !item?.queryDetails?.visit_done_date &&
                        !item?.queryDetails?.meeting_done_date &&
                        !item?.queryDetails?.deal_done_date &&
                        !item?.queryDetails?.ringing_date &&
                        !item?.queryDetails?.switch_off_date &&
                        !item?.queryDetails?.wrong_no_date &&
                        !item?.queryDetails?.not_interested_date &&
                        !item?.queryDetails?.interested_date) {
                        uniqueFollowupCount++;
                    }
                }

                // Visit count - exact frontend logic
                if (item?.queryDetails?.visit_done_date != null && 
                    item?.queryDetails?.call_status === "Visit Done") {
                    visitCount++;
                }

                // Not interested count - exact frontend logic
                if (item?.queryDetails?.not_interested_date != null && 
                    item.leadStatus == "notInterest") {
                    notInterestedCount++;
                }

                // Interested count - exact frontend logic
                if (item?.queryDetails?.interested_date != null && 
                    item.leadStatus != "notInterest" && 
                    item.leadStatus === "followup") {
                    interestedCount++;
                }
            });

            return {
                userName: employee.userName,
                callTarget: employee.callTarget || 0,
                totalCallTarget: daysDiff * Number(employee.callTarget || 0),
                callCount: callCount,
                followupTarget: employee.followupTarget || 0,
                followUpCount: followUpCount,
                uniqueFollowupCount: uniqueFollowupCount,
                meetingTarget: employee.meetingTarget || 0,
                visitCount: visitCount,
                notInterestedCount: notInterestedCount,
                interestedCount: interestedCount
            };
        });

        // Execute all employee queries in parallel
        const employeeData = await Promise.all(employeeDataPromises);

        return HandleResponse({
            type: "SUCCESS",
            message: "Employee-wise data fetched successfully",
            data: employeeData
        });

    } catch (error: any) {
        console.error('Report POST Error:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}