import DB from './../../../_Database/db';
import HandleResponse from './../../../_utils/response';
import LeadScore from './../../../_model/LeadScore/leadScore.model';
import mongoose from 'mongoose';
import Lead from './../../../_model/LeadModel/lead.model';
import { log } from 'console';

/**
 * @swagger
 * tags:
 *   - name: LeadsScore
 *     description: Operations related to Leads
 *
 * /api/v1/leadScore:
 *   post:
 *     tags:
 *       - Leads
 *     description: Leads Score Fields CRUD's
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
        const { id, service, ...content }: any = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "id is missing" })
        }

        const leadScore = await LeadScore.findOne({ lead: new mongoose.Types.ObjectId(id), service })

        if (leadScore) {
            content?.email ? leadScore.emails = content.email : "";
            content?.linkdin ? leadScore.linkdin = content.linkdin : "";
            content?.instagram ? leadScore.instagram = content.instagram : "";
            content?.facebook ? leadScore.facebook = content.facebook : "";
            await leadScore.save()
        } else {
            let obj: any = {};
            content?.email ? obj.emails = content.email : "";
            content?.linkdin ? obj.linkdin = content.linkdin : "";
            content?.instagram ? obj.instagram = content.instagram : "";
            content?.facebook ? obj.facebook = content.facebook : "";
            const lead = new LeadScore({
                lead: id,
                ...obj,
                service
            })
            await lead.save()
        }
        return HandleResponse({ type: "SUCCESS", message: "Score Created Successfully" })
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}
export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const _id = searchParams.get('id');
        const service = searchParams.get('service');
        if (!_id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "id is missing" })
        }

        const leadScore = await LeadScore.findOne({ lead: new mongoose.Types.ObjectId(_id), service })

        return HandleResponse({ type: "SUCCESS", message: "", data: { leadScore } })
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}

export async function PATCH(req: Request) {
    try {
        await DB();

        const { searchParams } = new URL(req.url);
        const leadId = searchParams.get('id');
        const body = await req.json();

        // Validate 'leadId' and 'userId' (now coming as AiScore)
        if (!leadId || !body.userId) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Lead ID and userId (AiScore) are required",
            });
        }

        const { service, userId } = body.userId;

    
        if (!service || !userId) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Both service and type are required in AiScore",
            });
        }


        const result = await LeadScore.findOneAndUpdate(
            { 
                lead: new mongoose.Types.ObjectId(leadId), 
                service: service 
            }, 
            { $set: { type: userId } }, 
            { new: true, runValidators: true } 
        );

  
        if (!result) {
            return HandleResponse({
                type: "NOT_FOUND",
                message: "Lead with the specified ID and service not found",
            });
        }
        return HandleResponse({
            type: "SUCCESS",
            message: "Lead Score updated successfully",
            data: result,
        });

    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error.message
        });
    }
}


export async function DELETE(req: Request) {
    try {
        await DB();
        const user: any = JSON.parse(req.headers.get('user') as string);

        if (!user || !user._id || !user.company?._id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "User information is missing" });
        }

        const leads = await Lead.find({ company: new mongoose.Types.ObjectId(user.company?._id) });

        const leadIds = leads.map((lead) => lead._id);


        const leadScores = await LeadScore.find({ lead: { $in: leadIds } });

        if (!leadScores || leadScores.length === 0) {
            return HandleResponse({
                type: "NOT_FOUND",
                message: "No LeadScore documents found for the given company ID",
            });
        }

        // Manually merge lead scores with related lead data
        const combinedData = leadScores?.map((score) => {
            const relatedLead = leads.find((lead) => lead._id.toString() === score.lead.toString());
            return {
                ...score.toObject(), 
                lead: relatedLead ? relatedLead.toObject() : null, 
            };
        });

        // Return the combined data
        return HandleResponse({
            type: "SUCCESS",
            message: "LeadScore documents found",
            data: combinedData
        });

    } catch (error: any) {
        console.error("Error fetching LeadScore:", error);

        // Handle errors
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error.message,
        });
    }
}


