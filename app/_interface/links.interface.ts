import mongoose from "mongoose";

export interface ILinksModel {
    _id:mongoose.Schema.Types.ObjectId,
    logo:string
    name:string,
    websiteUrl:string
    createdBy:mongoose.Schema.Types.ObjectId,
    company:mongoose.Schema.Types.ObjectId,
    createAt:Date,
    updateAt:Date
}

export interface IList  {
    _id:mongoose.Schema.Types.ObjectId,
    title: string;
    companyId: mongoose.Types.ObjectId; // Added to interface
    createdBy: mongoose.Types.ObjectId;  // Added to interface
  }