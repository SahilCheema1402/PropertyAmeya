import { ILinksModel } from './../../_interface/links.interface';
import mongoose, { Schema, model, models ,Model} from "mongoose";
import { User,Company,Links } from "./../../_const/const";


const linkSchema = new Schema<ILinksModel>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.mongo.ObjectId()
    },
    logo:{
        type:String
    },
    name:{
        type:String,
        required:[true,"userName is missing"],
    },
    websiteUrl: {
        type:String,
        required:[true,"Website Url is missing"],
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    }, 
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:Company.Name,
        required:[true,"Company is missing"]
    },
    createAt:{
        type:Date,
        default:new Date()
    },
    updateAt:{
        type:Date,
        default:new Date()
    },

});
export default models[Links.schemaName]as Model<ILinksModel> || model<ILinksModel>(Links.schemaName, linkSchema);
