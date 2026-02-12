import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import User from './../../../_model/user/user.model';
import Fields from './../../../_model/LeadModel/Field.model';
import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';
// import { SignJWT } from 'jose';
/**
 * @swagger
 * tags:
 *   - name: Leads
 *     description: Operations related to Leads
 *
 * /api/v1/leadfield:
 *   post:
 *     tags:
 *       - Leads
 *     description: Leads Fields CRUD's
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/leadField'
 *     responses:
 *       200:
 *         description: successfully!
 *       400:
 *         description: Bad request
 */
export async function POST(req: Request) {
    try {
        DB();
        const fields = await req.json();
        const user:any = JSON.parse(req.headers.get('user') as string);
        const  { _id} = fields;
        if(!fields){
            return HandleResponse({type:"BAD_REQUEST",message:"Fields is missing"})
        }
        if(_id){
            const fields_ = await Fields.findByIdAndUpdate(_id,{
                $push:{fields:fields}
            },{new:true})
            return HandleResponse({type:"SUCCESS",message:"Fields Updated Successfully"})
        }else{
            const fields_ = new Fields({
                fields:[fields],
                user: user?._id,
                company:user?.company?._id
            })
            await fields_.save();
            return HandleResponse({type:"SUCCESS",message:"Fields Created Successfully"})
        }
    } catch (error:any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}
/**
 * @swagger
 * tags:
 *   - name: Leads
 *     description: Operations related to Leads
 *
 * /api/v1/leadfield:
 *   put:
 *     tags:
 *       - Leads
 *     description: Leads Fields CRUD's
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/leadField'
 *     responses:
 *       200:
 *         description: successfully!
 *       400:
 *         description: Bad request
 */
export async function PUT(req: Request) {
    try {
        DB();
        const {fields,_id} = await req.json();
        if(!fields){
            return HandleResponse({type:"BAD_REQUEST",message:"Fields is missing"})
        }
        if(!_id){
            return HandleResponse({type:"BAD_REQUEST",message:"Fields _id is missing"})
        }
        await Fields.findByIdAndUpdate(_id,{
            fields
        },{new:true})
        return HandleResponse({type:"SUCCESS",message:"Fields Updated Successfully"})
    } catch (error:any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}
/**
 * @swagger
 * tags:
 *   - name: Leads
 *     description: Operations related to Leads
 *
 * /api/v1/leadfield:
 *   get:
 *     tags:
 *       - Leads
 *     description: Leads Fields CRUD's
 *     responses:
 *       200:
 *         description: successfully!
 *       400:
 *         description: Bad request
 */
export async function GET(req: Request) {
    try {
        DB();
        const user:any = JSON.parse(req.headers.get('user') as string);
        const fields_ = await Fields.findOne({user:user?._id}).lean();
        return HandleResponse({type:"SUCCESS",message:"",data:{fields_}})
    } catch (error:any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}


/**
 * Uses MongoDB aggregation to filter fields for a specified company where the 'filter' attribute is true.

 */
export async function DELETE(req: Request) {
    try {
//         const user: any = JSON.parse(req.headers.get('user') as string);
        const results = await Fields.aggregate([

            // { $match: { company: new mongoose.Types.ObjectId(user?.company?._id) } },

            // Unwind the fields array to process each element
            { $unwind: "$fields" },
            { $match: { "fields.filter": true } },
            {
                $group: {
                    _id: "$_id",
                    fields: { $push: "$fields" }
                }
            }
        ]);
        if (results.length === 0) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "No matching company found or no fields available."
            })

        }
        return HandleResponse({type:"SUCCESS",message:"",data:results[0].fields})
    } catch (error:any) {
        console.error('Error in aggregation:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}
