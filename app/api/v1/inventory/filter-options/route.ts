import DB from './../../../../_Database/db';
import HandleResponse from './../../../../_utils/response';
import inventoryModel from './../../../../_model/Inventory/inventory.model';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    try {
        await DB();
        const user: any = JSON.parse(req.headers.get('user') as string);

        // Get distinct values for filter options
        const pipeline = [
            {
                $match: {
                    company: new mongoose.Types.ObjectId(user?.company?._id)
                }
            },
            {
                $group: {
                    _id: null,
                    projects: { $addToSet: "$project" },
                    types: { $addToSet: "$type" },
                    facings: { $addToSet: "$facing" },
                    inventoryTypes: { $addToSet: "$inventoryType" },
                    statuses: { $addToSet: "$status" },
                    bhks: { $addToSet: "$bhk" },
                    locations: { $addToSet: "$location" },
                    towerNumbers: { $addToSet: "$tower_no" },
                    parkingTypes: { $addToSet: "$parking_type" }
                }
            },
            {
                $project: {
                    _id: 0,
                    projects: {
                        $filter: {
                            input: "$projects",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    types: {
                        $filter: {
                            input: "$types",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    facings: {
                        $filter: {
                            input: "$facings",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    inventoryTypes: {
                        $filter: {
                            input: "$inventoryTypes",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    statuses: {
                        $filter: {
                            input: "$statuses",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    bhks: {
                        $filter: {
                            input: "$bhks",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    locations: {
                        $filter: {
                            input: "$locations",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    towerNumbers: {
                        $filter: {
                            input: "$towerNumbers",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    },
                    parkingTypes: {
                        $filter: {
                            input: "$parkingTypes",
                            as: "item",
                            cond: { $and: [{ $ne: ["$$item", null] }, { $ne: ["$$item", ""] }] }
                        }
                    }
                }
            }
        ];

        const result = await inventoryModel.aggregate(pipeline);
        const options = result[0] || {};

        // Get price ranges
        const priceStats = await inventoryModel.aggregate([
            {
                $match: {
                    company: new mongoose.Types.ObjectId(user?.company?._id)
                }
            },
            {
                $addFields: {
                    demand_numeric: {
                        $toDouble: {
                            $replaceAll: {
                                input: { $replaceAll: { input: "$demand", find: "₹", replacement: "" } },
                                find: ",",
                                replacement: ""
                            }
                        }
                    },
                    expected_rent_numeric: {
                        $toDouble: {
                            $replaceAll: {
                                input: { $replaceAll: { input: "$expected_rent", find: "₹", replacement: "" } },
                                find: ",",
                                replacement: ""
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    minDemand: { $min: "$demand_numeric" },
                    maxDemand: { $max: "$demand_numeric" },
                    avgDemand: { $avg: "$demand_numeric" },
                    minRent: { $min: "$expected_rent_numeric" },
                    maxRent: { $max: "$expected_rent_numeric" },
                    avgRent: { $avg: "$expected_rent_numeric" }
                }
            }
        ]);

        const stats = priceStats[0] || {};

        // Get date ranges
        const dateStats = await inventoryModel.aggregate([
            {
                $match: {
                    company: new mongoose.Types.ObjectId(user?.company?._id)
                }
            },
            {
                $group: {
                    _id: null,
                    oldestCreated: { $min: "$createAt" },
                    newestCreated: { $max: "$createAt" },
                    oldestAvailable: { $min: "$available_date" },
                    newestAvailable: { $max: "$available_date" }
                }
            }
        ]);

        const dates = dateStats[0] || {};

        // Sort all arrays
        Object.keys(options).forEach(key => {
            if (Array.isArray(options[key])) {
                options[key] = options[key].sort();
            }
        });

        const filterOptions = {
            // Static predefined options (always available)
            static: {
                facings: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
                propertyTypes: ['residential', 'Commercial', 'Plot', 'Villa', 'Apartment', 'Office', 'Shop', 'Warehouse'],
                inventoryTypes: ['Rent Residential', 'Resale Residential', 'Rent Commercial', 'Resale Commercial'],
                statuses: ['Available', 'Sold', 'Rented', 'Booked', 'Hold'],
                bhkOptions: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+', 'Studio'],
                parkingOptions: ['Yes', 'Not Available'],
                parkingTypes: ['Covered', 'Open', 'Stilt']
            },
            
            // Dynamic options from database
            dynamic: {
                projects: options.projects || [],
                types: options.types || [],
                facings: options.facings || [],
                inventoryTypes: options.inventoryTypes || [],
                statuses: options.statuses || [],
                bhks: options.bhks || [],
                locations: options.locations || [],
                towerNumbers: options.towerNumbers || [],
                parkingTypes: options.parkingTypes || []
            },

            // Price and date ranges
            ranges: {
                demand: {
                    min: Math.floor(stats.minDemand || 0),
                    max: Math.ceil(stats.maxDemand || 10000000),
                    avg: Math.round(stats.avgDemand || 0)
                },
                rent: {
                    min: Math.floor(stats.minRent || 0),
                    max: Math.ceil(stats.maxRent || 100000),
                    avg: Math.round(stats.avgRent || 0)
                },
                dates: {
                    oldestCreated: dates.oldestCreated,
                    newestCreated: dates.newestCreated,
                    oldestAvailable: dates.oldestAvailable,
                    newestAvailable: dates.newestAvailable
                }
            },

            // Statistics for UI reference
            stats: {
                totalRecords: await inventoryModel.countDocuments({
                    company: new mongoose.Types.ObjectId(user?.company?._id)
                }),
                uniqueProjects: options.projects?.length || 0,
                uniqueLocations: options.locations?.length || 0,
                avgPrice: Math.round(stats.avgDemand || 0),
                avgRent: Math.round(stats.avgRent || 0)
            }
        };

        return HandleResponse({
            type: "SUCCESS",
            message: "Filter options retrieved successfully",
            data: filterOptions
        });

    } catch (error: any) {
        console.error('Filter options error:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to get filter options"
        });
    }
}