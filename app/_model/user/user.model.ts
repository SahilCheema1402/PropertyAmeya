import { Staff, Company, Lead } from "./../../_const/const";
import { User } from "./../../_const/const";
import { IUser } from './../../_interface/user.interface';
import { UserRoles } from './../../_enums/enums';
import mongoose, { Model, Schema, model, models } from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new Schema<IUser>({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    userName: {
        type: String,
        required: [true, "userName is missing"],
    },
    email: {
        type: String,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, "Company is missing"]
    },
    password: {
        type: String,
        required: [true, "Password is missing"]
    },
    refreshToken: {
        type: String,
    },
    designation: {
        type: String,

    },
    address: {
        type: String,
    },
    salary: {
        type: String,
    },
    target: {
        type: String,
    },
    pan_no: {
        type: String,
        unique: true,
        trim: true
    },
    aadhar_no: {
        type: String,
        unique: true,
        trim: true
    },
    date_of_birth: {
        type: String,
    },
    marriage_anniversary: {
        type: String,
    },
    father_name: {
        type: String,
    },
    emergency_contact_details: {
        type: String,
    },
    salesExcutive: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    Lead: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    salesManager: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    areaManager: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    vpSale: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    teamHead: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    personalEmployee: {
        type: String,
    },
    callTarget: {
        type: String,
    },
    meetingTarget: {
        type: String,
    },
    followupTarget: {
        type: String,
    },
    createAt: {
        type: Date,
        default: new Date()
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updateAt: {
        type: Date,
        default: new Date()
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
    },
    logTime: {
        type: Date
    },
    logStatus: Boolean,
    subordinate: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name
    }],
    manager: [{ type: Schema.Types.ObjectId, ref: User.Name }],
    role: {
        type: Number,
        enum: {
            values: Object.values(UserRoles).filter((value) => {
                return (typeof value === 'number') && value
            }),
            message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
        },
        required: [true, "Role is missing"]
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    this.password = await bcrypt.hash(this.password!, 10)
})

export default models[User.schemaName] as Model<IUser> || model<IUser>(User.schemaName, userSchema);