import mongoose from "mongoose";

export interface ITermsAndConditions {
    _id:mongoose.Schema.Types.ObjectId,
    content: string; 
    createdBy:mongoose.Schema.Types.ObjectId,
    createAt:Date,
    updateAt:Date,
}
export interface IEmployee {
    _id:mongoose.Schema.Types.ObjectId,
    name: string;
    email: string;
    readBy:mongoose.Schema.Types.ObjectId,
    acceptedTerms: boolean; 
    termsAcceptedAt?: Date;
}