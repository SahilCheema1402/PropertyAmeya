import { Lead, Company, User, Query } from "./../../_const/const";
import mongoose, { Schema, model, models } from "mongoose";
import { ILead } from "./../../_interface/leadField.interface";
import db from "@app/_Database/db";

const docSchema = new Schema<ILead>({
    name: {
        type: String,
        index: true
    },
    call_date: {
        type: Date,
    },
    call_visit_meeting_consider_in_follow_up_date: {
        type: Date,
    },
    visit_done_date: {
        type: Date,
    },
    meeting_done_date: {
        type: Date,
    },
    deal_done_date: {
        type: Date,
    },
    ringing_date: {
        type: Date,
    },
    switch_off_date: {
        type: Date,
    },
    wrong_no_date: {
        type: Date,
    },
    not_interested_date: {
        type: Date,
    },
    followup_date: {
        type: Date,
    },
    shifting_date: {
        type: Date,
    },
    phone: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        index: true
    },
    alternate: {
        type: String,
        required: false, // Optional field
    },
    email: {
        type: String,
        trim: true,
        index: true
    },
    source: {
        type: String,
        index: true
    },
    address: {
        type: String,
    },
    createAt: {
        type: Date,
        default: new Date(),
        index: true
    },
    updateAt: {
        type: Date,
        default: new Date(),
        index: true
    },
    firstFollowupDate: {
        type: Date,
        default: new Date(),
        index: true
    },
    isRechurn: {
        type: Boolean,
        default: false,
        index: true
    },
    lastAssignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastAssignedAt: {
        type: Date,
        default: null
    },
    isHotProspect: {
        type: Boolean,
        default: false,
        index: true
    },
    isSuspect: {
        type: Boolean,
        default: false,
        index: true
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, "Company Id is missing"]
    },
    query: [{
        type: Schema.Types.ObjectId,
        ref: Query.Name,
        index: true
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    },
    leadStatus: {
        type: String,
        default: 'fresh',
        index: true
    },
    call_status: {
        type: String,
        index: true
    },
    assign: [{
        type: Schema.Types.ObjectId,
        ref: User.Name,
    }],
    assignAt: {
        type: Date,
        default: new Date()
    },
    allowQueryAddition: {
        type: Boolean,
        default: true,  // By default, query addition is allowed
        index: true
    },
    // In your Lead schema, add:
    deletedQueries: [{
        queryId: {
            type: Schema.Types.ObjectId,
            ref: Query.Name,
            required: true
        },
        deletedAt: {
            type: Date,
            default: Date.now
        },
        deletedBy: {
            type: String,
            default: 'system'
        }
    }]
}, { strict: false });

// Add validation middleware to ensure a lead cannot be both Hot Prospect and Suspect
docSchema.pre('save', function (next) {
    if (this.isHotProspect && this.isSuspect) {
        const err = new Error('A lead cannot be both Hot Prospect and Suspect');
        return next(err);
    }
    next();
});

// Add validation middleware for updates
docSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;
    if (update && update.isHotProspect && update.isSuspect) {
        const err = new Error('A lead cannot be both Hot Prospect and Suspect');
        return next(err);
    }
    next();
});

// In your Lead schema
docSchema.index({ company: 1, leadStatus: 1, phone: 1 });
docSchema.index({ company: 1, phone: 1 });
docSchema.index({ company: 1, assign: 1, leadStatus: 1 });
docSchema.index({
    "company": 1,
    "assign": 1,
    "leadStatus": 1,
    "createAt": -1
});
docSchema.index({ phone: "text", name: "text", email: "text" });
docSchema.index({ "company": 1, "assign": 1, "createAt": -1 });
docSchema.index({ "company": 1, "call_status": 1, "leadStatus": 1 });
docSchema.index({ "firstFollowupDate": 1 });
docSchema.index({ "company": 1, "assign": 1 });
// Add indexes for Hot Prospect and Suspect filtering
docSchema.index({ "company": 1, "isHotProspect": 1 });
docSchema.index({ "company": 1, "isSuspect": 1 });
docSchema.index({ "company": 1, "isHotProspect": 1, "leadStatus": 1, "call_status": 1 });
docSchema.index({ "company": 1, "isSuspect": 1, "leadStatus": 1, "call_status": 1 });

export default models[Lead.schemaName] || model(Lead.schemaName, docSchema);