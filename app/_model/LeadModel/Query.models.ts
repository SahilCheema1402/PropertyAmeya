import mongoose, { Model, Schema, model, models } from "mongoose";
import { IField, IQuery } from './../../_interface/leadField.interface';
import { User, Company, LeadField, Query, Remark } from './../../_const/const';
const querySchema = new Schema<IQuery>({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
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
    interested_date: {
        type: Date,
    },
    status: {
        type: String,
        default: "",
    },
    leadType: {
        type: String,
        default: 'rent',
    },
    location: {
        type: String,
    },
    purpose: {
        type: String,
    },
    name: {
        type: String,
    },
    phone: {
        type: String,
    },
    project: {
        type: String,
    },
    budget: {
        type: String,
    },
    bhk: {
        type: String,
    },
    type: {
        type: String,
    },
    reason: {
        type: String,
    },
    size: {
        type: String,
    },
    lead_actual_slab: {
        type: String,
    },
    discount: {
        type: String,
    },
    actual_revnue: {
        type: String,
    },
    sell_revenue: {
        type: String,
    },
    incentive_slab: {
        type: String,
    },
    closing_amount: {
        type: String,
    },
    exp_visit_date: {
        type: Date,
    },
    floor: {
        type: String,
    },
    followup_date: {
        type: Date,
    },
    shifting_date: {
        type: Date,
    },
    unit_no: {
        type: String,
    },
    visit_done: {
        type: Date,
    },
    meeting_done: {
        type: String,
    },
    call_status: {
        type: String
    },
    remarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Remark.Name,
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name,
    },
    visitDoneBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name
    },
    meetingDoneBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, 'Company ID is missing']
    },
    createAt: {
        type: Date,
        default: new Date()
    },
    updateAt: {
        type: Date,
        default: new Date()
    },
    deleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: String
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
    },
}, { strict: true });

querySchema.index({ "createAt": -1 });
querySchema.index({ "followup_date": 1 });
querySchema.index({ "leadType": 1 });
querySchema.index({ "followup_date": 1 });
querySchema.index({ "not_interested_date": 1 });
querySchema.index({ "deal_done_date": 1 });
querySchema.index({ "ringing_date": 1 });
querySchema.index({ "wrong_no_date": 1 });
querySchema.index({ "switch_off_date": 1 });
querySchema.index({ "visit_done_date": 1 });
querySchema.index({ "meeting_done_date": 1 });
querySchema.index({ "exp_visit_date": 1 });
querySchema.index({ "leadType": 1 });

export default models[Query.schemaName] as Model<IQuery> || model<IQuery>(Query.schemaName, querySchema);