import mongoose, {Model, Schema, model, models} from "mongoose";
import {ILeadScore} from './../../_interface/leadscore.interface';
import {User,Company,Lead,LeadScore} from './../../_const/const';
const docSchema = new Schema<ILeadScore>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    lead:{
        type:mongoose.Schema.Types.ObjectId,
        ref:Lead.Name,
    },
    service:String,
    emails:[String],
    linkdin:[String],
    instagram:[String],
    facebook:[String],
    type:String
},{strict:true});
export default models[LeadScore.schemaName] as Model<ILeadScore> || model<ILeadScore>(LeadScore.schemaName, docSchema);