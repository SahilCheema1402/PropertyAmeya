import mongoose from "mongoose";

export interface IField {
    _id: mongoose.Schema.Types.ObjectId,
    fields: {
        name: string,
        header: string,
        type_: string,
        dropdown: string[],
        multiDropdown: boolean,
        show: string,
        validations: {
            required_: boolean,
            email: boolean,
            phone: boolean,
            customFunc: string
        },
        filter: boolean
    }[],
    remarks: {
        type: mongoose.Schema.Types.ObjectId
    }[],
    user: mongoose.Schema.Types.ObjectId,
    company: mongoose.Schema.Types.ObjectId,
    createAt: Date,
    updateAt: Date,
}

export interface ILead {
    _id: mongoose.Schema.Types.ObjectId,
    name: string;
    phone: string;
    alternate?: string; // Optional field
    email?: string;
    address?: string;
    source?: string;
    createAt: Date;
    updateAt: Date;
    assignAt?: Date;
    leadStatus: string;
    company: mongoose.Schema.Types.ObjectId;
    createdBy: mongoose.Schema.Types.ObjectId;
    query: IQuery[]; // Array of queries
    assign: mongoose.Schema.Types.ObjectId;
    firstFollowupDate?: Date;
    isRechurn?: boolean;
    lastAssignedTo?: mongoose.Schema.Types.ObjectId;
    lastAssignedAt?: Date;
    isHotProspect?: boolean;
    isSuspect?: boolean;
    call_status?: string;
    call_date?: Date;
    call_visit_meeting_consider_in_follow_up_date?: Date;
    visit_done_date?: Date;
    meeting_done_date?: Date;
    deal_done_date?: Date;
    ringing_date?: Date;
    switch_off_date?: Date;
    wrong_no_date?: Date;
    not_interested_date?: Date;
    followup_date?: Date;
    shifting_date?: Date;
    allowQueryAddition?: boolean;
    deletedQueries?: {
        queryId: mongoose.Schema.Types.ObjectId;
        deletedAt: Date;
        deletedBy: string;
    }[];
}
export interface IQuery {
    _id: mongoose.Schema.Types.ObjectId,
    call_date?: Date;
    deal_done_date?: Date;
    meeting_done_date?: Date;
    visit_done_date?: Date;
    ringing_date?: Date;
    switch_off_date?: Date;
    wrong_no_date?: Date;
    call_visit_meeting_consider_in_follow_up_date?: Date;
    not_interested_date: Date;
    interested_date: Date;
    status: string;
    remarks: IRemark[];
    leadType: string;
    location?: string;
    purpose?: string;
    name: string;
    phone: string;
    project?: string;
    budget?: string;
    bhk?: string;
    type?: string;
    size?: string;
    lead_actual_slab?: string;
    discount?: string;
    actual_revnue?: string;
    sell_revenue?: string;
    incentive_slab?: string;
    call_status?: string,
    reason?: string;
    closing_amount?: string;
    exp_visit_date?: string;
    floor?: string;
    followup_date?: Date;
    shifting_date?: Date;
    meeting_done?: string;
    visitDoneBy?: mongoose.Schema.Types.ObjectId;
    meetingDoneBy?: mongoose.Schema.Types.ObjectId;
    unit_no?: string;
    visit_done?: Date;
    createAt: Date;
    updateAt: Date,
    user: mongoose.Schema.Types.ObjectId;
    company: mongoose.Schema.Types.ObjectId;
    createdBy: mongoose.Schema.Types.ObjectId;
    deleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;
}
export interface IRemark {
    _id: mongoose.Schema.Types.ObjectId,
    title: string;
    user: string,
    createdBy: mongoose.Schema.Types.ObjectId;
    createAt: Date;
}