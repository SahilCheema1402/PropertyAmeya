import DB from './../../../../_Database/db';
import type {  NextApiResponse } from 'next';
import HandleResponse from './../../../../_utils/response';
import { NextRequest } from 'next/server';
import listModel from './../../../../_model/List/list.model';



// export async function POST(req: NextRequest, res: NextApiResponse) {
//   try {

//     await DB();

//     const list = await req.json();

//     if (!list.title || !list.companyId || !list.createdBy) {
//       return HandleResponse({
//         type: "BAD_REQUEST",
//         message: 'All fields are required.'
//       });
//     }

//     const newList = new listModel(list);
//     await newList.save();

//     return HandleResponse({
//       type: "SUCCESS",
//       message: "List created successfully.",
//       data: newList,
//     });
//   } catch (error) {
//     console.error(error);
//     return HandleResponse({
//       type: "BAD_REQUEST",
//       message: "An error occurred while creating the list. Please try again."
//     });
//   }
// }

// export async function GET(req: NextRequest, res: NextApiResponse) {
//     try {
//       await DB();

//       const { searchParams } = new URL(req.url);
//       const _id = searchParams.get('id');
//       // const { companyId } = req.query;

//       // if (!companyId) {
//       //   return HandleResponse({
//       //     type: "BAD_REQUEST",
//       //     message: "Company ID is required."
//       //   });
//       // }

//       // Find lists by companyId
//       const lists = await listModel.find({companyId:_id })

//       return HandleResponse({
//         type: "SUCCESS",
//         message: "Lists retrieved successfully.",
//         data: lists,
//       });
//     } catch (error) {
//       console.error(error);
//       return HandleResponse({
//         type: "BAD_REQUEST",
//         message: "An error occurred while retrieving lists. Please try again."
//       });
//     }
//   }