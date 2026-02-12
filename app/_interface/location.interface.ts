import mongoose from "mongoose";

export interface ILocation {
    _id:mongoose.Schema.Types.ObjectId,
    staffId: mongoose.Schema.Types.ObjectId,
    latitude:string
    longitude: string
    address: string
    createAt:Date,
}