import mongoose from "mongoose";

export interface INotification {
    _id:mongoose.Schema.Types.ObjectId,
    title:string,
    description:string,
    createFor:mongoose.Schema.Types.ObjectId[],
    createAt:Date,
    read:boolean,
}