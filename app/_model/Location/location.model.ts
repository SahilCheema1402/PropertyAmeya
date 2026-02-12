import { User,Location} from "@app/_const/const";
import { ILocation } from "@app/_interface/location.interface";
import mongoose, {Model, Schema, model, models} from "mongoose";
const docSchema = new Schema<ILocation>({
    _id: {
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    staffId:{
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    address: { type: String },
    createAt: {type: Date},
 
})

export default models[Location.schemaName] as Model<ILocation> || model<ILocation>(Location.schemaName, docSchema);