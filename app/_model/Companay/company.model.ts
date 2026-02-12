import { User, Company } from "./../../_const/const";
import {ICompany} from './../../_interface/company.interface';
import mongoose, {Model, Schema, model, models} from "mongoose";

const companySchema = new Schema<ICompany>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    companyName:{
        type:String,
        required:[true,"userName is missing"],
    },
    address:{
        type:String,
        required:[true,"Address is missing"]
    },
    email:{
        type:String,
        unique:true,
        sparse:true
    },
    phone:{
        type:String,
        unique:true,
        sparse:true
    },
    pincode:{
        type:String
    },
    createBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:User.Name,
    },
    createAt:{
        type:Date,
        default:new Date()
    },
    updateAt:{
        type:Date,
        default:new Date()
    }
});

export default models[Company.schemaName] as Model<ICompany>|| model<ICompany>(Company.schemaName, companySchema);