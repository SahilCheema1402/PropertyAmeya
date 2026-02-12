import mongoose from "mongoose";

export interface ISaleNotification {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  leadId: mongoose.Types.ObjectId;
  clientName: string;
  project: string;
  leadType: string;
  saleDate: Date;
  message: string;
  daysAgo: number;
  isCongratulatory: boolean;
  isNoSaleMessage?: boolean; 
  isOwnSale?: boolean;       
  timeAgo?: string;
}