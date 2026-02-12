import mongoose from "mongoose";
export interface IProject {
    _id:mongoose.Schema.Types.ObjectId;
     project_name: string;
    company: mongoose.Schema.Types.ObjectId;
     product:string;
     client_name: string;
     size?: string;
     floor: string;
     payment_plan: string;
     BSP: string;
     discount:string;
     view_plc:string;
     conner_plc?: string;
     floor_plc?: string;
     edc?: string;
     idc?: string;
    itc?: string;
     ffc: string;
     gst?:string;
    note1?:string;
    note2?:string;
    note3?:string;
    note4?:string;
     leastRent?: string;
     power_backup_qty?: string;
     power_backup_price?: string;
    on_booking ?: string;
    within_thirty__Days ?: string;
    on_possession?: string;
    other_possession_charges?:string;
    other_additional_charges?:string;
    others:{
        name:string,
        value:string
    }[],
    createdBy:mongoose.Schema.Types.ObjectId,
    createAt:Date,
    updateAt:Date,
}