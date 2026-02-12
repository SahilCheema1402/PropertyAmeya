import { NextRequest, NextResponse } from 'next/server';
import { checkAndUpdateRechurnLeads } from '@app/_utils/rechurnScheduler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Check for both minute and day parameters for flexibility
    const thresholdMinutes = Number(searchParams.get('thresholdMinutes'));
    const thresholdDays = Number(searchParams.get('thresholdDays'));
    
    let finalThresholdDays: number;
    
    if (thresholdMinutes) {
      // Convert minutes to days (for testing)
      finalThresholdDays = thresholdMinutes / (24 * 60);
      console.log(`Using threshold from minutes: ${thresholdMinutes} minutes = ${finalThresholdDays} days`);
    } else if (thresholdDays) {
      // Use days directly
      finalThresholdDays = thresholdDays;
      console.log(`Using threshold from days: ${finalThresholdDays} days`);
    } else {
      // Default to 30 days
      finalThresholdDays = 30;
      console.log(`Using default threshold: ${finalThresholdDays} days`);
    }
    
    console.log(`Manual rechurn check triggered with ${finalThresholdDays} days threshold for NEW leads only`);
    
    const result = await checkAndUpdateRechurnLeads(finalThresholdDays);
    
    return NextResponse.json({
      success: true,
      count: result.count || 0,
      message: result.message || 'Rechurn check completed for NEW leads only',
      details: result.details || [],
      timestamp: new Date().toISOString(),
      thresholdUsed: finalThresholdDays,
      thresholdInMinutes: thresholdMinutes || (finalThresholdDays * 24 * 60),
      cutoffDate: result.cutoffDate,
      checkTime: result.checkTime,
      note: "Only checking leads assigned after June 30, 2025"
    });
  } catch (error) {
    console.error('Manual rechurn check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        count: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST method for manual trigger with lead IDs
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    
    // Handle threshold from query params or body
    const thresholdMinutes = Number(searchParams.get('thresholdMinutes')) || body.thresholdMinutes;
    const thresholdDays = Number(searchParams.get('thresholdDays')) || body.thresholdDays;
    
    let finalThresholdDays: number;
    
    if (thresholdMinutes) {
      finalThresholdDays = thresholdMinutes / (24 * 60);
    } else if (thresholdDays) {
      finalThresholdDays = thresholdDays;
    } else {
      finalThresholdDays = 30;
    }
    
    // If leadIds are provided, this is a manual move operation
    if (body.leadIds && Array.isArray(body.leadIds)) {
      console.log(`Manual move to rechurn for ${body.leadIds.length} leads`);
      
      // Import your Lead model and manually update these specific leads
      const { default: Lead } = await import('@app/_model/LeadModel/lead.model');
      const { DateTime } = await import('luxon');
      const mongoose = await import('mongoose');
      
      const result = await Lead.updateMany(
        {
          _id: { $in: body.leadIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
          leadStatus: 'fresh'
        },
        {
          $set: {
            assign: [],
            assignAt: null,
            isRechurn: true,
            call_status: null, // Clear call_status as requested
            updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        count: result.modifiedCount,
        message: `${result.modifiedCount} leads manually moved to rechurn`,
        timestamp: new Date().toISOString(),
        thresholdUsed: finalThresholdDays,
        manual: true
      });
    }
    
    // Otherwise, run the automatic check (only for NEW leads)
    const result = await checkAndUpdateRechurnLeads(finalThresholdDays);
    
    return NextResponse.json({
      success: true,
      count: result.count || 0,
      message: result.message || 'Rechurn check completed for NEW leads only',
      details: result.details || [],
      timestamp: new Date().toISOString(),
      thresholdUsed: finalThresholdDays,
      thresholdInMinutes: thresholdMinutes || (finalThresholdDays * 24 * 60),
      cutoffDate: result.cutoffDate,
      checkTime: result.checkTime,
      mode: body.dryRun ? 'dry-run' : 'actual',
      note: "Only processing leads assigned after June 30, 2025"
    });
  } catch (error) {
    console.error('Manual rechurn operation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        count: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}