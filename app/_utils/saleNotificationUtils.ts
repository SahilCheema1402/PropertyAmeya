// utils/saleNotificationUtils.ts
import SaleNotification from "@app/_model/SalesNotification/salenotification";
import { Notification_Create } from "@app/api/v1/notification/notificationUtils";
import userModel from "@app/_model/user/user.model";
import mongoose, { Types } from "mongoose";
import { DateTime } from "luxon";

export async function createSaleNotification(lead: any, userId: string, clientName: string, project: string, leadType: string) {
    try {
        console.log("Creating sale notification for lead:", lead?._id, "by user:", userId);
        const user = await userModel.findById(userId);
        if (!user) throw new Error("User not found");

        const saleDate = DateTime.now().setZone('Asia/Kolkata');
        const message = `Congratulations! ${user.userName} has made a ${leadType} sale for ${project}`;

        // Create the sale notification
        const saleNotification = new SaleNotification({
            userId: user._id,
            userName: user.userName,
            leadId: lead?._id ? new mongoose.Types.ObjectId(lead._id) : new mongoose.Types.ObjectId(),
            clientName: lead?.name || clientName,
            project,
            leadType,
            saleDate: saleDate.toJSDate(),
            message,
            daysAgo: 0,
            isCongratulatory: true
        });

        await saleNotification.save();

        // Get all employees from the same company
        const allEmployees = await userModel.find({ 
            company: user.company,
            _id: { $ne: user._id } // Exclude the user who made the sale
        }).lean();
        
        const employeeIds = allEmployees.map(emp => String(emp._id));

        // Notify all other employees about the sale
        if (employeeIds.length > 0) {
            await Notification_Create(
                employeeIds,
                "New Sale Alert! 🎉",
                `${user.userName} just made a ${leadType} sale for ${project}!`
            );
        }

        // Notify the user who made the sale
        await Notification_Create(
            [String(user._id)],
            "Congratulations on your sale! 🎉",
            `You successfully completed a ${leadType} deal for ${project}!`
        );

        return saleNotification;
    } catch (error) {
        console.error("Error creating sale notification:", error);
        throw error;
    }
}

export async function updateSaleNotifications() {
    try {
        const now = DateTime.now().setZone('Asia/Kolkata');
        
        // Update all sale notifications to calculate days ago
        const saleNotifications = await SaleNotification.find({
            saleDate: { $exists: true }
        }).lean();

        for (const notification of saleNotifications) {
            const saleDate = DateTime.fromJSDate(notification.saleDate);
            const daysAgo = now.diff(saleDate, 'days').days;

            // Update days ago
            await SaleNotification.updateOne(
                { _id: notification._id },
                { $set: { daysAgo: Math.floor(daysAgo) } }
            );

            // Keep congratulatory status for 7 days instead of 1 day
            if (daysAgo >= 7 && notification.isCongratulatory) {
                await SaleNotification.updateOne(
                    { _id: notification._id },
                    { $set: { isCongratulatory: false } }
                );
            }
        }

        // Clean up old notifications (older than 30 days) to keep database lean
        const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();
        await SaleNotification.deleteMany({
            saleDate: { $lt: thirtyDaysAgo },
            isCongratulatory: false
        });

        console.log("Sale notifications updated successfully");
    } catch (error) {
        console.error("Error updating sale notifications:", error);
        throw error;
    }
}

// Helper function to get personalized banner messages
export function generateBannerMessage(notification: any, isCurrentUser: boolean = false) {
    const congratulatoryMessages = [
        'woohoo! 🎉',
        'cheers! 🥳', 
        'amazing! ✨',
        'fantastic! 🌟',
        'excellent! 👏',
        'brilliant! 💫',
        'outstanding! 🏆',
        'superb! 🎊'
    ];

    if (isCurrentUser) {
        if (notification.isNoSaleMessage) {
            return notification.message;
        }
        return `You made a sale ${notification.timeAgo}! 🎉`;
    } else {
        const randomMessage = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)];
        return `${notification.userName.toUpperCase()} made a sale ${notification.timeAgo}, ${randomMessage}`;
    }
}