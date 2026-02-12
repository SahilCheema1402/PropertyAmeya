import mongoose from "mongoose";
import { NextResponse } from "next/server";
import Query from "../../../../_model/LeadModel/Query.models"; 
import DB from "@app/_Database/db";
import HandleResponse from '../../../../_utils/response';
import Lead from '../../../../_model/LeadModel/lead.model';
 
export async function POST(req: Request) {
    try {
        DB();
       
        const user: any = JSON.parse(req.headers.get('user') as string);
       
        // Optional: Add role-based access control
        if (user.role !== 1 && user.role !== 2) {
            return HandleResponse({
                type: "UNAUTHORIZED",
                message: "You don't have permission to perform this action"
            });
        }
 
        // Get all leads with their queries
        const leads = await Lead.find({
            company: user?.company?._id
        }).select('_id phone query');
 
        let updatedCount = 0;
        let errorCount = 0;
 
        // Process each lead
        for (const lead of leads) {
            try {
                // Prepare update object
                const updateFields: any = {
                    updateAt: new Date()
                };

                // Set allowQueryAddition based on query field
                if (!lead.query || lead.query.length === 0) {
                    // If query is null, undefined, or empty array, set allowQueryAddition to false
                    updateFields.allowQueryAddition = true;
                } else {
                    // If query has data (array with elements), set allowQueryAddition to true
                    updateFields.allowQueryAddition = false;
                    
                    // Get the latest query for this lead
                    const latestQuery = await Query.findOne({
                        _id: { $in: lead.query }
                    })
                    .sort({ createAt: -1 }) // Sort by creation date descending
                    .select('call_status call_date call_visit_meeting_consider_in_follow_up_date visit_done_date meeting_done_date deal_done_date ringing_date switch_off_date wrong_no_date not_interested_date followup_date shifting_date');
 
                    if (latestQuery) {
                        // Add call_status if it exists
                        if (latestQuery.call_status) {
                            updateFields.call_status = latestQuery.call_status;
                        }

                        // Add all date fields if they exist
                        if (latestQuery.call_date) {
                            updateFields.call_date = latestQuery.call_date;
                        }
                        if (latestQuery.call_visit_meeting_consider_in_follow_up_date) {
                            updateFields.call_visit_meeting_consider_in_follow_up_date = latestQuery.call_visit_meeting_consider_in_follow_up_date;
                        }
                        if (latestQuery.visit_done_date) {
                            updateFields.visit_done_date = latestQuery.visit_done_date;
                        }
                        if (latestQuery.meeting_done_date) {
                            updateFields.meeting_done_date = latestQuery.meeting_done_date;
                        }
                        if (latestQuery.deal_done_date) {
                            updateFields.deal_done_date = latestQuery.deal_done_date;
                        }
                        if (latestQuery.ringing_date) {
                            updateFields.ringing_date = latestQuery.ringing_date;
                        }
                        if (latestQuery.switch_off_date) {
                            updateFields.switch_off_date = latestQuery.switch_off_date;
                        }
                        if (latestQuery.wrong_no_date) {
                            updateFields.wrong_no_date = latestQuery.wrong_no_date;
                        }
                        if (latestQuery.not_interested_date) {
                            updateFields.not_interested_date = latestQuery.not_interested_date;
                        }
                        if (latestQuery.followup_date) {
                            updateFields.followup_date = latestQuery.followup_date;
                        }
                        if (latestQuery.shifting_date) {
                            updateFields.shifting_date = latestQuery.shifting_date;
                        }
                    }
                }

                // Update the lead with the data
                await Lead.findByIdAndUpdate(
                    lead._id,
                    { $set: updateFields },
                    { new: true }
                );
                updatedCount++;
            } catch (error) {
                console.error(`Error updating lead ${lead._id}:`, error);
                errorCount++;
            }
        }
 
        return HandleResponse({
            type: "SUCCESS",
            message: `Successfully updated ${updatedCount} leads with call status, dates, and allowQueryAddition. ${errorCount} errors occurred.`,
            data: {
                totalLeads: leads.length,
                updatedLeads: updatedCount,
                errors: errorCount
            }
        });
 
    } catch (error: any) {
        console.error("Error in update lead call status and dates:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "An error occurred while updating lead call status and dates"
        });
    }
}
 
// Alternative method using aggregation pipeline for better performance
export async function PUT(req: Request) {
    try {
        DB();
       
        const user: any = JSON.parse(req.headers.get('user') as string);
       
        // Optional: Add role-based access control
        if (user.role !== 1 && user.role !== 2) {
            return HandleResponse({
                type: "UNAUTHORIZED",
                message: "You don't have permission to perform this action"
            });
        }
 
        // Use aggregation pipeline for better performance
        const result = await Lead.aggregate([
            {
                $match: {
                    company: new mongoose.Types.ObjectId(user?.company?._id)
                }
            },
            {
                $lookup: {
                    from: 'queries', // Make sure this matches your Query collection name
                    localField: 'query',
                    foreignField: '_id',
                    as: 'queryData'
                }
            },
            {
                $addFields: {
                    latestQuery: {
                        $arrayElemAt: [
                            {
                                $sortArray: {
                                    input: '$queryData',
                                    sortBy: { createAt: -1 }
                                }
                            },
                            0
                        ]
                    },
                    // Add allowQueryAddition logic in aggregation
                    allowQueryAddition: {
                        $cond: {
                            if: { 
                                $or: [
                                    { $eq: ["$query", null] },
                                    { $eq: ["$query", []] },
                                    { $eq: [{ $size: { $ifNull: ["$query", []] } }, 0] }
                                ]
                            },
                            then: false,
                            else: true
                        }
                    }
                }
            }
        ]);
 
        let updatedCount = 0;
       
        // Update leads in batches
        for (const lead of result) {
            const updateFields: any = {
                allowQueryAddition: lead.allowQueryAddition,
                updateAt: new Date()
            };

            // Add call_status if latest query exists
            if (lead.latestQuery && lead.latestQuery.call_status) {
                updateFields.call_status = lead.latestQuery.call_status;
            }

            await Lead.findByIdAndUpdate(
                lead._id,
                { $set: updateFields }
            );
            updatedCount++;
        }
 
        return HandleResponse({
            type: "SUCCESS",
            message: `Successfully updated ${updatedCount} leads using aggregation pipeline with allowQueryAddition.`,
            data: {
                updatedLeads: updatedCount
            }
        });
 
    } catch (error: any) {
        console.error("Error in aggregation update:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "An error occurred while updating lead call status"
        });
    }
}