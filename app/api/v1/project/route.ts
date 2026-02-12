import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import projectModel from '@app/_model/Project/project.model';
import mongoose, {  PipelineStage } from 'mongoose';
import { DateTime } from 'luxon';
 
export async function GET(req: any, res: any) {
    try {
      await DB();
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search');
      const page = searchParams.get('page');
      const limit = searchParams.get('limit');

          const user: any = JSON.parse(req.headers.get('user') as string);
      
              let filters: PipelineStage[] = [{
                  $match: {
                      company: new mongoose.Types.ObjectId(user?.company?._id),
                  }
              },
              {
                  $match: {
                      ...(search && {
                          $or: [
                              { project_name: { $regex: search, $options: 'i' } },
                              { client_name: { $regex: search, $options: 'i' } },
                              { product: { $regex: search, $options: 'i' } },
                              { size: { $regex: search, $options: 'i' } },
                              { floor: { $regex: search, $options: 'i' } },
                              { payment_plan: { $regex: search, $options: 'i' } },
                              { BSP: { $regex: search, $options: 'i' } },
                              { discount: { $regex: search, $options: 'i' } },
                              { view_plc: { $regex: search, $options: 'i' } },
                              { conner_plc: { $regex: search, $options: 'i' } },
                              { floor_plc: { $regex: search, $options: 'i' } },
                              { edc: { $regex: search, $options: 'i' } },
      
                              { idc: { $regex: search, $options: 'i' } },
                              { itc: { $regex: search, $options: 'i' } },
                              { unit_no: { $regex: search, $options: 'i' } },
      
                              { ffc: { $regex: search, $options: 'i' } },
                              { note1: { $regex: search, $options: 'i' } },
                              { note2: { $regex: search, $options: 'i' } },
                              { note3: { $regex: search, $options: 'i' } },
                              { note4: { $regex: search, $options: 'i' } },
                              { gst: { $regex: search, $options: 'i' } },
                              { leastRent: { $regex: search, $options: 'i' } },
                              { power_backup_qty: { $regex: search, $options: 'i' } },
                              { power_backup_price: { $regex: search, $options: 'i' } },
                              { on_booking: { $regex: search, $options: 'i' } },
                              { within_thirty__Days: { $regex: search, $options: 'i' } },
                              { on_possession: { $regex: search, $options: 'i' } },
]
                      }),
                  }
              },

              {
                  $group: {
                      _id: "$_id",
                      project_name: { $first: "$project_name" },
                      client_name: { $first: "$client_name" },
                      product: { $first: "$product" },
                      size: { $first: "$size" },
                      floor: { $first: "$floor" },
                      createAt: { $first: "$createAt" },
                      company: { $first: "$company" },
                      payment_plan: { $first: "$payment_plan" },
                      BSP: { $first: "$BSP" },
                      discount: { $first: "$discount" },
                      view_plc: { $first: "$view_plc" },
                      conner_plc: { $first: "$conner_plc" },
                      floor_plc: { $first: "$floor_plc" },
                      edc: { $first: "$edc" },
                      idc: { $first: "$idc" },
                      createdBy: { $first: "$createdBy" },
                      itc: { $first: "$itc" },
                      ffc: { $first: "$ffc" },
                      note1: { $first: "$note1" },
                      note2: { $first: "$note2" },
                      note3: { $first: "$note3" },
                      note4: { $first: "$note4" },
                      gst: { $first: "$gst" },
                      leastRent: { $first: "$leastRent" },
                      power_backup_qty: { $first: "$power_backup_qty" },
                      power_backup_price: { $first: "$power_backup_price" },
                      on_booking: { $first: "$on_booking" },
                      within_thirty__Days: { $first: "$within_thirty__Days" },
                      on_possession: { $first: "$on_possession" },
                      other_possession_charges: { $first: "$other_possession_charges" },
                      other_additional_charges: { $first: "$other_additional_charges" },
                      __v: { $first: "$__v" }
                  }
              }]
              const project = await projectModel.aggregate(filters).skip((Number(page) - 1) * Number(limit)  || 0).limit(Number(limit) || 0);
              const count = (await projectModel.aggregate(filters)).length;
              return HandleResponse({
                    type: "SUCCESS",
                    message: "Project Details retrieved successfully.",
                    data: {project,count},
                    
                  });
     
    
    } catch (error) {
      console.error("An error occurred while retrieving users",error);
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "An error occurred while retrieving project. Please try again."
      });
    }
  }



export async function POST(req: Request) {
    try {
        DB();
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!body.data) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Body Data is Missing!" })
        }
        if (body.type_ === 'update') {
          if (body._id !== 'undefined' &&body._id ) {
              const Project=   await projectModel.findByIdAndUpdate(
                  new mongoose.Types.ObjectId(body._id),
                  {
                      $set: body.data
                  },
                  { new: true }
              );
  return HandleResponse({ type: "SUCCESS", message: "Project Updated Successfully" })
          }
          else{
              return HandleResponse({
                  type: "BAD_REQUEST",
                  message: `id is required.`,
              })

          }
      
      }
        if (body.type_ === 'add') {
          const Project_ = new projectModel({
            ...body.data,
            createdBy: user?._id,
            company: user?.company?._id,
            createAt: DateTime.now().setZone('Asia/Kolkata')
        })
        await Project_.save();
        return HandleResponse({ type: "SUCCESS", message: "Created Successfully" })
        }
       
    } catch (error: any) {
         return HandleResponse({
                type: "BAD_REQUEST",
                message: error?.message
            })
    }
}
