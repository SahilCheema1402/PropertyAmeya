// api/v1/saleNotification/route.ts
import { NextRequest } from "next/server";
import HandleResponse from "@app/_utils/response";
import DB from "@app/_Database/db";
import SaleNotification from "@app/_model/SalesNotification/salenotification";
import userModel from "@app/_model/user/user.model";
import LeadModel from "@app/_model/LeadModel/lead.model";
import { DateTime } from "luxon";
import { ILead } from "@app/_interface/leadField.interface";

export async function GET(req: NextRequest) {
    try {
        DB();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!user) {
            return HandleResponse({ type: "UNAUTHORIZED", message: "User not authenticated" });
        }

        const now = DateTime.now().setZone('Asia/Kolkata');
        const oneWeekAgo = now.minus({ days: 7 });
        const thirtyDaysAgo = now.minus({ days: 30 });

        // Check if user is admin (add your admin role numbers here)
        // const isAdmin = [1, 2, 3, 4, 5, 6, 7, 31].includes(user.role);
        const isAdmin = [1, 2 ].includes(user.role);

        // Get all users from the same company (excluding current user unless admin)
        const companyUsersQuery: any = { company: user.company , isActive: true  };
        if (!isAdmin) {
            companyUsersQuery._id = { $ne: user._id };
        }

        const companyUsers = await userModel.find(companyUsersQuery).lean();

        // Get sales from other employees within the last week
        const othersSales = await SaleNotification.find({
            userId: { $in: companyUsers.map(u => u._id) },
            saleDate: { $gte: oneWeekAgo.toJSDate() }
        })
            .sort({ saleDate: -1 })
            .lean();

        // Get current user's latest sale (even if admin)
        const lastDeal = await LeadModel.findOne<ILead>({
            createdBy: user._id,
            leadStatus: 'deal-done'
        })
            .sort({ deal_done_date: -1 })
            .lean();

        const userLatestSale = lastDeal?.deal_done_date || null;

        const notifications = [];

        // Process current user's sales (same logic as before)
        if (userLatestSale) {
            const userSaleDate = DateTime.fromJSDate(userLatestSale.saleDate);
            const daysSinceUserSale = Math.floor(now.diff(userSaleDate, 'days').days);
            const hoursSinceUserSale = Math.floor(now.diff(userSaleDate, 'hours').hours);

            if (daysSinceUserSale < 7) {
                let timeAgo = getTimeAgoString(daysSinceUserSale, hoursSinceUserSale);
                notifications.push({
                    ...userLatestSale,
                    timeAgo,
                    isCongratulatory: true,
                    isOwnSale: true,
                    message: `You made a sale ${timeAgo}! 🎉`
                });
            } else {
                notifications.push(createNoSaleNotification(user, userLatestSale, true));
            }
        } else {
            notifications.push(createNoSaleNotification(user, null, true));
        }

        // Process other employees' sales with admin-specific additions
        // In the GET function where you process othersSales:
const processedOthersSales = othersSales.map(sale => {
    const saleDate = DateTime.fromJSDate(sale.saleDate);
    const daysSinceSale = Math.floor(now.diff(saleDate, 'days').days);
    const hoursSinceSale = Math.floor(now.diff(saleDate, 'hours').hours);

    const timeAgo = getTimeAgoString(daysSinceSale, hoursSinceSale);
    const randomMessage = getRandomCongratulatoryMessage();

    return {
        ...sale,
        timeAgo,
        isCongratulatory: true,  // This marks it as a positive notification
        isOwnSale: false,
        isNoSaleMessage: false,   // Explicitly set this
        message: `${sale.userName.toUpperCase()} made a sale ${timeAgo}, ${randomMessage}`
    };
});

        // For admin: Add "no sales" notifications for other staff members
        if (isAdmin) {
            for (const staff of companyUsers) {
                if (staff._id.toString() === user._id) continue; // Skip self

                const hasRecentSale = othersSales.some(s => s.userId.toString() === staff._id.toString());
                if (!hasRecentSale) {
                    const lastDeal = await LeadModel.findOne<ILead>({
                        createdBy: staff._id,
                        leadStatus: 'deal-done'
                    })
                        .sort({ deal_done_date: -1 })
                        .lean();

                    const lastSale = lastDeal?.deal_done_date || null;

                    if (lastSale) {
                        const daysSinceSale = Math.floor(now.diff(DateTime.fromJSDate(lastSale.saleDate), 'days').days);
                        notifications.push(createNoSaleNotification(staff, lastSale, false));
                    } else {
                        notifications.push(createNoSaleNotification(staff, null, false));
                    }
                }
            }
        }

        // Sort notifications: own sale first, then others by most recent
        const sortedNotifications = [
            ...notifications.filter(n => n.isOwnSale),
            ...processedOthersSales,
            ...notifications.filter(n => !n.isOwnSale && n.isNoSaleMessage) // Add admin's "no sale" notifications at the end
        ].slice(0, 15); // Slightly increased limit for admin view

        return HandleResponse({
            type: "SUCCESS",
            message: "Sales notifications fetched successfully",
            data: {
                notifications: sortedNotifications
            }
        });

    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to fetch sales notifications"
        });
    }
}

function createNoSaleNotification(
    user: any,
    lastDealDate: Date | null,
    isOwnSale: boolean
) {
    const now = DateTime.now().setZone('Asia/Kolkata');
    let message: string;
    let isCongratulatory = false;
    let isNoSaleMessage = true;

    if (lastDealDate) {
        const saleDate = DateTime.fromJSDate(lastDealDate);
        const daysSince = Math.floor(now.diff(saleDate, 'days').days);

        if (daysSince <= 7) {
            // Recent sale (within 7 days)
            isCongratulatory = true;
            isNoSaleMessage = false;
            
            const timeAgo = getTimeAgoString(daysSince, Math.floor(now.diff(saleDate, 'hours').hours));
            const randomMessage = getRandomCongratulatoryMessage();
            
            message = isOwnSale
                ? `You made a sale ${timeAgo}! ${randomMessage}`
                : `${user.userName.toUpperCase()} made a sale ${timeAgo}, ${randomMessage}`;
        } else {
            // Old sale (8+ days)
            const formatted = saleDate.toLocaleString(DateTime.DATE_FULL);
            message = isOwnSale
                ? `⚠️ You haven't made any sale since ${formatted} (${daysSince} day${daysSince !== 1 ? 's' : ''} ago)`
                : `⚠️ ${user.userName.toUpperCase()} hasn't made any sale since ${formatted} (${daysSince} day${daysSince !== 1 ? 's' : ''} ago)`;
        }
    } else {
        // No sales ever
        message = isOwnSale
            ? "⚠️ You haven't made any sales yet"
            : `⚠️ ${user.userName.toUpperCase()} hasn't made any sales yet`;
    }

    return {
        _id: `no-sale-${user._id}`,
        userId: user._id,
        userName: user.userName,
        isCongratulatory,
        isOwnSale,
        isNoSaleMessage,
        message
    };
}

// Helper function (should be defined elsewhere in your code)
function getTimeAgoString(days: number, hours: number): string {
    if (days === 0) {
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    if (days === 1) return 'yesterday';
    return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Helper function (should be defined elsewhere in your code)
function getRandomCongratulatoryMessage() {
    const messages = [
        'woohoo! 🎉',
        'cheers! 🥳',
        'amazing! ✨',
        'fantastic! 🌟',
        'excellent! 👏',
        'brilliant! 💫'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}