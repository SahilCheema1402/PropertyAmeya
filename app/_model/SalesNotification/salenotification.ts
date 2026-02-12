import { User, SalesNotification} from "@app/_const/const";
import {ISaleNotification} from "@app/_interface/salesnotification.interface"

import mongoose, {Model, Schema, model, models} from "mongoose";
const docSchema = new Schema<ISaleNotification>({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.Name,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  clientName: String,
  project: String,
  leadType: String,
  saleDate: {
    type: Date,
    default: Date.now
  },
  message: String,
  daysAgo: Number,
  isCongratulatory: {
    type: Boolean,
    default: true
  },
  isNoSaleMessage: {
    type: Boolean,
    default: true
  },
  isOwnSale: {
    type: Boolean,
    default: true
  },
  timeAgo:String

}, {
  timestamps: true
});

export default models[SalesNotification.schemaName] as Model<ISaleNotification> || model<ISaleNotification>(SalesNotification.schemaName, docSchema);