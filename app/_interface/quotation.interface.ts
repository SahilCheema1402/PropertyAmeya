import mongoose from "mongoose";

export interface IQuatation {
  _id:mongoose.Schema.Types.ObjectId,
  company:mongoose.Schema.Types.ObjectId,
  name:string,
  companyName:string,
  services:{
    name:string,
    price:number,
    tax:number
  }[],
  formType:string,
  tax:string,
  notes:string,
  invoiceRaised:boolean,
  status:boolean,
}