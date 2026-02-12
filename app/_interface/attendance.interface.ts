import mongoose from "mongoose";

export interface IAttendance {
    userId: mongoose.Types.ObjectId;
    date: string;
    checkIn: Date;
    checkOut?: Date;
    checkInLocation: { lat: number; lng: number; address: string };
    checkOutLocation?: { lat: number; lng: number; address:string };
    totalHours?: number;
    status?: 'Full Day' | 'Half Day' | 'Absent';
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}