import mongoose from "mongoose";

export interface ICompany {
    _id:mongoose.Schema.Types.ObjectId,
    companyName:string,
    address:string,
    email:string,
    phone:string,
    pincode:string,
    createBy?:string,
    createAt:Date,
    updateAt:Date,
}