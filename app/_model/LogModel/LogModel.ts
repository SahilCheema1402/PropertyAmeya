import { User, Log} from "@app/_const/const";
import { ILog } from "@app/_interface/log.interface";
import mongoose, {Model, Schema, model, models} from "mongoose";
const docSchema = new Schema<ILog>({
    _id: {
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    errorName:String,
    errorDescription:String,
    code:String,
    createAt:{
        type:String,
        default:new Date().toLocaleString('en-GB')
    },
    other:String
})

export default models[Log.schemaName] as Model<ILog> || model<ILog>(Log.schemaName, docSchema);