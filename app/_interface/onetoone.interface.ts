import mongoose from 'mongoose';

export interface IOutTimeLocation {
    latitude: number;
    longitude: number;
}

export interface IOneToOne {
    agenda:string;
    name: string;
    email: string;
    phone: string;
    location: string;
    date: Date;  
    time: Date; 
    note: string; 
    status:string;
    outTimeLocation: IOutTimeLocation;
    priority:string;
    inTime: Date;
    inTimeAdd: string;
    outTime: Date,
    outTimeAdd: string,
    totalHours: string,
    companyId: mongoose.Types.ObjectId; 
    createdBy: mongoose.Types.ObjectId; 
    createdAt?: Date; 
    updatedAt?: Date; 
}
