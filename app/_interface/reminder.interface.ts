import mongoose, { Schema, Document } from 'mongoose';

export interface IReminder extends Document {
    name: string;
    title: string;
    startDate: Date;
    dueDate: Date;
    tat: number;
    tatMiss: number;
    status: string;
    priority: string;
    repeatOption:string;
    nextExecutionDate:Date;
    reminder: string;
    owner: mongoose.Types.ObjectId;
    tasklist: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    lastExecutedAt: Date;
}