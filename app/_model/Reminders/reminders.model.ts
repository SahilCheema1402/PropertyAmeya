import { IReminder } from './../../_interface/reminder.interface';
// models/Task.ts
import mongoose, { Schema, Document } from 'mongoose';


const ReminderSchema: Schema = new Schema({
    name: { type: String, required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    tat: { type: Number, default: 0 },
    tatMiss: { type: Number, default: 0 },
    status: { type: String, default: 'Pending' },
    priority: { type: String, required: true },
    tasklist:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lists', 
        required: [true, "list is missing"]
    },
    repeatOption:{ type: String,
        // enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true},

    nextExecutionDate: {
            type: Date,
            required: true
          },
    reminder: { type: String},

    inTime: {type : Date},
    inTimeAdd: {type :String},
    outTime:{type: Date},
    outTimeAdd: {type:String},
    totalHours:{type:Number},
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', 
        required: [true, "user is missing"]
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'companys', 
        required: [true, "Company is missing"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: [true, "User Id is missing"]
    },
    lastExecutedAt: {type:Date},
});

export default mongoose.models.Reminders || mongoose.model<IReminder>('Reminders', ReminderSchema);
