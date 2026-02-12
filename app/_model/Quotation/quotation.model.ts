import mongoose, {Model, Schema, model, models} from "mongoose";
import { IQuatation } from "./../../_interface/quotation.interface";
import {Quotation,Company} from './../../_const/const';
const quotationSchema = new Schema<IQuatation>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
  name:{
      type:String,
      required: [true, 'Name is required'],
      trim: true
  },
  formType:{
    type:String,
  },
  companyName:{
    type:String,
    },
  tax:Number,
  notes:String,
  services: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      tax: Number,
    },
  ],
  invoiceRaised:Boolean,
  status:Boolean,
  company: {
    type: Schema.Types.ObjectId,
    ref: Company.Name,
    // required: [true, "Company Id is missing"]
},
},{strict:true});
export default models[Quotation.schemaName] as Model<IQuatation> || model<IQuatation>(Quotation.schemaName, quotationSchema);