import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import userModel from '@app/_model/user/user.model';
import { DateTime } from 'luxon';

export async function GET(req: Request) {
  try {
    DB();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const staffId: any = searchParams.get('staffId');
    const user: any = JSON.parse(req.headers.get('user') as string);

    // Validate month parameter
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Valid month is required (format: YYYY-MM)"
      });
    }

    // Parse month in UTC to avoid timezone issues
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(Date.UTC(year, monthNum - 1, 1));
    const monthEnd = new Date(Date.UTC(year, monthNum, 0));
    
    // Get number of days in month
    const daysInMonth = monthEnd.getUTCDate();

    // Get user data
    const userQuery = staffId && staffId !== "undefined" && 
                     [1, 2, 3, 4, 5].includes(user.role) ? 
                     { _id: staffId } : 
                     { _id: user._id };

    const userData = await userModel.findOne(userQuery)
                          .select('userName email company callTarget');

    if (!userData) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "User not found" 
      });
    }

    const dailyCallTarget = Number(userData.callTarget) || 60;

    // Build query with UTC dates
    const baseQuery: any = {
      company: new mongoose.Types.ObjectId(user?.company?._id),
      "remarksDetails.createAt": {
        $gte: monthStart,
        $lte: monthEnd
      }
    };

    // Add staff filter
    if (staffId && staffId !== "undefined" && staffId !== '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      baseQuery.assign = new mongoose.Types.ObjectId(staffId);
    } else if (staffId !== '678642d40797483103969bc5') {
      baseQuery.assign = new mongoose.Types.ObjectId(user._id);
    }

    // Single aggregation to get all calls data for the month
    const monthlyCallsData = await Lead.aggregate([
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails",
        },
      },
      {
        $unwind: {
          path: "$queryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "remarks",
          localField: "queryDetails.remarks",
          foreignField: "_id",
          as: "remarksDetails",
        },
      },
      {
        $unwind: {
          path: "$remarksDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: baseQuery },
      {
        $group: {
          _id: {
            leadId: "$_id",
            day: { $dayOfMonth: "$remarksDetails.createAt" }
          },
          hasCall: { $max: 1 } // Each lead counts as 1 call per day max
        }
      },
      {
        $group: {
          _id: "$_id.day",
          calls: { $sum: "$hasCall" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create a map for quick lookup
    const callsMap = new Map();
    monthlyCallsData.forEach(item => {
      callsMap.set(item._id, item.calls);
    });

    // Create array to store daily results
    const dailyResults = [];

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const calls = callsMap.get(day) || 0;
      const callTargetAchieved = calls >= dailyCallTarget;

      const currentDate = new Date(Date.UTC(year, monthNum - 1, day));
      
      // Format as YYYY-MM-DD
      const formattedDate = currentDate.toISOString().split('T')[0];

      dailyResults.push({
        date: day,
        fullDate: formattedDate,
        callTargetAchieved,
        calls,
        callTarget: dailyCallTarget
      });
    }

    return HandleResponse({
      type: "SUCCESS",
      message: "Daily call target data retrieved successfully",
      data: {
        month: month,
        userData: {
          userName: userData.userName,
          email: userData.email
        },
        dailyCallTarget,
        dailyResults
      }
    });

  } catch (error: any) {
    console.error("Error in daily call target:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}