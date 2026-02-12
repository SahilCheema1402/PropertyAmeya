import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import userModel from '@app/_model/user/user.model';
import Company from '@app/_model/Companay/company.model';
import { assign } from '@node_modules/@types/nodemailer/lib/shared';
import { DateTime } from 'luxon';

export async function GET(req: Request) {
  try {
    DB();
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search');
    const selectedStatus = searchParams.get('selectedStatus');
    const leadType = searchParams.get('leadType');
    const id = searchParams.get('id');
    const user: any = JSON.parse(req.headers.get('user') as string);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    if (!user?.company?._id || !id) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Invalid company ID or assign ID"
      })
    }

    // Base match conditions (excluding selectedStatus)
    const baseMatchConditions: any = {
      company: new mongoose.Types.ObjectId(user?.company?._id),
      ...(id && id != "678642d40797483103969bc5" && {
        assign: new mongoose.Types.ObjectId(id)
      })
    };

    // Common pipeline stages for both counts and data
    const commonPipeline = [
      { $match: baseMatchConditions },
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
      {
        $match: {
          ...(selectedStatus && { leadStatus: selectedStatus }),
          ...(searchTerm && {
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { phone: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } },
              { address: { $regex: searchTerm, $options: 'i' } },
              { source: { $regex: searchTerm, $options: 'i' } },
              { leadStatus: { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.name": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.phone": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.email": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.project": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.budget": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.leadType": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.status": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.bhk": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.floor": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.call_status": { $regex: searchTerm, $options: 'i' } }, // Added this line
            ]
          }),
          ...(leadType && leadType !== 'all' && {
            "queryDetails.leadType": { $regex: leadType, $options: 'i' }
          })
        }
      }
    ];

    // Pipeline to calculate counts per status (without selectedStatus filter)
    const countsPipeline = [
      { $match: baseMatchConditions },
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
      {
        $match: {
          // Apply search and leadType filters but NOT selectedStatus for counts
          ...(searchTerm && {
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { phone: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } },
              { address: { $regex: searchTerm, $options: 'i' } },
              { source: { $regex: searchTerm, $options: 'i' } },
              { leadStatus: { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.name": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.phone": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.email": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.project": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.budget": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.leadType": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.status": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.bhk": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.floor": { $regex: searchTerm, $options: 'i' } },
              { "queryDetails.call_status": { $regex: searchTerm, $options: 'i' } }, // Added this line
            ]
          }),
          ...(leadType && leadType !== 'all' && {
            "queryDetails.leadType": { $regex: leadType, $options: 'i' }
          })
        }
      },
      {
        $group: {
          _id: "$_id", // Group by lead ID first
          leadStatus: { $first: "$leadStatus" }
        }
      },
      {
        $group: {
          _id: "$leadStatus", // Then group by status
          count: { $sum: 1 }
        }
      }
    ];

    // Get counts for all statuses
    const countsResult = await Lead.aggregate(countsPipeline);
    const statusCounts = {
      fresh: 0,
      followup: 0,
      notInterest: 0,
      'deal-done': 0
    };
    countsResult.forEach(({ _id, count }) => {
      if (_id in statusCounts) statusCounts[_id as keyof typeof statusCounts] = count;
    });

    // Pipeline to get paginated data with selectedStatus filter
    const dataPipeline = [
      { $match: baseMatchConditions },
      {
        $lookup: {
          from: "querys",
          localField: "query",
          foreignField: "_id",
          as: "queryDetails"
        }
      },
      // Apply selectedStatus filter early if specified
      ...(selectedStatus ? [{ $match: { leadStatus: selectedStatus } }] : []),
      
      // Apply search and leadType filters if queries exist
      {
        $addFields: {
          hasQueries: { $gt: [{ $size: "$queryDetails" }, 0] }
        }
      },
      {
        $match: {
          $or: [
            // Leads without queries - only apply lead-level filters
            {
              hasQueries: false,
              ...(searchTerm && {
                $or: [
                  { name: { $regex: searchTerm, $options: 'i' } },
                  { phone: { $regex: searchTerm, $options: 'i' } },
                  { email: { $regex: searchTerm, $options: 'i' } },
                  { address: { $regex: searchTerm, $options: 'i' } },
                  { source: { $regex: searchTerm, $options: 'i' } },
                  { leadStatus: { $regex: searchTerm, $options: 'i' } }
                ]
              })
            },
            // Leads with queries - apply all filters
            {
              hasQueries: true,
              $expr: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$queryDetails",
                        cond: {
                          $and: [
                            // Lead type filter
                            ...(leadType && leadType !== 'all' ? [
                              { $regexMatch: { input: "$$this.leadType", regex: leadType, options: "i" } }
                            ] : [true]),
                            // Search term filter
                            ...(searchTerm ? [
                              {
                                $or: [
                                  { $regexMatch: { input: "$name", regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: "$phone", regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: "$email", regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: "$address", regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: "$source", regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: "$leadStatus", regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.name", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.phone", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.email", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.project", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.budget", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.leadType", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.status", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.bhk", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.floor", ""] }, regex: searchTerm, options: "i" } },
                                  { $regexMatch: { input: { $ifNull: ["$$this.call_status", ""] }, regex: searchTerm, options: "i" } } // Added this line
                                ]
                              }
                            ] : [true])
                          ]
                        }
                      }
                    }
                  },
                  0
                ]
              }
            }
          ]
        }
      },
      
      // Lookup remarks for queries
      {
        $lookup: {
          from: "remarks",
          localField: "queryDetails.remarks",
          foreignField: "_id",
          as: "remarksData"
        }
      },
      
      // Add remarks to query details
      {
        $addFields: {
          queryDetails: {
            $map: {
              input: "$queryDetails",
              as: "query",
              in: {
                $mergeObjects: [
                  "$$query",
                  {
                    remarksDetails: {
                      $filter: {
                        input: "$remarksData",
                        cond: { $in: ["$$this._id", "$$query.remarks"] }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },

      {
  $lookup: {
    from: "users", // assuming your users collection is named "users"
    localField: "assign",
    foreignField: "_id",
    as: "assignedUser"
  }
},
{
  $unwind: {
    path: "$assignedUser",
    preserveNullAndEmptyArrays: true
  }
},
      
      // Final projection and structure
      {
  $project: {
    _id: 1,
    name: 1,
    phone: 1,
    email: 1,
    address: 1,
    source: 1,
    createAt: 1,
    leadStatus: 1,
    company: 1,
    query: "$queryDetails",
    createdBy: 1,
    assign: 1,
    assignedUser: {
      _id: "$assignedUser._id",
      userName: "$assignedUser.userName"
    },
    __v: 1
  }
},
      { $sort: { createAt: -1 as -1 } },
      { $skip: ((Number(page) - 1) * Number(limit)) || 0 },
      { $limit: Number(limit) || 10 }
    ];

    const fields_ = await Lead.aggregate(dataPipeline);

    return HandleResponse({
      type: "SUCCESS",
      data: {
        fields_,
        TotalFresh: statusCounts.fresh,
        TotalFollowup: statusCounts.followup,
        TotalNotInterest: statusCounts.notInterest,
        TotalDealDone: statusCounts['deal-done']
      }
    });
  } catch (error: any) {
    return HandleResponse({ type: "BAD_REQUEST", message: error?.message });
  }
}

export async function POST(req: Request) {
  try {
    DB();
    const user: any = JSON.parse(req.headers.get('user') as string);
    const { uniqueData } = await req.json();

    if (!uniqueData || uniqueData.length === 0) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Excel data large",
      });
    }
    
    // Arrays for unique and duplicate leads
    const uniqueArr: any[] = [];
    const duplicateArr: any[] = [];
    
    // Track seen phone numbers to identify duplicates within `uniqueData`
    const phoneSet = new Set();

    // Loop through the incoming leads
    for (const lead of uniqueData) {
      // Destructure required fields - Added Address and Alternate fields
      const { 
        Mobile: rawPhone, 
        'Email Id': email, 
        Name: name, 
        'Source': source, 
        'Address': address,
        'Alternate': rawAlternate  // Added alternate field
      } = lead;
      
      const phone =
        rawPhone && typeof rawPhone === "string"
          ? rawPhone.replace(/\D/g, "") // Normalize phone number if it's a string
          : rawPhone?.toString()?.replace(/\D/g, "");
      
      // Process alternate number - normalize it if it exists
      const alternate = rawAlternate && typeof rawAlternate === "string"
        ? rawAlternate.replace(/\D/g, "")
        : rawAlternate?.toString()?.replace(/\D/g, "") || null;
      
      // Validation for empty fields or invalid mobile numbers
      const isEmpty = !phone
      // const isInvalidPhone = phone && phone?.toString().length !== 10;
      
      // Validate alternate number if provided (should be 10 digits if present)
      // const isInvalidAlternate = alternate && alternate.length !== 10;

      if (isEmpty) {
        // Treat entries with empty fields or invalid phone numbers as duplicates
        duplicateArr.push(lead);
        continue;
      }
      
      // Check for duplicates within `uniqueData`
      if (phoneSet.has(phone)) {
        duplicateArr.push(lead);
        continue;
      }
      phoneSet.add(phone);
      
      const existingLead = await Lead.findOne({ phone });
      if (existingLead) {
        duplicateArr.push(lead);
      } else {
        const newLead: any = {
          phone,
          email,
          name,
          source,
          address,
          ...(alternate && { alternate }), // Only add alternate if it exists
          company: user?.company?._id,
          createdBy: user?._id,
          leadStatus: "fresh",
          createdAt: DateTime.now().setZone('Asia/Kolkata'),
        };
        if (user.role !== 1 && user.role !== 2) {
          newLead.assign = user?._id;
          newLead.assignAt = DateTime.now().setZone('Asia/Kolkata');
          newLead.updateAt = DateTime.now().setZone('Asia/Kolkata');
        }
        uniqueArr.push(newLead);
      }
    }

    // Save unique leads to the database
    if (uniqueArr.length > 0) {
      const lead: any = await Lead.insertMany(uniqueArr);
      const leadsIds = lead.map((admin: { _id: any; }) => admin._id);
      if (user.role !== 1 && user.role !== 2) {
        const LeadAssign: any = await userModel.findById(user._id);
        if (!LeadAssign.Lead) LeadAssign.Lead = [];
        LeadAssign.Lead.push(...leadsIds);
        LeadAssign.updateAt = DateTime.now().setZone('Asia/Kolkata')
        await LeadAssign.save();
      }
    }
    
    // Return success response
    return HandleResponse({
      type: "SUCCESS",
      message: "Excel file processed successfully",
      data: {
        uniqueLeadsCount: uniqueArr.length,
        duplicateLeadsCount: duplicateArr.length,
        duplicateLeads: duplicateArr,
      },
    });
  } catch (error: any) {
    console.error("Error processing Excel file:", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || "An error occurred",
    });
  }
}

export async function PUT(req: Request) {
  try {
    DB();
    const user: any = JSON.parse(req.headers.get('user') as string);
    const data: any = await userModel.findById(user._id).populate([
      { path: 'company', model: Company }, 
      { path: 'salesManager', model: userModel }, 
      { path: 'vpSale', model: userModel }, 
      { path: 'teamHead', model: userModel }, 
      { path: 'areaManager', model: userModel }
    ])
    
    // Return success response
    return HandleResponse({
      type: "SUCCESS",
      message: "User Details get successfully",
      data,
    });
  } catch (error: any) {
    console.error("Error :", error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || "An error occurred",
    });
  }
}

export async function DELETE(req: Request) {
  try {
    DB();
    const user: any = JSON.parse(req.headers.get('user') as string);

    if (!user?.company?._id) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Invalid company ID"
      })
    }

    // Get the current date with time reset to 00:00:00
    const currentDate = new Date(DateTime.now().startOf("day").toISO() || "");

    const filters: any = [
      {
        $match: {
          company: new mongoose.Types.ObjectId(user?.company?._id),
          assign: new mongoose.Types.ObjectId(user._id)
        }
      },
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
      {
        $match: {
          $or: [
            {
              "queryDetails.followup_date": {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
              },
            },
            {
              "queryDetails.exp_visit_date": {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
              },
            },
            {
              "queryDetails.visit_done": {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
              },
            },
            {
              "queryDetails.meeting_done": {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          phone: { $first: "$phone" },
          email: { $first: "$email" },
          address: { $first: "$address" },
          source: { $first: "$source" },
          createAt: { $first: "$createAt" },
          leadStatus: { $first: "$leadStatus" },
          company: { $first: "$company" },
          query: { $push: "$queryDetails" },
          createdBy: { $first: "$createdBy" },
          __v: { $first: "$__v" }
        }
      }
    ]

    const fields_ = await Lead.aggregate(filters)

    return HandleResponse({ 
      type: "SUCCESS", 
      message: "No any followup Date", 
      data: { fields_ } 
    })
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    })
  }
}
