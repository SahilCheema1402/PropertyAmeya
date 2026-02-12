import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY! || "public_PU0gdYD1LhtXpEqjtMIZzOGFEmQ=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY! || "private_JnnPIKCIbLFZIxpIzToORKoTe60=",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT! || "https://ik.imagekit.io/xdpr8on7w",
});
import mongoose, { PipelineStage } from 'mongoose';

export async function GET(req: Request) {
    try {
        DB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const page = searchParams.get('page');
        const limit = searchParams.get('limit');
        const user: any = JSON.parse(req.headers.get('user') as string);

        let filters: PipelineStage[] = [
            {
                $match: {
                    company: new mongoose.Types.ObjectId(user?.company?._id),
                    leadStatus: "deal-done",
                    ...(user.role !== 1 && user.role !== 2
                        ? { assign: new mongoose.Types.ObjectId(user?._id) }
                        : {})
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
                    ...(search && {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { phone: { $regex: search, $options: 'i' } },
                            { email: { $regex: search, $options: 'i' } },
                            { address: { $regex: search, $options: 'i' } },
                            { source: { $regex: search, $options: 'i' } },
                            { "queryDetails.name": { $regex: search, $options: 'i' } },
                            { "queryDetails.phone": { $regex: search, $options: 'i' } },
                            { "queryDetails.email": { $regex: search, $options: 'i' } },
                            { "queryDetails.project": { $regex: search, $options: 'i' } },
                            { "queryDetails.budget": { $regex: search, $options: 'i' } },
                            { "queryDetails.leadType": { $regex: search, $options: 'i' } },
                            { "queryDetails.status": { $regex: search, $options: 'i' } },
                            { "queryDetails.bhk": { $regex: search, $options: 'i' } },
                            { "queryDetails.floor": { $regex: search, $options: 'i' } },
                        ]
                    }),
                }
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
                    assign: { $first: "$assign" }, // include assign in response
                    __v: { $first: "$__v" }
                }
            }
        ];

        const fields_ = await Lead.aggregate(filters)
            .skip((Number(page) - 1) * Number(limit) || 0)
            .limit(Number(limit) || 0);

        const count = (await Lead.aggregate(filters)).length;

        return HandleResponse({
            type: "SUCCESS",
            message: "",
            data: { fields_, count }
        });

    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}


