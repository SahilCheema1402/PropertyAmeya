import DB from './../../../_Database/db';
import { NextApiRequest, NextApiResponse } from 'next';
import HandleResponse from './../../../_utils/response';
// import mongoose from 'mongoose';
import { Lead, Company, User, Query } from "./../../../_const/const";
import mongoose, { Schema, model, models } from "mongoose";
import UserModel from './../../../_model/user/user.model'
import WhatsAppTemplate from './../../../_model/WhatsAppTemplate/WhatsAppTemplate.model';

// GET - Fetch template for company
export async function GET(req: Request) {
    try {
        await DB();
        
        const user: any = JSON.parse(req.headers.get('user') as string);
        
        if (!user?._id || !user?.company?._id) {
            return HandleResponse({ 
                type: "UNAUTHORIZED", 
                message: "Invalid user information! Please Login Again" 
            });
        }

        const companyId = new mongoose.Types.ObjectId(user.company._id);

        // Find template for the company
        let template = await WhatsAppTemplate.findOne({ companyId })
            .populate('lastUpdatedBy', 'userName email')
            .lean();

        // If no template exists, create default one
        if (!template) {
            const defaultTemplate = new WhatsAppTemplate({
                companyId,
                lastUpdatedBy: user._id,
                template: `*Dear {clientName},*

*Greetings from Property 360 Degree Pvt Ltd!!*

We are pleased to share exclusive commercial investment opportunities at *Noida* now with a *Buyback Guarantee* ensuring complete investment security and strong appreciation potential.

🏢 *Civitech Santoni* – Corporate Suites, Sector 16B
✨ 1st Time in NCR – Corporate Suites with Swimming Pool & Club Facility

📍 Prime Location – Adjacent to Data Center Hub

✔ High Demand • Strong Business Growth

💼 *Fully Furnished Corporate Suites*
*1st transfer free

📈 *Buyback Guarantee*

Book your Corporate Suite today!

Kindly call back at your convenience for more details.

*Regards,*
{userName}
{designation}
Property 360 Degree Pvt Ltd`
            });
            
            await defaultTemplate.save();
            template = await WhatsAppTemplate.findById(defaultTemplate._id)
                .populate('lastUpdatedBy', 'userName email')
                .lean();
        }

        return HandleResponse({ 
            type: "SUCCESS", 
            message: "Template fetched successfully",
            data: template 
        });

    } catch (error: any) {
        console.error('Error fetching WhatsApp template:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'Failed to fetch template'
        });
    }
}

// PUT - Update template
export async function PUT(req: Request) {
    try {
        await DB();
        
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);

        if (!user?._id || !user?.company?._id) {
            return HandleResponse({ 
                type: "UNAUTHORIZED", 
                message: "Invalid user information! Please Login Again" 
            });
        }

        // Check if user has permission (role 1, 2, or 31)
        if (user.role !== 1 && user.role !== 2 && user.role !== 31) {
            return HandleResponse({ 
                type: "FORBIDDEN", 
                message: "You don't have permission to update the template" 
            });
        }

        const { template } = body;

        if (!template || typeof template !== 'string') {
            return HandleResponse({ 
                type: "BAD_REQUEST", 
                message: "Template content is required" 
            });
        }

        const companyId = new mongoose.Types.ObjectId(user.company._id);

        // Update or create template
        const updatedTemplate = await WhatsAppTemplate.findOneAndUpdate(
            { companyId },
            {
                template,
                lastUpdatedBy: user._id,
                lastUpdatedAt: new Date()
            },
            { 
                new: true, 
                upsert: true,
                runValidators: true
            }
        ).populate('lastUpdatedBy', 'userName email');

        return HandleResponse({ 
            type: "SUCCESS", 
            message: "Template updated successfully",
            data: updatedTemplate 
        });

    } catch (error: any) {
        console.error('Error updating WhatsApp template:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'Failed to update template'
        });
    }
}

// POST - Reset to default template
export async function POST(req: Request) {
    try {
        await DB();
        
        const user: any = JSON.parse(req.headers.get('user') as string);

        if (!user?._id || !user?.company?._id) {
            return HandleResponse({ 
                type: "UNAUTHORIZED", 
                message: "Invalid user information! Please Login Again" 
            });
        }

        // Check if user has permission (role 1, 2, or 31)
        if (user.role !== 1 && user.role !== 2 && user.role !== 31) {
            return HandleResponse({ 
                type: "FORBIDDEN", 
                message: "You don't have permission to reset the template" 
            });
        }

        const companyId = new mongoose.Types.ObjectId(user.company._id);

        const defaultTemplate = `*Dear {clientName},*

*Greetings from Property 360 Degree Pvt Ltd!!*

We are pleased to share exclusive commercial investment opportunities at *Noida* now with a *Buyback Guarantee* ensuring complete investment security and strong appreciation potential.

🏢 *Civitech Santoni* – Corporate Suites, Sector 16B
✨ 1st Time in NCR – Corporate Suites with Swimming Pool & Club Facility

📍 Prime Location – Adjacent to Data Center Hub

✔ High Demand • Strong Business Growth

💼 *Fully Furnished Corporate Suites*
*1st transfer free

📈 *Buyback Guarantee*

Book your Corporate Suite today!

Kindly call back at your convenience for more details.

*Regards,*
{userName}
{designation}
Property 360 Degree Pvt Ltd`;

        // Reset to default template
        const updatedTemplate = await WhatsAppTemplate.findOneAndUpdate(
            { companyId },
            {
                template: defaultTemplate,
                lastUpdatedBy: user._id,
                lastUpdatedAt: new Date()
            },
            { 
                new: true, 
                upsert: true 
            }
        ).populate('lastUpdatedBy', 'userName email');

        return HandleResponse({ 
            type: "SUCCESS", 
            message: "Template reset to default successfully",
            data: updatedTemplate 
        });

    } catch (error: any) {
        console.error('Error resetting WhatsApp template:', error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || 'Failed to reset template'
        });
    }
}