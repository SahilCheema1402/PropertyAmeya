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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId: any = searchParams.get('staffId');
    const leadType = searchParams.get("leadType");
    const user: any = JSON.parse(req.headers.get('user') as string);
    if (!startDate || !endDate) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Start Date and End Date are required"
      })
    }

    const start = DateTime.fromISO(startDate).startOf('day');
    const end = DateTime.fromISO(endDate).endOf('day');
    const query: any = {
      company: new mongoose.Types.ObjectId(user?.company?._id), // Matches company
      $or: [
        { "queryDetails.call_date": { $gte: start, $lte: end } },
        { "queryDetails.visit_done_date": { $gte: start, $lte: end } },
        { "queryDetails.meeting_done_date": { $gte: start, $lte: end } },
        { "queryDetails.deal_done_date": { $gte: start, $lte: end } },
      ]
    };
    // Add leadType filter condition if provided and not "all"
    if (leadType && leadType !== "all") {
      query["queryDetails.leadType"] = leadType;
    }

    if (staffId == '678642d40797483103969bc5') {
    } else if (staffId && staffId !== "undefined" && staffId != '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      query.assign = new mongoose.Types.ObjectId(staffId);
    } else {
      query.assign = new mongoose.Types.ObjectId(user._id);
    }


    const pipeline = [
      { $match: { company: new mongoose.Types.ObjectId(user?.company?._id) } },
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails"
        }
      },
      {
        $unwind: {
          path: "$queryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: query }
    ];
    const leads = await Lead.aggregate(pipeline);
    // Calculate the date for 3 months ago correctly
    const now1 = new Date(DateTime.now().startOf("day").toISO() || "");
    const threeMonthsAgoFirstDay = new Date(now1.getFullYear(), now1.getMonth() - 3, 1, 0, 0, 0);
    const lastDayOfCurrentMonth = new Date(now1.getFullYear(), now1.getMonth() + 1, 0, 23, 59, 59);

    // Build the user match condition based on staffId and user role
    let userMatch: any = {};

    if (staffId === '678642d40797483103969bc5') {
      // Do not add any user filter, include all users
    } else if (staffId && staffId !== "undefined" && staffId != '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      userMatch["queryDetails.user"] = new mongoose.Types.ObjectId(staffId);
    } else {
      // Default to current user if no staffId or not authorized
      userMatch["queryDetails.user"] = new mongoose.Types.ObjectId(user._id);
    }

    const Incentivepipeline = [
      // Initial match to filter by company and leadStatus early
      {
        $match: {
          company: new mongoose.Types.ObjectId(user?.company?._id),
          leadStatus: "deal-done"
        }
      },
      // Join with the 'querys' collection
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails",
        },
      },
      // Unwind the joined array to access queryDetails as an object
      { $unwind: "$queryDetails" },
      // Apply user-specific filtering after unwind
      { $match: userMatch },
      // Group all documents into a single result for totals
      {
        $group: {
          _id: null,
          totalIncentiveAll: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$queryDetails.incentive_slab", ""] }, { $ne: ["$queryDetails.incentive_slab", null] }] },
                { $toInt: "$queryDetails.incentive_slab" },
                0
              ]
            }
          },
          totalSellRevenueAll: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$queryDetails.sell_revenue", ""] }, { $ne: ["$queryDetails.sell_revenue", null] }] },
                { $toInt: "$queryDetails.sell_revenue" },
                0
              ]
            }
          },
          totalIncentiveLast3Months: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$queryDetails.deal_done_date", threeMonthsAgoFirstDay] },
                    { $lte: ["$queryDetails.deal_done_date", lastDayOfCurrentMonth] },
                    { $ne: ["$queryDetails.incentive_slab", ""] },
                    { $ne: ["$queryDetails.incentive_slab", null] }
                  ]
                },
                { $toInt: "$queryDetails.incentive_slab" },
                0
              ]
            }
          },
          totalSellRevenueLast3Months: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$queryDetails.deal_done_date", threeMonthsAgoFirstDay] },
                    { $lte: ["$queryDetails.deal_done_date", lastDayOfCurrentMonth] },
                    { $ne: ["$queryDetails.sell_revenue", ""] },
                    { $ne: ["$queryDetails.sell_revenue", null] }
                  ]
                },
                { $toInt: "$queryDetails.sell_revenue" },
                0
              ]
            }
          }
        }
      }
    ];

    const incentiveData = await Lead.aggregate(Incentivepipeline);
    const currentMonthStart = new Date(now1.getFullYear(), now1.getMonth(), 1, 0, 0, 0);
    const currentMonthEnd = new Date(now1.getFullYear(), now1.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthPipeline = [
      {
        $match: {
          company: new mongoose.Types.ObjectId(user?.company?._id),
          leadStatus: "deal-done",
          // "queryDetails.deal_done_date": { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails",
        },
      },
      { $unwind: "$queryDetails" },
      { $match: userMatch },
      {
        $group: {
          _id: null,
          // currentMonthIncentive: {
          //   $sum: {
          //     $cond: [
          //       { $and: [{ $ne: ["$queryDetails.incentive_slab", ""] }, { $ne: ["$queryDetails.incentive_slab", null] }] },
          //       { $toInt: "$queryDetails.incentive_slab" },
          //       0,
          //     ],
          //   },
          // },
          currentMonthSellRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ["$queryDetails.deal_done_date", currentMonthStart] },
                  { $lte: ["$queryDetails.deal_done_date", currentMonthEnd] }, { $ne: ["$queryDetails.sell_revenue", ""] }, { $ne: ["$queryDetails.sell_revenue", null] }]
                },
                { $toInt: "$queryDetails.sell_revenue" },
                0,
              ],
            },
          },
        },
      },
    ];

    const currentMonthData = await Lead.aggregate(currentMonthPipeline);

    // Calculate performance for the past 6 months
    const now = new Date(DateTime.now().startOf("day").toISO() || "");
    const sixMonthsData = [];

    for (let i = 5; i >= 0; i--) {
      // Start of the month: 12:00 AM on the 1st of the month
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);

      // End of the month: Current date and time if it's the current month, otherwise the last day of the month at 11:59:59
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      // Query for fetching data within the month range
      const monthlyQuery: any = {
        company: new mongoose.Types.ObjectId(user?.company?._id),
        $or: [
          { "queryDetails.call_date": { $gte: monthStart, $lte: monthEnd } },
          { "queryDetails.visit_done_date": { $gte: monthStart, $lte: monthEnd } },
          { "queryDetails.meeting_done_date": { $gte: monthStart, $lte: monthEnd } },
          { "queryDetails.deal_done_date": { $gte: monthStart, $lte: monthEnd } },
        ],
      };

      if (staffId == '678642d40797483103969bc5') {
      } else if (staffId && staffId !== "undefined" && staffId != '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {

        monthlyQuery.assign = new mongoose.Types.ObjectId(staffId);
      } else {
        monthlyQuery.assign = new mongoose.Types.ObjectId(user._id);
      }

      const monthlyData = await Lead.aggregate([
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
            path: "$queryDetails", // Unwind the queryDetails array
            preserveNullAndEmptyArrays: true, // Keep the document if there are no matches
          },
        },
        { $match: monthlyQuery },


        {
          $group: {
            _id: null,
            visits: { $sum: { $cond: [{ $ifNull: ["$queryDetails.visit_done_date", false] }, 1, 0] } },
            dealDone: { $sum: { $cond: [{ $ifNull: ["$queryDetails.deal_done_date", false] }, 1, 0] } },
            meetings: { $sum: { $cond: [{ $ifNull: ["$queryDetails.meeting_done_date", false] }, 1, 0] } },
          },
        }
      ]);

      sixMonthsData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        visits: monthlyData[0]?.visits || 0,
        dealDone: monthlyData[0]?.dealDone || 0,
        meetings: monthlyData[0]?.meetings || 0
      });
    }
    // target dynamic target assign
    let Target;
    let userData: any
    if (staffId && staffId !== "undefined" && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      userData = await userModel.findById(staffId).select('userName email company target meetingTarget followupTarget callTarget');
      if (userData) {

        const {
          target = 0,
          callTarget = 60,
          followupTarget = 0,
          meetingTarget = 0
        } = userData;

        const callTargetNum = parseFloat(callTarget);
        const followupTargetNum = parseFloat(followupTarget);
        const meetingTargetNum = parseFloat(meetingTarget);

        Target = {
          today: [callTargetNum || 60, 0, 0, 0], // Calls for today, no followups or deals today
          weekly: [
            (callTargetNum * 6) || 0,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(parseFloat(target) / 150000) || 0
          ],
          monthly: [
            (callTargetNum * 26) || 0,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round(parseFloat(target) / 150000) * 4 || 0
          ]
        };


      }
    } else {
      userData = await userModel.findById(user._id);
      if (userData) {

        const {
          target = 0,
          callTarget = 60,
          followupTarget = 0,
          meetingTarget = 0
        } = userData;

        const callTargetNum = parseFloat(callTarget);
        const followupTargetNum = parseFloat(followupTarget);
        const meetingTargetNum = parseFloat(meetingTarget);

        Target = {
          today: [callTargetNum || 60, 0, 0, 0], // Calls for today, no followups or deals today
          weekly: [
            (callTargetNum * 6) || 360,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(parseFloat(target) / 150000) || 0
          ],
          monthly: [
            (callTargetNum * 26) || 1560,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round(parseFloat(target) / 150000) * 4 || 0
          ]
        };
      }
    }


    return HandleResponse({
      type: "SUCCESS",
      message: "Get Target Vs Achievement Data Successfully",
      data: {
        leads,
        past6Months: sixMonthsData,
        incentiveData,
        Target,
        currentMonthData,
        userData
      }
    });

  } catch (error: any) {
    console.error("Error in target vs achievement:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }

}


export async function POST(req: Request) {
  try {
    DB();
    const body = await req.json();
    const { startDate, endDate, staffId, leadType } = body;
    const user: any = JSON.parse(req.headers.get('user') as string);

    if (!startDate || !endDate) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Start Date and End Date are required"
      });
    }

    const start = DateTime.fromISO(startDate).startOf('day');
    const end = DateTime.fromISO(endDate).endOf('day');
    const query: any = {
      company: new mongoose.Types.ObjectId(user?.company?._id),
      $or: [
        { "queryDetails.call_date": { $gte: start, $lte: end } },
        { "queryDetails.visit_done_date": { $gte: start, $lte: end } },
        { "queryDetails.meeting_done_date": { $gte: start, $lte: end } },
        { "queryDetails.deal_done_date": { $gte: start, $lte: end } },
      ]
    };

    if (leadType && leadType !== "all") {
      query["queryDetails.leadType"] = leadType;
    }

    if (staffId == '678642d40797483103969bc5') {
      // No staff filter
    } else if (staffId && staffId !== "undefined" && staffId != '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      query.assign = new mongoose.Types.ObjectId(staffId);
    } else {
      query.assign = new mongoose.Types.ObjectId(user._id);
    }

    const pipeline = [
      { $match: { company: new mongoose.Types.ObjectId(user?.company?._id) } },
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails"
        }
      },
      {
        $unwind: {
          path: "$queryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: query }
    ];
    const leads = await Lead.aggregate(pipeline);
    // Calculate the date for 3 months ago correctly
    const now1 = new Date(DateTime.now().startOf("day").toISO() || "");
    const threeMonthsAgoFirstDay = new Date(now1.getFullYear(), now1.getMonth() - 3, 1, 0, 0, 0);
    const lastDayOfCurrentMonth = new Date(now1.getFullYear(), now1.getMonth() + 1, 0, 23, 59, 59);

    // Build the user match condition based on staffId and user role
    let userMatch: any = {};

    if (staffId === '678642d40797483103969bc5') {
      // Do not add any user filter, include all users
    } else if (staffId && staffId !== "undefined" && staffId != '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      userMatch["queryDetails.user"] = new mongoose.Types.ObjectId(staffId);
    } else {
      // Default to current user if no staffId or not authorized
      userMatch["queryDetails.user"] = new mongoose.Types.ObjectId(user._id);
    }
    // Add this to your GET/POST API
    const dailyActivityPipeline = [
      { $match: { company: new mongoose.Types.ObjectId(user?.company?._id) } },
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails"
        }
      },
      {
        $unwind: {
          path: "$queryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: query }
    ];

    const dailyActivity = await Lead.aggregate(dailyActivityPipeline);
    const Incentivepipeline = [
      // Initial match to filter by company and leadStatus early
      {
        $match: {
          company: new mongoose.Types.ObjectId(user?.company?._id),
          leadStatus: "deal-done"
        }
      },
      // Join with the 'querys' collection
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails",
        },
      },
      // Unwind the joined array to access queryDetails as an object
      { $unwind: "$queryDetails" },
      // Apply user-specific filtering after unwind
      { $match: userMatch },
      // Group all documents into a single result for totals
      {
        $group: {
          _id: null,
          totalIncentiveAll: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$queryDetails.incentive_slab", ""] }, { $ne: ["$queryDetails.incentive_slab", null] }] },
                { $toInt: "$queryDetails.incentive_slab" },
                0
              ]
            }
          },
          totalSellRevenueAll: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$queryDetails.sell_revenue", ""] }, { $ne: ["$queryDetails.sell_revenue", null] }] },
                { $toInt: "$queryDetails.sell_revenue" },
                0
              ]
            }
          },
          totalIncentiveLast3Months: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$queryDetails.deal_done_date", threeMonthsAgoFirstDay] },
                    { $lte: ["$queryDetails.deal_done_date", lastDayOfCurrentMonth] },
                    { $ne: ["$queryDetails.incentive_slab", ""] },
                    { $ne: ["$queryDetails.incentive_slab", null] }
                  ]
                },
                { $toInt: "$queryDetails.incentive_slab" },
                0
              ]
            }
          },
          totalSellRevenueLast3Months: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$queryDetails.deal_done_date", threeMonthsAgoFirstDay] },
                    { $lte: ["$queryDetails.deal_done_date", lastDayOfCurrentMonth] },
                    { $ne: ["$queryDetails.sell_revenue", ""] },
                    { $ne: ["$queryDetails.sell_revenue", null] }
                  ]
                },
                { $toInt: "$queryDetails.sell_revenue" },
                0
              ]
            }
          }
        }
      }
    ];

    const incentiveData = await Lead.aggregate(Incentivepipeline);
    const currentMonthStart = new Date(now1.getFullYear(), now1.getMonth(), 1, 0, 0, 0);
    const currentMonthEnd = new Date(now1.getFullYear(), now1.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthPipeline = [
      {
        $match: {
          company: new mongoose.Types.ObjectId(user?.company?._id),
          leadStatus: "deal-done",
          // "queryDetails.deal_done_date": { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails",
        },
      },
      { $unwind: "$queryDetails" },
      { $match: userMatch },
      {
        $group: {
          _id: null,
          // currentMonthIncentive: {
          //   $sum: {
          //     $cond: [
          //       { $and: [{ $ne: ["$queryDetails.incentive_slab", ""] }, { $ne: ["$queryDetails.incentive_slab", null] }] },
          //       { $toInt: "$queryDetails.incentive_slab" },
          //       0,
          //     ],
          //   },
          // },
          currentMonthSellRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ["$queryDetails.deal_done_date", currentMonthStart] },
                  { $lte: ["$queryDetails.deal_done_date", currentMonthEnd] }, { $ne: ["$queryDetails.sell_revenue", ""] }, { $ne: ["$queryDetails.sell_revenue", null] }]
                },
                { $toInt: "$queryDetails.sell_revenue" },
                0,
              ],
            },
          },
        },
      },
    ];

    const currentMonthData = await Lead.aggregate(currentMonthPipeline);

    // Calculate performance for the past 6 months
    const now = new Date(DateTime.now().startOf("day").toISO() || "");
    const sixMonthsData = [];

    for (let i = 5; i >= 0; i--) {
      // Start of the month: 12:00 AM on the 1st of the month
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);

      // End of the month: Current date and time if it's the current month, otherwise the last day of the month at 11:59:59
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      // Query for fetching data within the month range
      const monthlyQuery: any = {
        company: new mongoose.Types.ObjectId(user?.company?._id),
        $or: [
          { "queryDetails.call_date": { $gte: monthStart, $lte: monthEnd } },
          { "queryDetails.visit_done_date": { $gte: monthStart, $lte: monthEnd } },
          { "queryDetails.meeting_done_date": { $gte: monthStart, $lte: monthEnd } },
          { "queryDetails.deal_done_date": { $gte: monthStart, $lte: monthEnd } },
        ],
      };

      if (staffId == '678642d40797483103969bc5') {
      } else if (staffId && staffId !== "undefined" && staffId != '678642d40797483103969bc5' && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {

        monthlyQuery.assign = new mongoose.Types.ObjectId(staffId);
      } else {
        monthlyQuery.assign = new mongoose.Types.ObjectId(user._id);
      }

      const monthlyData = await Lead.aggregate([
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
        { $match: monthlyQuery },


        {
          $group: {
            _id: null,
            visits: { $sum: { $cond: [{ $ifNull: ["$queryDetails.visit_done_date", false] }, 1, 0] } },
            dealDone: { $sum: { $cond: [{ $ifNull: ["$queryDetails.deal_done_date", false] }, 1, 0] } },
            meetings: { $sum: { $cond: [{ $ifNull: ["$queryDetails.meeting_done_date", false] }, 1, 0] } },
          },
        }
      ]);

      sixMonthsData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        visits: monthlyData[0]?.visits || 0,
        dealDone: monthlyData[0]?.dealDone || 0,
        meetings: monthlyData[0]?.meetings || 0
      });
    }
    // target dynamic target assign
    let Target;
    let userData: any
    if (staffId && staffId !== "undefined" && (user.role === 1 || user.role === 2 || user.role === 3 || user.role === 4 || user.role === 5)) {
      userData = await userModel.findById(staffId).select('userName email company target meetingTarget followupTarget callTarget');
      if (userData) {

        const {
          target = 0,
          callTarget = 60,
          followupTarget = 0,
          meetingTarget = 0
        } = userData;

        const callTargetNum = parseFloat(callTarget);
        const followupTargetNum = parseFloat(followupTarget);
        const meetingTargetNum = parseFloat(meetingTarget);

        Target = {
          today: [callTargetNum || 60, 0, 0, 0], // Calls for today, no followups or deals today
          weekly: [
            (callTargetNum * 6) || 0,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(parseFloat(target) / 150000) || 0
          ],
          monthly: [
            (callTargetNum * 26) || 0,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round(parseFloat(target) / 150000) * 4 || 0
          ]
        };


      }
    } else {
      userData = await userModel.findById(user._id);
      if (userData) {

        const {
          target = 0,
          callTarget = 60,
          followupTarget = 0,
          meetingTarget = 0
        } = userData;

        const callTargetNum = parseFloat(callTarget);
        const followupTargetNum = parseFloat(followupTarget);
        const meetingTargetNum = parseFloat(meetingTarget);

        Target = {
          today: [callTargetNum || 60, 0, 0, 0], // Calls for today, no followups or deals today
          weekly: [
            (callTargetNum * 6) || 360,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(followupTargetNum / 2) || 0,
            Math.round(parseFloat(target) / 150000) || 0
          ],
          monthly: [
            (callTargetNum * 26) || 1560,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round((followupTargetNum / 2) * 4) || 0,
            Math.round(parseFloat(target) / 150000) * 4 || 0
          ]
        };
      }
    }

    return HandleResponse({
      type: "SUCCESS",
      message: "Get Target Vs Achievement Data Successfully",
      data: {
        leads,
        dailyActivity,
        past6Months: sixMonthsData,
        incentiveData,
        Target,
        currentMonthData,
        userData
      }
    });

  } catch (error: any) {
    console.error("Error in target vs achievement:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    });
  }
}