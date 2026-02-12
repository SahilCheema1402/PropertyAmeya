import mongoose, {Model, Schema, model, models} from "mongoose";
import {IRemark} from './../../_interface/leadField.interface';
import {User,Company,LeadField,Remark} from './../../_const/const';
const docSchema = new Schema<IRemark>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    title: {
          type: String,
    },
    user:{
        type: String,
    },
    createAt:{
        type:Date,
        default:new Date()
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
      },

},{strict:true});
export default models[Remark.schemaName] as Model<IRemark> || model<IRemark>(Remark.schemaName, docSchema);