import mongoose, { Schema, model, models ,Model} from "mongoose";
import { Group,User,Company,Lead } from "./../../_const/const";
import { IGroupModel } from "./../../_interface/group.interface";
import mongooseAutoPopulate from 'mongoose-autopopulate';
const groupSchema = new Schema<IGroupModel>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.mongo.ObjectId()
    },
    name:String,
    groupUserId:{
            type:[Schema.Types.ObjectId],
            ref:Lead.Name,
            // autopopulate:true
    },
    description:{
        type:String
    },
    groupId:{
        type:String
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, "Company Id is missing"]
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    }
});
// groupSchema.plugin(mongooseAutoPopulate);
export default models[Group.schemaName]as Model<IGroupModel> || model<IGroupModel>(Group.schemaName, groupSchema);
