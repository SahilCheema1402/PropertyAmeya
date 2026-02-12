import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@app/_Database/db";
import Lead from '@app/_model/LeadModel/lead.model';
import Query from '@app/_model/LeadModel/Query.models';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { queryId, leadId } = await req.json();

    if (!queryId || !leadId) {
      return NextResponse.json(
        { success: false, message: 'Query ID and Lead ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(queryId) || !mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // --- REMOVED SESSION START ---

    // Find the query to be deleted
    // REMOVED .session(session)
    const queryToDelete = await Query.findById(queryId);

    if (!queryToDelete) {
      return NextResponse.json(
        { success: false, message: 'Query not found' },
        { status: 404 }
      );
    }

    // Find the lead
    // REMOVED .session(session)
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    const belongs = lead.query.some((id: any) => id.toString() === queryId);
    if (!belongs) {
      return NextResponse.json(
        { success: false, message: 'Query does not belong to this lead' },
        { status: 400 }
      );
    }

    // Soft delete: Mark query as deleted and add to deletedQueries array
    queryToDelete.deleted = true;
    queryToDelete.deletedAt = new Date();
    // REMOVED { session }
    await queryToDelete.save();

    // Remove the query reference from the Lead's query array
    lead.query = lead.query.filter((id: { toString: () => any; }) => id.toString() !== queryId);

    // Add to deletedQueries array with timestamp
    if (!lead.deletedQueries) {
      lead.deletedQueries = [];
    }

    lead.deletedQueries.push({
      queryId: queryId,
      deletedAt: new Date(),
      deletedBy: "system"
    });

    // Find the latest non-deleted query to update lead status
    const remainingQueryIds = lead.query;

    if (remainingQueryIds.length > 0) {
      // Get the most recent query (last in array)
      const latestQueryId = remainingQueryIds[remainingQueryIds.length - 1];
      // REMOVED .session(session)
      const latestQuery = await Query.findById(latestQueryId);

      if (latestQuery) {
        let newLeadStatus = lead.leadStatus;
        let newCallStatus = lead.call_status;

        // Update call status from the latest query
        if (latestQuery.call_status) {
          newCallStatus = latestQuery.call_status;
        }

        // Update lead status based on query status
        if (lead.leadStatus !== 'deal-done') {
          if (latestQuery.status == "Not Interested" ||
            latestQuery.status == "Budget Issue" ||
            latestQuery.status == "Location Issue") {
            newLeadStatus = 'notInterest';
          } else if (latestQuery.status == "Deal Done") {
            newLeadStatus = "deal-done";
          } else if (latestQuery.status == 'Interested' ||
            latestQuery.call_status == "Visit Done" ||
            latestQuery.call_status == "Meeting Done" ||
            latestQuery.status == "follow-up") {
            newLeadStatus = "followup";
          } else {
            newLeadStatus = "fresh";
          }
        }

        // Apply the updates
        lead.leadStatus = newLeadStatus;
        lead.call_status = newCallStatus;

        applyLeadDatesFromLatestQuery(lead, latestQuery);
      }
    } else {
      // No queries left, reset to default status
      lead.leadStatus = 'fresh';
      lead.call_status = '';

      // Reset all date fields when no queries remain
      lead.call_date = null;
      lead.call_visit_meeting_consider_in_follow_up_date = null;
      lead.visit_done_date = null;
      lead.meeting_done_date = null;
      lead.deal_done_date = null;
      lead.ringing_date = null;
      lead.switch_off_date = null;
      lead.wrong_no_date = null;
      lead.not_interested_date = null;
      lead.followup_date = null;
      lead.shifting_date = null;
    }

    lead.updateAt = DateTime.now().setZone('Asia/Kolkata').toJSDate();
    // REMOVED { session }
    await lead.save();

    // --- REMOVED SESSION COMMIT ---

    return NextResponse.json({
      success: true,
      message: 'Query soft deleted successfully',
      data: {
        deletedQueryId: queryId,
        updatedLeadStatus: lead.leadStatus,
        updatedCallStatus: lead.call_status
      }
    });

  } catch (error: any) {
    console.error('Delete query error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete query',
        error: error.message
      },
      { status: 500 }
    );
  }
}

function applyLeadDatesFromLatestQuery(lead: any, latestQuery: any) {
  if (latestQuery.call_date) lead.call_date = latestQuery.call_date;
  if (latestQuery.call_visit_meeting_consider_in_follow_up_date)
    lead.call_visit_meeting_consider_in_follow_up_date = latestQuery.call_visit_meeting_consider_in_follow_up_date;
  if (latestQuery.visit_done_date) lead.visit_done_date = latestQuery.visit_done_date;
  if (latestQuery.meeting_done_date) lead.meeting_done_date = latestQuery.meeting_done_date;
  if (latestQuery.deal_done_date) lead.deal_done_date = latestQuery.deal_done_date;
  if (latestQuery.ringing_date) lead.ringing_date = latestQuery.ringing_date;
  if (latestQuery.switch_off_date) lead.switch_off_date = latestQuery.switch_off_date;
  if (latestQuery.wrong_no_date) lead.wrong_no_date = latestQuery.wrong_no_date;
  if (latestQuery.not_interested_date) lead.not_interested_date = latestQuery.not_interested_date;
  if (latestQuery.followup_date) lead.followup_date = latestQuery.followup_date;
  if (latestQuery.shifting_date) lead.shifting_date = latestQuery.shifting_date;
}