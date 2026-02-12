import mongoose from "mongoose";

export interface IGroupModel {
    _id:mongoose.Schema.Types.ObjectId,
    groupUserId:mongoose.Schema.Types.ObjectId[],
    name:string,
    description:string
    groupId:string
    createdBy:mongoose.Schema.Types.ObjectId,
    company:mongoose.Schema.Types.ObjectId,
}