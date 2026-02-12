import { User, Attendance } from "./../../_const/const";
import mongoose, {Model, Schema, model, models} from "mongoose";
import { IAttendance } from "@app/_interface/attendance.interface";

const attendanceSchema = new Schema<IAttendance>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.schemaName,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        default: null
    },
    checkInLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String }
    },
    checkOutLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        address: { type: String }
    },
    totalHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Full Day', 'Half Day', 'Absent'],
        default: 'Full Day'
    },
    remarks: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

export default models[Attendance.schemaName] as Model<IAttendance>|| model<IAttendance>(Attendance.schemaName, attendanceSchema);