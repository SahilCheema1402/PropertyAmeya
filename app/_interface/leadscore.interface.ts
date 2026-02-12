import mongoose from "mongoose";
import { string } from "zod";

export interface ILeadScore {
    _id:mongoose.Schema.Types.ObjectId,
    lead:mongoose.Schema.Types.ObjectId,
    service:string,
    emails:string[],
    linkdin:string[],
    instagram:string[],
    facebook:string[]
    type:string
}