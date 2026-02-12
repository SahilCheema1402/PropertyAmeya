import mongoose from 'mongoose';
import Lead from '@app/_model/LeadModel/lead.model';
import { DateTime } from 'luxon';
import DB from '@app/_Database/db';

export async function checkAndUpdateRechurnLeads(thresholdDays = 30) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await DB();
    }

    // July 23, 2025 cutoff date - assignments after this date follow new rechurn logic
    const cutoffDate = new Date('2025-07-23T23:59:59.999Z');
    
    // May 30th cutoff for old leads
    const oldLeadsCutoff = new Date('2025-06-23T23:59:59.999Z');
    
    // Calculate threshold date (30 days from assignment for new leads)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    console.log(`=== RECHURN CHECK STARTED ===`);
    console.log(`New leads threshold: assigned before ${thresholdDate.toISOString()}`);
    console.log(`Cutoff date (June 30, 2025): ${cutoffDate.toISOString()}`);
    console.log(`Old leads cutoff (May 30, 2025): ${oldLeadsCutoff.toISOString()}`);
    console.log(`Current date: ${new Date().toISOString()}`);

    // ========== NEW LEADS LOGIC (Assigned AFTER June 30, 2025) ==========
    const newLeadsToRechurn = await Lead.aggregate([
      {
        $match: {
          assign: { $exists: true, $ne: [] },
          assignAt: { 
            $lt: thresholdDate, // Must be assigned more than 30 days ago
            $gt: cutoffDate    // Must be assigned AFTER June 30, 2025
          },
          leadStatus: 'fresh',
          isRechurn: { $ne: true }
        }
      },
      {
        $addFields: {
          // Get the maximum date from all activity fields
          latestActivityDate: {
            $max: [
              "$call_date",
              "$call_visit_meeting_consider_in_follow_up_date", 
              "$visit_done_date",
              "$meeting_done_date",
              "$deal_done_date",
              "$ringing_date",
              "$switch_off_date",
              "$wrong_no_date",
              "$not_interested_date",
              "$followup_date",
              "$shifting_date"
            ]
          },
          assignAt30DaysLater: {
            $dateAdd: {
              startDate: "$assignAt",
              unit: "day", 
              amount: thresholdDays
            }
          },
          leadType: "NEW"
        }
      },
      {
        $match: {
          $or: [
            // Case 1: No activity at all after assignment
            { 
              $or: [
                { latestActivityDate: { $exists: false } },
                { latestActivityDate: null }
              ]
            },
            
            // Case 2: Activity exists but it's before the assignment date
            { 
              $and: [
                { latestActivityDate: { $exists: true } },
                { latestActivityDate: { $ne: null } },
                { $expr: { $lt: ["$latestActivityDate", "$assignAt"] } }
              ]
            }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          assignAt: 1,
          latestActivityDate: 1,
          assignAt30DaysLater: 1,
          leadType: 1,
          daysSinceAssignment: {
            $divide: [
              { $subtract: [new Date(), "$assignAt"] },
              1000 * 60 * 60 * 24
            ]
          },
          rechurnReason: {
            $cond: {
              if: { 
                $or: [
                  { $not: { $ifNull: ["$latestActivityDate", false] } },
                  { $eq: ["$latestActivityDate", null] }
                ]
              },
              then: "NEW LEAD: No activity after assignment",
              else: "NEW LEAD: Only old activity (before current assignment)"
            }
          }
        }
      }
    ]).allowDiskUse(true);

    // ========== OLD LEADS LOGIC (Assigned BEFORE June 30, 2025) ==========
    const oldLeadsToRechurn = await Lead.aggregate([
      {
        $match: {
          assign: { $exists: true, $ne: [] },
          assignAt: { 
            $lt: oldLeadsCutoff,  // Must be assigned before May 30, 2025
            $lte: cutoffDate      // Must be assigned BEFORE June 30, 2025
          },
          leadStatus: 'fresh',
          isRechurn: { $ne: true }
        }
      },
      {
        $addFields: {
          // Check if ANY activity exists at all (regardless of date)
          hasAnyActivity: {
            $or: [
              { $ne: [{ $ifNull: ["$call_date", null] }, null] },
              { $ne: [{ $ifNull: ["$call_visit_meeting_consider_in_follow_up_date", null] }, null] },
              { $ne: [{ $ifNull: ["$visit_done_date", null] }, null] },
              { $ne: [{ $ifNull: ["$meeting_done_date", null] }, null] },
              { $ne: [{ $ifNull: ["$deal_done_date", null] }, null] },
              { $ne: [{ $ifNull: ["$ringing_date", null] }, null] },
              { $ne: [{ $ifNull: ["$switch_off_date", null] }, null] },
              { $ne: [{ $ifNull: ["$wrong_no_date", null] }, null] },
              { $ne: [{ $ifNull: ["$not_interested_date", null] }, null] },
              { $ne: [{ $ifNull: ["$followup_date", null] }, null] },
              { $ne: [{ $ifNull: ["$shifting_date", null] }, null] }
            ]
          },
          leadType: "OLD"
        }
      },
      {
        $match: {
          hasAnyActivity: false  // Only leads with NO activity at all
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          assignAt: 1,
          leadType: 1,
          hasAnyActivity: 1,
          daysSinceAssignment: {
            $divide: [
              { $subtract: [new Date(), "$assignAt"] },
              1000 * 60 * 60 * 24
            ]
          },
          rechurnReason: "OLD LEAD: No work done at all"
        }
      }
    ]).allowDiskUse(true);

    // Combine both arrays
    const allLeadsToRechurn = [...newLeadsToRechurn, ...oldLeadsToRechurn];

    console.log(`\n=== RECHURN ANALYSIS ===`);
    console.log(`Found ${newLeadsToRechurn.length} NEW leads to rechurn (assigned after June 30, inactive for ${thresholdDays} days)`);
    console.log(`Found ${oldLeadsToRechurn.length} OLD leads to rechurn (assigned before May 30, no work done)`);
    console.log(`Total leads to rechurn: ${allLeadsToRechurn.length}`);
    
    // Log details for debugging
    allLeadsToRechurn.forEach((lead, index) => {
      console.log(`\n--- Lead ${index + 1} Analysis ---`);
      console.log(`Type: ${lead.leadType}`);
      console.log(`Lead: ${lead.name} (${lead.phone})`);
      console.log(`Reason: ${lead.rechurnReason}`);
      console.log(`Assigned: ${lead.assignAt}`);
      console.log(`Days since assignment: ${Math.floor(lead.daysSinceAssignment)}`);
      
      if (lead.leadType === 'NEW') {
        console.log(`Latest Activity: ${lead.latestActivityDate || 'None'}`);
        console.log(`30-day cutoff: ${lead.assignAt30DaysLater}`);
      } else {
        console.log(`Has Any Activity: ${lead.hasAnyActivity}`);
      }
    });

    if (allLeadsToRechurn.length > 0) {
      const leadIds = allLeadsToRechurn.map(lead => lead._id);
      
      // First, get the current assignments to store as lastAssignedTo
      const leadsWithAssignments = await Lead.find({
        _id: { $in: leadIds },
        assign: { $exists: true, $ne: [] }
      }).select('_id assign assignAt');

      // Update each lead individually to preserve lastAssignedTo
      for (const lead of leadsWithAssignments) {
        if (lead.assign && lead.assign.length > 0) {
          await Lead.findByIdAndUpdate(lead._id, {
            $set: {
              lastAssignedTo: lead.assign[0], // Store the current assignee
              lastAssignedAt: lead.assignAt,  // Store when they were assigned
              assign: [],
              assignAt: null,
              isRechurn: true,
              call_status: null,
              updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
            }
          });
        }
      }

      console.log(`\n=== UPDATE RESULT ===`);
      console.log(`Successfully updated ${leadsWithAssignments.length} leads to rechurn status with last assigned info`);
    }

    return {
      success: true,
      count: allLeadsToRechurn.length,
      newLeadsCount: newLeadsToRechurn.length,
      oldLeadsCount: oldLeadsToRechurn.length,
      details: allLeadsToRechurn.map(lead => ({
        id: lead._id,
        name: lead.name,
        phone: lead.phone,
        type: lead.leadType,
        reason: lead.rechurnReason,
        assignedAt: lead.assignAt,
        daysSinceAssignment: Math.floor(lead.daysSinceAssignment),
        latestActivity: lead.latestActivityDate || null,
        thirtyDayCutoff: lead.assignAt30DaysLater || null,
        hasAnyActivity: lead.hasAnyActivity
      })),
      message: `Updated ${allLeadsToRechurn.length} leads to rechurn status (${newLeadsToRechurn.length} new + ${oldLeadsToRechurn.length} old)`,
      thresholdUsed: thresholdDays,
      cutoffDate: cutoffDate.toISOString(),
      oldLeadsCutoff: oldLeadsCutoff.toISOString(),
      checkTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in checkAndUpdateRechurnLeads:', error);
    return {
      success: false,
      count: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Updated scheduler functions
export function startRechurnScheduler(thresholdDays = 30) {
  console.log(`Starting rechurn scheduler with ${thresholdDays} days threshold`);
  console.log(`- NEW leads (after June 30): inactive for ${thresholdDays} days`);
  console.log(`- OLD leads (before June 30): assigned before May 30 with no work done`);
  
  // Initial run
  checkAndUpdateRechurnLeads(thresholdDays).catch(console.error);
  
  // Schedule periodic runs (daily for production)
  const interval = 24 * 60 * 60 * 1000; // 24 hours
  const scheduler = setInterval(() => {
    console.log('Running scheduled rechurn check...');
    checkAndUpdateRechurnLeads(thresholdDays).catch(console.error);
  }, interval);

  // Return cleanup function
  return () => {
    console.log('Stopping rechurn scheduler');
    clearInterval(scheduler);
  };
}

// For testing with shorter intervals (USE ONLY FOR TESTING)
export function startRechurnSchedulerTest(thresholdMinutes = 2) {
  console.log(`Starting TEST rechurn scheduler with ${thresholdMinutes} minutes threshold`);
  console.log(`- NEW leads: inactive for ${thresholdMinutes} minutes`);
  console.log(`- OLD leads: assigned before May 30 with no work done`);
  
  // Convert minutes to days for the threshold calculation
  const thresholdDays = thresholdMinutes / (24 * 60);
  
  checkAndUpdateRechurnLeads(thresholdDays).catch(console.error);
  
  // Run every 2 minutes for testing
  const interval = thresholdMinutes * 60 * 1000;
  const scheduler = setInterval(() => {
    console.log('Running TEST scheduled rechurn check...');
    checkAndUpdateRechurnLeads(thresholdDays).catch(console.error);
  }, interval);

  return () => {
    console.log('Stopping TEST rechurn scheduler');
    clearInterval(scheduler);
  };
}

// Initialize for PRODUCTION (30 days)
startRechurnScheduler(30);

// FOR TESTING ONLY - uncomment this line and comment the above line
// startRechurnSchedulerTest(2);