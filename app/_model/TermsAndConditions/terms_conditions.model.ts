import { TermsAndConditons} from "@app/_const/const";
import { ITermsAndConditions, } from "@app/_interface/termsconditions";
import mongoose, {Model, Schema, model, models} from "mongoose";
const termsandconditionSchema = new Schema<ITermsAndConditions>({
    _id: {
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    content: {
        type: String,
        required: true,
    },
    createAt:{
        type:Date,
        default: new Date,
    },
    createdBy:{type:mongoose.Schema.Types.ObjectId},   
    updateAt: {
        type: Date,
        default: Date.now,
    },
})

export default models[TermsAndConditons.schemaName] as Model<ITermsAndConditions> || model<ITermsAndConditions>(TermsAndConditons.schemaName, termsandconditionSchema);


