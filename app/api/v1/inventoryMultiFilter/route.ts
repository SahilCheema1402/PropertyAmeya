import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import inventoryModel from './../../../_model/Inventory/inventory.model';
import mongoose, { PipelineStage } from 'mongoose';

export async function GET(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const user: any = JSON.parse(req.headers.get('user') as string);
        
        // Extract all possible filter parameters
        const company = searchParams.get('company');
        const project = searchParams.get('project');
        const unit_no = searchParams.get('unit_no');
        const area = searchParams.get('area');
        const type = searchParams.get('type');
        const facing = searchParams.get('facing');
        const inventoryType = searchParams.get('inventoryType');
        const status = searchParams.get('status');
        const bhk = searchParams.get('bhk');
        const tower_no = searchParams.get('tower_no');
        const location = searchParams.get('location');
        const tenant = searchParams.get('tenant');
        const dimension = searchParams.get('dimension');
        const parking = searchParams.get('parking');
        const parking_type = searchParams.get('parking_type');
        
        // Range filters
        const demand_min = searchParams.get('demand_min');
        const demand_max = searchParams.get('demand_max');
        const expected_rent_min = searchParams.get('expected_rent_min');
        const expected_rent_max = searchParams.get('expected_rent_max');
        
        // Date filters
        const available_date = searchParams.get('available_date');
        const deal_closing_date = searchParams.get('deal_closing_date');
        const createAt = searchParams.get('createAt');
        
        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Build match conditions
        let matchConditions: any = {
            company: new mongoose.Types.ObjectId(company || user?.company?._id)
        };

        // Text-based filters with exact and partial matching
        if (project) {
            matchConditions.project = { $regex: project, $options: 'i' };
        }
        
        if (unit_no) {
            matchConditions.unit_no = { $regex: unit_no, $options: 'i' };
        }
        
        if (area) {
            matchConditions.area = { $regex: area, $options: 'i' };
        }
        
        if (location) {
            matchConditions.location = { $regex: location, $options: 'i' };
        }
        
        if (tenant) {
            matchConditions.tenant = { $regex: tenant, $options: 'i' };
        }
        
        if (tower_no) {
            matchConditions.tower_no = { $regex: tower_no, $options: 'i' };
        }
        
        if (dimension) {
            matchConditions.dimension = { $regex: dimension, $options: 'i' };
        }

        // Exact match filters for select fields
        if (type) {
            matchConditions.type = type;
        }
        
        if (facing) {
            matchConditions.facing = facing;
        }
        
        if (inventoryType) {
            matchConditions.inventoryType = inventoryType;
        }
        
        if (status) {
            matchConditions.status = status;
        }
        
        if (bhk) {
            matchConditions.bhk = bhk;
        }
        
        if (parking) {
            matchConditions.parking = parking;
        }
        
        if (parking_type) {
            matchConditions.parking_type = parking_type;
        }

        // Date filters
        if (available_date) {
            const targetDate = new Date(available_date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            
            matchConditions.available_date = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        
        if (deal_closing_date) {
            const targetDate = new Date(deal_closing_date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            
            matchConditions.deal_closing_date = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        
        if (createAt) {
            const targetDate = new Date(createAt);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            
            matchConditions.createAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        // Corrected aggregation pipeline with proper currency conversion
const pipeline: PipelineStage[] = [
    {
        $addFields: {
            demand_numeric: {
                $let: {
                    vars: {
                        // First, clean and normalize the string
                        cleanString: {
                            $trim: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: { $toString: "$demand" },
                                                        find: "₹",
                                                        replacement: ""
                                                    }
                                                },
                                                find: ",",
                                                replacement: ""
                                            }
                                        },
                                        find: " ",
                                        replacement: ""
                                    }
                                }
                            }
                        }
                    },
                    in: {
                        $switch: {
                            branches: [
                                // Handle Crore values (multiply by 10,000,000)
                                {
                                    case: { 
                                        $regexMatch: { 
                                            input: "$$cleanString", 
                                            regex: /cr|crore/i 
                                        } 
                                    },
                                    then: {
                                        $multiply: [
                                            {
                                                $convert: {
                                                    input: {
                                                        $replaceAll: {
                                                            input: {
                                                                $replaceAll: {
                                                                    input: "$$cleanString",
                                                                    find: "Cr",
                                                                    replacement: ""
                                                                }
                                                            },
                                                            find: "Crore",
                                                            replacement: ""
                                                        }
                                                    },
                                                    to: "double",
                                                    onError: 0
                                                }
                                            },
                                            10000000 // 1 Crore = 10,000,000
                                        ]
                                    }
                                },
                                // Handle Lakh values (multiply by 100,000)
                                {
                                    case: { 
                                        $regexMatch: { 
                                            input: "$$cleanString", 
                                            regex: /lac|lakh/i 
                                        } 
                                    },
                                    then: {
                                        $multiply: [
                                            {
                                                $convert: {
                                                    input: {
                                                        $replaceAll: {
                                                            input: {
                                                                $replaceAll: {
                                                                    input: "$$cleanString",
                                                                    find: "Lac",
                                                                    replacement: ""
                                                                }
                                                            },
                                                            find: "Lakh",
                                                            replacement: ""
                                                        }
                                                    },
                                                    to: "double",
                                                    onError: 0
                                                }
                                            },
                                            100000 // 1 Lakh = 100,000
                                        ]
                                    }
                                }
                            ],
                            // Default case: treat as regular number
                            default: {
                                $convert: {
                                    input: "$$cleanString",
                                    to: "double",
                                    onError: 0,
                                    onNull: 0
                                }
                            }
                        }
                    }
                }
            },
            expected_rent_numeric: {
                $let: {
                    vars: {
                        // First, clean and normalize the string
                        cleanString: {
                            $trim: {
                                input: {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: { $toString: "$expected_rent" },
                                                        find: "₹",
                                                        replacement: ""
                                                    }
                                                },
                                                find: ",",
                                                replacement: ""
                                            }
                                        },
                                        find: " ",
                                        replacement: ""
                                    }
                                }
                            }
                        }
                    },
                    in: {
                        $switch: {
                            branches: [
                                // Handle Crore values
                                {
                                    case: { 
                                        $regexMatch: { 
                                            input: "$$cleanString", 
                                            regex: /cr|crore/i 
                                        } 
                                    },
                                    then: {
                                        $multiply: [
                                            {
                                                $convert: {
                                                    input: {
                                                        $replaceAll: {
                                                            input: {
                                                                $replaceAll: {
                                                                    input: "$$cleanString",
                                                                    find: "Cr",
                                                                    replacement: ""
                                                                }
                                                            },
                                                            find: "Crore",
                                                            replacement: ""
                                                        }
                                                    },
                                                    to: "double",
                                                    onError: 0
                                                }
                                            },
                                            10000000
                                        ]
                                    }
                                },
                                // Handle Lakh values
                                {
                                    case: { 
                                        $regexMatch: { 
                                            input: "$$cleanString", 
                                            regex: /lac|lakh/i 
                                        } 
                                    },
                                    then: {
                                        $multiply: [
                                            {
                                                $convert: {
                                                    input: {
                                                        $replaceAll: {
                                                            input: {
                                                                $replaceAll: {
                                                                    input: "$$cleanString",
                                                                    find: "Lac",
                                                                    replacement: ""
                                                                }
                                                            },
                                                            find: "Lakh",
                                                            replacement: ""
                                                        }
                                                    },
                                                    to: "double",
                                                    onError: 0
                                                }
                                            },
                                            100000
                                        ]
                                    }
                                }
                            ],
                            // Default case: treat as regular number
                            default: {
                                $convert: {
                                    input: "$$cleanString",
                                    to: "double",
                                    onError: 0,
                                    onNull: 0
                                }
                            }
                        }
                    }
                }
            },
            // Add debug fields to see what's happening
            debug_demand_original: "$demand",
            debug_expected_rent_original: "$expected_rent"
        }
    }
];

        // Add range filters after computing numeric fields
        let postComputeMatchConditions: any = {};

        if (demand_min || demand_max) {
    postComputeMatchConditions.demand_numeric = {};
    if (demand_min && !isNaN(parseFloat(demand_min))) {
        postComputeMatchConditions.demand_numeric.$gte = parseFloat(demand_min);
    }
    if (demand_max && !isNaN(parseFloat(demand_max))) {
        postComputeMatchConditions.demand_numeric.$lte = parseFloat(demand_max);
    }
    
    // Add debug logging
    console.log('Demand range filter:', postComputeMatchConditions.demand_numeric);
}

if (expected_rent_min || expected_rent_max) {
    postComputeMatchConditions.expected_rent_numeric = {};
    if (expected_rent_min && !isNaN(parseFloat(expected_rent_min))) {
        postComputeMatchConditions.expected_rent_numeric.$gte = parseFloat(expected_rent_min);
    }
    if (expected_rent_max && !isNaN(parseFloat(expected_rent_max))) {
        postComputeMatchConditions.expected_rent_numeric.$lte = parseFloat(expected_rent_max);
    }
    
    // Add debug logging
    console.log('Rent range filter:', postComputeMatchConditions.expected_rent_numeric);
}

        // Apply initial match conditions
        pipeline.push({ $match: matchConditions });
        // Apply initial match conditions
        pipeline.push({ $match: matchConditions });

        // Apply post-compute match conditions if any
        if (Object.keys(postComputeMatchConditions).length > 0) {
            pipeline.push({ $match: postComputeMatchConditions });
        }
        pipeline.push(
            // Lookup user details
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdByDetails"
                }
            },
            {
                $unwind: {
                    path: "$createdByDetails",
                    preserveNullAndEmptyArrays: true 
                }
            },
            
            // Lookup remarks
            {
                $lookup: {
                    from: "remarks",
                    localField: "remarks",
                    foreignField: "_id",
                    as: "remarksDetails"
                }
            },
            
            // Project final fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    mobile: 1,
                    email: 1,
                    address: 1,
                    type: 1,
                    createAt: 1,
                    company: 1,
                    unit_no: 1,
                    project: 1,
                    phone: 1,
                    bhk: 1,
                    landing_amount: 1,
                    expected_rent: 1,
                    demand: 1,
                    available_date: 1,
                    deal_closing_date: 1,
                    createdBy: {
                        _id: "$createdByDetails._id",
                        name: "$createdByDetails.userName"
                    },
                    closing_amount: 1,
                    expVisitTime: 1,
                    tenant: 1,
                    status: 1,
                    facing: 1,
                    area: 1,
                    dimension: 1,
                    inventoryType: 1,
                    inventory: 1,
                    purpose: 1,
                    registry: 1,
                    location: 1,
                    landing: 1,
                    tenant_mobile_no: 1,
                    tower_no: 1,
                    parking: 1,
                    parking_type: 1,
                    front: 1,
                    height: 1,
                    remarksDetails: 1,
                    __v: 1
                }
            },
            
            // Sort by creation date (newest first)
            {
                $sort: { createAt: -1 }
            }
        );

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await inventoryModel.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Apply pagination
        const paginatedPipeline = [
            ...pipeline,
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        const fields_ = await inventoryModel.aggregate(paginatedPipeline);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Build applied filters summary
        const appliedFilters: any = {};
        
        if (project) appliedFilters.project = project;
        if (unit_no) appliedFilters.unit_no = unit_no;
        if (area) appliedFilters.area = area;
        if (type) appliedFilters.type = type;
        if (facing) appliedFilters.facing = facing;
        if (inventoryType) appliedFilters.inventoryType = inventoryType;
        if (status) appliedFilters.status = status;
        if (bhk) appliedFilters.bhk = bhk;
        if (tower_no) appliedFilters.tower_no = tower_no;
        if (location) appliedFilters.location = location;
        if (tenant) appliedFilters.tenant = tenant;
        if (dimension) appliedFilters.dimension = dimension;
        if (parking) appliedFilters.parking = parking;
        if (parking_type) appliedFilters.parking_type = parking_type;
        
        if (demand_min || demand_max) {
            appliedFilters.demand_range = {
                min: demand_min,
                max: demand_max
            };
        }
        
        if (expected_rent_min || expected_rent_max) {
            appliedFilters.expected_rent_range = {
                min: expected_rent_min,
                max: expected_rent_max
            };
        }
        
        if (available_date) appliedFilters.available_date = available_date;
        if (deal_closing_date) appliedFilters.deal_closing_date = deal_closing_date;
        if (createAt) appliedFilters.createAt = createAt;

        return HandleResponse({
            type: "SUCCESS",
            message: "Multi-filter inventory data retrieved successfully",
            data: {
                fields_,
                count: total,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalRecords: total,
                    limit,
                    hasNextPage,
                    hasPrevPage
                },
                appliedFilters,
                filtersCount: Object.keys(appliedFilters).length
            }
        });

    } catch (error: any) {
        console.error('Multi-filter error:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to apply multi-filters"
        });
    }
}