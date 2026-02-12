import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import ImageKit from 'imagekit';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';
import RemarksModel from './../../../_model/LeadModel/Remarks.model';
import inventoryModel from './../../../_model/Inventory/inventory.model';
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY! || "public_PU0gdYD1LhtXpEqjtMIZzOGFEmQ=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY! || "private_JnnPIKCIbLFZIxpIzToORKoTe60=",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT! || "https://ik.imagekit.io/xdpr8on7w",
});
import mongoose, { FilterQuery, PipelineStage, Schema } from 'mongoose';
import { DateTime } from 'luxon';

export async function POST(req: Request) {
    try {
        await DB();
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);

        // Validate request body
        if (!body.data) {
            return HandleResponse({ 
                type: "BAD_REQUEST", 
                message: "Body Data is Missing!" 
            });
        }

        // Handle inventory creation
        if (body.type_ === 'add') {
            let remarkIds = [];
            if (body.data.remarks) {
                const newRemark = new RemarksModel({
                    title: body.data.remarks,
                    user: user.userName,
                    createdBy: user._id,
                    createAt: DateTime.now().setZone('Asia/Kolkata'),
                });
                await newRemark.save();
                remarkIds.push(newRemark._id);
            }

            const Inventory = new inventoryModel({
                ...body.data,
                createAt: DateTime.now().setZone('Asia/Kolkata'),
                updateAt: DateTime.now().setZone('Asia/Kolkata'),
                createdBy: user._id,
                remarks: remarkIds,
                company: user?.company?._id,
            });
            await Inventory.save();
            
            return HandleResponse({ 
                type: "SUCCESS", 
                message: "Inventory Created Successfully" 
            });
        }

        // Handle inventory update
        if (body.type_ === 'update') {
            // Validate ID
            if (!body._id || body._id === 'undefined') {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: "Invalid inventory ID provided"
                });
            }
            try {
                const inventoryId = new mongoose.Types.ObjectId(body._id);
                
                // First check if inventory exists
                const existingInventory = await inventoryModel.findById(inventoryId);
                if (!existingInventory) {
                    return HandleResponse({
                        type: "BAD_REQUEST",
                        message: "Inventory not found"
                    });
                }

                // Update the inventory
                const updatedInventory = await inventoryModel.findByIdAndUpdate(
                    inventoryId,
                    {
                        $set: {
                            ...body.data,
                            updateAt: new Date() // Add updateAt timestamp
                        }
                    },
                    { 
                        new: true,
                        runValidators: true // Run model validators
                    }
                );
                return HandleResponse({ 
                    type: "SUCCESS", 
                    message: "Inventory Updated Successfully" 
                });
            } catch (err) {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: "Invalid inventory ID format"
                });
            }
        }

        // Handle invalid type_
        return HandleResponse({
            type: "BAD_REQUEST",
            message: "Invalid operation type"
        });

    } catch (error: any) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return HandleResponse({
                type: "BAD_REQUEST",
                message: `Duplicate ${duplicateField}: ${error.keyValue[duplicateField]} already exists.`
            });
        }
        
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "An error occurred"
        });
    }
}

export async function PUT(req: Request) {
    try {
        DB();
        const body = await req.json(); //
        const user: any = JSON.parse(req.headers.get('user') as string);
        const { _id, query, type_, leadIndex, remarks }: { _id: string, query: any, type_: string, leadIndex: number, remarks: string } = body;
        if (!_id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Lead _id is Missing!" })
        }
        if (!query) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Lead Query is Missing!" })
        }
        let lead;
        if (type_ == "remarks") {
            lead = await inventoryModel.findById(_id);

            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "_id is wrong" })
            }
        } else {
            //  lead = await Lead.findById(_id);

            if (!lead) {
                return HandleResponse({ type: "BAD_REQUEST", message: "_id is wrong" })
            }

        }

        let remarkIds = [];
        if (query.remarks) {
            // If the remarks are provided as a string, create a Remark document
            const newRemark = new RemarksModel({
                title: query.remarks,
                user: user.userName,
                createdBy: user._id,
                createAt: new Date(),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }
        if (query.call_status == "Visit Done") {
            // If the remarks are provided as a string, create a Remark document
            const newRemark = new RemarksModel({
                title: `Visit completed by ${user.userName}`,
                user: user.userName,
                createdBy: user._id,
                createAt: new Date(),
            });
            await newRemark.save();
            remarkIds.push(newRemark._id);
        }
        // If the lead exists and type is "add", add the new query
        if (type_ === "add") {
            const newQuery = new inventoryModel({
                ...query,
                createAt: new Date(),
                updateAt: new Date(),
                createdBy: user._id,
                company: user?.company?._id,
                remarks: remarkIds,
                user: user._id
            });
            await newQuery.save();
            // await Lead.findByIdAndUpdate(
            //     _id,
            //     {
            //         $push: { query: newQuery._id }
            //     },
            //     { new: true }
            // );

        }

        //If type is remarks
        else if (type_ === 'remarks' && remarks && _id) {
            const newRemark = new RemarksModel({
                title: remarks,
                user: user.userName,
                createdBy: user._id,
                createAt: new Date(),
            });

            await newRemark.save();
            await inventoryModel.findByIdAndUpdate(
                _id,
                {
                    $push: { remarks: newRemark._id }
                }
            );
        }

        // If the lead query is empty, create the first query
        else {
            const newQuery = new inventoryModel({
                ...query,
                createAt: new Date(),
                updateAt: new Date(),
                createdBy: user._id,
                remarks: remarkIds, // Link to the created remarks
            });
            await newQuery.save();
            // await Lead.findByIdAndUpdate(_id, {
            //     query: [newQuery._id]  // Add the new query to the lead's query list
            // });
        }

        return HandleResponse({ type: "SUCCESS", message: "Successfully created the lead" });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}

export async function GET(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const leadType = searchParams.get('leadType');
        const page = searchParams.get('page');
        const limit = searchParams.get('limit');
        const user: any = JSON.parse(req.headers.get('user') as string);
        

        // First, let's check if any documents exist at all
        const totalDocs = await inventoryModel.countDocuments();

        // Check documents for this company
        const companyDocs = await inventoryModel.countDocuments({
            company: new mongoose.Types.ObjectId(user?.company?._id)
        });

        let filters: PipelineStage[] = [{
            $match: {
                company: new mongoose.Types.ObjectId(user?.company?._id),
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { bhk: { $regex: search, $options: 'i' } },
                        { mobile: { $regex: search, $options: 'i' } },
                        { type: { $regex: search, $options: 'i' } },
                        { project: { $regex: search, $options: 'i' } },
                        { budget: { $regex: search, $options: 'i' } },
                        { leadType: { $regex: search, $options: 'i' } },
                        { status: { $regex: search, $options: 'i' } },
                        { bhk: { $regex: search, $options: 'i' } },
                        { floor: { $regex: search, $options: 'i' } },
                        { expected_rent: { $regex: search, $options: 'i' } },
                        { inventoryType: { $regex: search, $options: 'i' } },
                        { inventory: { $regex: search, $options: 'i' } },
                        { tenant_mobile_no: { $regex: search, $options: 'i' } },
                        { unit_no: { $regex: search, $options: 'i' } },
                        { tower_no: { $regex: search, $options: 'i' } },
                        { location: { $regex: search, $options: 'i' } },
                        { area: { $regex: search, $options: 'i' } },
                        { dimension: { $regex: search, $options: 'i' } },
                        { facing: { $regex: search, $options: 'i' } },
                        { demand: { $regex: search, $options: 'i' } },
                        { landing_amount: { $regex: search, $options: 'i' } },
                        { tenant: { $regex: search, $options: 'i' } },
                        
                    ]
                }),
                ...(leadType && leadType !== 'all' && {
                    $or: [
                        { inventoryType: { $regex: leadType, $options: 'i' } },// Match leadType in Query


                    ]
                })
            }
        },
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
        {
            $lookup: {
                from: "remarks",
                localField: "remarks",
                foreignField: "_id",
                as: "remarksDetails"
            }
        },
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
                __v: 1
            }
        }]
        const fields_ = await inventoryModel.aggregate(filters).skip((Number(page) - 1) * Number(limit)  || 0).limit(Number(limit) || 0);
        const count = (await inventoryModel.aggregate(filters)).length;

        return HandleResponse({ type: "SUCCESS", message: "Get All Inventory", data: { fields_,count } })
    }
    catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}


export async function PATCH(req: Request) {
    try {
        const form = await req.formData();

        let FilesDetails: File[] = [];
        let UploadFiles: UploadResponse[] = [];

        // Collect files from the form data
        form.forEach((value, key) => {
            if (value instanceof File) {
                FilesDetails.push(value);
            }
        });

        if (FilesDetails.length > 0) {
            await Promise.all(FilesDetails.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const upload = await imagekit.upload({
                    file: buffer,
                    fileName: file.name,
                });

                UploadFiles.push(upload);
            }));
        }

        return HandleResponse({ type: "SUCCESS", data: { UploadFiles } });
    } catch (error: any) {
        console.error('Error handling PATCH request:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'An unexpected error occurred.',
        });
    }
}
export async function DELETE(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const termsId = searchParams.get('id');
        if (!termsId) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Inventory ID is required."
            });
        }
        const result = await inventoryModel.findByIdAndDelete(termsId)
        return HandleResponse({
            type: "SUCCESS",
            message: "Inventory deleted successfully.",
            data: result
        });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to delete inventory."
        });
    }
}
