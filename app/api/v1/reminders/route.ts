import DB from './../../../_Database/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';
const moment = require('moment-timezone');
import RemindersModel from './../../../_model/Reminders/reminders.model';
import HandleResponse from './../../../_utils/response';

// export async function GET(req: NextApiRequest, res: NextApiResponse) {
//     try {
//         await DB();
//         const reminders = await RemindersModel.find().sort({ createdAt: 1 });

//         if (!reminders || reminders.length === 0) {
//             return HandleResponse({
//                 type: "NOT_FOUND",
//                 message: "No Reminders found.",
//                 data: []
//             });
//         }

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Reminders retrieved successfully.",
//             data: reminders,
//         });
//     } catch (error) {
//         console.error(error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An error occurred while retrieving reminder. Please try again."
//         });
//     }
// }

// export async function POST(req: NextApiRequest, res: NextApiResponse) {
//     try {
//         await DB();
//         const r = await req.json();
//         if (!r.companyId || !r.createdBy) {
//             return HandleResponse({ type: "BAD_REQUEST", message: 'Must be logged in' });
//         }

//         if (!r.repeatOption) {
//             return HandleResponse({ type: "BAD_REQUEST", message: 'Repeat option is required.' });
//         }

//         const repeatOption = r.repeatOption.split(' ')[0].toLowerCase();

//         let nextExecutionDate = moment().startOf('day').toDate();

//         switch (repeatOption) {
//             case 'daily':
//                 nextExecutionDate = moment().add(1, 'days').startOf('day').toDate();
//                 break;
//             case 'weekly':
//                 nextExecutionDate = moment().add(1, 'weeks').startOf('day').toDate();
//                 break;
//             case 'monthly':
//                 nextExecutionDate = moment().add(1, 'months').startOf('day').toDate();
//                 break;
//             case 'yearly':
//                 nextExecutionDate = moment().add(1, 'years').startOf('day').toDate();
//                 break;
//             default:
//                 return HandleResponse({ type: "BAD_REQUEST", message: 'Invalid repeat option.' });
//         }

//         r.nextExecutionDate = nextExecutionDate;

//         const newReminder = new RemindersModel(r);

//         await newReminder.save();

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Reminder created successfully.",
//             data: newReminder,
//         },);

//     } catch (error) {

//         console.error('Error in creating reminder:', error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An error occurred while creating the reminder. Please try again."
//         },);
//     }
// }


// export async function PUT(req: NextApiRequest, res: NextApiResponse) {


//     try {

//         await DB();
//         const data = await req.json();
//         const { reminderId, companyId, createdBy } = data;
//         if (!companyId || !createdBy) {
//             return HandleResponse({ type: "BAD_REQUEST", message: 'Must Loggedin' });
//         };

//         if (!reminderId || Array.isArray(reminderId)) {
//             return HandleResponse({
//                 type: "BAD_REQUEST",
//                 message: 'Reminder ID must be provided and cannot be an array.'
//             });
//         };



//         const reminder = await RemindersModel.findOne({ _id: reminderId });

//         if (!reminder) {
//             return HandleResponse({
//                 type: "NOT_FOUND",
//                 message: "Appointment not found."
//             });
//         }

//         //     Object.assign(appointment, updateData);
//         delete data._id;
//         const rmndr = await RemindersModel.updateOne({ _id: reminderId }, { $set: data });


//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Updated successfully.",
//             data: rmndr
//         });
//     } catch (error) {
//         console.error('Error updating appointment:', error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An unexpected error occurred while updating the reminder."
//         });
//     }
// }
