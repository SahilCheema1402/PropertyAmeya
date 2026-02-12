import ErrorLog from "@app/_utils/ErrorLog";
import DB from '@app/_Database/db';
import HandleResponse from "@app/_utils/response";
import notificationModel from "@app/_model/Notification/notification";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        DB();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!user) {
            return HandleResponse({ type: "BAD_REQUEST", message: "UnAuthoritation for Getting Notifications" })
        }

        // Get pagination parameters from URL
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20'); // Default 20 per page
        const skip = (page - 1) * limit;

        // Get notifications with pagination and only essential fields
        const notifications = await notificationModel
            .find({ 
                $and: [
                    { createFor: { $in: [user?._id] } }, 
                    { read: { $nin: [user?._id] } }
                ] 
            })
            .select('title description createAt createFor read') // Only select needed fields
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count for pagination info (using countDocuments for better performance)
        const totalCount = await notificationModel.countDocuments({ 
            $and: [
                { createFor: { $in: [user?._id] } }, 
                { read: { $nin: [user?._id] } }
            ] 
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        return HandleResponse({ 
            type: "SUCCESS", 
            message: "", 
            data: { 
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasMore,
                    limit
                }
            } 
        });
    } catch (error: any) {
        await ErrorLog('GET Notifications', error)
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}

export async function PUT(req: NextRequest) {
    try {
        DB();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!user) {
            return HandleResponse({ type: "BAD_REQUEST", message: "UnAuthoritation for Getting Notifications" })
        }

        // Get pagination parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Get archived notifications with pagination
        const notifications = await notificationModel
            .find({ 
                $and: [
                    { createFor: { $in: [user?._id] } }, 
                    { read: { $in: [user?._id] } }
                ] 
            })
            .select('title description createAt createFor read')
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalCount = await notificationModel.countDocuments({ 
            $and: [
                { createFor: { $in: [user?._id] } }, 
                { read: { $in: [user?._id] } }
            ] 
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        return HandleResponse({ 
            type: "SUCCESS", 
            message: "", 
            data: { 
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasMore,
                    limit
                }
            } 
        });
    } catch (error: any) {
        await ErrorLog('GET Archived Notifications', error)
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}

export async function POST(req: NextRequest) {
    try {
        DB();
        const user: any = JSON.parse(req.headers.get('user') as string);
        const body = await req.json();
        
        await notificationModel.findByIdAndUpdate(body?.id, {
            $push: { read: user?._id }
        });
        
        return HandleResponse({ type: "SUCCESS", message: "notification has been marked read successfully." })
    } catch (error: any) {
        await ErrorLog('POST Notification', error)
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}