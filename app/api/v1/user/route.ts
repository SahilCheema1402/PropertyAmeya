import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import User from './../../../_model/user/user.model';
import Company from './../../../_model/Companay/company.model';
import LeadFields from './../../../_model/LeadModel/Field.model';
// import { NextApiRequest,NextApiResponse } from 'next';

/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: Operations related to user management
 * 
 * /api/v1/user:
 *   post:
 *     tags:
 *       - User Management
 *     description: Create a user as admin or staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User added successfully!
 *       400:
 *         description: Bad request
 */
export async function POST(req: Request) {
    try {
        DB();
        const body = await req.json();
        const company = await Company.create({...body});
        const user = new User({
            ...body,
            company:company._id
        });
        const fields_ = new LeadFields({
            fields:[{
                name:"services",
                header:"Services",
                type_:"dropdown",
                dropdown:[]
            }],
            user: user?._id,
            company:company?._id
        })
        await fields_.save();
        await user.save();
        return HandleResponse({
            type: "SUCCESS",
            message: "User Created successfully",
        })
    } catch (error:any) {
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
      const _id = searchParams.get('id');
      // Find lists by companyId
      const user = await User.find({company:_id}).select('userName');
  
      return HandleResponse({
        type: "SUCCESS",
        message: "Users retrieved successfully.",
        data: user,
      });
    } catch (error) {
      console.error(error);
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "An error occurred while retrieving users. Please try again."
      });
    }
}
export async function PATCH(req: any, res: any) {
    try {
      await DB();
      const body = await req.json();
      
        if (body.action !== 'enable' &&body.action !== 'disable') {
            return HandleResponse({
              type: "BAD_REQUEST",
              message: "Invalid action"
            });
        }

        const user = await User.findById(body.userId);
        if (!user) {
            return HandleResponse({
              type: "BAD_REQUEST",
              message: "User not found"
            });
        }

        user.isActive = body.action === 'enable';
        await user.save();
  
      return HandleResponse({
        type: "SUCCESS",
        message: "Users disabled successfully.",
        data: "",
      });
    } catch (error) {
      console.error(error);
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "An error occurred while retrieving users. Please try again."
      });
    }
}
 


