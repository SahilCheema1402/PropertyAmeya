import mongoose, { Types } from "mongoose";

export interface IUser {
    _id:mongoose.Schema.Types.ObjectId,
    subordinate:mongoose.Schema.Types.ObjectId[],
    role:number,
    userName:string,
    email:string,
    address:string,
    phone:string,
    salary:string,
    designation:string,
    personalEmployee:string,
    manager?: Types.ObjectId[] | string[];
//   subordinate?: Types.ObjectId[] | string[];
    salesExcutive:mongoose.Schema.Types.ObjectId[],
    salesManager:mongoose.Schema.Types.ObjectId[],
    areaManager:mongoose.Schema.Types.ObjectId[],
    vpSale:mongoose.Schema.Types.ObjectId[],
    teamHead:mongoose.Schema.Types.ObjectId[],
    Lead:mongoose.Schema.Types.ObjectId[]
    callTarget:string,
    meetingTarget:string,
    followupTarget:string,
    target:string,
    password:string,
    company:mongoose.Schema.Types.ObjectId,
    logTime:Date,
    staff:mongoose.Schema.Types.ObjectId[],
    refreshToken:string,
    logStatus:boolean,
    isActive:boolean,
    createAt:Date,
    updateAt:Date,
    pan_no:string,
    aadhar_no:string,
    date_of_birth:string
    marriage_anniversary:string,
    father_name:string,
    emergency_contact_details:string,
    createdBy: mongoose.Types.ObjectId;
}

