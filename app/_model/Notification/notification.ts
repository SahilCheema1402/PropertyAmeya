import { User, Notification} from "@app/_const/const";
import { INotification } from "@app/_interface/notification.interface";

import mongoose, {Model, Schema, model, models} from "mongoose";
const docSchema = new Schema<INotification>({
    _id: {
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    title:String,
    description:String,
    createFor:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:User.Name,
    }],
    read:[{
        type:mongoose.Schema.Types.ObjectId,
    }],
    createAt:{
        type:Date,
        default: new Date,
    },
    
})

export default models[Notification.schemaName] as Model<INotification> || model<INotification>(Notification.schemaName, docSchema);