import DB from './../../../_Database/db';
import OneToOneModel from './../../../_model/Onetoone/onetoone.model';
import { IOneToOne } from './../../../_interface/onetoone.interface';
import {  NextApiResponse,NextApiRequest } from 'next';
import { NextRequest } from 'next/server';
import HandleResponse from './../../../_utils/response';

// export async function POST(req: NextRequest, res: NextApiResponse) {


//     try {
//         await DB();
//     const data = await req.json();
//     const { agenda, name, email, phone, location, date, time,note, status, priority, companyId, createdBy} = data;
//     if(!companyId || !createdBy){
//         return HandleResponse({type:"BAD_REQUEST", message: 'Must Loggedin' });
//     }
//     if (!agenda || !name || !email || !phone || !location || !date || !time ||!note || 
//          !status || !priority || !companyId || !createdBy) {
//         return HandleResponse({type:"BAD_REQUEST", message: 'All required fields must be provided.' });


//     }
//         const newAppointment = new OneToOneModel({
//             agenda,
//             name,
//             email,
//             phone,
//             location,
//             date,
//             time,
//             note,
//             status,
//             priority,
//             companyId,
//             createdBy,
//         });
//         await newAppointment.save();


//         return HandleResponse({
//             type: "SUCCESS",
//             message: "1-2-1 Created successfully",
//         })
//     } catch (error:any) {
//         console.error('Error creating appointment:', error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: error?.message
//         });
//     }
// }

// export async function GET(req: NextRequest, res: NextApiResponse) {


//     try {
//         await DB();
//         const { searchParams } = new URL(req.url);
//         const _id = searchParams.get('id');
//         const appointments = await OneToOneModel.find({companyId:_id })
//             .sort({ date: 1, time: 1 }); // Sort by date and time in descending order

//         if ( appointments.length == 0) {
//             return HandleResponse({
//                 type: "BAD_REQUEST",
//                 data: [],
//                 message: "No appointments found.",

//             });
//         }

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Appointments retrieved successfully",
//             data: appointments,
//         });
//     } catch (error: any) {
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An error occurred while retrieving appointments. Please try again."
//         });
//     }
// }



// export async function GET(req: NextApiRequest, res: NextApiResponse) {
//     await DB();
//     const { id } = req.query;
// console.log
//     if (!id || Array.isArray(id)) {
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: 'Appointment ID must be provided and cannot be an array.'
//         });
//     }

//     try {
//         const appointment = await OneToOneModel.findById(id);
//         if (!appointment) {
//             return HandleResponse({
//                 type: "NOT_FOUND",
//                 message: "Appointment not found."
//             });
//         }

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Appointment retrieved successfully",
//             data: appointment,
//         });
//     } catch (error: any) {
//         console.error('Error retrieving appointment:', error);

//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An unexpected error occurred while retrieving the appointment."
//         });
//     }
// }


// export async function DELETE(req: NextRequest, res: NextApiResponse) {
//     await DB();

//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get('id');
//     // Validate that id is provided
//     if (!id || Array.isArray(id)) {
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: 'Appointment ID must be provided and cannot be an array.'
//         });
//     }

//     try {
//         const appointment = await OneToOneModel.findByIdAndDelete(id);

//         // Check if the appointment was found and deleted
//         if (!appointment) {
//             return HandleResponse({
//                 type: "NOT_FOUND",
//                 message: "Appointment not found."
//             });
//         }

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Appointment deleted successfully",
//         });
//     } catch (error: any) {
//         console.error('Error deleting appointment:', error);

//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An unexpected error occurred while deleting the appointment."
//         });
//     }
// }



// export async function PUT(req: NextRequest, res: NextApiResponse) {
//     try {
//         await DB();
//         const data = await req.json();
//     const { selectedotoId, agenda, name, email, phone, location, date, time, outTimeLocation,  note, status, priority, companyId, createdBy} = data;

//         // Validate required fields
//         if (!companyId || !createdBy) {
//             return HandleResponse({type:"BAD_REQUEST", message: 'Must Loggedin' });
//         }
//         if (!selectedotoId || typeof selectedotoId !== 'string') {
//             return HandleResponse({
//                 type: "BAD_REQUEST",
//                 message: 'Appointment ID must be provided and cannot be an array.'
//             });
//         }
//         if (!agenda || !name || !email || !phone || !location || !date || !time || !outTimeLocation || !note || !status || !priority) {
//             return HandleResponse({type:"BAD_REQUEST", message: 'All required fields must be provided.' });
//         }

//         // Check if appointment exists
//         const appointment = await OneToOneModel.findById(selectedotoId);
//         if (!appointment) {
//             return HandleResponse({
//                 type: "NOT_FOUND",
//                 message: "Appointment not found."
//             });
//         }

//         // Update the appointment
//         const updateData = { ...data };
//         delete updateData.selectedotoId;
//         const updatedAppointment = await OneToOneModel.findByIdAndUpdate(
//             selectedotoId,
//             { $set: updateData },
//             { new: true }
//         );

//         return HandleResponse({
//             type: "SUCCESS",
//             message: "Updated successfully.",
//             data: appointment
//         });
//     } catch (error) {
//         console.error('Error updating appointment:', error);
//         return HandleResponse({
//             type: "BAD_REQUEST",
//             message: "An unexpected error occurred while updating the appointment."
//         });
//     }
// }
