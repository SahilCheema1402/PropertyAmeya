import DB from './../../../_Database/db';
import { NextApiRequest, NextApiResponse } from 'next';
import HandleResponse from './../../../_utils/response';
import Lead from './../../../_model/LeadModel/lead.model';
import ImageKit from 'imagekit';
import { map } from 'p-iteration';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';
import RemarksModel from '@app/_model/LeadModel/Remarks.model';
import QueryModels from '@app/_model/LeadModel/Query.models';
import userModel from '@app/_model/user/user.model';
import { Notification_Create } from '../notification/notificationUtils';
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY! || "public_PU0gdYD1LhtXpEqjtMIZzOGFEmQ=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY! || "private_JnnPIKCIbLFZIxpIzToORKoTe60=",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT! || "https://ik.imagekit.io/xdpr8on7w",
});
import mongoose, { FilterQuery, PipelineStage, Schema } from 'mongoose';
import leadModel from './../../../_model/LeadModel/lead.model';
import { DateTime } from 'luxon';
import { createSaleNotification } from '@app/_utils/saleNotificationUtils';
import { startOfDay, endOfDay } from "date-fns";

const normalizeFollowupDate = (followupDate: string | number | Date) => {
    if (!followupDate) return null;

    // First, let's see what we're receiving
    console.log('Raw followup_date input:', followupDate);

    // Parse the date string
    const inputDate = new Date(followupDate);
    console.log('Parsed as JS Date:', inputDate);
    console.log('JS Date getDate():', inputDate.getDate());
    console.log('JS Date getUTCDate():', inputDate.getUTCDate());

    // Use the local date components (this should give us the "28" that was selected)
    const year = inputDate.getFullYear();
    const month = inputDate.getMonth() + 1;
    const day = inputDate.getDate(); // This should be 28 if user selected 28

    console.log(`Extracted components: ${year}-${month}-${day}`);

    // Create DateTime for that date in IST
    const result = DateTime.fromObject({
        year: year,
        month: month,
        day: day,
        hour: 18,
        minute: 29,
        second: 59,
        millisecond: 999
    }, { zone: 'Asia/Kolkata' });

    console.log('Final result:', result.toISO());
    return result;
};


// Helper functions for Hot Prospect and Suspect validation
const canMarkAsHotProspect = (leadStatus: string, callStatus: string) => {
    const validCallStatuses = ['Call Picked', 'Visit Done', 'Meeting Done'];
    return leadStatus === 'followup' && validCallStatuses.includes(callStatus);
};

const canMarkAsSuspect = (leadStatus: string, callStatus: string) => {
    return leadStatus === 'fresh' && (!callStatus || callStatus === 'Call Back');
};

// Function to update Hot Prospect and Suspect status based on lead conditions
const updateHotProspectAndSuspectStatus = async (leadId: string) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) return;

        const updateData: any = {};
        let statusChanged = false;

        // Check if current Hot Prospect status is valid
        if (lead.isHotProspect && !canMarkAsHotProspect(lead.leadStatus, lead.call_status)) {
            updateData.isHotProspect = false;
            statusChanged = true;
            console.log(`Removing Hot Prospect status from lead ${leadId} - conditions no longer met`);
        }

        // Check if current Suspect status is valid
        if (lead.isSuspect && !canMarkAsSuspect(lead.leadStatus, lead.call_status)) {
            updateData.isSuspect = false;
            statusChanged = true;
            console.log(`Removing Suspect status from lead ${leadId} - conditions no longer met`);
        }

        // Update if any status changed
        if (statusChanged) {
            updateData.updateAt = DateTime.now().setZone('Asia/Kolkata');
            await Lead.findByIdAndUpdate(leadId, updateData);
            console.log(`Updated Hot Prospect/Suspect status for lead ${leadId}`);
        }
    } catch (error) {
        console.error('Error updating Hot Prospect/Suspect status:', error);
    }
};

const normalizeStatusValue = (status: string | number) => {
    if (!status) return status;

    // Normalize status values to match backend expectations
    const statusMap: { [key: string]: string } = {
        'followup': 'follow-up',
        'follow-up': 'follow-up',
        'fresh': 'fresh',
        'notInterest': 'Not Interested',
        'Not Interested': 'Not Interested',
        'Deal Done': 'Deal Done',
        'deal-done': 'Deal Done'
    };

    return statusMap[String(status)] || status;
};

const updateLeadStatus = async (leadId: string, newStatus: string, currentStatus: string) => {
    const updateData: any = {
        leadStatus: newStatus,
        updateAt: DateTime.now().setZone('Asia/Kolkata')
    };

    // If transitioning from fresh to followup for the first time
    if (currentStatus === 'fresh' && newStatus === 'followup') {
        updateData.firstFollowupDate = DateTime.now().setZone('Asia/Kolkata');
    }

    await Lead.findByIdAndUpdate(leadId, updateData);

    // Update Hot Prospect and Suspect status after lead status change
    await updateHotProspectAndSuspectStatus(leadId);
};

async function updateLeadCallStatus(leadId: string, queryId: string, callStatus: string) {
    try {
        console.log(`Attempting to update lead call_status for leadId: ${leadId}, queryId: ${queryId}, callStatus: ${callStatus}`);

        const leadWithQueries = await Lead.findById(leadId)
            .populate({
                path: 'query',
                model: QueryModels,
                options: { sort: { createAt: -1 } }
            });

        if (!leadWithQueries) {
            console.error(`Lead not found: ${leadId}`);
            return false;
        }

        if (!leadWithQueries.query || leadWithQueries.query.length === 0) {
            console.error(`Lead has no queries: ${leadId}`);
            return false;
        }

        // Get the latest query (first in the sorted array)
        const latestQuery = leadWithQueries.query[0];
        console.log(`Latest query ID: ${latestQuery._id}, Comparing with queryId: ${queryId}`);

        // Check if the updated query is the latest one
        if (latestQuery._id.toString() === queryId.toString()) {
            console.log(`Query is the latest - updating lead call_status to: ${callStatus}`);

            // Update lead's call_status to match the latest query's call_status
            const updateResult = await Lead.findByIdAndUpdate(leadId, {
                call_status: callStatus,
                updateAt: DateTime.now().setZone('Asia/Kolkata')
            }, { new: true });

            // Update Hot Prospect and Suspect status after call status change
            await updateHotProspectAndSuspectStatus(leadId);

            console.log(`Lead call_status updated successfully. New call_status: ${updateResult?.call_status}`);
            return true;
        } else {
            console.log(`Query is not the latest - skipping lead call_status update`);
            return false;
        }
    } catch (error) {
        console.error('Error updating lead call_status:', error);
        return false;
    }
}

async function updateLeadDatesFromLatestQuery(leadId: string) {
    try {
        console.log(`Updating lead dates from latest query for leadId: ${leadId}`);

        const leadWithQueries = await Lead.findById(leadId)
            .populate({
                path: 'query',
                model: QueryModels,
                options: { sort: { createAt: -1 } }
            });

        if (!leadWithQueries || !leadWithQueries.query || leadWithQueries.query.length === 0) {
            console.error(`Lead not found or has no queries: ${leadId}`);
            return false;
        }

        // Get the latest query (first in the sorted array)
        const latestQuery = leadWithQueries.query[0];
        console.log(`Syncing dates from latest query ID: ${latestQuery._id}`);

        // Prepare update object with date fields from the latest query
        const dateUpdateData: any = {
            updateAt: DateTime.now().setZone('Asia/Kolkata')
        };

        // List of date fields to sync from query to lead
        const dateFields = [
            'call_date',
            'call_visit_meeting_consider_in_follow_up_date',
            'visit_done_date',
            'meeting_done_date',
            'deal_done_date',
            'ringing_date',
            'switch_off_date',
            'wrong_no_date',
            'not_interested_date',
            'exp_visit_date',
            'followup_date',
            'shifting_date',
            'interested_date',
        ];

        // Copy all date fields from latest query to lead (including null values to reset dates)
        dateFields.forEach(field => {
            dateUpdateData[field] = latestQuery[field] || null;
        });

        // Update lead with the date fields from latest query
        await Lead.findByIdAndUpdate(leadId, dateUpdateData, { new: true });

        console.log(`Lead dates synced successfully from latest query`);
        return true;
    } catch (error) {
        console.error('Error updating lead dates from latest query:', error);
        return false;
    }
}

//lead create and update
export async function POST(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const _id = searchParams.get('id');
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!body) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Body Data is Missing!" })
        }
        if (_id !== 'undefined' && _id) {
            const lead = await Lead.findById(new mongoose.Types.ObjectId(body._id));
            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "Lead Not Found" })
            }
            const { query, _id, createAt, company, createdBy, __v, ...updateData } = body;
            await Lead.findByIdAndUpdate(
                new mongoose.Types.ObjectId(_id),
                {
                    $set: updateData
                },
                { new: true }
            );
            return HandleResponse({ type: "SUCCESS", message: "Updated Successfully" })
        }
        const Lead_ = new Lead({
            ...body,
            createdBy: user?._id,
            company: user?.company?._id
        })
        await Lead_.save();
        if (user.role !== 1 && user.role !== 2) {
            Lead_.assign.push(user._id)
            Lead_.updateAt = DateTime.now().setZone('Asia/Kolkata')
            Lead_.assignAt = DateTime.now().setZone('Asia/Kolkata');
            await Lead_.save();
            const LeadAssign: any = await userModel.findById(user._id);
            LeadAssign.Lead.push(Lead_._id);
            LeadAssign.updateAt = DateTime.now().setZone('Asia/Kolkata')
            await LeadAssign.save();
        }
        return HandleResponse({ type: "SUCCESS", message: "Created Successfully" })
    } catch (error: any) {
        if (error.code === 11000) {
            const duplicateEmail = Object.keys(error.keyValue)[0];  // Extract the duplicated field (email in this case)
            return HandleResponse({
                type: "BAD_REQUEST",
                message: `Duplicate key error.${error.keyValue[duplicateEmail]} already exist.`,
            })
        } else {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: error?.message
            })
        }
    }
}

export async function PUT(req: Request) {
    try {
        DB();
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!user?._id) {
            return HandleResponse({ type: "UNAUTHORIZED", message: "Invalid user information! Please Login Again" });
        }
        const { _id, query, type_, leadIndex, remarks, isHotProspect, isSuspect }: {
            _id: string,
            query: any,
            type_: string,
            leadIndex: number,
            remarks: string,
            isHotProspect?: boolean,
            isSuspect?: boolean
        } = body;

        if (!_id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Lead _id is Missing!" })
        }

        // Handle Hot Prospect marking
        if (type_ === "markHotProspect") {
            const lead = await Lead.findById(_id);
            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "Lead not found" });
            }

            // Check if lead meets conditions for Hot Prospect
            if (!canMarkAsHotProspect(lead.leadStatus, lead.call_status)) {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: "Lead cannot be marked as Hot Prospect. Conditions: Lead Status must be 'followup' and Call Status must be 'Call Picked', 'Visit Done', or 'Meeting Done'."
                });
            }

            const updateData: any = {
                isHotProspect: isHotProspect,
                updateAt: DateTime.now().setZone('Asia/Kolkata')
            };

            // If marking as Hot Prospect, ensure it's not a Suspect
            if (isHotProspect) {
                updateData.isSuspect = false;
            }

            await Lead.findByIdAndUpdate(_id, updateData);
            return HandleResponse({
                type: "SUCCESS",
                message: isHotProspect ? "Lead marked as Hot Prospect" : "Lead removed from Hot Prospects"
            });
        }

        // Handle Suspect marking
        if (type_ === "markSuspect") {
            const lead = await Lead.findById(_id);
            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "Lead not found" });
            }

            // Check if lead meets conditions for Suspect
            if (!canMarkAsSuspect(lead.leadStatus, lead.call_status)) {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: "Lead cannot be marked as Suspect. Conditions: Lead Status must be 'fresh' and Call Status must be null or 'Call Back'."
                });
            }

            const updateData: any = {
                isSuspect: isSuspect,
                updateAt: DateTime.now().setZone('Asia/Kolkata')
            };

            // If marking as Suspect, ensure it's not a Hot Prospect
            if (isSuspect) {
                updateData.isHotProspect = false;
            }

            await Lead.findByIdAndUpdate(_id, updateData);
            return HandleResponse({
                type: "SUCCESS",
                message: isSuspect ? "Lead marked as Suspect" : "Lead removed from Suspects"
            });
        }

        // Handle toggle query addition permission (Admin only)
        if (type_ === "toggleQueryAddition") {
            // Check if user is admin (role 1 or 2)
            if (user.role !== 1 && user.role !== 2) {
                return HandleResponse({ type: "FORBIDDEN", message: "Only admins can toggle query addition permission" });
            }

            const lead = await Lead.findById(_id);
            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "Lead not found" });
            }

            const newToggleState = query?.allowQueryAddition !== undefined ? query.allowQueryAddition : !lead.allowQueryAddition;

            await Lead.findByIdAndUpdate(_id, {
                allowQueryAddition: newToggleState,
                updateAt: DateTime.now().setZone('Asia/Kolkata')
            });

            return HandleResponse({
                type: "SUCCESS",
                message: newToggleState ? "Query addition enabled" : "Query addition disabled",
                data: { allowQueryAddition: newToggleState }
            });
        }

        if (!query && type_ !== "remarks") {
            return HandleResponse({ type: "BAD_REQUEST", message: "Lead Query is Missing!" })
        }

        let lead;
        const remarksContent = remarks || (query && query.remarks);
        if (type_ == "remarks") {
            lead = await QueryModels.findById(_id);
            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "_id is wrong" })
            }
        } else if (type_ === "add") {
            lead = await Lead.findById(_id);
            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "_id is wrong" })
            }
        }

        let remarkIds = [];
        if (query.remarks) {
            const newRemark = new RemarksModel({
                title: remarksContent,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            console.log("Saving new remark:", newRemark);
            await newRemark.save();
            remarkIds.push(newRemark._id);
            console.log("Remark saved with ID:", newRemark._id);
        }

        if (query.call_status == "Visit Done") {
            const newRemark = new RemarksModel({
                title: `Visit completed by ${user.userName}`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);

            // Use the provided visitDoneBy or default to current user
            query.visitDoneBy = query.visitDoneBy || user._id;
            query.meetingDoneBy = query.meetingDoneBy || user._id;
        }

        if (query.call_status == "Switch Off") {
            const newRemark = new RemarksModel({
                title: `I ${user.userName} made a call, but the phone is switched off.`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.call_status == "Wrong No") {
            const newRemark = new RemarksModel({
                title: `I ${user.userName} Made a Call, but Dialed the Wrong Number`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.call_status == "Ringing") {
            const newRemark = new RemarksModel({
                title: `I ${user.userName} made a call, but no one answered.`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.call_status == "Call Back") {
            const newRemark = new RemarksModel({
                title: `I ${user.userName} made a call, they said to call back later.`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.call_status == "Meeting Done") {
            const newRemark = new RemarksModel({
                title: `Meeting completed by ${user.userName}`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.status == "Not Interested") {
            const newRemark = new RemarksModel({
                title: `This lead is not interested, confirm by ${user.userName}`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.status == "Deal Done") {
            const newRemark = new RemarksModel({
                title: `This lead is now a customer, deal confirmed by ${user.userName}`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);

            // Get the full lead object for the notification
            const fullLead = await Lead.findById(_id);

            await createSaleNotification(
                fullLead,  // Pass the full lead object instead of just _id
                user._id,
                fullLead?.name || query.name || "Customer",
                query.project || "a project",
                query.leadType || ""
            );
            console.log("Creating sale notification for lead:", fullLead, "by user:", user._id);
        }

        if (query.status == "Budget Issue") {
            const newRemark = new RemarksModel({
                title: `Customer Discussion Regarding Budget Issue, Confirmed by ${user.userName}.`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.status == "Interested") {
            const newRemark = new RemarksModel({
                title: `Customer Showing Strong Interest, Potential for Further Discussion – Confirmed by ${user.userName}.`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        if (query.status == "Location Issue") {
            const newRemark = new RemarksModel({
                title: `Customer Facing Location Issue, Confirmed by ${user.userName}.`,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }

        // If the lead exists and type is "add", add the new query
        if (type_ === "add") {
            const admin: any[] = await userModel.find({ $or: [{ role: 1 }, { role: 2 }] }).lean();

            if (admin.length > 0 && query.status == "Deal Done") {
                const adminIds = admin.map(admin => admin._id);
                await map(adminIds, async (id) => {
                    await Notification_Create(
                        id,
                        `Deal Completed`,
                        `The project ${query.project || ""}, a ${query.leadType || ""} deal with the client ${query.name || ""}, has been successfully completed by ${user.userName || "Employee"}.`
                    );
                })
                await Notification_Create(
                    user._id,
                    `Deal Completed Successfully`,
                    `Congratulations!, ${user.userName}! You have successfully completed the deal for ${query.project || "Project"} ${query.leadType || ""} with the client ${query.name || ""}.`
                );
            }

            const newQuery = new QueryModels({
                ...query,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
                updateAt: DateTime.now().setZone('Asia/Kolkata'),
                createdBy: user._id,
                company: user?.company?._id,
                remarks: remarkIds,
                user: query.status == "Deal Done" ? user._id : null,
                call_date: DateTime.now().setZone('Asia/Kolkata'),
                followup_date: normalizeFollowupDate(query.followup_date),
                call_visit_meeting_consider_in_follow_up_date: (query.status == 'Interested' || query.call_status == "Visit Done" || query.status == "follow-up" || query.call_status == "Meeting Done") ? DateTime.now().setZone('Asia/Kolkata') : null,
                not_interested_date: (query.call_status == "Wrong No" || query.status == "Location Issue" || query.status == "Budget Issue" || query.status == "Not Interested") ? DateTime.now().setZone('Asia/Kolkata') : null,
                exp_visit_date: DateTime.now().setZone('Asia/Kolkata'),
                interested_date: query.status == 'Interested' ? DateTime.now().setZone('Asia/Kolkata') : null,
                deal_done_date: query.status == "Deal Done" ? DateTime.now().setZone('Asia/Kolkata') : null,
                ringing_date: query.call_status == "Ringing" ? DateTime.now().setZone('Asia/Kolkata') : null,
                switch_off_date: query.call_status == "Switch Off" ? DateTime.now().setZone('Asia/Kolkata') : null,
                wrong_no_date: query.call_status == "Wrong No" ? DateTime.now().setZone('Asia/Kolkata') : null,
                meeting_done_date: query.call_status == "Meeting Done" ? DateTime.now().setZone('Asia/Kolkata') : null,
                visit_done_date: query.call_status == "Visit Done" ? DateTime.now().setZone('Asia/Kolkata') : null,
            });
            await newQuery.save();

            const currentLeadStatus = lead.leadStatus;
            let newLeadStatus = lead.leadStatus;

            if (lead.leadStatus !== 'deal-done') {
                if (query.status == "Not Interested" ||
                    query.status == "Budget Issue" || query.status == "Location Issue") {
                    newLeadStatus = 'notInterest';
                } else if (query.status == "Deal Done") {
                    newLeadStatus = "deal-done";
                } else if (query.status == 'Interested' || query.call_status == "Visit Done" ||
                    query.call_status == "Meeting Done" || query.status == "follow-up") {
                    newLeadStatus = "followup";
                } else {
                    newLeadStatus = "fresh";
                }
            }

            // Update the lead with new query and auto-disable query addition
            await Lead.findByIdAndUpdate(_id, {
                $push: { query: newQuery._id },
                allowQueryAddition: false  // Auto-disable after query submission
            });

            // Update lead status with firstFollowupDate logic
            if (currentLeadStatus !== newLeadStatus) {
                await updateLeadStatus(_id, newLeadStatus, currentLeadStatus);
            }

            // FIXED: Update lead call_status if this is the latest query and call_status exists
            if (query.call_status) {
                console.log(`Updating call_status for new query. Lead ID: ${_id}, Query ID: ${newQuery._id}, Call Status: ${query.call_status}`);
                await updateLeadCallStatus(_id.toString(), newQuery._id.toString(), query.call_status);
            }

            // Always sync all dates from the latest query to the lead
            console.log(`Syncing all dates from latest query to lead. Lead ID: ${_id}`);
            await updateLeadDatesFromLatestQuery(_id.toString());
        }

        // If type is remarks
        else if (type_ === 'remarks' && remarksContent && _id) {
            const newRemark = new RemarksModel({
                title: remarksContent,
                user: user.userName,
                createdBy: user._id,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
            });
            await newRemark.save();

            // Add this critical update to associate the remark with the query
            await QueryModels.findByIdAndUpdate(
                _id,
                {
                    $push: { remarks: newRemark._id }, // Associate remark with query
                    call_date: DateTime.now().setZone('Asia/Kolkata'),
                    updateAt: DateTime.now().setZone('Asia/Kolkata'),
                }
            );
        }

        else if (type_ === "update" && _id) {
            // Normalize the status value
            if (query.status) {
                query.status = normalizeStatusValue(query.status);
                console.log(`Normalized status to: ${query.status}`);
            }

            const updatedDocument = await QueryModels.findByIdAndUpdate(
                _id,
                {
                    $set: {
                        ...query,
                        followup_date: query.followup_date ? normalizeFollowupDate(query.followup_date) : query.followup_date,
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        call_date: DateTime.now().setZone('Asia/Kolkata')
                    }
                },
                { new: true }
            );

            // FIXED: Find the lead associated with this query for call_status update
            const associatedLead = await Lead.findOne({ "query": updatedDocument?._id });

            if (query.status == "Not Interested") {
                const newRemark = new RemarksModel({
                    title: `This lead is not interested,confirm by ${user.userName}`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        not_interested_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "notInterest", lead.leadStatus);
                }
            }

            if (query.status == "Budget Issue") {
                const newRemark = new RemarksModel({
                    title: `Customer Discussion Regarding Budget Issue, Confirmed by ${user.userName}.`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        not_interested_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "notInterest", lead.leadStatus);
                }
            }

            if (query.status == "Location Issue") {
                const newRemark = new RemarksModel({
                    title: `Customer Facing Location Issue, Confirmed by ${user.userName}.`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        not_interested_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "notInterest", lead.leadStatus);
                }
            }

            if (query.call_status == "Visit Done") {
                const newRemark = new RemarksModel({
                    title: `Visit completed by ${user.userName}`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        visit_done_date: DateTime.now().setZone('Asia/Kolkata'),
                        call_visit_meeting_consider_in_follow_up_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "followup", lead.leadStatus);
                }
            }

            if (query.call_status == "Meeting Done") {
                const newRemark = new RemarksModel({
                    title: `Meeting completed by ${user.userName}`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        call_visit_meeting_consider_in_follow_up_date: DateTime.now().setZone('Asia/Kolkata'),
                        meeting_done_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "followup", lead.leadStatus);
                }
            }

            if (query.status == "follow-up") {
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "followup", lead.leadStatus);
                }
            }

            if (query.status == "Interested") {
                const newRemark = new RemarksModel({
                    title: `Customer Showing Strong Interest, Potential for Further Discussion – Confirmed by ${user.userName}.`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        interested_date: DateTime.now().setZone('Asia/Kolkata'),
                        call_visit_meeting_consider_in_follow_up_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "followup", lead.leadStatus);
                }
            }

            if (query.call_status == "Switch Off") {
                const newRemark = new RemarksModel({
                    title: `I (${user.userName}) made a call, but the phone is switched off.`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        switch_off_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
            }

            if (query.call_status == "Ringing") {
                const newRemark = new RemarksModel({
                    title: `I (${user.userName}) made a call, but no one answered.`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                        ringing_date: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
            }

            if (query.call_status == "Call Back") {
                const newRemark = new RemarksModel({
                    title: `I (${user.userName}) made a call, they said to call back later.`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
            }

            if (query.status == "Deal Done" &&
                (!query.incentive_slab && !query.actual_revnue && !query.discount && !query.lead_actual_slab)) {
                const admin: any[] = await userModel.find({ $or: [{ role: 1 }, { role: 2 }] }).lean();
                if (admin.length > 0) {
                    const adminIds = admin.map(admin => admin._id);
                    await map(adminIds, async (id) => {
                        await Notification_Create(
                            id,
                            `Deal Completed`,
                            `The project ${query.project || ""}, a ${query.leadType || ""} deal with the client ${query.name || ""}, has been successfully completed by ${user.userName || "Employee"}.`
                        );
                    })
                    await Notification_Create(
                        user._id,
                        `Deal Completed Successfully`,
                        `Congratulations!, ${user.userName}! You have successfully completed the deal for ${query.project || "Project"} ${query.leadType || ""} with the client ${query.name || ""}.`
                    );
                }

                // Get the full lead object
                const fullLead = await Lead.findOne({ "query": updatedDocument?._id });

                // Create sale notification
                await createSaleNotification(
                    fullLead,
                    user._id,
                    fullLead?.name || query.name || "Customer",
                    query.project || "a project",
                    query.leadType || ""
                );

                const newRemark = new RemarksModel({
                    title: `This lead is now a customer, deal confirmed by ${user.userName}`,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                await QueryModels.findByIdAndUpdate(
                    _id,
                    {
                        $push: { remarks: newRemark._id },
                        user: query.status == "Deal Done" ? user._id : null,
                        deal_done_date: DateTime.now().setZone('Asia/Kolkata'),
                        updateAt: DateTime.now().setZone('Asia/Kolkata'),
                    }
                );
                const lead = await Lead.findOne({ "query": updatedDocument?._id });
                if (lead && lead?.leadStatus !== "deal-done") {
                    await updateLeadStatus(lead._id, "deal-done", lead.leadStatus);
                }
            }

            if (query.status && updatedDocument) {
                const lead = await Lead.findOne({ "query": updatedDocument._id });

                if (lead && lead.leadStatus !== "deal-done") {
                    let newLeadStatus = lead.leadStatus;

                    // Determine new lead status based on query status
                    if (query.status === "Not Interested" || query.status === "Budget Issue" || query.status === "Location Issue") {
                        newLeadStatus = "notInterest";
                    } else if (query.status === "Deal Done") {
                        newLeadStatus = "deal-done";
                    } else if (query.status === "Interested" || query.status === "follow-up") {
                        newLeadStatus = "followup";
                    } else if (query.status === "fresh") {
                        newLeadStatus = "fresh";
                    }

                    // Update lead status if it changed
                    if (newLeadStatus !== lead.leadStatus) {
                        console.log(`Updating lead status from ${lead.leadStatus} to ${newLeadStatus} for lead ${lead._id}`);
                        await updateLeadStatus(lead._id, newLeadStatus, lead.leadStatus);
                    }
                }
            }

            // Also, ensure call status-based lead status updates work
            if (query.call_status && updatedDocument) {
                const lead = await Lead.findOne({ "query": updatedDocument._id });

                if (lead && lead.leadStatus !== "deal-done") {
                    let newLeadStatus = lead.leadStatus;

                    // Update lead status based on call status if no explicit status is provided
                    if (!query.status) {
                        if (['Call Picked', 'Visit Done', 'Meeting Done'].includes(query.call_status)) {
                            newLeadStatus = "followup";
                        } else if (['Switch Off', 'Ringing', 'Call Back', 'Wrong No'].includes(query.call_status)) {
                            // Keep as fresh for these call statuses unless explicitly changed
                            newLeadStatus = "fresh";
                        }

                        // Update if changed
                        if (newLeadStatus !== lead.leadStatus) {
                            console.log(`Updating lead status based on call_status from ${lead.leadStatus} to ${newLeadStatus} for lead ${lead._id}`);
                            await updateLeadStatus(lead._id, newLeadStatus, lead.leadStatus);
                        }
                    }
                }
            }

            // Update lead call_status if this is the latest query and call_status exists
            if (query.call_status && associatedLead && updatedDocument) {
                await updateLeadCallStatus(associatedLead._id.toString(), updatedDocument._id.toString(), query.call_status);
            }

            // Always sync all dates from the latest query to the lead after any update
            if (associatedLead) {
                console.log(`Syncing all dates from latest query to lead after update. Lead ID: ${associatedLead._id}`);
                await updateLeadDatesFromLatestQuery(associatedLead._id.toString());
            }
        }

        return HandleResponse({ type: "SUCCESS", message: "Successfully updated the lead" });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}
/**
 * @swagger
 * tags:
 *   - name: Leads
 *     description: Operations related to Leads
 *
 * /api/v1/lead:
 *   get:
 *     tags:
 *       - Leads
 *     description: Leads Getting
 *     responses:
 *       200:
 *         description: successfully!
 *       400:
 *         description: Bad request
 */



export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const user: any = JSON.parse(req.headers.get('user') as string);
        const search = searchParams.get('search');
        const selectedStatus = searchParams.get('selectedStatus');
        const leadType = searchParams.get('leadType');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const staffId = searchParams.get('staffId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const isPhoneSearch = search && /^\d{10}$/.test(search.replace(/\D/g, ''));
        const companyId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(user?.company?._id);
        const userId = new mongoose.Types.ObjectId(user._id);

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

        // FIXED: Mutually exclusive status conditions
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

        if (user.role == 1 || user.role == 2) {
            // ADMIN USERS - OPTIMIZED VERSION
            const baseMatchCondition: any = {
                company: companyId
            };

            if (staffId && staffId !== "678642d40797483103969bc5") {
                baseMatchCondition.assign = new mongoose.Types.ObjectId(staffId);
            }

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
                const phoneMatchCondition = {
                    company: companyId,
                    phone: { $regex: search, $options: 'i' },
                    ...(staffId && staffId !== "678642d40797483103969bc5" && {
                        assign: new mongoose.Types.ObjectId(staffId)
                    })
                };

                const phoneResults = await Lead.aggregate([
                    { $match: phoneMatchCondition },
                    {
                        $facet: {
                            categorized: [
                                {
                                    $addFields: {
                                        category: {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: ["$isHotProspect", true] }, then: "hotprospects" },
                                                    { case: { $eq: ["$isSuspect", true] }, then: "suspects" },
                                                    { case: { $eq: ["$leadStatus", "deal-done"] }, then: "deal-done" },
                                                    { case: { $eq: ["$leadStatus", "notInterest"] }, then: "notInterest" },
                                                    { case: { $and: [{ $eq: ["$leadStatus", "followup"] }, { $eq: ["$call_status", "Visit Done"] }] }, then: "visitdone" },
                                                    { case: { $and: [{ $eq: ["$leadStatus", "followup"] }, { $eq: ["$call_status", "Meeting Done"] }] }, then: "meetingdone" },
                                                    { case: { $eq: ["$call_status", "Ringing"] }, then: "ringing" },
                                                    { case: { $eq: ["$call_status", "Switch Off"] }, then: "switchoff" },
                                                    { case: { $eq: ["$call_status", "Wrong No"] }, then: "wrongno" },
                                                    { case: { $eq: ["$call_status", "Call Back"] }, then: "callback" },
                                                    { case: { $and: [{ $eq: ["$leadStatus", "followup"] }, { $eq: ["$call_status", "Call Picked"] }] }, then: "followup" }
                                                ],
                                                default: "fresh"
                                            }
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$category",
                                        count: { $sum: 1 }
                                    }
                                }
                            ],
                            data: [
                                { $match: getStatusConditions(selectedStatus ?? "fresh") },
                                { $sort: { createAt: -1 } },
                                { $skip: (page - 1) * limit },
                                { $limit: limit },
                                {
                                    $lookup: {
                                        from: "querys",
                                        localField: "query",
                                        foreignField: "_id",
                                        as: "queryDetails",
                                        pipeline: [
                                            { $sort: { createAt: -1 } },
                                            { $limit: 1 },
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
                                        latestQuery: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$queryDetails" }, 0] },
                                                then: { $arrayElemAt: ["$queryDetails", -1] },
                                                else: null
                                            }
                                        }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "assign",
                                        foreignField: "_id",
                                        as: "assignedUsers",
                                        pipeline: [{ $project: { userName: 1, _id: 1 } }]
                                    }
                                }
                            ]
                        }
                    }
                ]);

                const statusCounts = phoneResults[0].categorized.reduce((acc: any, item: any) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {});

                return HandleResponse({
                    type: "SUCCESS",
                    message: "phone_search_results",
                    data: {
                        fields_: phoneResults[0].data,
                        phoneSearchResults: statusCounts,
                        availableStatuses: Object.keys(statusCounts),
                        TotalFresh: statusCounts['fresh'] || 0,
                        TotalFollowup: statusCounts['followup'] || 0,
                        TotalNotInterest: statusCounts['notInterest'] || 0,
                        TotalDealdone: statusCounts['deal-done'] || 0,
                        TotalRinging: statusCounts['ringing'] || 0,
                        TotalCallback: statusCounts['callback'] || 0,
                        TotalWrongno: statusCounts['wrongno'] || 0,
                        TotalSwitchoff: statusCounts['switchoff'] || 0,
                        TotalVisitdone: statusCounts['visitdone'] || 0,
                        TotalMeetingdone: statusCounts['meetingdone'] || 0,
                        TotalHotprospects: statusCounts['hotprospects'] || 0,
                        TotalSuspects: statusCounts['suspects'] || 0
                    }
                });
            }

            // OPTIMIZED: Only count and fetch what's needed for the selected status
            const selectedStatusCondition = selectedStatus ? getStatusConditions(selectedStatus) : {};
            const selectedDateRangeCondition = selectedStatus ? getDateRangeCondition(selectedStatus) : {};
            
            // Combined condition for selected status
            const finalMatchCondition = {
                ...baseMatchCondition,
                ...selectedStatusCondition,
                ...selectedDateRangeCondition
            };

            // Build aggregation pipeline
            const pipeline: any[] = [
                { $match: finalMatchCondition }
            ];

            // Add leadType filter if needed
            if (leadType && leadType !== 'all') {
                pipeline.push(
                    {
                        $lookup: {
                            from: "querys",
                            localField: "query",
                            foreignField: "_id",
                            as: "tempQuery",
                            pipeline: [
                                { $sort: { createAt: -1 } },
                                { $limit: 1 },
                                { $project: { leadType: 1 } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            tempLatestQuery: {
                                $arrayElemAt: ["$tempQuery", 0]
                            }
                        }
                    },
                    {
                        $match: {
                            "tempLatestQuery.leadType": { $regex: leadType, $options: 'i' }
                        }
                    }
                );
            }

            // Add facet for count and data
            pipeline.push({
                $facet: {
                    total: [{ $count: "count" }],
                    data: [
                        { $sort: { createAt: -1 } },
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "querys",
                                localField: "query",
                                foreignField: "_id",
                                as: "queryDetails",
                                pipeline: [
                                    { $sort: { createAt: -1 } },
                                    { $limit: 1 },
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
                                latestQuery: {
                                    $cond: {
                                        if: { $gt: [{ $size: "$queryDetails" }, 0] },
                                        then: { $arrayElemAt: ["$queryDetails", -1] },
                                        else: null
                                            }
                                        }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "assign",
                                        foreignField: "_id",
                                        as: "assignedUsers",
                                        pipeline: [{ $project: { userName: 1, _id: 1 } }]
                                    }
                                }
                            ]
                        }
                    });

            const results = await Lead.aggregate(pipeline);

            const currentStatusTotal = results[0].total[0]?.count || 0;
            const leadsData = results[0].data;

            // OPTIMIZED: Only count other statuses if specifically needed (e.g., for UI badges)
            // For now, we'll return null/0 for other counts to speed up the response
            // The frontend should handle missing counts gracefully
            
            return HandleResponse({
                type: "SUCCESS",
                message: search ? "search_results" : "",
                data: {
                    fields_: leadsData,
                    [`Total${selectedStatus?.charAt(0).toUpperCase()}${selectedStatus?.slice(1).replace('-', '')}`]: currentStatusTotal,
                    total: currentStatusTotal,
                    // Only include the current status count
                    // Other counts can be fetched separately if needed
                }
            });

        } else {
            // NON-ADMIN USERS - APPLY SAME OPTIMIZATION
            const sentinelLeadBankId = "678642d40797483103969bc5";
            const isFreshSelected = (selectedStatus ?? "") === "fresh";

            const baseMatchCondition: any = {
                company: companyId
            };

            if (user.role === 31) {
                if (isFreshSelected) {
                    if (staffId && staffId !== sentinelLeadBankId) {
                        baseMatchCondition.assign = new mongoose.Types.ObjectId(staffId);
                    }
                } else {
                    baseMatchCondition.assign = userId;
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
                // Same phone search logic as admin
                const phoneMatchCondition = {
                    ...baseMatchCondition,
                    phone: { $regex: search, $options: 'i' }
                };

                const phoneResults = await Lead.aggregate([
                    { $match: phoneMatchCondition },
                    {
                        $facet: {
                            categorized: [
                                {
                                    $addFields: {
                                        category: {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: ["$isHotProspect", true] }, then: "hotprospects" },
                                                    { case: { $eq: ["$isSuspect", true] }, then: "suspects" },
                                                    { case: { $eq: ["$leadStatus", "deal-done"] }, then: "deal-done" },
                                                    { case: { $eq: ["$leadStatus", "notInterest"] }, then: "notInterest" },
                                                    { case: { $and: [{ $eq: ["$leadStatus", "followup"] }, { $eq: ["$call_status", "Visit Done"] }] }, then: "visitdone" },
                                                    { case: { $and: [{ $eq: ["$leadStatus", "followup"] }, { $eq: ["$call_status", "Meeting Done"] }] }, then: "meetingdone" },
                                                    { case: { $eq: ["$call_status", "Ringing"] }, then: "ringing" },
                                                    { case: { $eq: ["$call_status", "Switch Off"] }, then: "switchoff" },
                                                    { case: { $eq: ["$call_status", "Wrong No"] }, then: "wrongno" },
                                                    { case: { $eq: ["$call_status", "Call Back"] }, then: "callback" },
                                                    { case: { $and: [{ $eq: ["$leadStatus", "followup"] }, { $eq: ["$call_status", "Call Picked"] }] }, then: "followup" }
                                                ],
                                                default: "fresh"
                                            }
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: "$category",
                                        count: { $sum: 1 }
                                    }
                                }
                            ],
                            data: [
                                { $match: getStatusConditions(selectedStatus ?? "fresh") },
                                { $sort: { createAt: -1 } },
                                { $skip: (page - 1) * limit },
                                { $limit: limit },
                                {
                                    $lookup: {
                                        from: "querys",
                                        localField: "query",
                                        foreignField: "_id",
                                        as: "queryDetails",
                                        pipeline: [
                                            { $sort: { createAt: -1 } },
                                            { $limit: 1 },
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
                                        latestQuery: {
                                            $cond: {
                                                if: { $gt: [{ $size: "$queryDetails" }, 0] },
                                                then: { $arrayElemAt: ["$queryDetails", -1] },
                                                else: null
                                            }
                                        }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "assign",
                                        foreignField: "_id",
                                        as: "assignedUsers",
                                        pipeline: [{ $project: { userName: 1, _id: 1 } }]
                                    }
                                }
                            ]
                        }
                    }
                ]);

                const statusCounts = phoneResults[0].categorized.reduce((acc: any, item: any) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {});

                return HandleResponse({
                    type: "SUCCESS",
                    message: "phone_search_results",
                    data: {
                        fields_: phoneResults[0].data,
                        phoneSearchResults: statusCounts,
                        availableStatuses: Object.keys(statusCounts),
                        TotalFresh: statusCounts['fresh'] || 0,
                        TotalFollowup: statusCounts['followup'] || 0,
                        TotalNotInterest: statusCounts['notInterest'] || 0,
                        TotalDealdone: statusCounts['deal-done'] || 0,
                        TotalRinging: statusCounts['ringing'] || 0,
                        TotalCallback: statusCounts['callback'] || 0,
                        TotalWrongno: statusCounts['wrongno'] || 0,
                        TotalSwitchoff: statusCounts['switchoff'] || 0,
                        TotalVisitdone: statusCounts['visitdone'] || 0,
                        TotalMeetingdone: statusCounts['meetingdone'] || 0,
                        TotalHotprospects: statusCounts['hotprospects'] || 0,
                        TotalSuspects: statusCounts['suspects'] || 0
                    }
                });
            }

            // OPTIMIZED: Same as admin section
            const selectedStatusCondition = selectedStatus ? getStatusConditions(selectedStatus) : {};
            const selectedDateRangeCondition = selectedStatus ? getDateRangeCondition(selectedStatus) : {};
            
            const finalMatchCondition = {
                ...baseMatchCondition,
                ...selectedStatusCondition,
                ...selectedDateRangeCondition
            };

            const pipeline: any[] = [
                { $match: finalMatchCondition }
            ];

            if (leadType && leadType !== 'all') {
                pipeline.push(
                    {
                        $lookup: {
                            from: "querys",
                            localField: "query",
                            foreignField: "_id",
                            as: "tempQuery",
                            pipeline: [
                                { $sort: { createAt: -1 } },
                                { $limit: 1 },
                                { $project: { leadType: 1 } }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            tempLatestQuery: {
                                $arrayElemAt: ["$tempQuery", 0]
                            }
                        }
                    },
                    {
                        $match: {
                            "tempLatestQuery.leadType": { $regex: leadType, $options: 'i' }
                        }
                    }
                );
            }

            pipeline.push({
                $facet: {
                    total: [{ $count: "count" }],
                    data: [
                        { $sort: { createAt: -1 } },
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: "querys",
                                localField: "query",
                                foreignField: "_id",
                                as: "queryDetails",
                                pipeline: [
                                    { $sort: { createAt: -1 } },
                                    { $limit: 1 },
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
                                latestQuery: {
                                    $cond: {
                                        if: { $gt: [{ $size: "$queryDetails" }, 0] },
                                        then: { $arrayElemAt: ["$queryDetails", -1] },
                                        else: null
                                    }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "assign",
                                foreignField: "_id",
                                as: "assignedUsers",
                                pipeline: [{ $project: { userName: 1, _id: 1 } }]
                            }
                        }
                    ]
                }
            });

            const results = await Lead.aggregate(pipeline);

            const currentStatusTotal = results[0].total[0]?.count || 0;
            const leadsData = results[0].data;

            return HandleResponse({
                type: "SUCCESS",
                message: search ? "search_results" : "",
                data: {
                    fields_: leadsData,
                    [`Total${selectedStatus?.charAt(0).toUpperCase()}${selectedStatus?.slice(1).replace('-', '')}`]: currentStatusTotal,
                    total: currentStatusTotal,
                }
            });
        }

    } catch (error: any) {
        console.error('Error handling GET request:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'An unexpected error occurred.',
        });
    }
}

export async function PATCH(req: Request) {
    try {
        const form = await req.formData();

        let FilesDetails: File[] = [];
        let UploadFiles: UploadResponse[] = [];

        // Collect files from the form data
        form.forEach((value, key) => {
            if (value instanceof File) {
                FilesDetails.push(value);
            }
        });

        if (FilesDetails.length > 0) {
            await Promise.all(FilesDetails?.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const upload = await imagekit.upload({
                    file: buffer,
                    fileName: file.name,
                });

                UploadFiles.push(upload);
            }));
        }

        return HandleResponse({ type: "SUCCESS", data: { UploadFiles } });
    } catch (error: any) {
        console.error('Error handling PATCH request:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'An unexpected error occurred.',
        });
    }
}