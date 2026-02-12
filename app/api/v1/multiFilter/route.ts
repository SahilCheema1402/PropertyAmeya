import DB from '@app/_Database/db';
import { NextApiRequest, NextApiResponse } from 'next';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose, { FilterQuery, PipelineStage, Schema } from 'mongoose';
export async function GET(req: Request) {
  try {
    await DB();
    const { searchParams } = new URL(req.url);
    const user: any = JSON.parse(req.headers.get('user') as string);
    // Fetch query parameters   
    const project = searchParams.get("project");
    const type = searchParams.get("type");
    const bhk = searchParams.get("bhk");
    const leadType = searchParams.get("leadtype")
    const source = searchParams.get("source")
    let budget = searchParams.get("budget")
    const page = Math.max(1, Number(searchParams.get('page')) || 1); // Default to 1 if invalid
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 10)); // Default to 10, max 100
    const skip = (page - 1) * limit;
    // Construct query filters
    const queryFilters: any = {};
    if (project) queryFilters.project = { $regex: project, $options: "i" };
    if (type) queryFilters.type = { $regex: type, $options: "i" };
    if (bhk) queryFilters.bhk = { $regex: bhk, $options: "i" };
    if (leadType) queryFilters.leadType = { $regex: leadType, $options: "i" };
    if (source) queryFilters.source = { $regex: source, $options: "i" };
    // Handle Budget Range Filtering
    
    if (budget) {
      let budgetRange;
      budget = budget.replace(/\s+/g, '');
      if( budget=='30000000'){
        budgetRange = [30000000,1000000000]
      }else{
         budgetRange = budget.replace(/,/g, '').split("-").map(Number); 
      }
      if (budgetRange.length === 2 && !isNaN(budgetRange[0]) && !isNaN(budgetRange[1])) {
        queryFilters.budget = {
          $gte: budgetRange[0],
          $lte: budgetRange[1],
        };
      } else {
        return HandleResponse({
          type: "BAD_REQUEST",
          message: "Invalid budget range format.",
        });
      }
    }
    // Aggregation pipeline
    if (user.role == 1 || user.role == 2) {
      const filters: any= [
        {
          $lookup: {
            from: "querys", // Query collection name
            localField: "query",
            foreignField: "_id",
            as: "queryDetails",
          },
        },
        {
          $unwind: {
            path: "$queryDetails",
            preserveNullAndEmptyArrays: true
          },
        },
        {
          $match: {
            ...(queryFilters.project && { "queryDetails.project": queryFilters.project }),
            ...(queryFilters.type && { "queryDetails.type": queryFilters.type }),
            ...(queryFilters.bhk && { "queryDetails.bhk": queryFilters.bhk }),
            ...(queryFilters.leadType && { "queryDetails.leadType": queryFilters.leadType }),
            ...(queryFilters.source && { "source": queryFilters.source }),
            ...(queryFilters?.budget?.$gte && {
              $expr: {
                $and: [
                  {
                    $gt: [
                      {
                        $convert: {
                          input: "$queryDetails.budget",
                          to: "double",
                          onError: null,
                          onNull: null,
                        }
                      },
                      queryFilters?.budget?.$gte,
                    ]
                  },
                  {
                    $lte: [
                      {
                        $convert: {
                          input: "$queryDetails.budget",
                          to: "double",
                          onError: null,
                          onNull: null,
                        }
                      },
                      queryFilters?.budget?.$lte,
                    ]
                  }
                ]
              }
            }),
          },
        },
        {
          $lookup: {
            from: "remarks",
            localField: "queryDetails.remarks",
            foreignField: "_id",
            as: "queryDetails.remarksDetails"
          }
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
            company: { $first: "$company" },
            leadStatus: { $first: "$leadStatus" },
            query: { $push: "$queryDetails" },
            createdBy: { $first: "$createdBy" },
            __v: { $first: "$__v" },
          },
        },
      ]
      const fields_ = await Lead.aggregate(filters)
      .skip(skip)  // Use calculated skip value
      .limit(limit); // Use validated limit
                    const allUsers = await Lead.aggregate(filters);
                    const TotalFresh = allUsers.filter((user: any) => user.leadStatus == 'fresh').length;
                    const TotalFollowup = allUsers.filter((user: any) => user.leadStatus == 'followup').length;
                    const TotalNotInterest = allUsers.filter((user: any) => user.leadStatus == 'notInterest').length;
      return HandleResponse({ type: "SUCCESS", message: "Multi Filter", data: { fields_,TotalFresh,TotalFollowup,TotalNotInterest } })
    } else {
      const filters: any = [
        {
          $match: {
            company: new mongoose.Types.ObjectId(user?.company?._id), assign: new mongoose.Types.ObjectId(user._id)
          }
        },
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
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $match: {
          ...(queryFilters.project && { "queryDetails.project": queryFilters.project }),
          ...(queryFilters.type && { "queryDetails.type": queryFilters.type }),
          ...(queryFilters.bhk && { "queryDetails.bhk": queryFilters.bhk }),
          ...(queryFilters.leadType && { "queryDetails.leadType": queryFilters.leadType }),
          ...(queryFilters.source && { "source": queryFilters.source }),
          ...(queryFilters?.budget?.$gte && {
            $expr: {
              $and: [
                {
                  $gt: [
                    {
                      $convert: {
                        input: "$queryDetails.budget",
                        to: "double",
                        onError: null,
                        onNull: null,
                      }
                    },
                    queryFilters?.budget?.$gte,
                  ]
                },
                {
                  $lte: [
                    {
                      $convert: {
                        input: "$queryDetails.budget",
                        to: "double",
                        onError: null,
                        onNull: null,
                      }
                    },
                    queryFilters?.budget?.$lte,
                  ]
                }
              ]
            }
          }),
        },
      },
      {
        $match: {
          ...queryFilters,
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
          company: { $first: "$company" },
          leadStatus: { $first: "$leadStatus" },
          query: { $push: "$queryDetails" },
          createdBy: { $first: "$createdBy" },
          __v: { $first: "$__v" },
        },
      },
      ]
           const fields_ = await Lead.aggregate(filters).skip((Number(page) - 1) * Number(limit)  || 0).limit(Number(limit) || 0);
              const allUsers = await Lead.aggregate(filters);
                       const TotalFresh = allUsers.filter((user: any) => user.leadStatus == 'fresh').length;
                       const TotalFollowup = allUsers.filter((user: any) => user.leadStatus == 'followup').length;
                       const TotalNotInterest = allUsers.filter((user: any) => user.leadStatus == 'notInterest').length;
      return HandleResponse({ type: "SUCCESS", message: "Multi Filter", data: { fields_,TotalFresh,TotalFollowup,TotalNotInterest } })
    }
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message || "An error occurred while fetching leads.",
    });
  }
}