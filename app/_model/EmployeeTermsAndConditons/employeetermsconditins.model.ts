import { EmployeeTermsandConditons} from "@app/_const/const";
import { IEmployee } from "@app/_interface/termsconditions";
import mongoose, {Model, Schema, model, models} from "mongoose";
const EmployeeSchema = new Schema<IEmployee>({
    _id: {
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    readBy:{ type:mongoose.Schema.Types.ObjectId},
    acceptedTerms: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
});

export default models[EmployeeTermsandConditons.schemaName] as Model<IEmployee> || model<IEmployee>(EmployeeTermsandConditons.schemaName, EmployeeSchema);