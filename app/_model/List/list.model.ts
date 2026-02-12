import { IList } from "./../../_interface/links.interface";
import mongoose, { Schema, model, models ,Model} from "mongoose";
import { User,Company,Links, } from "./../../_const/const";
import { List } from "./../../_const/const";
  const ListSchema = new Schema<IList>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.mongo.ObjectId()
    },
    title: { type: String, required: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:Company.Name,
      required: [true, "Company is missing"]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.Name,
      required: [true, "User Id is missing"]
    }
  }, { timestamps: true });
  
  export default models[List.schemaName]as Model<IList> || model<IList>(List.schemaName, ListSchema);
