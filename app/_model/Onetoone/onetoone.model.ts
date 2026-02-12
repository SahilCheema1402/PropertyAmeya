import mongoose, { Schema, Document } from "mongoose";
import { IOneToOne } from './../../_interface/onetoone.interface';
import { IOutTimeLocation } from "./../../_interface/onetoone.interface";

const iOutTimeLocationSchema = new mongoose.Schema<IOutTimeLocation>({
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
});

const OneToOneSchema: Schema = new Schema<IOneToOne>({
    agenda: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true,}, 
    phone: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true }, 
    time: { type: Date, required: true }, 
    note: { type: String, required: true }, 
    status:{type:String, required:true},
    outTimeLocation: { type: iOutTimeLocationSchema},
    priority: { type: String, required: true },
    inTime: {type : Date},
    inTimeAdd: {type :String},
    outTime:{type: Date},
    outTimeAdd: {type:String},
    totalHours:{type:String},
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'companys', 
        required: [true, "Company is missing"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: [true, "User Id is missing"]
    }
}, { timestamps: true }); 

const OneToOneModel = mongoose.models.OneToOne || mongoose.model<IOneToOne>('OneToOne', OneToOneSchema);

export default OneToOneModel;