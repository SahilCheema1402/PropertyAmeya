// app/api/lead/counts/route.ts
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import Query from "../../../../_model/LeadModel/Query.models"; 
import DB from "@app/_Database/db";
import HandleResponse from '../../../../_utils/response';
import Lead from '../../../../_model/LeadModel/lead.model';

export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const user: any = JSON.parse(req.headers.get('user') as string);
        const staffId = searchParams.get('staffId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');

        const companyId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(user?.company?._id);
        const userId = new mongoose.Types.ObjectId(user._id);
        const isPhoneSearch = search && /^\d{10}$/.test(search.replace(/\D/g, ''));

        // Helper function to get date range condition
        const getDateRangeCondition = (status: string) => {
            if (!startDate && !endDate) return {};

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

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

            const dateFieldMap: Record<string, string> = {
                'fresh': 'createAt',
                'followup': 'firstFollowupDate',
                'visitdone': 'visit_done_date',
                'meetingdone': 'meeting_done_date',
                'deal-done': 'deal_done_date',
                'ringing': 'ringing_date',
                'switchoff': 'switch_off_date',
                'wrongno': 'wrong_no_date',
                'notInterest': 'not_interested_date',
                'callback': 'createAt',
                'hotprospects': 'createAt',
                'suspects': 'createAt'
            };

            const dateField = dateFieldMap[status] || 'createAt';
            return { [dateField]: dateCondition };
        };

        const getStatusConditions = (status: string) => {
            switch (status) {
                case 'hotprospects':
                    return { isHotProspect: true };
                
                case 'suspects':
                    return { isSuspect: true };
                
                case 'deal-done':
                    return { 
                        leadStatus: "deal-done",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true }
                    };
                
                case 'notInterest':
                    return { 
                        leadStatus: "notInterest",
                        call_status: { $in: ["Visit Done", "Meeting Done", "Call Picked", "Ringing", "Call Back", "Wrong No", "Switch Off"] }
                    };
                
                case 'visitdone':
                    return { 
                        leadStatus: "followup",
                        call_status: "Visit Done",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true },
                    };
                
                case 'meetingdone':
                    return { 
                        leadStatus: "followup",
                        call_status: "Meeting Done",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true },
                    };
                
                case 'ringing':
                    return { 
                        call_status: "Ringing",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true },
                        leadStatus: { $nin: ["deal-done", "notInterest"] }
                    };
                
                case 'switchoff':
                    return { 
                        call_status: "Switch Off",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true },
                        leadStatus: { $nin: ["deal-done", "notInterest"] }
                    };
                
                case 'wrongno':
                    return { 
                        call_status: "Wrong No",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true },
                        leadStatus: { $nin: ["deal-done", "notInterest"] }
                    };
                
                case 'callback':
                    return { 
                        call_status: "Call Back",
                        isHotProspect: { $ne: true },
                        isSuspect: { $ne: true },
                        leadStatus: { $nin: ["deal-done", "notInterest"] }
                    };
                
                case 'followup':
                    return { 
                        leadStatus: "followup",
                        call_status: "Call Picked",
                    };
                
                case 'fresh':
                    return {
                        $and: [
                            { isHotProspect: { $ne: true } },
                            { isSuspect: { $ne: true } },
                            { leadStatus: { $nin: ["deal-done", "notInterest"] } },
                            { call_status: { $nin: ["Ringing", "Switch Off", "Wrong No", "Call Back", "Visit Done", "Meeting Done"] } },
                            {
                                $or: [
                                    { query: { $exists: false } },
                                    { query: { $size: 0 } },
                                    { leadStatus: "fresh" },
                                    { 
                                        leadStatus: { $in: ["followup", "follow-up"] },
                                        call_status: { $in: [null, "", "Select Call"] }
                                    },
                                    {
                                        call_status: "Call Picked",
                                        leadStatus: "fresh"
                                    }
                                ]
                            }
                        ]
                    };
                
                default:
                    return {};
            }
        };

        // Build base match condition based on role
        const baseMatchCondition: any = {
            company: companyId
        };

        if (user.role == 1 || user.role == 2) {
            // Admin
            if (staffId && staffId !== "678642d40797483103969bc5") {
                baseMatchCondition.assign = new mongoose.Types.ObjectId(staffId);
            }
        } else {
            // Non-admin
            const sentinelLeadBankId = "678642d40797483103969bc5";
            
            if (user.role === 31) {
                // Role 31: Only filter by staffId if not fresh or if specific staff selected
                if (staffId && staffId !== sentinelLeadBankId) {
                    baseMatchCondition.assign = new mongoose.Types.ObjectId(staffId);
                }
            } else if (user.role === 7 || user.role === 8 || user.role === 9) {
                if (staffId) {
                    const isSubordinate = user.subordinate?.some(
                        (subId: any) => subId.toString() === staffId.toString()
                    );
                    baseMatchCondition.assign = isSubordinate 
                        ? new mongoose.Types.ObjectId(staffId) 
                        : userId;
                } else {
                    baseMatchCondition.assign = userId;
                }
            } else {
                baseMatchCondition.assign = userId;
            }
        }

        // Add search filter
        if (search && !isPhoneSearch) {
            baseMatchCondition.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { source: { $regex: search, $options: 'i' } }
            ];
        }

        if (isPhoneSearch) {
            baseMatchCondition.phone = { $regex: search, $options: 'i' };
        }

        // OPTIMIZED: Build facet stages for counting only (no data fetching)
        const statusTypes = ['fresh', 'followup', 'notInterest', 'deal-done', 'ringing', 'callback', 'wrongno', 'switchoff', 'visitdone', 'meetingdone', 'hotprospects', 'suspects'];
        
        const facetStages: any = {};
        
        statusTypes.forEach(status => {
            const statusCondition = getStatusConditions(status);
            const dateRangeCondition = getDateRangeCondition(status);
            
            facetStages[`count_${status}`] = [
                { $match: { ...statusCondition, ...dateRangeCondition } },
                { $count: "total" }
            ];
        });

        const results = await Lead.aggregate([
            { $match: baseMatchCondition },
            { $facet: facetStages }
        ]);

        const counts: any = {};
        statusTypes.forEach(status => {
            const countResult = results[0][`count_${status}`];
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('-', '');
            counts[`Total${capitalizedStatus}`] = countResult[0]?.total || 0;
        });

        return HandleResponse({
            type: "SUCCESS",
            message: "status_counts",
            data: counts
        });

    } catch (error: any) {
        console.error('Error fetching status counts:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'An unexpected error occurred.',
        });
    }
}