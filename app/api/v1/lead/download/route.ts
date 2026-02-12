// First install exceljs in your backend
// npm install exceljs

import * as ExcelJS from 'exceljs';
import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import { is } from 'date-fns/locale';

// Status color mapping
const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'fresh': 'FFFFA500',        // Orange
    'followup': 'FF008000',     // Green  
    'notinterest': 'FFFF0000',  // Red
    'deal-done': 'FF0000FF',    // Blue
    'hotprospects': 'FF800080', // Purple
    'suspects': 'FFFFFF00',     // Yellow
    'visitdone': 'FFDA70D6',    // Light Purple (Orchid)
    'meetingdone': 'FF008B8B',  // Teal Green (Dark Turquoise)
    'ringing': 'FF191970',      // Dark Blue (Midnight Blue)
    'switchoff': 'FF2F4F4F',    // Dark Grey (Dark Slate Gray)
    'wrongno': 'FF8B0000',      // Blood Red (Dark Red)
    'callback': 'FF87CEEB'      // Light Blue (Sky Blue)
  };
  return statusColors[status.toLowerCase()] || 'FF4F46E5'; // Default blue
};

// Helper function to capitalize names
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to capitalize headers
const capitalizeHeader = (header: string): string => {
  return header
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export async function POST(req: Request) {
    try {
        DB();
        const body = await req.json();
        
        console.log("Download request from user:", req.headers.get('user'));
        const user: any = JSON.parse(req.headers.get('user') as string);
        
        const { 
            selectedStatus, 
            leadType, 
            search,
            downloadAll = false
        } = body;

        const companyId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(user?.company?._id);
        const userId = new mongoose.Types.ObjectId(user._id);

        // Check if search is a phone number (10 digits)
        const isPhoneSearch = search && /^\d{10}$/.test(search.replace(/\D/g, ''));

        // Helper function to get status conditions (same as your existing logic)
        const getStatusConditions = (status: string) => {
            switch (status) {
                case 'fresh':
                    return {
                        $or: [
                            { query: { $exists: false } },
                            { query: { $size: 0 } },
                            {
                                $and: [
                                    { query: { $exists: true, $ne: [] } },
                                    {
                                        $or: [
                                            { leadStatus: { $exists: false } },
                                            { leadStatus: null },
                                            { leadStatus: "" },
                                            { leadStatus: "fresh" }
                                        ]
                                    },
                                    {
                                        $or: [
                                            { call_status: { $exists: false } },
                                            { call_status: null },
                                            { call_status: "" }
                                        ]
                                    }
                                ]
                            }
                        ]
                    };
                case 'followup':
                    return {
                        leadStatus: "followup",
                        call_status: "Call Picked"
                    };
                case 'notinterest':
                    return {
                        leadStatus: "notInterest",
                        call_status: { $in: ["Visit Done", "Meeting Done", "Call Picked", "Ringing", "Call Back", "Wrong No", "Switch Off"] }
                    };
                case 'deal-done':
                    return {
                        leadStatus: "deal-done",
                        call_status: { $in: ["Visit Done", "Meeting Done"] }
                    };
                case 'ringing':
                    return {
                        call_status: "Ringing",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'callback':
                    return {
                        call_status: "Call Back",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'wrongno':
                    return {
                        call_status: "Wrong No",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'switchoff':
                    return {
                        call_status: "Switch Off",
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: "" },
                            { leadStatus: "fresh" }
                        ]
                    };
                case 'visitdone':
                    return {
                        leadStatus: "followup",
                        call_status: "Visit Done"
                    };
                case 'meetingdone':
                    return {
                        leadStatus: "followup",
                        call_status: "Meeting Done"
                    };
                case 'hotprospects':
                    return {
                        isHotProspect: true,
                    }
                case 'suspects':
                    return {
                        isSuspect: true,
                    }
                default:
                    return {};
            }
        };

        // Build base conditions based on user role
        let baseMatchCondition: any;
        
        if (user.role == 1 || user.role == 2) {
            baseMatchCondition = {
                company: companyId,
            };
        } else {
            baseMatchCondition = {
                company: companyId,
                ...(user._id != "678642d40797483103969bc5" && {
                    assign: userId
                })
            };
        }

        // Build streaming pipeline (same as your existing logic)
        const buildStreamingPipeline = (statusCondition: any = {}) => {
            let pipeline: any[] = [
                { $match: { ...baseMatchCondition, ...statusCondition } }
            ];

            if (search && !isPhoneSearch) {
                pipeline.push({
                    $match: {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { phone: { $regex: search, $options: 'i' } },
                            { email: { $regex: search, $options: 'i' } },
                            { address: { $regex: search, $options: 'i' } },
                            { source: { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            if (isPhoneSearch) {
                pipeline[0].$match.phone = { $regex: search, $options: 'i' };
            }

            if (leadType && leadType !== 'all') {
                pipeline.push({
                    $lookup: {
                        from: "querys",
                        localField: "query",
                        foreignField: "_id",
                        as: "queryDetails",
                        pipeline: [
                            { $match: { leadType: { $regex: leadType, $options: 'i' } } },
                            { $limit: 1 }
                        ]
                    }
                });
                pipeline.push({
                    $match: {
                        "queryDetails.0": { $exists: true }
                    }
                });
            }

            pipeline.push({ $sort: { _id: -1 } });

            pipeline.push(
                {
                    $lookup: {
                        from: "querys",
                        localField: "query",
                        foreignField: "_id",
                        as: "queryDetails",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "remarks",
                                    localField: "remarks",
                                    foreignField: "_id",
                                    as: "remarksDetails",
                                    pipeline: [
                                        { $project: { remark: 1 } }
                                    ]
                                }
                            },
                            { $project: { name: 1, phone: 1, email: 1, project: 1, leadType: 1, call_status: 1, remarksDetails: 1 } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "assign",
                        foreignField: "_id",
                        as: "assignedUsers",
                        pipeline: [
                            { $project: { userName: 1, _id: 1 } },
                            { $limit: 1 }
                        ]
                    }
                }
            );

            pipeline.push({
                $project: {
                    name: 1,
                    phone: 1,
                    email: 1,
                    address: 1,
                    source: 1,
                    leadStatus: 1,
                    call_status: 1,
                    createAt: 1,
                    updatedAt: 1,
                    queryDetails: { $arrayElemAt: ["$queryDetails", 0] },
                    assignedUser: { $arrayElemAt: ["$assignedUsers.userName", 0] }
                }
            });

            return pipeline;
        };

        // Create ExcelJS workbook
        const workbook = new ExcelJS.Workbook();
        const BATCH_SIZE = 1000;
        let fileName = 'leads_export';

        // Style functions
        const styleHeaderCell = (cell: ExcelJS.Cell, bgColor: string) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: bgColor }
            };
            cell.font = { 
                bold: true, 
                color: { argb: 'FFFFFFFF' }, // White text
                size: 12 
            };
            cell.alignment = { 
                vertical: 'middle', 
                horizontal: 'center' 
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        };

        const styleDataCell = (cell: ExcelJS.Cell) => {
            cell.alignment = { 
                vertical: 'middle', 
                horizontal: 'left' 
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        };

        // Define headers
        const headers = [
            'Name', 'Phone', 'Email', 'Address', 'Source', 'Lead Status', 
            'Call Status', 'Query Name', 'Query Phone', 'Query Email', 
            'Project', 'Lead Type', 'Query Call Status', 'Assigned To', 
            'Created At', 'Updated At'
        ];

        if (downloadAll) {
            // Create separate sheets for each status
            const statusTypes = ['fresh', 'followup', 'notinterest', 'deal-done', 'ringing', 'callback', 'wrongno', 'switchoff', 'visitdone', 'meetingdone'];
            
            for (const status of statusTypes) {
                console.log(`Processing status: ${status}`);
                const statusCondition = getStatusConditions(status);
                const pipeline = buildStreamingPipeline(statusCondition);
                
                // Create worksheet for this status
                const worksheet = workbook.addWorksheet(`${capitalizeHeader(status)}`);
                
                // Add and style headers
                const headerRow = worksheet.addRow(headers.map(capitalizeHeader));
                const statusColor = getStatusColor(status);
                
                for (let i = 1; i <= headers.length; i++) {
                    styleHeaderCell(headerRow.getCell(i), statusColor);
                }
                
                // Use cursor for memory efficiency
                const cursor = Lead.aggregate(pipeline, {
                    allowDiskUse: true,
                    maxTimeMS: 300000,
                    cursor: { batchSize: BATCH_SIZE }
                }).cursor();

                let processedCount = 0;
                for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                    const queryDetails = doc.queryDetails || {};
                    
                    const row = worksheet.addRow([
                        capitalizeName(doc.name || ''),
                        doc.phone || '',
                        doc.email || '',
                        doc.address || '',
                        capitalizeHeader(doc.source || ''),
                        capitalizeHeader(doc.leadStatus || ''),
                        capitalizeHeader(doc.call_status || ''),
                        capitalizeName(queryDetails.name || ''),
                        queryDetails.phone || '',
                        queryDetails.email || '',
                        capitalizeHeader(queryDetails.project || ''),
                        capitalizeHeader(queryDetails.leadType || ''),
                        capitalizeHeader(queryDetails.call_status || ''),
                        capitalizeName(doc.assignedUser || ''),
                        doc.createAt ? new Date(doc.createAt).toLocaleString() : '',
                        doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '',
                        // queryDetails.remarksDetails?.map((remark: any) => remark.remark).join(', ') || ''
                    ]);

                    // Style data cells
                    for (let i = 1; i <= headers.length; i++) {
                        styleDataCell(row.getCell(i));
                    }
                    
                    processedCount++;
                    
                    if (processedCount % BATCH_SIZE === 0) {
                        console.log(`Processed ${processedCount} ${status} leads`);
                    }
                }

                // Set column widths
                [20, 15, 25, 30, 15, 15, 15, 20, 15, 25, 20, 15, 15, 20, 15, 15, 30].forEach((width, index) => {
                    worksheet.getColumn(index + 1).width = width;
                });

                await cursor.close();
                console.log(`Completed ${status}: ${processedCount} leads`);
            }
            
            fileName = `all_leads_export_${new Date().toISOString().split('T')[0]}`;
        } else {
            // Single status download
            const statusCondition = selectedStatus ? getStatusConditions(selectedStatus) : {};
            const pipeline = buildStreamingPipeline(statusCondition);
            
            const worksheet = workbook.addWorksheet(`${capitalizeHeader(selectedStatus || 'All')} Leads`);
            
            // Add and style headers
            const headerRow = worksheet.addRow(headers.map(capitalizeHeader));
            const statusColor = getStatusColor(selectedStatus || 'fresh');
            
            for (let i = 1; i <= headers.length; i++) {
                styleHeaderCell(headerRow.getCell(i), statusColor);
            }
            
            const cursor = Lead.aggregate(pipeline, {
                allowDiskUse: true,
                maxTimeMS: 300000,
                cursor: { batchSize: BATCH_SIZE }
            }).cursor();

            let processedCount = 0;
            for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                const queryDetails = doc.queryDetails || {};
                
                const row = worksheet.addRow([
                    capitalizeName(doc.name || ''),
                    doc.phone || '',
                    doc.email || '',
                    doc.address || '',
                    capitalizeHeader(doc.source || ''),
                    capitalizeHeader(doc.leadStatus || ''),
                    capitalizeHeader(doc.call_status || ''),
                    capitalizeName(queryDetails.name || ''),
                    queryDetails.phone || '',
                    queryDetails.email || '',
                    capitalizeHeader(queryDetails.project || ''),
                    capitalizeHeader(queryDetails.leadType || ''),
                    capitalizeHeader(queryDetails.call_status || ''),
                    capitalizeName(doc.assignedUser || ''),
                    doc.createAt ? new Date(doc.createAt).toLocaleString() : '',
                    doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '',
                    // queryDetails.remarksDetails?.map((remark: any) => remark.remark).join(', ') || ''
                ]);

                // Style data cells
                for (let i = 1; i <= headers.length; i++) {
                    styleDataCell(row.getCell(i));
                }
                
                processedCount++;
            }

            // Set column widths
            [20, 15, 25, 30, 15, 15, 15, 20, 15, 25, 20, 15, 15, 20, 15, 15, 30].forEach((width, index) => {
                worksheet.getColumn(index + 1).width = width;
            });

            await cursor.close();
            fileName = `${capitalizeName(selectedStatus) || 'All'}_leads_export_${new Date().toISOString().split('T')[0]}`;
        }

        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Convert to Blob
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        return new Response(blob, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
            },
        });

    } catch (error: any) {
        console.error('Error handling download request:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'An unexpected error occurred during download.',
        });
    }
}