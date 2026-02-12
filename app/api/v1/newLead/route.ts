import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import Lead from './../../../_model/LeadModel/lead.model';
import mongoose, { PipelineStage } from 'mongoose';

export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const userHeader = req.headers.get('user');
        let user: any = null;

        try {
            user = userHeader ? JSON.parse(userHeader) : null;
        } catch (error) {
            return HandleResponse({
                type: 'ERROR',
                message: 'Invalid user header format',
            });
        }

        if (!user || !user.role) {
            return HandleResponse({
                type: 'ERROR',
                message: 'Unauthorized: User or role missing',
            });
        }

        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 250); // Cap at 250
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Parse special search formats
        let createdByFilter = null;
        let actualSearch = search;

        if (search && search.startsWith('createdBy:')) {
            const parts = search.split('createdBy:');
            if (parts.length > 1) {
                createdByFilter = parts[1].trim();
                actualSearch = null;
            }
        }

        // Build base match conditions with proper indexing support
        const baseMatchConditions: any = {
            company: new mongoose.Types.ObjectId(user?.company?._id),
            // leadStatus: "fresh",
        };

        // Optimized date range filter
        if (startDate || endDate) {
            const dateFilter: any = {};
            if (startDate) {
                const startDateTime = new Date(startDate);
                startDateTime.setUTCHours(0, 0, 0, 0);
                dateFilter.$gte = startDateTime;
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setUTCHours(23, 59, 59, 999);
                dateFilter.$lte = endDateTime;
            }
            baseMatchConditions.createAt = dateFilter;
        }

        if (createdByFilter) {
            baseMatchConditions.createdBy = new mongoose.Types.ObjectId(createdByFilter);
        }

        // Role-based filtering
        if (user.role !== 1 && user.role !== 2 && user._id !== "678642d40797483103969bc5") {
            baseMatchConditions.assign = new mongoose.Types.ObjectId(user._id);
        }

        // Optimized search conditions with proper indexing
        const buildSearchConditions = (searchTerm: string | null) => {
            if (!searchTerm || searchTerm.length < 2) return {}; // Minimum 2 chars for search
            
            // Use text search if available, otherwise regex
            return {
                $or: [
                    { name: { $regex: `^${searchTerm}`, $options: 'i' } }, // Prefix search is faster
                    { phone: { $regex: `^${searchTerm}` } } // Exact match for phone numbers
                ]
            };
        };

        // OPTIMIZED PIPELINE
        const pipeline: PipelineStage[] = [
            {
                $match: {
                    ...baseMatchConditions,
                    ...buildSearchConditions(actualSearch)
                }
            },
            {
                $sort: { createAt: -1 } // Sort early in pipeline
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdByUser",
                    pipeline: [
                        { $project: { userName: 1 } } // Only get userName field
                    ]
                }
            },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    createAt: 1,
                    createdBy: 1,
                    createdByName: {
                        $ifNull: [
                            { $arrayElemAt: ["$createdByUser.userName", 0] },
                            "System"
                        ]
                    }
                }
            }
        ];

        // Get total count efficiently - use countDocuments instead of aggregation
        const totalCount = await Lead.countDocuments({
            ...baseMatchConditions,
            ...buildSearchConditions(actualSearch)
        });

        const dataResults = await Lead.aggregate(pipeline)
            .allowDiskUse(true)
            .option({ maxTimeMS: 30000 }); // 30 second timeout

        // Only get status counts for admin users and only when needed
        let statusCounts = {
            TotalFresh: 0,
            TotalFollowup: 0,
            TotalNotInterest: 0,
            TotalDealDone: 0,
            total: totalCount
        };

        // Skip status counts if searching or filtering by specific user to improve performance
        if ((user.role === 1 || user.role === 2) && !actualSearch && !createdByFilter) {
            const countConditions: { company: mongoose.Types.ObjectId; [key: string]: any } = { 
                company: new mongoose.Types.ObjectId(user?.company?._id)
            };
            
            // Add date filter to counts if present
            if (startDate || endDate) {
                countConditions.createAt = baseMatchConditions.createAt;
            }

            // Use Promise.all for parallel execution
            const [TotalFresh, TotalFollowup, TotalNotInterest, TotalDealDone] = await Promise.all([
                Lead.countDocuments({ ...countConditions, leadStatus: 'fresh' }),
                Lead.countDocuments({ ...countConditions, leadStatus: 'followup' }),
                Lead.countDocuments({ ...countConditions, leadStatus: 'notInterest' }),
                Lead.countDocuments({ ...countConditions, leadStatus: 'deal-done' })
            ]);

            statusCounts = {
                TotalFresh,
                TotalFollowup,
                TotalNotInterest,
                TotalDealDone,
                total: totalCount
            };
        }

        return HandleResponse({
            type: "SUCCESS",
            message: "",
            data: {
                fields_: dataResults,
                ...statusCounts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    hasNext: page * limit < totalCount,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error: any) {
        console.error('Lead API Error:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "An error occurred while fetching leads"
        });
    }
}