import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import terms_conditionsModel from '@app/_model/TermsAndConditions/terms_conditions.model';
import employeetermsconditinsModel from '@app/_model/EmployeeTermsAndConditons/employeetermsconditins.model';
import userModel from '@app/_model/user/user.model';
import { map } from 'p-iteration';
import { Notification_Create } from '../notification/notificationUtils';
import mongoose, { FilterQuery, PipelineStage, Schema } from 'mongoose';
import { DateTime } from 'luxon';
import nodemailer from 'nodemailer'
const transporter = nodemailer.createTransport({
service:'gmail',          
  auth: {
    user: 'property360noida@gmail.com',
    pass: 'panm kqtg ugan mcza',
  },

});
// admin to create terms and conditions.
export async function POST(req: Request) {
    try {
        await DB();
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        const { content } = body
        if (!content) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Terms content is required."
            });
        }
        if (body.type_ === 'update') {
            if (body._id !== 'undefined' && body._id) {
                const Project = await terms_conditionsModel.findByIdAndUpdate(
                    body._id,
                    {
                        content,
                        updateAt: DateTime.now().setZone('Asia/Kolkata')
                    },
                    { new: true }
                );
                return HandleResponse({ type: "SUCCESS", message: "Terms and Conditions  Updated Successfully" })
            }
            else {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: `_ is required.`,
                })

            }
        }
        if (body.type_ === 'add') {
            // Save terms and conditions to database
            const result = await terms_conditionsModel.create({
                content: content,
                createdBy: user._id,
                createAt:  DateTime.now().setZone('Asia/Kolkata'),
                updateAt:  DateTime.now().setZone('Asia/Kolkata')
            });
            return HandleResponse({
                type: "SUCCESS",
                message: "Terms and Conditions created successfully.",
                data: result
            });
        }
    } catch (error: any) {
        console.error("Error creating terms and conditions:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to create terms and conditions."
        });
    }
}
// admin to update existing terms and conditions.
export async function PUT(req: Request) {
    try {
        const { termsContent, termsId } = await req.json();
        if (!termsContent || !termsId) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Terms content and terms ID are required."
            });
        }

        const db = await DB();

        // Update the terms content based on the provided terms ID
        const result = await terms_conditionsModel.findByIdAndUpdate(
            { _id: termsId },
            { $set: { content: termsContent, updateAt:  DateTime.now().setZone('Asia/Kolkata')} }
        );

        return HandleResponse({
            type: "SUCCESS",
            message: "Terms and Conditions updated successfully.",
            data: result
        });
    } catch (error: any) {
        console.error("Error updating terms and conditions:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to update terms and conditions."
        });
    }
}
// the admin to delete existing terms and conditions.
export async function DELETE(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const termsId = searchParams.get('id');
        if (!termsId) {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Terms ID is required."
            });
        }
        // Delete the terms from the database
        const result = await terms_conditionsModel.findByIdAndDelete(termsId)

        await employeetermsconditinsModel.deleteMany({});
        return HandleResponse({
            type: "SUCCESS",
            message: "Terms and Conditions deleted successfully.",
            data: result
        });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to delete terms and conditions."
        });
    }
}
// allow the employee to view the most recent terms and conditions.
export async function GET(req: Request) {
    try {
        await DB(); // Get database connection

        // Fetch the most recent terms and conditions
        const terms = await terms_conditionsModel.find({})

        return HandleResponse({
            type: "SUCCESS",
            message: "Terms and Conditions retrieved successfully.",
            data: terms
        });
    } catch (error: any) {
        console.error("Error fetching terms and conditions:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to retrieve terms and conditions."
        });
    }
}

// Once the employee accepts the terms, we store that they’ve accepted and send an email notification.
export async function PATCH(req: Request) {
    try {
        await DB();
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        const employeeTerms = await employeetermsconditinsModel.create({ name: user.userName, email: user.email, readBy: user._id, acceptedTerms: true, termsAcceptedAt:  DateTime.now().setZone('Asia/Kolkata'), });
        const staffMsg = {
            to: user.email,
            from: "property360noida@gmail.com",
            subject: 'Terms and Conditions Accepted',
            text: `Hello ${user.userName}\n\nYou have successfully accepted the terms and conditions.\n\n${body.termsContent}`
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(staffMsg, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });

        const admin: any[] = await userModel.find({ $or: [{ role: 1 }, { role: 2 }] }).lean();

        if (admin.length > 0) {
            const adminIds: any = admin.map(admin => admin.email);

            await map(adminIds, async (email) => {
           
                const msg: any = {
                    to: [email as string],
                    from: "property360noida@gmail.com",
                    subject: `${user.userName} Employee Accepted Terms and Conditions`,
                    text: `${user.userName} has accepted the terms and conditions.\n\n${body.termsContent}`
                };
                 await new Promise((resolve, reject) => {
                    transporter.sendMail(msg, (error, info) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(info);
                        }
                    });
                })
            })

        }
        if (admin.length > 0) {
            const adminIds = admin.map(admin => admin._id);
            await map(adminIds, async (id) => {
                await Notification_Create(
                    id,
                    `Terms and Conditions Accepted`,
                    `${user.userName} has agreed to and accepted the terms and conditions.`
                );
            })
          
        }
        await Notification_Create(
            user._id,
            `Terms and Conditions Accepted`,
            `Congratulations, ${user.userName}! You have successfully accepted the terms and conditions.`
        );

        return HandleResponse({
            type: "SUCCESS",
            message: "Terms and Conditions accepted and emails sent."
        });
    } catch (error: any) {
        console.error("Error accepting terms and conditions:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to accept terms and conditions."
        });
    }
}

export async function OPTIONS(req: Request) {
    try {
        await DB();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (user.role !=1&& user.role != 2) {
            const data = await employeetermsconditinsModel.find({ readBy:   new mongoose.Types.ObjectId(user._id) });
            if (data.length>0) {
                return HandleResponse({
                    type: "SUCCESS",
                    message: "You have already accepted the terms and conditions.",
                    data: data
                });
            }
            return HandleResponse({
                type: "SUCCESS",
                message: "You have not accepted terms and conditions.",
                data: data
            });
        }
        else {
            return HandleResponse({
                type: "SUCCESS",
                message: "Your are  an Admin"
            });
        }

    } catch (error: any) {
        console.error("Error accepting terms and conditions:", error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "Failed to accept terms and conditions."
        });
    }
}









